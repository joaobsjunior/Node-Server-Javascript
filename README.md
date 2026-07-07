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
| `KEY_REQUEST_AUTH` | Chave de criptografia do token de autenticação das requisições |

**Opcionais** (com defaults seguros):

| Variável | Default | Descrição |
| --- | --- | --- |
| `PORT` | `9090` | Porta HTTP do servidor |
| `BODY_LIMIT` | `1mb` | Limite do corpo das requisições (JSON e urlencoded) |
| `CORS_ORIGINS` | vazio | Origens permitidas para CORS, separadas por vírgula. Vazio = sem cabeçalhos CORS |
| `LDAP_URL` | `ldap://0.0.0.0:389` | URL do servidor LDAP |
| `LDAP_BASE_DN` | `dc=domain,dc=local` | Base DN do LDAP |
| `LDAP_USERNAME` | vazio | Usuário LDAP |
| `LDAP_PASSWORD` | vazio | Senha LDAP |
| `MAIL_HOST` | vazio | Host SMTP |
| `MAIL_PORT` | `587` | Porta SMTP |
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
