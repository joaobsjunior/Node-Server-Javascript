'use strict';

// database libs
//let oracledb = require('oracledb');

// common
let dbEngine = new require('../../../common/database-connector')();
let sqlType = require('../../../common/enum/sqltype.enum');
const dbConfig = require('../../../config/dbconfig');
const dbGeneric = require('../../../common/database-generic');
const messageEnum = require('../../../common/enum/message.enum');
const ResponseData = require('../../../common/response-data');
let _ = require('lodash');

// model domains
let User = require('./User.model');
let DealerResponse = require('../sales/dealer/DealerResponse.model');
let AppUtil = require('../../../common/app-util');
let Message = require('../../../common/model/Message.model');

const c_COMMAND_LIST_ALL = "SELECT * FROM usuario WHERE idusuario <> 40 ";
const c_COMMAND_KEEP = "{call MANTER_USUARIO('${ username }', ${ active })}";

class UserRepository {
  constructor() {}

  // LIST
  listDataAll(user = new User(), req, res, callback) {
    var self = this;
    var bindVars = {};
    var SELECT = null;
    try {
      dbEngine.execute(dbConfig.MYSQL_NAME, c_COMMAND_LIST_ALL, sqlType.SELECT, bindVars, callbackDB);
      return;
    } catch (error) {
      AppUtil.errorResponse(error, res, 412, callback);
      return;
    }

    function callbackDB(data) {
      self.callbackDBGeneric(data, callback);
    }
  }

  // KEEP
  keepData(user = new User(), req, res, callback) {
    var self = this;
    var bindVars = user;
    var query = '(&(objectClass=user)(sAMAccountName=' + user.username + '))';
    global.AD.find(query, function (err, results) {
      if ((err || !results) && user.active) {
        if (!err) {
          err = new Error();
        }
        if (res) {
          res.status(422);
        }
        ResponseData.errorResponse(err, (data) => {
          data.message.setMessage(messageEnum.msg13);
          callback(data);
        });
      } else {
        try {
          dbEngine.execute(dbConfig.MYSQL_NAME, c_COMMAND_KEEP, sqlType.SELECT, bindVars, callbackDB);
          return;
        } catch (error) {
          AppUtil.errorResponse(error, res, 412, callback);
          return;
        }
      }
    });

    function callbackDB(data) {
      if (data.isSuccess) {
        user.active = null;
        self.listDataAll(user, req, res, callback);
      }else{
        callback(data);
      }
    }
  }

}

try {
  module.exports = exports = UserRepository;
} catch (e) {
  exports = UserRepository;
}