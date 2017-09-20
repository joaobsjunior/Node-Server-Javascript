'use strict';
const baseEnum = require('../common/enum/database.enum');
var path = require('path');

const util = require('util');
const appUtil = require('./app-util');
let _ = require('lodash');

const dbConfig = require('../config/dbconfig');
let respData = require('./response-data');

// database libs
let tunnel = require('tunnel-ssh');
let JDBC = require('jdbc');
let jinst = require('jdbc/lib/jinst');
var ResultSet = require('jdbc/lib/resultset');
let JDBCResultSet = require('../java/JDBCResultSet');
var java = jinst.getInstance();

// enums
var sqlType = require('./enum/sqltype.enum');

// model domains
let Response = require('./model/Response.model');

var numRows = 5000;

exports = module.exports = () => {
    var getDataOfResultSet = (resultset, callback) => {
        var resultSet = new JDBCResultSet(resultset._rs, java);
        var results = resultSet.getObject();
        callback(results);
    };
    var executeSQLQuery = (statement, SQL, callback) => {
        statement.executeQuery(SQL, (err, resultset) => {
            if (err) {
                respData.errorResponse(err, callback);
            } else {
                getDataOfResultSet(resultset, callback);
            }
        });
    };
    var executeSQLUpdate = (statement, SQL, callback) => {
        statement.executeUpdate(SQL, (err, count) => {
            if (err) {
                respData.errorResponse(err, callback);
            } else {
                callback(count);
            }
        });
    };
    var executeSQLStatement = (conn, statement, SQL, callback) => {
        conn._conn.setAutoCommitSync(false);
        var scripts = SQL.slice(0, -1).split(';');
        for (var i in scripts) {
            if (typeof scripts[i] != 'function' && scripts[i]) {
                statement._s.addBatchSync(scripts[i]);
            }
        }
        statement._s.executeBatch((err, data) => {
            if (err) {
                respData.errorResponse(err, callback);
            } else {
                conn._conn.commit((err) => {
                    if (err) {
                        respData.errorResponse(err, callback);
                    } else {
                        var count = _.sum(data);
                        callback(count);
                    }
                });
            }
        });
    };
    var executeSQLInsert = (conn, SQL, callback) => {
        conn.prepareCall(SQL, (err, callablestatement) => {
            var JDBCTypes = java.import('java.sql.Types');
            if (err) {
                respData.errorResponse(err, callback);
            } else {
                callablestatement._cs.registerOutParameterSync(1, JDBCTypes.NUMERIC);
                callablestatement._cs.registerOutParameterSync(2, JDBCTypes.NUMERIC);
                callablestatement.execute((err, data) => {
                    if (err) {
                        respData.errorResponse(err, callback);
                    } else {
                        var result = {}
                        result.last_id = parseFloat(callablestatement._cs.getLongSync(1));
                        result.affectRows = parseFloat(callablestatement._cs.getLongSync(2));
                        callback(result);
                    }
                });

            }
        });
    };
    var executeSQLProcedure = (conn, SQL, callback) => {
        conn.prepareCall(SQL, (err, callablestatement) => {
            if (err) {
                respData.errorResponse(err, callback);
            } else {
                callablestatement.execute((err, data) => {
                    if (err) {
                        respData.errorResponse(err, callback);
                    } else {
                        var resultset = callablestatement._cs.getResultSetSync();
                        getDataOfResultSet(new ResultSet(resultset), callback);
                    }
                });

            }
        });
    };
    var filterSQLType = (conn, statement, SQL, SQLType, callback) => {
        switch (SQLType) {
            case sqlType.PROCEDURE:
                executeSQLProcedure(conn, SQL, callback)
                break;
            case sqlType.STATEMENT:
                executeSQLStatement(conn, statement, SQL, callback)
                break;
            case sqlType.SELECT:
                executeSQLQuery(statement, SQL, callback);
                break;
            case sqlType.INSERT_ID:
                executeSQLInsert(conn, SQL, callback);
                break;
            default:
                executeSQLUpdate(statement, SQL, callback);
        }
    };
    return {
        execute: (server, SQL, SQLType, bindVars, callbackResult) => {
            var _connObj, SQL_DB;
            var closeConnection = () => {
                if (_connObj) {
                    _connObj.conn.close(function (err) {
                        if (err) {
                            respData.errorResponse(err);
                        }
                    });
                }
            };
            var callbackBefore = (data) => {
                closeConnection();
                if (data instanceof Response) {
                    callbackResult(data);
                    return;
                };
                respData.successResponse(data, callbackResult);
            };
            var exec = () => {
                if (!jinst.isJvmCreated()) {
                    jinst.addOption("-Xrs");
                    jinst.setupClasspath([
                        path.resolve(__dirname, './drivers/mysql/mariadb-java-client-1.5.9.jar'),
                        path.resolve(__dirname, './drivers/informix/ifxjdbc.jar'),
                        path.resolve(__dirname, './drivers/postgresql/postgresql-9.4.1212.jre7.jar'),
                        path.resolve(__dirname, './drivers/oracledb/ojdbc8.jar')
                    ]);
                }
                SQL_DB = new JDBC(server.config);
                SQL_DB.initialize((err) => {
                    if (err) {
                        respData.errorResponse(err, callbackBefore);
                    } else {
                        SQL_DB.reserve((err, connObj) => {
                            if (err) {
                                respData.errorResponse(err, callbackBefore);
                            } else {
                                _connObj = connObj;
                                var conn = connObj.conn;
                                conn.createStatement((err, statement) => {
                                    if (err) {
                                        respData.errorResponse(err, callbackBefore);
                                    } else {
                                        var compiled = _.template(SQL);
                                        SQL = compiled(bindVars);
                                        statement.setFetchSize(numRows, (err) => {
                                            if (err) {
                                                respData.errorResponse(err, callbackBefore);
                                            } else {
                                                filterSQLType(conn, statement, SQL, SQLType, callbackBefore);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            };
            if(server.ssh.request){
                if(server.ssh.server){
                    exec();
                    return;
                }
                server.ssh.config.keepAlive = true;
                var sshServer = tunnel(server.ssh.config, function (err, sshServer) {
                    if (err) {
                        respData.errorResponse(err, callbackBefore);
                    }else{
                        server.ssh.server = sshServer;
                        exec();
                    }
                });
            }else{
                exec();
            }
            
        }
    }
}