'use strict';

/**
 * Limitadores de requisições (proteção contra força bruta e abuso).
 *
 *  - global: aplicado a todas as rotas (RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX)
 *  - login : aplicado ao endpoint de autenticação (LOGIN_RATE_LIMIT_*)
 *
 * A chave é o IP do cliente (req.ip); atrás de proxy reverso configure
 * TRUST_PROXY para que o IP real seja usado.
 */

const rateLimit = require('express-rate-limit');
const Response = require('./model/Response.model');
const messageEnum = require('./enum/message.enum');

function buildHandler(message) {
    return (req, res) => {
        let body = new Response();
        body.message.setMessage(message);
        res.status(429).json(body);
    };
}

function create(rateConfig) {
    let cfg = rateConfig || {};
    let common = {
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: buildHandler(messageEnum.server429)
    };
    return {
        global: rateLimit(Object.assign({}, common, {
            windowMs: cfg.windowMs || 60 * 1000,
            limit: cfg.max || 300
        })),
        login: rateLimit(Object.assign({}, common, {
            windowMs: cfg.loginWindowMs || 15 * 60 * 1000,
            limit: cfg.loginMax || 10,
            // Só conta tentativas que não resultaram em sucesso
            skipSuccessfulRequests: true
        }))
    };
}

module.exports = exports = { create };
