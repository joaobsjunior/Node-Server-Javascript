'use strict';

// constants
const mensagemEnum = require('./enum/message.enum');
const base64url = require('base64url');
const jws = require('jws');
const _ = require('lodash');
var CryptoJS = require("crypto-js");
const AppUtil = require('./app-util');
const projectEnum = require('./enum/project.enum');

// model domains
let ResponseData = require('./response-data');


exports = module.exports = () => {
    var checkAutorizationAccess = (username, groups, res, callback) => {
        var query = '(&(objectClass=user)(sAMAccountName=' + username + '))';
        global.AD.find(query, function (err, results) {
            var callbackLocal = (resp) => {
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
            var query = '(&(member=' + results.users[0].dn + '))';
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
                var groupsOfUser = results.groups.map((value) => {
                    return _.camelCase(value.cn);
                });
                var find = _.find(groupsOfUser, (o) => {
                    return groups.indexOf(o) != -1;
                });
                if (find) {
                    callback(true, null);
                } else {
                    var msg = mensagemEnum.msg06;
                    log.info(msg);
                    if (res) {
                        res.status(401);
                    }
                    var error = new Error();
                    error.message = msg;
                    ResponseData.errorResponse(error, callbackLocal);
                }
            });
        });
    }
    var checkAuth = (username, password, res, groups, callback) => {
        global.AD.authenticate(username + '@' + global.config.server.mail.domain, password, (err, auth) => {
            var callbackLocal = (resp) => {
                callback(false, resp);
            }
            if (err) {
                log.error(err);
            }
            if (auth) {
                if (groups.length) {
                    checkAutorizationAccess(username, groups, res, callback);
                } else {
                    callback(true);
                }
            } else {
                var msg = mensagemEnum.server403;
                log.info(msg);
                if (res) {
                    res.status(403);
                }
                var error = new Error();
                error.message = msg;
                ResponseData.errorResponse(error, callbackLocal);
            }
        });
    };
    return {
        authenticate: (req, res, next) => {
            var isMobile = AppUtil.isMobile(req.headers['user-agent']);
            var device = isMobile ? 'mobile' : 'desktop';
            var projectName = _.filter(projectEnum, function (o) {
                return o.id == req.headers.project;
            });
            projectName = projectName[0] || {};
            console.log("[RESQUEST] - URL: [" + req.method.toUpperCase() + "] '" + req.originalUrl + "' | USER: '" + ((req.headers.username) ? req.headers.username : '##') + "' | PROJECT: '" + projectName.name + "' | DEVICE: '" + device + "'");
            var path = req.route.path;
            var groups = [];
            var groupADArray = [];
            var swagger = global.swaggerSpec;
            var swaggerParams = swagger.paths[path][req.method.toLowerCase()];
            var requireAD = groupADArray = swaggerParams['requireAD'];
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
            if (!req.headers.username && !req.headers.token) {
                res.status(500);
                ResponseData.errorResponse(new Error(), (data) => {
                    res.send(data);
                    res.end();
                });
                return;
            }
            var username = req.headers.username;
            var password = CryptoJS.AES.decrypt(String(req.headers.token), global.config.keyRequestAutentication).toString(CryptoJS.enc.Utf8);
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