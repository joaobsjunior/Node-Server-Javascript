'use strict';

// constants
const mensagemEnum = require('./enum/message.enum');
const base64url = require('base64url');
const jws = require('jws');
const _ = require('lodash');
let CryptoJS = require("crypto-js");
const AppUtil = require('./app-util');
const projectEnum = require('./enum/project.enum');

// model domains
let ResponseData = require('./response-data');


exports = module.exports = () => {
    let checkAutorizationAccess = (username, groups, res, callback) => {
        let query = '(&(objectClass=user)(sAMAccountName=' + username + '))';
        global.AD.find(query, function (err, results) {
            let callbackLocal = (resp) => {
                callback(false, resp);
            }
            if ((err) || (!results)) {
                log.error(err);
                if (res) {
                    res.status(403);
                }
                ResponseData.errorResponse(err, callbackLocal);
                return;
            }
            let query = '(&(member=' + results.users[0].dn + '))';
            global.AD.find(query, function (err, results) {
                if ((err) || (!results)) {
                    if (!err) {
                        err = new Error();
                        err.message = mensagemEnum.msg06;
                    }
                    log.error(err);
                    if (res) {
                        res.status(401);
                    }
                    ResponseData.errorResponse(err, callbackLocal);
                    return;
                }
                let groupsOfUser = results.groups.map((value) => {
                    return _.camelCase(value.cn);
                });
                let find = _.find(groupsOfUser, (o) => {
                    return groups.indexOf(o) != -1;
                });
                if (find) {
                    callback(true, null);
                } else {
                    let msg = mensagemEnum.msg06;
                    log.info(msg);
                    if (res) {
                        res.status(401);
                    }
                    let error = new Error();
                    error.message = msg;
                    ResponseData.errorResponse(error, callbackLocal);
                }
            });
        });
    }
    let checkAuth = (username, password, res, groups, callback) => {
        callback(true, null);
    };
    return {
        authenticate: (req, res, next) => {
            res.socket.setTimeout(7200000);
            let isMobile = AppUtil.isMobile(req.headers['user-agent']);
            let device = isMobile ? 'mobile' : 'desktop';
            let projectName = _.filter(projectEnum, function (o) {
                return o.id == req.headers.project;
            });
            projectName = projectName[0] || {};
            let user = req.headers.username || req.body.username || '##';
            let params = AppUtil.clone(req.body) || {};
            if (params.password) {
                params.password = "***";
            }
            params = JSON.stringify(params, null, 4);
            let method = req.method.toUpperCase();
            let logStr = "[RESQUEST] - URL: [" + method + "] '" + req.originalUrl + "' | USER: '" + user + "' | PROJECT: '" + projectName.name + "' | DEVICE: '" + device + "'";
            if (method != 'GET') {
                logStr += " BODY: '\n" + params + "'";
            }
            log.info(logStr);
            let path = req.route.path;
            let groups = [];
            let groupADArray = [];
            let swagger = global.swaggerSpec;
            let swaggerParams = swagger.paths[path][req.method.toLowerCase()];
            let requireAD = groupADArray = swaggerParams['requireAD'];
            if (swaggerParams['onlyLocalhost'] && req.headers.host.toLowerCase().indexOf('localhost') != 0) {
                res.status(500);
                ResponseData.errorResponse(new Error(), (data) => {
                    res.send(data);
                    res.end();
                });
                return;
            }
            if (!requireAD) {
                next();
                return;
            }
            try {
                groupADArray = swagger.paths[path][req.method.toLowerCase()].hasOwnProperty('groupAD');
                if (groupADArray) {
                    groups = swagger.paths[path][req.method.toLowerCase()]['groupAD'].map((value) => {
                        return _.camelCase(value);
                    });
                }
            } catch (err) {
                res.status(500);
                ResponseData.errorResponse(err, (data) => {
                    res.send(data);
                    res.end();
                });
                return;
            }
            if (!req.headers.token) {
                res.status(500);
                ResponseData.errorResponse(new Error(), (data) => {
                    res.send(data);
                    res.end();
                });
                return;
            }
            let userdata = CryptoJS.AES.decrypt(String(req.headers.token), global.config.keyRequestAutentication).toString(CryptoJS.enc.Utf8);
            userdata = JSON.parse(userdata);
            let username = userdata.username;
            let password = userdata.password;
            checkAuth(username, password, res, groups, (auth, message) => {
                if (auth) {
                    next();
                    return;
                } else {
                    res.send(message);
                    res.end();
                    return;
                }
            });
        }
    }
}