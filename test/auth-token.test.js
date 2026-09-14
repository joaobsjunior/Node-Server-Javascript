'use strict';
const test = require('node:test');
const assert = require('node:assert');
const jws = require('jws');

global.config = { keyRequestAutentication: 'unit-test-secret-key-with-32-chars!!', auth: { tokenTtlSeconds: 60 } };
const AuthToken = require('../common/auth-token');

test('emite e valida um token', () => {
    const token = AuthToken.sign({ email: 'a@b.c', passwordHash: 'hash' });
    const data = AuthToken.verify(token);
    assert.ok(data);
    assert.strictEqual(data.email, 'a@b.c');
    assert.ok(AuthToken.matches(data, 'hash'));
    assert.ok(!AuthToken.matches(data, 'other-hash'));
});

test('token não expõe o hash da senha', () => {
    const token = AuthToken.sign({ email: 'a@b.c', passwordHash: 'super-secret-hash' });
    const payload = Buffer.from(token.split('.')[1], 'base64').toString();
    assert.ok(payload.indexOf('super-secret-hash') === -1);
});

test('rejeita token adulterado, assinado com outra chave ou alg=none', () => {
    const token = AuthToken.sign({ email: 'a@b.c', passwordHash: 'hash' });
    const parts = token.split('.');
    const tampered = parts[0] + '.' + Buffer.from(JSON.stringify({ sub: 'evil@b.c', fp: 'x', exp: 9999999999 })).toString('base64url') + '.' + parts[2];
    assert.strictEqual(AuthToken.verify(tampered), null);

    const other = jws.sign({ header: { alg: 'HS256' }, payload: { sub: 'a@b.c', fp: 'x', exp: 9999999999 }, secret: 'other' });
    assert.strictEqual(AuthToken.verify(other), null);

    const none = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url') + '.' +
        Buffer.from(JSON.stringify({ sub: 'a@b.c', fp: 'x', exp: 9999999999 })).toString('base64url') + '.';
    assert.strictEqual(AuthToken.verify(none), null);
    assert.strictEqual(AuthToken.verify(''), null);
    assert.strictEqual(AuthToken.verify('garbage'), null);
    assert.strictEqual(AuthToken.verify(undefined), null);
});

test('rejeita token expirado', () => {
    const expired = jws.sign({
        header: { alg: 'HS256' },
        payload: { sub: 'a@b.c', fp: AuthToken.fingerprint('hash'), iat: 0, exp: Math.floor(Date.now() / 1000) - 1 },
        secret: global.config.keyRequestAutentication
    });
    assert.strictEqual(AuthToken.verify(expired), null);
});
