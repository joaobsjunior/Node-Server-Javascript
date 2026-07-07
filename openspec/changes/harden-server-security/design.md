# Design — Harden Server Security

## Context

O servidor Express (Node >= 6, código legado com `var`/`let` misturados) inicializa em `index.js`, carrega configuração estática de `config/config.js` e protege rotas via `common/request-interceptor.js`. Problemas atuais:

- Segredos hardcoded: `keyRequestAutentication: "@1b%2c^3d&4#$"`, senha LDAP e credenciais SMTP em `config/config.js` (versionado).
- CORS `Access-Control-Allow-Origin: *` aplicado globalmente em `index.js`.
- `body-parser` com limite de 50mb (JSON e urlencoded).
- `request-interceptor.js`: descriptografia AES + `JSON.parse` sem try/catch (token corrompido derruba o fluxo), status 500 para falhas de autenticação, e o callback de `checkAuth` só é invocado no caminho de sucesso — falha de login deixa a requisição pendurada.
- IP interno `10.200.1.190` hardcoded em `index.js` (gateway SOA).
- Monkey-patch de `child_process.spawn` que loga todos os argumentos no console.

## Goals / Non-Goals

**Goals:**
- Eliminar segredos do código-fonte, com validação de ambiente na inicialização.
- CORS restrito por allowlist configurável.
- Autenticação robusta: try/catch, status HTTP corretos (401/403), toda requisição recebe resposta.
- Limite de payload configurável com padrão de 1mb.
- Remover o patch de `spawn` e o IP hardcoded.

**Non-Goals:**
- Redesenhar o esquema de token (a senha dentro do token AES é uma fraqueza conhecida, mas mudá-lo quebra todos os clientes — fica para uma mudança futura).
- Atualizar dependências desatualizadas (helmet 3.x, express 4.15, etc.) — escopo separado.
- Adicionar rate limiting ou HTTPS/TLS.

## Decisions

### D1: Leitura de env nativa, sem dependência `dotenv` obrigatória
`config/config.js` passa a ler `process.env` diretamente, com uma função `requireEnv(name)` que lança erro na inicialização se a variável estiver ausente. Alternativa considerada: adicionar `dotenv` — rejeitada como obrigatória por ser dependência nova em projeto legado com Node >= 6; o `.env.example` documenta as variáveis e quem quiser pode carregar via shell ou instalar `dotenv` localmente.

Variáveis: `KEY_REQUEST_AUTH` (obrigatória), `LDAP_URL`, `LDAP_USERNAME`, `LDAP_PASSWORD`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `GATEWAY_HOST`, `GATEWAY_PORT`, `CORS_ORIGINS`, `BODY_LIMIT`, `PORT`.

Obrigatórias apenas as de segurança direta (`KEY_REQUEST_AUTH`); as demais têm defaults não sensíveis ou desativam o recurso (e-mail sem credenciais → `sendEmail: false` com warning).

### D2: CORS por allowlist no middleware existente
Manter o middleware manual em `index.js` (sem adicionar o pacote `cors`), mas ecoando o `Origin` da requisição apenas se estiver em `CORS_ORIGINS` (split por vírgula, trim). Sem match → não emite cabeçalhos CORS. Alternativa: pacote `cors` — rejeitado para minimizar novas dependências; o middleware manual tem ~10 linhas.

### D3: Correção do interceptor sem mudar o contrato do token
- Envolver `CryptoJS.AES.decrypt` + `JSON.parse` em try/catch → 401 em caso de falha.
- `checkLogin` callback: tratar explicitamente o caminho `!data.isSuccess || !data.size` chamando `callback(false, ...)` (hoje só o sucesso invoca o callback).
- Padronizar respostas: 401 (token ausente/inválido/credencial rejeitada), 403 (rota `onlyLocalhost` acessada externamente — hoje retorna 500), corpo genérico via `ResponseData.errorResponse` sem detalhes de exceção.
- O formato do token (AES com email+senha) permanece o mesmo — compatibilidade com clientes existentes.

### D4: Limite de payload
`BODY_LIMIT` com default `'1mb'` aplicado a `bodyParser.json` e `bodyParser.urlencoded`. Deploys que realmente precisam de payloads grandes configuram a variável explicitamente.

### D5: Remoções diretas
- Monkey-patch de `spawn` em `index.js` (IIFE nas linhas finais): remover por completo — era instrumentação de debug que loga argumentos possivelmente sensíveis.
- IP `10.200.1.190`: mover para `GATEWAY_HOST`/`GATEWAY_PORT` com os valores atuais como default documentado apenas no `.env.example` (não no código).

## Risks / Trade-offs

- [Deploys existentes quebram sem as novas variáveis] → mudança BREAKING documentada; mensagem de erro na inicialização nomeia exatamente a variável ausente; `.env.example` e README atualizados.
- [Clientes browser em origens não listadas param de funcionar] → `CORS_ORIGINS` aceita a lista atual de consumidores; em ambiente de desenvolvimento pode-se listar `http://localhost:*` origens explícitas.
- [Clientes que dependem do status 500 em falha de auth] → improvável, mas mudança de contrato documentada no proposal; 401/403 é o comportamento correto.
- [Payloads legítimos > 1mb rejeitados] → `BODY_LIMIT` configurável; quem precisa de 50mb define explicitamente.
- [Node >= 6 não tem sintaxe moderna] → manter estilo ES5/ES6 do código existente (sem optional chaining, sem `??`).

## Migration Plan

1. Definir as variáveis de ambiente no ambiente de execução (ver `.env.example`).
2. Deploy da nova versão; a inicialização valida o ambiente e falha rápido se algo faltar.
3. Rollback: voltar à versão anterior (que não exige as variáveis) — sem migração de dados.

## Open Questions

- Lista real de origens que consomem a API (necessária para popular `CORS_ORIGINS` em produção) — a definir com quem opera o serviço.
