'use strict';
const baseEnum = require('../common/enum/database.enum');

module.exports = {
  GSENSEX: {
    typeserver: baseEnum.MARIADB,
    ssh: {
      request: false,
      config: {
        username: null,
        password: null,
        host: null,
        port: null,
        dstHost: null,
        dstPort: null,
        localPort: null
      },
      server: null
    },
    connection: {
      host: 'localhost',
      database: 'gSenseX',
      service: null,
      username: 'root',
      password: null
    }
  },
};