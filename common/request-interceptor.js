'use strict';

// constants
const AppUtil = require('./app-util');
const AuthToken = require('./auth-token');
let LoginRepository = require('./../app/manager/login/Login.repository');

// model domains
let ResponseData = require('./response-data');

const LOOPBACK_ADDRESSES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

exports = module.exports = () => {

    let sendError = (res, status) => {
        res.status(status);
        ResponseData.errorResponse(new Error(), (data) => {
            res.send(data);
            res.end();
        });
    };

    /**
     * checkAuth - Confirma que o usuário do token ainda existe e que a senha não mudou
     * desde a emissão (fingerprint do hash armazenado).
     */
    let checkAuth = (claims, res, callback) => {
        let loginRepository = new LoginRepository();
        loginRepository.checkLogin(claims, res, (data) => {
            callback(Boolean(data && data.isSuccess && data.size), null);
        });
    };

    /**
     * isLocalRequest - Verifica a origem pelo endereço do socket (o cabeçalho Host é
     * controlado pelo cliente e não serve como prova de origem local).
     */
    let isLocalRequest = (req) => {
        let address = req.socket && req.socket.remoteAddress;
        return Boolean(address) && LOOPBACK_ADDRESSES.indexOf(address) !== -1;
    };

    return {
        authenticate: (req, res, next) => {
            process.nextTick(() => {
                try {
                    let isMobile = AppUtil.isMobile(req.headers['user-agent']);
                    let device = isMobile ? 'mobile' : 'desktop';
                    let user = req.headers.email || (req.body && req.body.email) || '##';
                    if (typeof user !== 'string') {
                        try {
                            user = JSON.stringify(user);
                        } catch (e) {
                            user = '##';
                        }
                    }
                    let params = AppUtil.clone(req.body || {});
                    if (params && params.password) {
                        params.password = "***";
                    }
                    params = JSON.stringify(params, null, 4);
                    let method = req.method.toUpperCase();
                    let logStr = "[REQUEST] - URL: [" + method + "] " + JSON.stringify(req.originalUrl) + " | USER: " + JSON.stringify(user) + " | DEVICE: '" + device + "'";
                    if (method != 'GET') {
                        logStr += " BODY: '\n" + params + "'";
                    }
                    log.info(logStr);

                    let path = req.route && req.route.path;
                    let swagger = global.swaggerSpec || {};
                    let swaggerPath = (swagger.paths && path) ? swagger.paths[path] : null;
                    let swaggerParams = swaggerPath ? swaggerPath[req.method.toLowerCase()] : null;

                    // Rota sem documentação: assume o comportamento mais restritivo
                    // (autenticação obrigatória) em vez de interromper o processo.
                    let requireAD = swaggerParams ? Boolean(swaggerParams['requireAD']) : true;
                    let onlyLocalhost = swaggerParams ? Boolean(swaggerParams['onlyLocalhost']) : false;

                    if (onlyLocalhost && !isLocalRequest(req)) {
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
                    let claims;
                    try {
                        claims = AuthToken.verify(String(req.headers.token));
                    } catch (e) {
                        sendError(res, 401);
                        return;
                    }
                    if (!claims || typeof claims.email !== 'string') {
                        sendError(res, 401);
                        return;
                    }
                    checkAuth(claims, res, (auth) => {
                        if (auth) {
                            req.user = claims;
                            next();
                        } else {
                            sendError(res, 401);
                        }
                    });
                } catch (err) {
                    ResponseData.errorResponse(err);
                    if (!res.headersSent) {
                        sendError(res, 500);
                    }
                }
            });
        }
    }
}
