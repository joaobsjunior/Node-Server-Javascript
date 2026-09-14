'use strict';

// constants
const AppUtil = require('./app-util');
const AuthToken = require('./auth-token');
let LoginRepository = require('./../app/manager/login/Login.repository');
let Login = require('./../app/manager/login/Login.model');

// model domains
let ResponseData = require('./response-data');

const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

function isLoopback(req) {
    let address = req.socket && req.socket.remoteAddress;
    if (!address) {
        return false;
    }
    return LOOPBACK_ADDRESSES.indexOf(address) !== -1 || address.indexOf('127.') === 0 || address.indexOf('::ffff:127.') === 0;
}

function sendError(res, status) {
    if (res.headersSent) {
        return;
    }
    res.status(status);
    ResponseData.errorResponse(new Error(), (data) => {
        data.message.message = null;
        res.send(data);
        res.end();
    });
}

exports = module.exports = () => {
    /**
     * checkAuth - Confere o token contra o usuário no banco: o usuário precisa
     * existir e o fingerprint do token precisa bater com o hash atual da senha
     * (tokens antigos são invalidados quando a senha muda).
     */
    let checkAuth = (tokenData, res, callback) => {
        let login = new Login();
        login.email = tokenData.email;
        let loginRepository = new LoginRepository();
        loginRepository.checkLogin(login, res, (data) => {
            if (!data || !data.isSuccess || !data.size || !data.response || !data.response[0]) {
                callback(false);
                return;
            }
            callback(AuthToken.matches(tokenData, data.response[0].password));
        });
    };

    return {
        authenticate: (req, res, next) => {
            process.nextTick(() => {
                try {
                    let timeout = global.config && global.config.server && global.config.server.requestTimeoutMs;
                    if (timeout && timeout > 0 && res.socket) {
                        res.socket.setTimeout(timeout);
                    }
                    let isMobile = AppUtil.isMobile(req.headers['user-agent']);
                    let device = isMobile ? 'mobile' : 'desktop';
                    let body = (req.body && typeof req.body === 'object') ? req.body : {};
                    let user = req.headers.email || body.email || '##';
                    let params = AppUtil.clone(body) || {};
                    if (params.password) {
                        params.password = "***";
                    }
                    params = JSON.stringify(params, null, 4);
                    let method = req.method.toUpperCase();
                    let logStr = "[RESQUEST] - URL: [" + method + "] '" + req.originalUrl + "' | USER: '" + user + "' | DEVICE: '" + device + "'";
                    if (method != 'GET') {
                        logStr += " BODY: '\n" + params + "'";
                    }
                    log.info(logStr);

                    let path = req.route && req.route.path;
                    let swagger = global.swaggerSpec || {};
                    let swaggerPath = swagger.paths && swagger.paths[path];
                    let swaggerParams = swaggerPath && swaggerPath[req.method.toLowerCase()];
                    if (!swaggerParams) {
                        // Rota sem documentação swagger: nega por padrão (fail-closed)
                        log.warn("[interceptor] Rota sem definição swagger, acesso negado: [" + method + "] " + path);
                        sendError(res, 403);
                        return;
                    }
                    let requireAD = swaggerParams['requireAD'];
                    if (swaggerParams['onlyLocalhost'] && !isLoopback(req)) {
                        sendError(res, 403);
                        return;
                    }
                    if (!requireAD) {
                        next();
                        return;
                    }
                    if (!req.headers.token) {
                        sendError(res, 401);
                        return;
                    }
                    let tokenData = AuthToken.verify(String(req.headers.token));
                    if (!tokenData) {
                        sendError(res, 401);
                        return;
                    }
                    checkAuth(tokenData, res, (auth) => {
                        if (auth) {
                            next();
                            return;
                        }
                        sendError(res, 401);
                    });
                } catch (error) {
                    log.error(error);
                    sendError(res, 500);
                }
            });
        }
    }
}
