'use strict';
let Response = require('./model/Response.model');
const messageEnum = require('./enum/message.enum');

function getLogger() {
    if (global.log && typeof global.log.error === 'function') {
        return global.log;
    }
    return console;
}

function exposeDetails() {
    return Boolean(global.config && global.config.server && global.config.server.exposeErrorDetails);
}

exports = module.exports = {
    /**
     * errorResponse - Loga o erro completo no servidor e devolve ao cliente
     * apenas uma mensagem. Detalhes internos (stack trace, objeto do erro)
     * só são incluídos quando EXPOSE_ERROR_DETAILS=true.
     */
    errorResponse: (err, callback) => {
        let error = (err instanceof Error) ? err : new Error(err ? String(err) : '');
        getLogger().error(error);
        if (callback) {
            let res = new Response();
            let message = error.message || '';
            if (message.indexOf('java.sql') !== -1 || message.indexOf('Error running static method') !== -1) {
                message = messageEnum.msg26;
            }
            res.message.message = message;
            if (exposeDetails()) {
                res.message.additionalInformation = {
                    error: error,
                    stack: error.stack,
                    name: error.name,
                    fileName: error.fileName || null,
                    lineNumber: error.lineNumber || null
                };
            }
            callback(res);
        }
    },
    successResponse: (data, callback) => {
        let res = new Response();
        res.size = (data && data.length) || null;
        res.isSuccess = true;
        res.response = data;
        callback(res);
    }
}
