'use strict';
const ResponseData = require('./response-data');
const Mailer = require('./mailer');
const messageEnum = require('./enum/message.enum');
const AppUtil = require('./app-util');
let _ = require('lodash');

class DatabaseGeneric {

    static SQLReportEmail(SQL, error) {
        let dataEmail = {
            info1: {
                label: 'Comando SQL',
                txt: SQL
            },
            info2: {
                label: 'Erro',
                txt: error.toString()
            }
        };
        let compile = _.template(messageEnum.msgEmail);
        let msgEmail = compile(dataEmail);
        Mailer.send(null, messageEnum.titleErrorConsulta, msgEmail, true);
    }

}
try {
    exports = module.exports = DatabaseGeneric;
} catch (error) {
    exports = DatabaseGeneric;
}