'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('node:events');

global.config = {
    keyRequestAutentication: 'unit-test-secret-key-with-32-chars!!',
    auth: { tokenTtlSeconds: 60 },
    server: { requestTimeoutMs: 0, exposeErrorDetails: false }
};
global.log = { info() {}, warn() {}, error() {} };
global.swaggerSpec = {
    paths: {
        '/api/public': { get: { requireAD: false } },
        '/api/private': { get: { requireAD: true } },
        '/api/local': { get: { requireAD: false, onlyLocalhost: true } }
    }
};

// Evita carregar o driver JDBC/JVM no teste: substitui o conector de banco por um stub
const connectorPath = require.resolve('../common/database-connector');
require.cache[connectorPath] = { id: connectorPath, filename: connectorPath, loaded: true, exports: () => ({ execute() { throw new Error('stub'); } }) };

const LoginRepository = require('../app/manager/login/Login.repository');
const AuthToken = require('../common/auth-token');
const interceptor = require('../common/request-interceptor')();

// Repositório simulado: usuário "a@b.c" com hash "hash"
LoginRepository.prototype.checkLogin = function (login, res, callback) {
    if (login.email === 'a@b.c') {
        callback({ isSuccess: true, size: 1, response: [{ email: 'a@b.c', password: 'hash' }] });
    } else {
        callback({ isSuccess: true, size: 0, response: [] });
    }
};

function run(path, headers, remoteAddress) {
    return new Promise((resolve) => {
        const req = {
            method: 'GET',
            originalUrl: path,
            headers: Object.assign({ 'user-agent': 'test', host: 'localhost:9090' }, headers || {}),
            body: {},
            route: { path: path },
            socket: { remoteAddress: remoteAddress || '10.0.0.5' }
        };
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headersSent = false;
        res.socket = { setTimeout() {} };
        res.status = (code) => { res.statusCode = code; return res; };
        res.send = (body) => { res.body = body; res.headersSent = true; return res; };
        res.end = () => { resolve({ kind: 'response', status: res.statusCode, body: res.body }); };
        interceptor.authenticate(req, res, () => resolve({ kind: 'next' }));
    });
}

test('rota pública passa sem token', async () => {
    assert.deepStrictEqual(await run('/api/public'), { kind: 'next' });
});

test('rota protegida sem token responde 401 sem detalhes', async () => {
    const r = await run('/api/private');
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.body.isSuccess, false);
    assert.strictEqual(r.body.message.additionalInformation, null);
});

test('rota protegida com token inválido responde 401 sem derrubar o processo', async () => {
    const r = await run('/api/private', { token: 'U2FsdGVkX1+garbage' });
    assert.strictEqual(r.status, 401);
});

test('rota protegida com token válido passa', async () => {
    const token = AuthToken.sign({ email: 'a@b.c', passwordHash: 'hash' });
    assert.deepStrictEqual(await run('/api/private', { token }), { kind: 'next' });
});

test('token válido mas senha alterada (fingerprint diferente) responde 401', async () => {
    const token = AuthToken.sign({ email: 'a@b.c', passwordHash: 'old-hash' });
    assert.strictEqual((await run('/api/private', { token })).status, 401);
});

test('token de usuário inexistente responde 401', async () => {
    const token = AuthToken.sign({ email: 'ghost@b.c', passwordHash: 'hash' });
    assert.strictEqual((await run('/api/private', { token })).status, 401);
});

test('onlyLocalhost usa o endereço do socket, não o header Host', async () => {
    assert.strictEqual((await run('/api/local', { host: 'localhost' }, '203.0.113.9')).status, 403);
    assert.deepStrictEqual(await run('/api/local', { host: 'example.com' }, '127.0.0.1'), { kind: 'next' });
    assert.deepStrictEqual(await run('/api/local', {}, '::ffff:127.0.0.1'), { kind: 'next' });
});

test('rota sem definição swagger é negada (fail-closed) em vez de lançar exceção', async () => {
    assert.strictEqual((await run('/api/undocumented')).status, 403);
});
