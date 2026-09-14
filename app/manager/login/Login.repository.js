'use strict';

// common
let dbEngine = new require('./../../../common/database-connector')();
let sqlType = require('../../../common/enum/sqltype.enum');
const dbConfig = require('../../../config/dbconfig');
const AuthToken = require('../../../common/auth-token');
let fs = require('fs');
let path = require('path');

// model domains
let Login = require('./Login.model');
let AppUtil = require('../../../common/app-util');

// Comandos SQL lidos uma vez, com caminho absoluto (independente do diretório de execução)
const SQL_DIR = path.resolve(__dirname, '../../../sql/manager/login');
const SQL_LOGIN = fs.readFileSync(path.join(SQL_DIR, 'login.sql'), 'utf8');
const SQL_LOGIN_CHECK = fs.readFileSync(path.join(SQL_DIR, 'login-check.sql'), 'utf8');

class LoginRepository {
  constructor() {}

  /**
   * loginData - Autentica email/senha e emite o token assinado.
   * A senha nunca é devolvida ao cliente; o token carrega apenas um
   * fingerprint HMAC do hash armazenado (ver common/auth-token.js).
   */
  loginData(login = new Login(), res, callback) {
    let bindVars = AppUtil.clone(login);

    function callGet() {
      try {
        dbEngine.execute(dbConfig.GSENSEX, SQL_LOGIN, sqlType.SELECT, bindVars, callbackDB);
      } catch (error) {
        AppUtil.errorResponse(error, res, 412, callback);
      }
    }

    //CALLBACKDB
    function callbackDB(data) {
      if (!data.isSuccess || !data.size) {
        callback(data);
        return;
      }
      let user = data.response[0];
      let token = AuthToken.sign({
        email: user.email,
        passwordHash: user.password
      });
      let dataResponse = {
        id: user.idadministrator,
        email: user.email,
        name: user.name,
        level: user.level,
        token: token
      }
      data.response = dataResponse;
      callback(data);
    }

    callGet();
  }

  /**
   * checkLogin - Busca o usuário pelo email para validação do token.
   */
  checkLogin(login = new Login(), res, callback) {
    let bindVars = { email: login.email };

    function callGet() {
      try {
        dbEngine.execute(dbConfig.GSENSEX, SQL_LOGIN_CHECK, sqlType.SELECT, bindVars, callback);
      } catch (error) {
        AppUtil.errorResponse(error, res, 412, callback);
      }
    }

    callGet();
  }

}

try {
  module.exports = exports = LoginRepository;
} catch (e) {
  exports = LoginRepository;
}
