# Tarefas

- [x] Prepared statements: `common/sql-binder.js` converte `${nome}` em `?` e aplica os valores
      via JDBC (SELECT, UPDATE/INSERT com chaves geradas, lote STATEMENT, PROCEDURE, INSERT_ID)
- [x] Credenciais do banco como propriedades JDBC (fora da URL) e lidas de `DB_*`
- [x] `populateToService` sem `eval` (`common/safe-populate.js`) e `objToUpperCase` sem `eval`
- [x] Token JWT HS256 com expiração e fingerprint da senha (`common/auth-token.js`); crypto-js e
      base64url removidos
- [x] Interceptor: fail-closed para rota sem documentação, `onlyLocalhost` pelo endereço do socket,
      try/catch global, sem override do timeout do socket
- [x] Respostas de erro sem stack/SQL (`EXPOSE_ERROR_DETAILS`)
- [x] SMTP com STARTTLS obrigatório/TLS implícito; retorno imediato quando desabilitado
- [x] Rate limit no login (e global opcional); `trust proxy` configurável; `x-powered-by` removido
- [x] Limites de upload multipart; proteção contra chaves `__proto__` nos parâmetros
- [x] CEP: validação do formato, envelope sem template, timeout na chamada externa
- [x] `Message.setMessage` sem `lodash.template`; código morto com chave fixa removido
- [x] BIGINT lido como string (sem overflow) e conversão do resultado protegida
- [x] Dependências: nodemailer 10, helmet 8, chalk 4, express-rate-limit; `npm audit` = 0
- [x] Teste de fumaça `npm test` (H2 em memória): 38 verificações
- [x] `.env.example` e README atualizados
