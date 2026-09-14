'use strict';
/**
 * Teste de integração: sobe o servidor real (index.js) e valida o comportamento
 * de segurança observável por HTTP. Não requer banco de dados: as tentativas de
 * login falham na conexão JDBC e devem produzir uma resposta genérica.
 */
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 19000 + Math.floor(Math.random() * 1000);
const BASE = 'http://127.0.0.1:' + PORT;
let server;
let output = '';

function startServer() {
    return new Promise((resolve, reject) => {
        server = spawn(process.execPath, ['index.js'], {
            cwd: path.resolve(__dirname, '..'),
            env: Object.assign({}, process.env, {
                KEY_REQUEST_AUTH: 'integration-test-key-with-32-chars-ok',
                PORT: String(PORT),
                CORS_ORIGINS: 'http://ok.test',
                BODY_LIMIT: '100kb',
                LOGIN_RATE_LIMIT_MAX: '2',
                FORCE_COLOR: '0'
            }),
            stdio: ['ignore', 'pipe', 'pipe']
        });
        const timer = setTimeout(() => reject(new Error('servidor não iniciou:\n' + output)), 30000);
        const onData = (chunk) => {
            output += chunk.toString();
            if (output.indexOf('Server started') !== -1) {
                clearTimeout(timer);
                resolve();
            }
        };
        server.stdout.on('data', onData);
        server.stderr.on('data', onData);
        server.on('exit', (code) => {
            clearTimeout(timer);
            reject(new Error('servidor terminou com código ' + code + ':\n' + output));
        });
    });
}

test.before(async () => { await startServer(); });
test.after(() => { if (server) { server.kill('SIGKILL'); } });

test('servidor não inicia sem KEY_REQUEST_AUTH', async () => {
    const env = Object.assign({}, process.env);
    delete env.KEY_REQUEST_AUTH;
    const result = await new Promise((resolve) => {
        const child = spawn(process.execPath, ['index.js'], { cwd: path.resolve(__dirname, '..'), env, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        child.stdout.on('data', (c) => { out += c; });
        child.stderr.on('data', (c) => { out += c; });
        child.on('exit', (code) => resolve({ code, out }));
    });
    assert.notStrictEqual(result.code, 0);
    assert.ok(result.out.indexOf('KEY_REQUEST_AUTH') !== -1);
});

test('CORS: origem permitida recebe cabeçalhos, origem desconhecida não', async () => {
    const ok = await fetch(BASE + '/api/cep/abc', { headers: { Origin: 'http://ok.test' } });
    assert.strictEqual(ok.headers.get('access-control-allow-origin'), 'http://ok.test');
    const denied = await fetch(BASE + '/api/cep/abc', { headers: { Origin: 'http://evil.test' } });
    assert.strictEqual(denied.headers.get('access-control-allow-origin'), null);
    const preflight = await fetch(BASE + '/api/manager/login', { method: 'OPTIONS', headers: { Origin: 'http://ok.test', 'Access-Control-Request-Method': 'POST' } });
    assert.strictEqual(preflight.status, 204);
});

test('cabeçalhos de segurança (helmet) presentes e X-Powered-By ausente', async () => {
    const res = await fetch(BASE + '/api/cep/abc');
    assert.strictEqual(res.headers.get('x-powered-by'), null);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('ratelimit') || res.headers.get('ratelimit-limit'));
});

test('JSON malformado responde 400 em JSON, sem página HTML nem stack trace', async () => {
    const res = await fetch(BASE + '/api/manager/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
    assert.strictEqual(res.status, 400);
    const text = await res.text();
    assert.ok(text.indexOf('<html') === -1 && text.indexOf('    at ') === -1);
    const body = JSON.parse(text);
    assert.strictEqual(body.isSuccess, false);
});

test('payload acima de BODY_LIMIT responde 413', async () => {
    const res = await fetch(BASE + '/api/manager/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a'.repeat(200 * 1024) }) });
    assert.strictEqual(res.status, 413);
});

test('CEP inválido responde 422 sem chamar serviço externo', async () => {
    const res = await fetch(BASE + "/api/cep/12'<x>");
    assert.strictEqual(res.status, 422);
});

test('login sem dados responde 422', async () => {
    const res = await fetch(BASE + '/api/manager/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(res.status, 422);
});

test('falha no banco não vaza stack trace e login é limitado por IP', async () => {
    const attempt = () => fetch(BASE + '/api/manager/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "a@b.c' OR 1=1 -- ", password: 'x' })
    });
    // 1ª tentativa: o "{}" anterior já consumiu uma; esta é a 2ª (última permitida)
    const first = await attempt();
    assert.strictEqual(first.status, 500);
    const body = await first.json();
    assert.strictEqual(body.isSuccess, false);
    assert.strictEqual(body.message.additionalInformation, null);
    assert.ok(JSON.stringify(body).indexOf('java.sql') === -1);
    assert.ok(JSON.stringify(body).indexOf('\tat ') === -1);
    // 3ª tentativa: bloqueada
    const third = await attempt();
    assert.strictEqual(third.status, 429);
});
