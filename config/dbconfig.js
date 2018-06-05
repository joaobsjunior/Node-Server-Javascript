'use strict';
const baseEnum = require('../common/enum/database.enum');

module.exports = {
  DATABASE1: {
    typeserver: baseEnum.MYSQL,
    ssh: {
      request: false,
      config: {},
      server: null
    },
    config: {
      url: 'jdbc:mysql://localhost:3306/dbname?user=user&password=password&useSSL=false',
      drivername: 'com.mysql.jdbc.Driver'
    }
  },
  DATABASE2: {
    typeserver: baseEnum.ORACLEDB,
    ssh: {
      request: false,
      config: {},
      server: null
    },
    config: {
      url: 'jdbc:oracle:thin:dbname/user@//localhost:1521/service',
      drivername: 'oracle.jdbc.OracleDriver'
    }
  },
  DATABASE3: {
    typeserver: baseEnum.INFORMIX,
    ssh: {
      request: false,
      config: {},
      server: null
    },
    config: {
      url: 'jdbc:informix-sqli://localhost:1528/instace:user=user;password=password',
      drivername: 'com.informix.jdbc.IfxDriver'
    }
  },
  DATABASE4: {
    typeserver: baseEnum.POSTGRESQL,
    ssh: {
      request: true,
      config: {
        username: 'user',
        password: 'password',
        host: 'localhost',
        port: 22,
        dstHost: 'localhost',
        dstPort: 5432,
        localPort: 5432
      },
      server: null
    },
    config: {
      url: 'jdbc:postgresql://localhost:5432/gnccrm?user=user&password=password',
      drivername: 'org.postgresql.Driver'
    }
  }
};