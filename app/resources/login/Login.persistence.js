'use strict';

// database libs
//let oracledb = require('oracledb');

// common
let dbEngine = require('../../../common/database-connector')();
let sqlType = require('../../../common/enum/sqltype.enum');
const dbConfig = require('../../../config/dbconfig');
const dbGeneric = require('../../../common/database-generic');
const messageEnum = require('../../../common/enum/message.enum');
const ResponseData = require('../../../common/response-data');
var CryptoJS = require("crypto-js");
let _ = require('lodash');

// model domains
let Login = require('./Login.model');
let AppUtil = require('../../../common/app-util');
let Message = require('../../../common/model/Message.model');

const c_COMMAND_LOGIN = "";

class LoginRepository {
  constructor() {}

  // LOGIN
  loginData(login = new Login(), res, callback) {
    var username = login.username;
    var password = login.password;
    var userData = {};
    userData.mail = "";
    /*global.AD.authenticate(username + '@domain.local', password, (err, auth) => {
      if (auth) {
        var query = '(&(objectClass=user)(sAMAccountName=' + username + '))';
        global.AD.find(query, function (err, results) {
          userData = results.users[0];
          if (!err) {
            callbackDB()
          } else {
            var error = new Error();
            error.message = messageEnum.msg07;
            AppUtil.errorResponse(error, res, 403, callback);
          }
        });
      } else {
        var error = new Error();
        error.message = messageEnum.msg07;
        AppUtil.errorResponse(error, res, 403, callback);
      }
    });*/

    function callbackDB() {
      var responseData = {
        user: {
          email: userData.mail.toLowerCase(),
          name: userData.displayName,
          username: userData.sAMAccountName,
          token: CryptoJS.AES.encrypt(login.password, global.config.keyRequestAutentication).toString()
        }
      }
      ResponseData.successResponse(responseData, callback);
    }

  }
}

try {
  module.exports = exports = LoginRepository;
} catch (e) {
  exports = LoginRepository;
}