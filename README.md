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
| `KEY_REQUEST_AUTH` | Chave (HMAC-SHA256) que assina o token de autenticação. Use um valor aleatório com pelo menos 32 caracteres |

**Opcionais** (com defaults seguros):

| Variável | Default | Descrição |
| --- | --- | --- |
| `PORT` | `9090` | Porta HTTP do servidor |
| `BODY_LIMIT` | `1mb` | Limite do corpo das requisições (JSON e urlencoded) |
| `CORS_ORIGINS` | vazio | Origens permitidas para CORS, separadas por vírgula. Vazio = sem cabeçalhos CORS |
| `REQUEST_TIMEOUT_MS` | `120000` | Timeout de inatividade do socket por requisição (0 = default do Node) |
| `TRUST_PROXY` | vazio | Saltos/IPs de proxy reverso confiáveis (necessário para rate limit por IP atrás de proxy) |
| `EXPOSE_ERROR_DETAILS` | `false` | Inclui stack trace nas respostas de erro (apenas depuração local) |
| `TOKEN_TTL_SECONDS` | `28800` | Validade do token de autenticação (8h) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | `60000` / `300` | Limite global de requisições por IP |
| `LOGIN_RATE_LIMIT_WINDOW_MS` / `LOGIN_RATE_LIMIT_MAX` | `900000` / `10` | Limite de tentativas de login com falha por IP |
| `UPLOAD_MAX_FILE_SIZE` / `UPLOAD_MAX_FIELDS_SIZE` / `UPLOAD_MAX_FIELDS` / `UPLOAD_MAX_FILES` | `10485760` / `1048576` / `100` / `10` | Limites do parser multipart |
| `LDAP_URL` | `ldap://0.0.0.0:389` | URL do servidor LDAP |
| `LDAP_BASE_DN` | `dc=domain,dc=local` | Base DN do LDAP |
| `LDAP_USERNAME` | vazio | Usuário LDAP |
| `LDAP_PASSWORD` | vazio | Senha LDAP |
| `MAIL_HOST` | vazio | Host SMTP |
| `MAIL_PORT` | `587` | Porta SMTP |
| `MAIL_SECURE` / `MAIL_REQUIRE_TLS` | `false` / `false` | TLS implícito (465) / exigir STARTTLS |
| `MAIL_USER` / `MAIL_PASS` | vazio | Credenciais SMTP. Se ausentes, o envio de e-mail é desabilitado |
| `MAIL_FROM` / `MAIL_TO` | vazio | Remetente e destinatário padrão dos e-mails |
| `GATEWAY_HOST` / `GATEWAY_PORT` | vazio | Host e porta do gateway SOA |

Exemplo:

```
#!shell-script
cp .env.example .env   # edite os valores
export KEY_REQUEST_AUTH="$(openssl rand -base64 48)"
npm start
```

### Segurança ###

Controles aplicados pelo servidor (detalhes em `openspec/changes/`):

- **SQL**: os bind vars interpolados nos arquivos `.sql` são escapados por dialeto (`common/sql-escape.js`) antes da compilação do template.
- **Autenticação**: o header `token` é um JWT assinado (HS256, `jws`) com expiração (`TOKEN_TTL_SECONDS`). Ele carrega apenas o e-mail e um fingerprint HMAC do hash da senha, então uma troca de senha invalida os tokens antigos. Tokens do formato anterior (AES) não são mais aceitos: os clientes precisam autenticar novamente.
- **Respostas de erro**: nunca incluem stack trace ou objetos internos (a menos que `EXPOSE_ERROR_DETAILS=true`). Erros de parse do body respondem em JSON.
- **Rotas**: `requireAD: true` no swagger exige token válido (401 caso contrário); `onlyLocalhost: true` é verificado pelo endereço do socket, não pelo header `Host`; rotas sem definição swagger são negadas (403).
- **Rate limiting**: global e específico do login, por IP (`express-rate-limit`).
- **CORS**: apenas as origens de `CORS_ORIGINS`, com resposta a preflight.
- **Uploads**: limites de tamanho e quantidade no parser multipart.
- **Anotações**: `populateToService` foi substituído por uma versão sem `eval` (`common/annotation-populate.js`).
- **E-mail**: STARTTLS habilitado (`ignoreTLS` removido); relatórios de erro SQL enviam o template do comando, nunca os valores.

Para rodar os testes (unitários e de integração, sem banco de dados):

```
#!shell-script
npm test
```

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
