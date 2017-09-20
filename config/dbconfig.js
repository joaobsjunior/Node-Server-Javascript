'use strict';
const baseEnum = require('../common/enum/database.enum');

module.exports = {
  MYSQL_NAME: {
    typeserver: baseEnum.MYSQL,
    ssh: {
      request: false,
      config: {}
    },
    config: {
      url: 'jdbc:mariadb://localhost:port/dbname?user=username&password=password',
      drivername: 'org.mariadb.jdbc.Driver'
    }
  },
  ORACLEDB_NAME: {
    typeserver: baseEnum.ORACLEDB,
    ssh: {
      request: false,
      config: {}
    },
    config: {
      url: 'jdbc:oracle:thin:username/password@//localhost:port/dbname',
      drivername: 'oracle.jdbc.OracleDriver'
    }
  },
  INFORMIX_NAME: {
    typeserver: baseEnum.INFORMIX,
    ssh: {
      request: false,
      config: {
        username: 'username',
        password: 'password',
        host: 'host ssh',
        port: 22, //port ssh
        dstHost: 'host db', //host db access
        dstPort: 1234, //port db access
        localPort: 5432 // same dstPort
      }
    },
    config: {
      url: 'jdbc:informix-sqli://localhost:port/dbname:INFORMIXSERVER=ol_standard;user=username;password=password',
      drivername: 'com.informix.jdbc.IfxDriver'
    }
  },
  POSTGRESQL_NAME: {
    typeserver: baseEnum.POSTGRESQL,
    ssh: {
      request: false,
      config: {
      }
    },
    config: {
      url: 'jdbc:postgresql://localhost:port/dbname?user=username&password=password',
      drivername: 'org.postgresql.Driver'
    }
  }
};