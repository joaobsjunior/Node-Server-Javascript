# README #

Este documento tem como objetivo instruir os usuários a instalar e rodar o sandbox localmente.

### Como configurar? ###

- Instale o Nodejs
- Instale o Python 2.7.x (3.x não é suportado)
- Instale as Ferramentas de Build (Apenas Windows) `` npm install --global --production windows-build-tools ``
- Instale do Node-Gyp ``` npm install -g node-gyp ```
- Instale as dependências (**apenas dependências**) do pdf-extract (ver: https://www.npmjs.com/package/pdf-extract)
- Instale as dependências do node no projeto:
```
#!shell-script
npm i
```
- Instale o pm2 caso não tenha:
```
#!shell-script
npm i -g pm2
```
- Execute o servidor com PM2
```
#!shell-script
pm2 start app.js --watch -i 1
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