'use strict';
const Mailer = require('./mailer');
const messageEnum = require('./enum/message.enum');
let _ = require('lodash');

class DatabaseGeneric {

    /**
     * SQLReportEmail - Notifica por e-mail um erro de SQL.
     * Recebe o template do comando (sem os valores interpolados) para que
     * dados do cliente — como credenciais de login — nunca sejam enviados.
     */
    static SQLReportEmail(SQL, error) {
        try {
            let dataEmail = {
                info1: {
                    label: 'Comando SQL',
                    txt: _.escape(String(SQL || ''))
                },
                info2: {
                    label: 'Erro',
                    txt: _.escape(error && error.message ? error.message : String(error))
                }
            };
            let compile = _.template(messageEnum.msgEmail);
            let msgEmail = compile(dataEmail);
            Mailer.send(null, messageEnum.titleErrorConsulta, msgEmail, true);
        } catch (e) {
            if (global.log) {
                global.log.error(e);
            }
        }
    }

}
try {
    exports = module.exports = DatabaseGeneric;
} catch (error) {
    exports = DatabaseGeneric;
}
