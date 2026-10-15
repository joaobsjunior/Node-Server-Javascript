'use strict';

// As credenciais (user/password) NÃO fazem parte da URL: são enviadas como
// propriedades da conexão JDBC (ver common/database-connector.js).
const DATABASE_ENUM = {
    ORACLEDB: {
        url: 'jdbc:oracle:thin:@//${host}:${port}/${service}',
        drivername: 'oracle.jdbc.OracleDriver',
        defaultPort: 1521
    },
    INFORMIX: {
        url: 'jdbc:informix-sqli://${host}:${port}/${database}',
        drivername: 'com.informix.jdbc.IfxDriver',
        defaultPort: 1528
    },
    MYSQL: {
        url: 'jdbc:mysql://${host}:${port}/${database}',
        drivername: 'com.mysql.jdbc.Driver',
        defaultPort: 3306
    },
    POSTGRESQL: {
        url: 'jdbc:postgresql://${host}:${port}/${database}',
        drivername: 'org.postgresql.Driver',
        defaultPort: 5432
    },
    MARIADB: {
        url: 'jdbc:mariadb://${host}:${port}/${database}',
        drivername: 'org.mariadb.jdbc.Driver',
        defaultPort: 3306
    }
};
module.exports = exports = DATABASE_ENUM;
