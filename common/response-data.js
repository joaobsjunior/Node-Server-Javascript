'use strict';
let Response = require('./model/Response.model');
const messageEnum = require('./enum/message.enum');

exports = module.exports = {
    errorResponse: (err, callback) => {
        log.error(err);
        if (callback) {
            let res = new Response();
            res.message.message = err.message;
            if (err.message.indexOf('java.sql') !== -1) {
                res.message.message = messageEnum.msg26;
            }
            res.message.additionalInformation = {
                error: err,
                stack: err.stack,
                name: err.name,
                fileName: err.fileName || null,
                lineNumber: err.lineNumber || null
            };
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