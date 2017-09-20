'use strict';
let Response = require('./model/Response.model');

exports = module.exports = {
    errorResponse: (err, callback) => {
        log.error(err);
        if (callback) {
            var res = new Response();
            res.message.message = err.message;
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
        var res = new Response();
        res.message = null;
        res.size = data.length || null;
        res.isSuccess = true;
        res.response = data;
        callback(res);
    }
}