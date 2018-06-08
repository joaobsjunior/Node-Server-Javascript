'use strict';

// database libs
//let oracledb = require('oracledb');

// common
let dbEngine = new require('../../common/database-connector')();
let sqlType = require('../../common/enum/sqltype.enum');
const dbConfig = require('../../config/dbconfig');
const dbGeneric = require('../../common/database-generic');
const messageEnum = require('../../common/enum/message.enum');
const ResponseData = require('../../common/response-data');
let CryptoJS = require("crypto-js");
let _ = require('lodash');
let fs = require('fs');

// model domains
let Login = require('./Login.model');
let AppUtil = require('../../common/app-util');
let Message = require('../../common/model/Message.model');

class LoginRepository {
  constructor() {}

  loginData(login = new Login(), res, callback) {
    let bindVars = AppUtil.clone(login);

    function callGet() {
      let SQL = fs.readFileSync('sql/login/login.sql', 'utf8');
      try {
        dbEngine.execute(dbConfig.GSENSEX, SQL, sqlType.SELECT, bindVars, callbackDB);
      } catch (error) {
        AppUtil.errorResponse(error, res, 412, callbackError);
      }
    }

    /*------------- CALLBACK OF RESULTSETS -------------*/

    //CALLBACK SALE
    function callbackDB(data) {
      if (!data.isSuccess || !data.response) {
        callback(data);
        return;
      }
      callback(data);
    }

    callGet();

  }

}

try {
  module.exports = exports = LoginRepository;
} catch (e) {
  exports = LoginRepository;
}