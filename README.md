# README #

Este documento tem como objetivo instruir os usuários a instalar e rodar o sandbox localmente.

### Como configurar? ###

- Instale o Nodejs
- Instale o Python 2.7.x (3.x não é suportado)
- Instale as Ferramentas de Build (Apenas Windows) `` npm install --global --production windows-build-tools ``
- Instale do Node-Gyp `` npm install -g node-gyp ``
- Set o Python2.7 como principal `` npm config set python python2.7 ``
- Set a versão do build tools como 2017 `` npm config set msvs_version 2017 ``
- Instale as dependências (**apenas dependências**) do pdf-extract (ver: https://www.npmjs.com/package/pdf-extract)
- Instale as dependências do node no projeto:
```
#!shell-script
npm i
```
### Variáveis de ambiente ###

O servidor lê sua configuração de variáveis de ambiente (ver `.env.example` para a lista completa com placeholders).

**Obrigatórias** (o servidor não inicia sem elas):

| Variável | Descrição |
| --- | --- |
| `KEY_REQUEST_AUTH` | Chave (>= 32 caracteres aleatórios) que assina o token de autenticação das requisições |

**Opcionais** (com defaults seguros):

| Variável | Default | Descrição |
| --- | --- | --- |
| `PORT` | `9090` | Porta HTTP do servidor |
| `BODY_LIMIT` | `1mb` | Limite do corpo das requisições (JSON e urlencoded) |
| `CORS_ORIGINS` | vazio | Origens permitidas para CORS, separadas por vírgula. Vazio = sem cabeçalhos CORS |
| `TRUST_PROXY` | `false` | Confiar nos cabeçalhos `X-Forwarded-*` (apenas atrás de proxy reverso) |
| `EXPOSE_ERROR_DETAILS` | `false` | Incluir stack trace e detalhes internos nas respostas de erro (apenas desenvolvimento) |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | `0` / `900000` | Limite global de requisições por IP na janela (0 desabilita) |
| `UPLOAD_MAX_FILE_SIZE` / `UPLOAD_MAX_FIELDS` | `10485760` / `1000` | Limites para `multipart/form-data` |
| `TOKEN_EXPIRES_IN` | `28800` | Validade do token de autenticação, em segundos |
| `RATE_LIMIT_LOGIN_MAX` / `RATE_LIMIT_LOGIN_WINDOW_MS` | `20` / `900000` | Tentativas de login por IP na janela (0 desabilita) |
| `DB_TYPE` | `MARIADB` | `MARIADB`, `MYSQL`, `POSTGRESQL`, `ORACLEDB` ou `INFORMIX` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_SERVICE` | `localhost` / padrão do tipo / `gSenseX` / vazio | Conexão com o banco |
| `DB_USER` / `DB_PASSWORD` | `root` / vazio | Credenciais do banco (enviadas como propriedades JDBC, nunca na URL) |
| `DB_URL` / `DB_DRIVER` | vazio | URL JDBC completa e classe do driver (substituem os valores acima) |
| `DB_DRIVERS_DIR` | vazio | Diretório adicional com drivers JDBC (`.jar`) |
| `DB_SSH` + `DB_SSH_*` | `false` | Túnel SSH até o banco |
| `LDAP_URL` | `ldap://0.0.0.0:389` | URL do servidor LDAP |
| `LDAP_BASE_DN` | `dc=domain,dc=local` | Base DN do LDAP |
| `LDAP_USERNAME` | vazio | Usuário LDAP |
| `LDAP_PASSWORD` | vazio | Senha LDAP |
| `MAIL_HOST` | vazio | Host SMTP |
| `MAIL_PORT` | `587` | Porta SMTP |
| `MAIL_SECURE` / `MAIL_REQUIRE_TLS` | `false` / `true` | TLS implícito (465) ou STARTTLS obrigatório (587) |
| `MAIL_USER` / `MAIL_PASS` | vazio | Credenciais SMTP. Se ausentes, o envio de e-mail é desabilitado |
| `MAIL_FROM` / `MAIL_TO` | vazio | Remetente e destinatário padrão dos e-mails |
| `GATEWAY_HOST` / `GATEWAY_PORT` | vazio | Host e porta do gateway SOA |

Exemplo:

```
#!shell-script
cp .env.example .env   # edite os valores
export KEY_REQUEST_AUTH="sua-chave-secreta"
npm start
```

### Autenticação ###

`POST /api/manager/login` recebe `email` e `password` e devolve um token JWT (HS256, assinado com
`KEY_REQUEST_AUTH`, validade `TOKEN_EXPIRES_IN`). As rotas protegidas (`requireAD: true` na
documentação Swagger) exigem o cabeçalho `token`. O token não carrega a senha nem o hash da senha;
ele é invalidado ao expirar ou quando a senha do usuário é alterada. Rotas sem documentação Swagger
exigem autenticação por padrão.

### Segurança ###

- Consultas SQL usam `PreparedStatement`: os placeholders `${nome}` dos arquivos `.sql` viram
  parâmetros posicionais (ver `common/sql-binder.js`); nenhum valor é concatenado ao comando.
- Respostas de erro não incluem SQL, stack trace nem classes internas (salvo `EXPOSE_ERROR_DETAILS=true`).
- Rate limit no login (`RATE_LIMIT_LOGIN_MAX`) e, opcionalmente, global (`RATE_LIMIT_MAX`).
- SMTP com STARTTLS obrigatório ou TLS implícito; CORS restrito a `CORS_ORIGINS`; cabeçalhos do `helmet`.

### Testes ###

```
#!shell-script
npm test
```

O teste de fumaça sobe o servidor contra um banco H2 em memória (o driver é baixado do Maven
Central para `test/.cache/` na primeira execução) e verifica login, imunidade a injeção de SQL,
validação do token, CORS, rate limit e o conector JDBC.

- Instale o pm2 caso não tenha:
```
#!shell-script
npm i -g pm2
```
- Execute o servidor com PM2
```
#!shell-script
pm2 start index.js --watch -i 1
```

Ou diretamente com nodejs:

```
#!shell-script
npm start
```

- Para testar abra seu navegador: http://localhost:9090/api-docs/

**EXTRAS**:

* Para ver os logs do pm2:
```
#!shell-script
pm2 logs
```

* Para ver o status do pm2:
```
#!shell-script
pm2 status
```

* Para ver o monitor do pm2:
```
#!shell-script
pm2 monit
```
