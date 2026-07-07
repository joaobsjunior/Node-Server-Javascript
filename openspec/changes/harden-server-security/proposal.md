# Harden Server Security

## Why

O servidor expõe várias falhas de segurança conhecidas: segredos hardcoded no código-fonte (chave de autenticação, credenciais LDAP e de e-mail em `config/config.js`), CORS aberto para qualquer origem, autenticação que transporta a senha do usuário dentro do token, tratamento de erros que responde com status incorretos (500 em vez de 401/403) e pode derrubar o processo, e limites de payload de 50mb que facilitam DoS. Essas falhas colocam credenciais e o serviço em risco imediato.

## What Changes

- Mover todos os segredos (chave `keyRequestAutentication`, credenciais LDAP, credenciais SMTP) de `config/config.js` para variáveis de ambiente, com falha explícita na inicialização quando um segredo obrigatório estiver ausente.
- **BREAKING**: o servidor não inicia mais sem as variáveis de ambiente obrigatórias configuradas.
- Substituir o CORS wildcard (`*`) por uma lista de origens permitidas configurável via variável de ambiente.
- Corrigir o middleware de autenticação (`common/request-interceptor.js`):
  - Envolver a descriptografia/parse do token em try/catch, retornando 401 em vez de deixar exceção não tratada.
  - Retornar códigos de status corretos: 401 para token ausente/inválido, 403 para acesso negado (em vez de 500).
  - Corrigir o bug do callback de `checkAuth` que nunca responde quando a autenticação falha (requisição fica pendurada).
- Reduzir o limite do body-parser de 50mb para um valor configurável com padrão seguro (1mb).
- Remover o monkey-patch de `child_process.spawn` em `index.js` que loga argumentos completos (potencial vazamento de dados sensíveis).
- Remover o IP interno hardcoded (`10.200.1.190`) de `index.js`, movendo-o para configuração.

## Capabilities

### New Capabilities

- `secure-configuration`: carregamento de segredos e parâmetros sensíveis via variáveis de ambiente, com validação na inicialização e ausência de segredos no código-fonte.
- `request-security`: política de CORS restritiva configurável, limites de payload seguros e respostas de autenticação com códigos de status HTTP corretos e sem vazamento de detalhes internos.

### Modified Capabilities

<!-- Nenhuma: não existem specs em openspec/specs/ ainda. -->

## Impact

- **Código afetado**: `index.js`, `config/config.js`, `common/request-interceptor.js`, `common/mailer.js`.
- **Operação**: deploys passam a exigir variáveis de ambiente (`KEY_REQUEST_AUTH`, `LDAP_PASSWORD`, `MAIL_USER`, `MAIL_PASS`, `CORS_ORIGINS`, etc.). Necessário documentar no README e fornecer `.env.example`.
- **Clientes da API**: clientes em origens não listadas no CORS deixarão de funcionar via navegador; respostas de erro de autenticação mudam de 500 para 401/403.
- **Dependências**: sem novas dependências obrigatórias (leitura de env nativa via `process.env`).
