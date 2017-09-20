# README #

Este documento tem como objetivo instruir os usuários a instalar e rodar o sandbox localmente.

### Como configurar? ###

1 - Instale o Nodejs

2 - Instale o Python 2.7.x (3.x não é suportado)

3 - Instale as Ferramentas de Build (Apenas Windows) `` npm install --global --production windows-build-tools ``

4 - Instale do Node-Gyp ``` npm install -g node-gyp ```

5 - Instale as dependências do node no projeto:

```
#!shell-script
npm i
```

6 - Instale o pm2 caso não tenha:

```
#!shell-script
npm i -g pm2
```

7 - Execute o servidor com PM2

```
#!shell-script
pm2 start gateway-server.js --watch -i 1
```

Ou diretamente com nodejs:

```
#!shell-script
npm start
```

8 - Para testar abra seu navegador: http://localhost:9090/api-docs/

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