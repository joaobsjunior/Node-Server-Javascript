'use strict';
const baseEnum = require('../common/enum/database.enum');
let path = require('path');
let fs = require('fs');

const util = require('util');
const appUtil = require('./app-util');
let _ = require('lodash');

const dbConfig = require('../config/dbconfig');
let respData = require('./response-data');

// database libs
let tunnel = require('tunnel-ssh');
let JDBC = require('jdbc');
let jinst = require('jdbc/lib/jinst');
let ResultSet = require('jdbc/lib/resultset');
let JDBCResultSet = require('../java/JDBCResultSet');
let java = jinst.getInstance();
let DatabaseGeneric = require('./database-generic');

// enums
let sqlType = require('./enum/sqltype.enum');

// model domains
let Response = require('./model/Response.model');

let numRows = 10000;

exports = module.exports = () => {
    let autoCommit = false;
    let getDataOfResultSet = (resultset, callback) => {
        let resultSet = new JDBCResultSet(resultset._rs, java);
        let results = resultSet.getObject();
        callback(results);
    };
    let executeSQLQuery = (statement, SQL, callback) => {
        statement.executeQuery(SQL, (err, resultset) => {
            if (err) {
                DatabaseGeneric.SQLReportEmail(SQL, err);
                respData.errorResponse(err, callback);
            } else {
                getDataOfResultSet(resultset, callback);
            }
        });
    };
    let executeSQLUpdate = (statement, SQL, callback) => {
        let Statement = java.import('java.sql.Statement');
        statement._s.executeUpdate(SQL, Statement.RETURN_GENERATED_KEYS, (err, count) => {
            if (err) {
                DatabaseGeneric.SQLReportEmail(SQL, err);
                respData.errorResponse(err, callback);
            } else {
                let rs = statement._s.getGeneratedKeysSync();
                if (rs) {
                    let resultSet = new JDBCResultSet(rs, java);
                    let results = resultSet.getObject();
                    if (results && results.length) {
                        callback(results);
                    } else {
                        callback(count ? true : false);
                    }
                } else {
                    callback(count ? true : false);
                }
            }
        });
    };
    let executeSQLStatement = (conn, statement, SQL, callback) => {
        conn._conn.setAutoCommitSync(autoCommit);
        let scripts = SQL.slice(0, -1).split(';');
        for (let i in scripts) {
            if (typeof scripts[i] != 'function' && scripts[i]) {
                statement._s.addBatchSync(scripts[i]);
            }
        }
        statement._s.executeBatch((err, data) => {
            if (err) {
                DatabaseGeneric.SQLReportEmail(SQL, err);
                respData.errorResponse(err, callback);
            } else {
                conn._conn.commit((err) => {
                    if (err) {
                        DatabaseGeneric.SQLReportEmail(SQL, err);
                        respData.errorResponse(err, callback);
                    } else {
                        let count = _.sum(data);
                        callback(count);
                    }
                });
            }
        });
    };
    let executeSQLInsert = (conn, SQL, callback) => {
        conn.prepareCall(SQL, (err, callablestatement) => {
            let JDBCTypes = java.import('java.sql.Types');
            if (err) {
                DatabaseGeneric.SQLReportEmail(SQL, err);
                respData.errorResponse(err, callback);
            } else {
                callablestatement._cs.registerOutParameterSync(1, JDBCTypes.NUMERIC);
                callablestatement._cs.registerOutParameterSync(2, JDBCTypes.NUMERIC);
                callablestatement.execute((err, data) => {
                    if (err) {
                        DatabaseGeneric.SQLReportEmail(SQL, err);
                        respData.errorResponse(err, callback);
                    } else {
                        let result = {}
                        result.last_id = parseFloat(callablestatement._cs.getLongSync(1));
                        result.affectRows = parseFloat(callablestatement._cs.getLongSync(2));
                        callback(result);
                    }
                });

            }
        });
    };
    let executeSQLProcedure = (conn, SQL, callback) => {
        conn.prepareCall(SQL, (err, callablestatement) => {
            if (err) {
                DatabaseGeneric.SQLReportEmail(SQL, err);
                respData.errorResponse(err, callback);
            } else {
                let withParameters = SQL.indexOf('?') != -1 ? true : false;
                if (withParameters) {
                    callablestatement._cs.registerOutParameterSync(1, -10);
                }
                callablestatement.execute((err, data) => {
                    if (err) {
                        DatabaseGeneric.SQLReportEmail(SQL, err);
                        respData.errorResponse(err, callback);
                    } else {
                        let resultset = null;
                        if (withParameters) {
                            resultset = callablestatement._cs.getObjectSync(1);
                        } else {
                            resultset = callablestatement._cs.getResultSetSync();
                        }
                        getDataOfResultSet(new ResultSet(resultset), callback);
                    }
                });

            }
        });
    };
    let filterSQLType = (conn, statement, SQL, SQLType, callback) => {
        switch (SQLType) {
            case sqlType.PROCEDURE:
                executeSQLProcedure(conn, SQL, callback);
                break;
            case sqlType.STATEMENT:
                executeSQLStatement(conn, statement, SQL, callback);
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
        execute: (server, SQL, SQLType, bindVars, callbackResult, $autoCommit = false) => {
            let serverConnection = {
                url: (_.template(server.typeserver.url))(server.connection),
                drivername: server.typeserver.drivername
            }
            autoCommit = $autoCommit;
            let _connObj, SQL_DB;
            let closeConnection = () => {
                if (_connObj) {
                    _connObj.conn.close(function (err) {
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
                };
                respData.successResponse(data, callbackResult);
            };
            let exec = () => {
                let files = fs.readdirSync(path.resolve(__dirname, './drivers')).filter((value)=>{
                    return value.lastIndexOf('.jar') != -1;
                });
                files = files.map((value) => {
                    return path.resolve(__dirname, './drivers/' + value);
                });
                if (!jinst.isJvmCreated()) {
                    jinst.addOption("-Xrs");
                    jinst.setupClasspath(files);
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
                                conn.createStatement((err, statement) => {
                                    if (err) {
                                        respData.errorResponse(err, callbackBefore);
                                    } else {
                                        let compiled = _.template(SQL);
                                        SQL = compiled(bindVars);
                                        //let Connection = java.import('java.sql.Connection');
                                        //conn._conn.setTransactionIsolationSync(Connection.TRANSACTION_READ_UNCOMMITTED);
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
            if (server.ssh.request) {
                if (server.ssh.server) {
                    exec();
                    return;
                }
                server.ssh.config.keepAlive = true;
                let sshServer = tunnel(server.ssh.config, function (err, sshServer) {
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
    }
}