'use strict';
let Login = require('./Login.model');
let appUtil = require('../../common/app-util');
const messageEnum = require('../../common/enum/message.enum');
let Response = require('../../common/model/Response.model');

class LoginController {
    constructor(login = new Login(), queryType = null) {
        this.login = login;
        this.queryType = queryType.toLowerCase().trim();
        this.response = new Response();
        switch (queryType) {
            case 'login':
                return this.loginData();
        }
        return true;
    }

    loginData() {
        if (!this.login.username) {
            this.response.message.setMessage(messageEnum.msg01, messageEnum.fieldUsername);
            return this.response;
        }
        if (!this.login.password) {
            this.response.message.setMessage(messageEnum.msg01, messageEnum.fieldPassword);
            return this.response;
        }
        return true;
    }

}

try {
    module.exports = exports = LoginController;
} catch (e) {
    exports = LoginController;
}