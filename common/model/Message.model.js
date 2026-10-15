'use strict';

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
        if (msgEnum && value !== undefined && value !== null && typeof msgEnum === 'string') {
            // Interpolação simples de <%= value %> / ${value}, sem compilar templates
            // (lodash.template executa código arbitrário presente no texto).
            this.message = msgEnum
                .replace(/<%[-=]?\s*value\s*%>/g, String(value))
                .replace(/\$\{\s*value\s*\}/g, String(value));
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