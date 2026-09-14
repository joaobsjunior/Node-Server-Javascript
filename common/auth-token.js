'use strict';

/**
 * Token de autenticação das requisições.
 *
 * Substitui o antigo token AES (CryptoJS, sem integridade e sem expiração,
 * transportando o hash da senha) por um JWT assinado com HMAC-SHA256 (jws):
 *   - `sub`: email do usuário;
 *   - `fp` : fingerprint HMAC do hash da senha armazenado no banco — permite
 *            invalidar o token quando a senha muda sem expor o hash ao cliente;
 *   - `iat`/`exp`: emissão e expiração (TOKEN_TTL_SECONDS).
 *
 * A chave de assinatura é KEY_REQUEST_AUTH (config.keyRequestAutentication).
 */

const crypto = require('crypto');
const jws = require('jws');

const ALGORITHM = 'HS256';

function getSecret() {
    let secret = global.config && global.config.keyRequestAutentication;
    if (!secret) {
        throw new Error('KEY_REQUEST_AUTH não configurada');
    }
    return secret;
}

function getTtlSeconds() {
    let ttl = global.config && global.config.auth && global.config.auth.tokenTtlSeconds;
    return (ttl && ttl > 0) ? ttl : 8 * 60 * 60;
}

/**
 * fingerprint - HMAC do hash da senha, para comparação sem expor o hash.
 */
function fingerprint(passwordHash) {
    return crypto
        .createHmac('sha256', getSecret())
        .update(String(passwordHash === null || passwordHash === undefined ? '' : passwordHash))
        .digest('hex');
}

/**
 * safeEqual - Comparação em tempo constante de duas strings.
 */
function safeEqual(a, b) {
    let bufA = Buffer.from(String(a || ''));
    let bufB = Buffer.from(String(b || ''));
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * sign - Emite um token para o usuário informado.
 * @param {{email: string, passwordHash: string}} user
 */
function sign(user) {
    let now = Math.floor(Date.now() / 1000);
    let payload = {
        sub: String(user.email),
        fp: fingerprint(user.passwordHash),
        iat: now,
        exp: now + getTtlSeconds()
    };
    return jws.sign({
        header: { alg: ALGORITHM, typ: 'JWT' },
        payload: payload,
        secret: getSecret()
    });
}

/**
 * verify - Valida assinatura, algoritmo e expiração do token.
 * @returns {{email: string, fp: string}|null} dados do token ou null se inválido
 */
function verify(token) {
    if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
        return null;
    }
    try {
        let decoded = jws.decode(token);
        if (!decoded || !decoded.header || decoded.header.alg !== ALGORITHM) {
            return null;
        }
        if (!jws.verify(token, ALGORITHM, getSecret())) {
            return null;
        }
        let payload = typeof decoded.payload === 'string' ? JSON.parse(decoded.payload) : decoded.payload;
        if (!payload || typeof payload.sub !== 'string' || typeof payload.fp !== 'string') {
            return null;
        }
        let now = Math.floor(Date.now() / 1000);
        if (typeof payload.exp !== 'number' || payload.exp <= now) {
            return null;
        }
        return { email: payload.sub, fp: payload.fp };
    } catch (e) {
        return null;
    }
}

/**
 * matches - Confere se o fingerprint do token corresponde ao hash atual da senha.
 */
function matches(tokenData, passwordHash) {
    if (!tokenData) {
        return false;
    }
    return safeEqual(tokenData.fp, fingerprint(passwordHash));
}

module.exports = exports = {
    ALGORITHM,
    sign,
    verify,
    fingerprint,
    matches,
    safeEqual
};
