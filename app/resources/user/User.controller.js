'use strict';
let User = require('./User.model');
let appUtil = require('../../../common/app-util');
const messageEnum = require('../../../common/enum/message.enum');
let Response = require('../../../common/model/Response.model');

class UserController {
    constructor(user = new User(), queryType = null) {
        this.user = user;
        this.queryType = queryType.toLowerCase().trim();
        this.response = new Response();
        switch (queryType) {
            case 'list':
                return this.list();
            case 'insert':
                return this.insert();
            case 'update':
                return this.update();
            case 'keep':
                return this.keep();
        }
        return true;
    }

    list() {
        return true;
    }

    insert() {
        return true;
    }

    update() {
        return true;
    }

    keep() {
        if (this.user.active == null && !this.user.username) {
            this.response.message.setMessage(messageEnum.server412);
            return this.response;
        }
        return true;
    }

}

try {
    module.exports = exports = UserController;
} catch (e) {
    exports = UserController;
}