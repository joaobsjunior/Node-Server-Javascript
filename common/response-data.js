'use strict';
let Response = require('./model/Response.model');
const messageEnum = require('./enum/message.enum');

const DATABASE_ERROR_PATTERN = /java\.sql|SQLException|jdbc|JdbcSQL|ORA-\d+|Error running (instance|static) method/i;

/**
 * exposeDetails - Detalhes internos (stack, SQL, nome da classe Java) só vão para o
 * cliente quando EXPOSE_ERROR_DETAILS=true. Em produção, ficam apenas no log.
 */
let exposeDetails = () => {
    return Boolean(global.config && global.config.server && global.config.server.exposeErrorDetails);
};

exports = module.exports = {
    errorResponse: (err, callback) => {
        if (!(err instanceof Error)) {
            err = new Error(err === undefined || err === null ? 'Erro desconhecido' : String(err));
        }
        if (global.log) {
            log.error(err);
        }
        if (callback) {
            let res = new Response();
            let message = err.message || String(err);
            if (DATABASE_ERROR_PATTERN.test(message)) {
                // Mensagens de banco incluem o comando SQL e a estrutura interna: não expor
                message = messageEnum.msg26;
            }
            res.message.message = message;
            if (exposeDetails()) {
                res.message.additionalInformation = {
                    error: err.message,
                    stack: err.stack,
                    name: err.name,
                    fileName: err.fileName || null,
                    lineNumber: err.lineNumber || null
                };
            }
            callback(res);
        }
    },
    successResponse: (data, callback) => {
        let res = new Response();
        res.size = data.length || null;
        res.isSuccess = true;
        res.response = data;
        callback(res);
    }
}
