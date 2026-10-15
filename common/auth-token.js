'use strict';
const jws = require('jws');

const ALGORITHM = 'HS256';

/**
 * AuthToken - Emite e valida tokens de autenticação (JWT assinado com HMAC-SHA256).
 *
 * Substitui o token anterior (AES com o e-mail e o hash da senha no payload):
 * o token agora não carrega credenciais, tem validade (exp) e qualquer alteração
 * no conteúdo invalida a assinatura.
 */
class AuthToken {

    static secret() {
        return global.config.keyRequestAutentication;
    }

    static expiresIn() {
        return global.config.auth.tokenExpiresIn;
    }

    /**
     * sign - Gera um token para o conjunto de claims informado.
     */
    static sign(claims = {}) {
        let now = Math.floor(Date.now() / 1000);
        let payload = Object.assign({}, claims, {
            iat: now,
            exp: now + AuthToken.expiresIn()
        });
        return jws.sign({
            header: {
                alg: ALGORITHM,
                typ: 'JWT'
            },
            payload: payload,
            secret: AuthToken.secret()
        });
    }

    /**
     * verify - Valida assinatura e validade. Lança erro quando inválido.
     * @returns {object} claims
     */
    static verify(token) {
        if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
            throw new Error('Token ausente ou inválido');
        }
        if (!jws.verify(token, ALGORITHM, AuthToken.secret())) {
            throw new Error('Assinatura do token inválida');
        }
        let decoded = jws.decode(token, { json: true });
        if (!decoded || !decoded.payload || typeof decoded.payload !== 'object') {
            throw new Error('Token inválido');
        }
        let payload = decoded.payload;
        let now = Math.floor(Date.now() / 1000);
        if (typeof payload.exp !== 'number' || payload.exp <= now) {
            throw new Error('Token expirado');
        }
        return payload;
    }
}

module.exports = exports = AuthToken;
