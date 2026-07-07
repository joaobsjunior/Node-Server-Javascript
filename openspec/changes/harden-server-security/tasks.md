# Tasks — Harden Server Security

## 1. Configuração segura (secure-configuration)

- [x] 1.1 Criar helper `requireEnv(name)`/`optionalEnv(name, default)` e refatorar `config/config.js` para ler `KEY_REQUEST_AUTH`, `LDAP_URL`, `LDAP_USERNAME`, `LDAP_PASSWORD`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `PORT` de `process.env`, abortando a inicialização com mensagem clara se `KEY_REQUEST_AUTH` estiver ausente
- [x] 1.2 Desativar envio de e-mail (`sendEmail: false` + warning no log) quando `MAIL_USER`/`MAIL_PASS` não estiverem definidas
- [x] 1.3 Mover `gatewayParam.hostName`/`port` de `index.js` para config lida de `GATEWAY_HOST`/`GATEWAY_PORT`
- [x] 1.4 Criar `.env.example` com todas as variáveis (placeholders, sem valores reais) e garantir que `.env` está no `.gitignore`
- [x] 1.5 Documentar as variáveis obrigatórias e opcionais no README.md

## 2. Segurança de requisições (request-security)

- [x] 2.1 Substituir o middleware CORS em `index.js`: ecoar o `Origin` apenas se estiver na lista `CORS_ORIGINS` (split por vírgula), sem cabeçalhos CORS caso contrário
- [x] 2.2 Reduzir limites do `body-parser` (json e urlencoded) para `BODY_LIMIT` com default `1mb`
- [x] 2.3 Envolver descriptografia AES + `JSON.parse` do token em try/catch em `common/request-interceptor.js`, respondendo 401 com corpo genérico em caso de falha
- [x] 2.4 Corrigir códigos de status no interceptor: 401 para token ausente/inválido/credencial rejeitada, 403 para violação de `onlyLocalhost` (substituindo os 500 atuais)
- [x] 2.5 Corrigir `checkAuth`/`checkLogin` para invocar o callback também no caminho de falha, garantindo que toda requisição recebe resposta (nunca fica pendurada)

## 3. Limpeza de código inseguro

- [x] 3.1 Remover o monkey-patch de `child_process.spawn` no final de `index.js`
- [x] 3.2 Varrer o repositório confirmando que nenhum segredo real permanece em arquivos versionados (config, common, app)

## 4. Verificação

- [x] 4.1 Iniciar o servidor com as variáveis definidas e confirmar boot normal; iniciar sem `KEY_REQUEST_AUTH` e confirmar falha explícita nomeando a variável
- [x] 4.2 Testar CORS com origem permitida e não permitida (curl com header `Origin`) e payload acima do limite (esperar 413)
- [x] 4.3 Testar rota protegida: sem token (401), token corrompido (401 sem crash), credencial inválida (401 com resposta imediata)
