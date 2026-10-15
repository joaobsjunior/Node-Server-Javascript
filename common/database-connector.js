'use strict';
let path = require('path');
let fs = require('fs');
let _ = require('lodash');

let respData = require('./response-data');

// database libs
let tunnel = require('tunnel-ssh');
let JDBC = require('jdbc');
let jinst = require('jdbc/lib/jinst');
let ResultSet = require('jdbc/lib/resultset');
let JDBCResultSet = require('./../java/JDBCResultSet');
let java = jinst.getInstance();
let DatabaseGeneric = require('./database-generic');
let SqlBinder = require('./sql-binder');

// enums
let sqlType = require('./enum/sqltype.enum');

// model domains
let Response = require('./model/Response.model');

let numRows = 10000;

/**
 * buildUrl - Monta a URL JDBC a partir do template da configuração.
 * Credenciais NÃO entram na URL: são passadas como propriedades da conexão.
 */
let buildUrl = (server) => {
    if (server.connection && server.connection.url) {
        return server.connection.url;
    }
    let template = String(server.typeserver.url || '');
    let connection = server.connection || {};
    return template.replace(/\$\{\s*(\w+)\s*\}/g, (match, key) => {
        let value = connection[key];
        return (value === undefined || value === null) ? '' : String(value);
    });
};

/**
 * listDriverJars - Lista os drivers JDBC (pasta common/drivers e, opcionalmente, DB_DRIVERS_DIR).
 */
let listDriverJars = () => {
    let dirs = [path.resolve(__dirname, './drivers')];
    if (global.config && global.config.database && global.config.database.driversDir) {
        dirs.push(path.resolve(global.config.database.driversDir));
    }
    let jars = [];
    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            return;
        }
        fs.readdirSync(dir)
            .filter((value) => value.toLowerCase().endsWith('.jar'))
            .forEach((value) => jars.push(path.resolve(dir, value)));
    });
    return jars;
};

exports = module.exports = () => {
    let autoCommit = false;

    let getDataOfResultSet = (resultset, callback) => {
        let results;
        try {
            let resultSet = new JDBCResultSet(resultset._rs, java);
            results = resultSet.getObject();
        } catch (err) {
            // Falha de conversão do resultado vira resposta de erro, não exceção não tratada
            respData.errorResponse(err, callback);
            return;
        }
        callback(results);
    };

    let closeQuietly = (javaStatement) => {
        try {
            if (javaStatement) {
                javaStatement.closeSync();
            }
        } catch (ignore) {
            // statement já fechado ou conexão encerrada
        }
    };

    let fail = (SQL, err, callback) => {
        DatabaseGeneric.SQLReportEmail(SQL, err);
        respData.errorResponse(err, callback);
    };

    // SELECT -> PreparedStatement.executeQuery
    let executeSQLQuery = (conn, SQL, bindVars, callback) => {
        let bound = SqlBinder.bind(SQL, bindVars);
        conn.prepareStatement(bound.sql, (err, preparedStatement) => {
            if (err) {
                fail(bound.sql, err, callback);
                return;
            }
            let ps = preparedStatement._ps;
            try {
                SqlBinder.setParameters(ps, bound.values, java);
                ps.setFetchSizeSync(numRows);
            } catch (bindErr) {
                closeQuietly(ps);
                fail(bound.sql, bindErr, callback);
                return;
            }
            preparedStatement.executeQuery((err, resultset) => {
                if (err) {
                    closeQuietly(ps);
                    fail(bound.sql, err, callback);
                } else {
                    try {
                        getDataOfResultSet(resultset, callback);
                    } finally {
                        closeQuietly(ps);
                    }
                }
            });
        });
    };

    // UPDATE / DELETE / INSERT -> PreparedStatement.executeUpdate (com chaves geradas)
    let executeSQLUpdate = (conn, SQL, bindVars, callback) => {
        let bound = SqlBinder.bind(SQL, bindVars);
        let Statement = java.import('java.sql.Statement');
        conn._conn.prepareStatement(bound.sql, Statement.RETURN_GENERATED_KEYS, (err, ps) => {
            if (err) {
                fail(bound.sql, err, callback);
                return;
            }
            try {
                SqlBinder.setParameters(ps, bound.values, java);
            } catch (bindErr) {
                closeQuietly(ps);
                fail(bound.sql, bindErr, callback);
                return;
            }
            ps.executeUpdate((err, count) => {
                if (err) {
                    closeQuietly(ps);
                    fail(bound.sql, err, callback);
                    return;
                }
                try {
                    let rs = ps.getGeneratedKeysSync();
                    if (rs) {
                        let resultSet = new JDBCResultSet(rs, java);
                        let results = resultSet.getObject();
                        if (results && results.length) {
                            callback(results);
                            return;
                        }
                    }
                    callback(count ? true : false);
                } catch (rsErr) {
                    fail(bound.sql, rsErr, callback);
                } finally {
                    closeQuietly(ps);
                }
            });
        });
    };

    // STATEMENT -> lote de comandos separados por ";" executados em transação
    let executeSQLStatement = (conn, SQL, bindVars, callback) => {
        let scripts = SqlBinder.splitScripts(SQL);
        let counts = [];
        try {
            conn._conn.setAutoCommitSync(autoCommit);
        } catch (err) {
            fail(SQL, err, callback);
            return;
        }
        let rollback = (err) => {
            try {
                conn._conn.rollbackSync();
            } catch (ignore) {
                // conexão pode já estar encerrada
            }
            fail(SQL, err, callback);
        };
        let runScript = (index) => {
            if (index >= scripts.length) {
                conn._conn.commit((err) => {
                    if (err) {
                        rollback(err);
                    } else {
                        callback(_.sum(counts));
                    }
                });
                return;
            }
            let bound = SqlBinder.bind(scripts[index], bindVars);
            conn._conn.prepareStatement(bound.sql, (err, ps) => {
                if (err) {
                    rollback(err);
                    return;
                }
                try {
                    SqlBinder.setParameters(ps, bound.values, java);
                } catch (bindErr) {
                    closeQuietly(ps);
                    rollback(bindErr);
                    return;
                }
                ps.executeUpdate((err, count) => {
                    closeQuietly(ps);
                    if (err) {
                        rollback(err);
                        return;
                    }
                    counts.push(count || 0);
                    runScript(index + 1);
                });
            });
        };
        runScript(0);
    };

    // INSERT_ID -> procedure com dois parâmetros de saída (last_id, affectRows)
    // após os parâmetros de entrada
    let executeSQLInsert = (conn, SQL, bindVars, callback) => {
        let bound = SqlBinder.bind(SQL, bindVars);
        conn.prepareCall(bound.sql, (err, callablestatement) => {
            if (err) {
                fail(bound.sql, err, callback);
                return;
            }
            let cs = callablestatement._cs;
            let JDBCTypes = java.import('java.sql.Types');
            let outIndex = bound.values.length + 1;
            try {
                SqlBinder.setParameters(cs, bound.values, java);
                cs.registerOutParameterSync(outIndex, JDBCTypes.NUMERIC);
                cs.registerOutParameterSync(outIndex + 1, JDBCTypes.NUMERIC);
            } catch (bindErr) {
                closeQuietly(cs);
                fail(bound.sql, bindErr, callback);
                return;
            }
            callablestatement.execute((err) => {
                if (err) {
                    closeQuietly(cs);
                    fail(bound.sql, err, callback);
                    return;
                }
                try {
                    let result = {};
                    result.last_id = parseFloat(cs.getLongSync(outIndex));
                    result.affectRows = parseFloat(cs.getLongSync(outIndex + 1));
                    callback(result);
                } catch (readErr) {
                    fail(bound.sql, readErr, callback);
                } finally {
                    closeQuietly(cs);
                }
            });
        });
    };

    // PROCEDURE -> procedure que devolve um cursor (parâmetro de saída após as entradas)
    let executeSQLProcedure = (conn, SQL, bindVars, callback) => {
        let withCursorParameter = SqlBinder.hasLiteralQuestionMark(SQL);
        let bound = SqlBinder.bind(SQL, bindVars);
        conn.prepareCall(bound.sql, (err, callablestatement) => {
            if (err) {
                fail(bound.sql, err, callback);
                return;
            }
            let cs = callablestatement._cs;
            let outIndex = bound.values.length + 1;
            try {
                SqlBinder.setParameters(cs, bound.values, java);
                if (withCursorParameter) {
                    cs.registerOutParameterSync(outIndex, -10);
                }
            } catch (bindErr) {
                closeQuietly(cs);
                fail(bound.sql, bindErr, callback);
                return;
            }
            callablestatement.execute((err) => {
                if (err) {
                    closeQuietly(cs);
                    fail(bound.sql, err, callback);
                    return;
                }
                try {
                    let resultset = withCursorParameter ? cs.getObjectSync(outIndex) : cs.getResultSetSync();
                    getDataOfResultSet(new ResultSet(resultset), callback);
                } catch (readErr) {
                    fail(bound.sql, readErr, callback);
                } finally {
                    closeQuietly(cs);
                }
            });
        });
    };

    let filterSQLType = (conn, SQL, SQLType, bindVars, callback) => {
        switch (SQLType) {
            case sqlType.PROCEDURE:
                executeSQLProcedure(conn, SQL, bindVars, callback);
                break;
            case sqlType.STATEMENT:
                executeSQLStatement(conn, SQL, bindVars, callback);
                break;
            case sqlType.SELECT:
                executeSQLQuery(conn, SQL, bindVars, callback);
                break;
            case sqlType.INSERT_ID:
                executeSQLInsert(conn, SQL, bindVars, callback);
                break;
            default:
                executeSQLUpdate(conn, SQL, bindVars, callback);
        }
    };

    return {
        /**
         * execute - Executa o SQL informado com os parâmetros em bindVars.
         * Os placeholders ${nome} do SQL são convertidos em parâmetros posicionais
         * de PreparedStatement; os valores nunca são concatenados ao texto do comando.
         */
        execute: (server, SQL, SQLType, bindVars, callbackResult, $autoCommit = false) => {
            let connection = server.connection || {};
            let serverConnection = {
                url: buildUrl(server),
                drivername: (connection.drivername || server.typeserver.drivername),
                properties: {}
            };
            if (connection.username !== undefined && connection.username !== null) {
                serverConnection.properties.user = String(connection.username);
            }
            if (connection.password !== undefined && connection.password !== null) {
                serverConnection.properties.password = String(connection.password);
            }
            autoCommit = $autoCommit;
            let _connObj, SQL_DB;
            let closeConnection = () => {
                if (_connObj) {
                    let connObj = _connObj;
                    _connObj = null;
                    connObj.conn.close(function (err) {
                        if (err) {
                            respData.errorResponse(err);
                        }
                    });
                }
            };
            let callbackBefore = (data) => {
                closeConnection();
                if (data instanceof Response) {
                    callbackResult(data);
                    return;
                }
                respData.successResponse(data, callbackResult);
            };
            let exec = () => {
                if (!jinst.isJvmCreated()) {
                    jinst.addOption("-Xrs");
                    jinst.setupClasspath(listDriverJars());
                }
                SQL_DB = new JDBC(serverConnection);
                SQL_DB.initialize((err) => {
                    if (err) {
                        respData.errorResponse(err, callbackBefore);
                    } else {
                        SQL_DB.reserve((err, connObj) => {
                            if (err) {
                                respData.errorResponse(err, callbackBefore);
                            } else {
                                _connObj = connObj;
                                let conn = connObj.conn;
                                try {
                                    filterSQLType(conn, SQL, SQLType, bindVars || {}, callbackBefore);
                                } catch (execErr) {
                                    respData.errorResponse(execErr, callbackBefore);
                                }
                            }
                        });
                    }
                });
            };
            if (server.ssh && server.ssh.request) {
                if (server.ssh.server) {
                    exec();
                    return;
                }
                server.ssh.config.keepAlive = true;
                tunnel(server.ssh.config, function (err, sshServer) {
                    if (err) {
                        respData.errorResponse(err, callbackBefore);
                    } else {
                        server.ssh.server = sshServer;
                        exec();
                    }
                });
            } else {
                exec();
            }
        }
    };
};
