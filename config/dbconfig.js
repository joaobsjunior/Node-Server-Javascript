'use strict';
const baseEnum = require('./../common/enum/database.enum');

/**
 * Configuração do banco de dados lida de variáveis de ambiente
 * (credenciais nunca ficam no código-fonte). Ver .env.example.
 */
function env(name, defaultValue) {
    let value = process.env[name];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    return value;
}

function envInt(name, defaultValue) {
    let value = parseInt(env(name, ''), 10);
    return isNaN(value) ? defaultValue : value;
}

let typeName = String(env('DB_TYPE', 'MARIADB')).toUpperCase();
let typeserver = baseEnum[typeName];
if (!typeserver) {
    console.error('[dbconfig] DB_TYPE inválido: ' + typeName + '. Valores aceitos: ' + Object.keys(baseEnum).join(', '));
    process.exit(1);
}

let sshRequest = String(env('DB_SSH', 'false')).toLowerCase() === 'true';

module.exports = {
  GSENSEX: {
    typeserver: typeserver,
    ssh: {
      request: sshRequest,
      config: {
        username: env('DB_SSH_USERNAME', null),
        password: env('DB_SSH_PASSWORD', null),
        host: env('DB_SSH_HOST', null),
        port: envInt('DB_SSH_PORT', 22),
        dstHost: env('DB_SSH_DST_HOST', env('DB_HOST', 'localhost')),
        dstPort: envInt('DB_SSH_DST_PORT', envInt('DB_PORT', typeserver.defaultPort)),
        localPort: envInt('DB_SSH_LOCAL_PORT', envInt('DB_PORT', typeserver.defaultPort))
      },
      server: null
    },
    connection: {
      // URL JDBC completa (opcional). Quando definida, substitui host/port/database/service.
      url: env('DB_URL', null),
      // Classe do driver (opcional). Quando definida, substitui a classe padrão do DB_TYPE.
      drivername: env('DB_DRIVER', null),
      host: env('DB_HOST', 'localhost'),
      port: envInt('DB_PORT', typeserver.defaultPort),
      database: env('DB_NAME', 'gSenseX'),
      service: env('DB_SERVICE', null),
      username: env('DB_USER', 'root'),
      password: env('DB_PASSWORD', '')
    }
  },
};
