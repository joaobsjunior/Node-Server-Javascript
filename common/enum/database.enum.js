'use strict';

const DATABASE_ENUM = {
    ORACLEDB: {
        url: 'jdbc:oracle:thin:${database}/${username}@/${password}/${host}:1521/${service}',
        drivername: 'oracle.jdbc.OracleDriver'
    },
    INFORMIX: {
        url: 'jdbc:informix-sqli://${host}:1528/${database}:user=${username};password=${password}',
        drivername: 'com.informix.jdbc.IfxDriver'
    },
    MYSQL: {
        url: 'jdbc:mysql://${host}:3306/${database}?user=${username}&password=${password}',
        drivername: 'com.mysql.jdbc.Driver'
    },
    POSTGRESQL: {
        url: 'jdbc:postgresql://${host}:5432/${database}?user=${username}&password=${password}',
        drivername: 'org.postgresql.Driver'
    },
    MARIADB: {
        url: 'jdbc:mariadb://${host}:3306/${database}?user=${username}&password=${password}',
        drivername: 'org.mariadb.jdbc.Driver'
    }
};
module.exports = exports = DATABASE_ENUM;