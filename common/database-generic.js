'use strict';
let dbEngine = new require('./database-connector')();
const ResponseData = require('./response-data');
const Mailer = require('./mailer');
const messageEnum = require('./enum/message.enum');
const AppUtil = require('./app-util');
let _ = require('lodash');

class DatabaseGeneric {

    constructor() {}

    static SELECT(bindVars = {
        table_names: '',
        from: ''
    }) {
        var SQL = `SELECT ('SELECT ' || (SELECT LISTAGG(C.TABLE_NAME || '.' || C.COLUMN_NAME || ' AS "' || C.TABLE_NAME || '_' || C.COLUMN_NAME || '"', ', ') WITHIN GROUP( ORDER BY C.TABLE_NAME ) "TABLE_NAMES" FROM   USER_TAB_COLS C WHERE  TABLE_NAME IN ('<%= table_names %>')) || ' FROM <%= from %>' ) FROM DUAL`;
        bindVars.table_names = bindVars.table_names.join("','");
        var compiler = _.template(SQL);
        SQL = compiler(bindVars);
        return SQL;
    }

    static SQL(res, cont, configDB, sqlString, _sqlType, bindVars, callbackDB, callback, msgError, error = null) {
        if (cont == 5) {
            var compiled = _.template(sqlString);
            var command_sql = compiled(bindVars);
            var dataEmail = {
                info1: {
                    label: 'Comando SQL',
                    txt: command_sql
                },
                info2: {
                    label: 'Erro',
                    txt: JSON.stringify(error)
                }
            };
            var compile = _.template(messageEnum.msgEmail);
            var msgEmail = compile(dataEmail);
            Mailer.send(msgError, msgEmail, true);
            res.status(422);
            AppUtil.errorResponse(error, res, 422, callback);
            return;
        }
        try {
            dbEngine.execute(configDB, sqlString, _sqlType, bindVars, callbackDB);
        } catch (error) {
            log.error(msgError, error);
            cont = cont++;
            DatabaseGeneric.SQL(cont, configDB, sqlString, _sqlType, bindVars, callbackDB, callback, msgError, error);
        }
    }

}
try {
    exports = module.exports = DatabaseGeneric;
} catch (error) {
    exports = DatabaseGeneric;
}