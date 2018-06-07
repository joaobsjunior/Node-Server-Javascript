'use strict';
let _ = require('lodash');

class Message {
    constructor(id = null, code = null, message = null, dateException = new Date(), nameCurrentResource = null, additionalInformation = null) {
        this.id = id;
        this.code = code;
        this.message = message;
        this.dateException = dateException;
        this.nameCurrentResource = nameCurrentResource;
        this.additionalInformation = additionalInformation;
    }

    setMessage(msgEnum, value) {
        if (msgEnum && value) {
            let compiler = _.template(msgEnum);
            this.message = compiler({
                value: value
            });
            return;
        }
        this.message = msgEnum;
    }
}

try {
    module.exports = exports = Message;
} catch (e) {
    exports = Message;
}