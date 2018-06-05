'use strict';
let Message = require('./Message.model');

class Response {
    constructor(
        message = new Message(),
        response = [],
        size = 0,
        isSuccess = false
    ) {
        this.isSuccess = isSuccess;
        this.size = size;
        this.message = message;
        this.response = response;
    }
}

try {
    module.exports = exports = Response;
} catch (e) {
    exports = Response;
}