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
      url: 'jdbc:mysql://0.0.0.0:3306/sales?user=user&password=password',
      drivername: 'com.mysql.jdbc.Driver'
    }
  },
};