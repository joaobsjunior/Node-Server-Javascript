'use strict';

const crypto = require('crypto');
const path = require('path');
let fs = require('fs');

// common
let dbEngine = new require('./../../../common/database-connector')();
let sqlType = require('../../../common/enum/sqltype.enum');
const dbConfig = require('../../../config/dbconfig');
const AuthToken = require('../../../common/auth-token');
const ResponseData = require('../../../common/response-data');

// model domains
let Login = require('./Login.model');
let AppUtil = require('../../../common/app-util');

const SQL_DIR = path.resolve(__dirname, '../../../sql/manager/login');

/**
 * passwordFingerprint - Resumo (SHA-256) do hash armazenado da senha.
 * Vai no token apenas para invalidar sessões quando a senha for alterada;
 * não permite recuperar a senha nem o hash original.
 */
function passwordFingerprint(storedHash) {
  return crypto.createHash('sha256').update(String(storedHash === undefined || storedHash === null ? '' : storedHash)).digest('hex');
}

function safeEqual(a, b) {
  let bufA = Buffer.from(String(a || ''));
  let bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function readSQL(fileName) {
  return fs.readFileSync(path.join(SQL_DIR, fileName), 'utf8');
}

class LoginRepository {
  constructor() {}

  /**
   * loginData - Autentica e-mail/senha e emite o token de acesso.
   */
  loginData(login = new Login(), res, callback) {
    let bindVars = {
      email: login.email,
      password: login.password
    };

    function callbackError(data) {
      callback(data);
    }

    function callGet() {
      try {
        let SQL = readSQL('login.sql');
        dbEngine.execute(dbConfig.GSENSEX, SQL, sqlType.SELECT, bindVars, callbackDB);
      } catch (error) {
        AppUtil.errorResponse(error, res, 412, callbackError);
      }
    }

    //CALLBACKDB
    function callbackDB(data) {
      if (!data.isSuccess || !data.size) {
        callback(data);
        return;
      }
      let row = data.response[0];
      let token = AuthToken.sign({
        sub: row.idadministrator,
        email: row.email,
        level: row.level,
        fp: passwordFingerprint(row.password)
      });
      let dataResponse = {
        id: row.idadministrator,
        email: row.email,
        name: row.name,
        level: row.level,
        token: token
      }
      data.response = dataResponse;
      callback(data);
    }

    callGet();
  }

  /**
   * checkLogin - Valida as claims de um token já verificado: o usuário precisa
   * existir e a senha não pode ter sido alterada desde a emissão do token.
   */
  checkLogin(claims = {}, res, callback) {
    let bindVars = {
      email: claims.email
    };

    function callbackError(data) {
      callback(data);
    }

    function callGet() {
      try {
        let SQL = readSQL('login-check.sql');
        dbEngine.execute(dbConfig.GSENSEX, SQL, sqlType.SELECT, bindVars, callbackDB);
      } catch (error) {
        AppUtil.errorResponse(error, res, 412, callbackError);
      }
    }

    //CALLBACKDB
    function callbackDB(data) {
      if (!data.isSuccess || !data.size) {
        callback(data);
        return;
      }
      let row = data.response[0];
      let valid = row && safeEqual(passwordFingerprint(row.password), claims.fp);
      if (!valid) {
        data.size = null;
        data.response = [];
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
