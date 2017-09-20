'use strict';
const baseEnum = require('../common/enum/database.enum');

module.exports = {
  SALE: {
    typeserver: baseEnum.MYSQL,
    ssh: {
      request: false,
      config: {},
      server: null
    },
    config: {
      url: 'jdbc:mariadb://<HOST>:<PORT>/<DBNAME>?user=<USER>&password=<PASSWORD>',
      drivername: 'org.mariadb.jdbc.Driver'
    }
  }
};