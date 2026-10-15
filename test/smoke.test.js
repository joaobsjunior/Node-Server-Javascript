'use strict';
/**
 * Teste de fumaça ponta a ponta.
 *
 * Sobe o servidor contra um banco H2 em memória (driver baixado do Maven Central
 * na primeira execução, em test/.cache) e verifica:
 *  - login válido/inválido e emissão de token JWT (sem credenciais no payload)
 *  - imunidade a injeção de SQL (prepared statements)
 *  - respostas de erro sem stack trace/SQL
 *  - validação do CEP, CORS, cabeçalhos do helmet, rate limit do login
 *  - interceptor de autenticação (token válido, adulterado, expirado, ausente,
 *    rota sem documentação, restrição a localhost)
 *
 * Uso: npm test
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.resolve(__dirname, '.cache');
const H2_JAR = path.join(CACHE, 'h2.jar');
const H2_URL = 'https://repo1.maven.org/maven2/com/h2database/h2/2.3.232/h2-2.3.232.jar';
const INIT_SQL = path.join(CACHE, 'init.sql');
const PORT = 19090 + Math.floor(Math.random() * 1000);
const KEY = 'chave-de-teste-com-mais-de-32-caracteres-0123456789';
const LOGIN_LIMIT = 8;

const initScript = `
CREATE ALIAS IF NOT EXISTS MD5 AS $$
String md5(String s) throws Exception {
  java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
  byte[] d = md.digest(s.getBytes("UTF-8"));
  StringBuilder sb = new StringBuilder();
  for (byte b : d) sb.append(String.format("%02x", b));
  return sb.toString();
}
$$;
CREATE ALIAS IF NOT EXISTS SHA1 AS $$
String sha1(String s) throws Exception {
  java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-1");
  byte[] d = md.digest(s.getBytes("UTF-8"));
  StringBuilder sb = new StringBuilder();
  for (byte b : d) sb.append(String.format("%02x", b));
  return sb.toString();
}
$$;
CREATE TABLE IF NOT EXISTS administrator (idadministrator INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), password VARCHAR(255), name VARCHAR(255), level INT);
INSERT INTO administrator (email, password, name, level) SELECT 'admin@test.com', SHA1(MD5('secret')), 'Admin', 1 WHERE NOT EXISTS (SELECT 1 FROM administrator);
`;

function testEnv(dbName) {
    return Object.assign({}, process.env, {
        KEY_REQUEST_AUTH: KEY,
        PORT: String(PORT),
        CORS_ORIGINS: 'http://allowed.example',
        DB_TYPE: 'MARIADB',
        DB_URL: 'jdbc:h2:mem:' + dbName + ';DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE;INIT=RUNSCRIPT FROM \'' + INIT_SQL.replace(/\\/g, '/') + '\'',
        DB_DRIVER: 'org.h2.Driver',
        DB_DRIVERS_DIR: CACHE,
        DB_USER: 'sa',
        DB_PASSWORD: '',
        RATE_LIMIT_LOGIN_MAX: String(LOGIN_LIMIT),
        RATE_LIMIT_LOGIN_WINDOW_MS: '60000',
        EXPOSE_ERROR_DETAILS: '',
        MAIL_USER: '',
        MAIL_PASS: '',
        FORCE_COLOR: '0'
    });
}

async function ensureDriver() {
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(INIT_SQL, initScript);
    if (fs.existsSync(H2_JAR) && fs.statSync(H2_JAR).size > 1000000) {
        return;
    }
    console.log('[test] baixando driver H2...');
    let response = await fetch(H2_URL);
    if (!response.ok) {
        throw new Error('Falha ao baixar o driver H2: HTTP ' + response.status);
    }
    fs.writeFileSync(H2_JAR, Buffer.from(await response.arrayBuffer()));
}

function startServer() {
    return new Promise((resolve, reject) => {
        let child = spawn(process.execPath, ['index.js'], { cwd: ROOT, env: testEnv('smoke') });
        let output = '';
        let done = false;
        let onData = (chunk) => {
            output += chunk.toString();
            if (!done && output.indexOf('Server started') !== -1) {
                done = true;
                resolve({ child, output: () => output });
            }
        };
        child.stdout.on('data', onData);
        child.stderr.on('data', onData);
        child.on('exit', (code) => {
            if (!done) {
                done = true;
                reject(new Error('Servidor encerrou antes de iniciar (código ' + code + ')\n' + output));
            }
        });
        setTimeout(() => {
            if (!done) {
                done = true;
                child.kill();
                reject(new Error('Timeout ao iniciar o servidor\n' + output));
            }
        }, 60000);
    });
}

async function request(method, urlPath, body, headers = {}) {
    let options = { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers) };
    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }
    let response = await fetch('http://127.0.0.1:' + PORT + urlPath, options);
    let text = await response.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch (e) {
        json = null;
    }
    return { status: response.status, headers: response.headers, text, json };
}

let passed = 0;
function check(name, condition, detail) {
    if (!condition) {
        throw new Error('FALHOU: ' + name + (detail ? '\n' + detail : ''));
    }
    passed++;
    console.log('  ok - ' + name);
}

async function httpTests() {
    console.log('[test] HTTP');
    let login = await request('POST', '/api/manager/login', { email: 'admin@test.com', password: 'secret' });
    check('login válido retorna 200 e isSuccess', login.status === 200 && login.json && login.json.isSuccess === true, login.text);
    check('login válido retorna id, email, name, level', login.json.response.id === 1 && login.json.response.email === 'admin@test.com' && login.json.response.name === 'Admin' && login.json.response.level === 1, login.text);
    let token = login.json.response.token;
    check('token é um JWT (3 partes)', typeof token === 'string' && token.split('.').length === 3, token);
    let payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    check('token não carrega senha nem hash', payload.password === undefined && JSON.stringify(payload).indexOf('secret') === -1 && payload.fp && payload.fp.length === 64, JSON.stringify(payload));
    check('token possui expiração', typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000), JSON.stringify(payload));

    let wrong = await request('POST', '/api/manager/login', { email: 'admin@test.com', password: 'wrong' });
    check('senha errada não autentica', wrong.status === 200 && wrong.json.isSuccess === true && !wrong.json.size && Array.isArray(wrong.json.response) && wrong.json.response.length === 0, wrong.text);

    let injection = await request('POST', '/api/manager/login', { email: "admin@test.com' OR '1'='1", password: "x') OR '1'='1" });
    check('injeção de SQL não autentica nem gera erro', injection.status === 200 && injection.json.isSuccess === true && !injection.json.size && injection.json.response.length === 0, injection.text);
    check('injeção de SQL não vaza SQL/stack', injection.text.indexOf('administrator') === -1 && injection.text.indexOf('stack') === -1, injection.text);

    let injection2 = await request('POST', '/api/manager/login', { email: "admin@test.com'--", password: "x" });
    check('comentário SQL no e-mail não autentica', injection2.json.isSuccess === true && !injection2.json.size, injection2.text);

    let missing = await request('POST', '/api/manager/login', { email: 'admin@test.com' });
    check('campos ausentes retornam 422', missing.status === 422, missing.text);

    let dateAttack = await request('POST', '/api/manager/login', { email: { toString: 1 }, password: "'); process.exit(1); ('" });
    check('payload malicioso não derruba o servidor', dateAttack.status === 200 || dateAttack.status === 422, dateAttack.text);

    let cep = await request('GET', '/api/cep/abc');
    check('CEP inválido retorna 422', cep.status === 422 && cep.json.isSuccess === false, cep.text);
    let cep2 = await request('GET', '/api/cep/12345678%27%3Cx%3E');
    check('CEP com caracteres extras retorna 422', cep2.status === 422, cep2.text);

    let cors = await request('GET', '/api/cep/abc', undefined, { Origin: 'http://allowed.example' });
    check('CORS liberado para origem permitida', cors.headers.get('access-control-allow-origin') === 'http://allowed.example');
    let corsDenied = await request('GET', '/api/cep/abc', undefined, { Origin: 'http://evil.example' });
    check('CORS negado para origem desconhecida', corsDenied.headers.get('access-control-allow-origin') === null);
    check('cabeçalhos de segurança (helmet) presentes', cors.headers.get('x-content-type-options') === 'nosniff' && cors.headers.get('x-powered-by') === null);

    let limited = null;
    for (let i = 0; i < LOGIN_LIMIT + 2; i++) {
        let attempt = await request('POST', '/api/manager/login', { email: 'admin@test.com', password: 'wrong' });
        if (attempt.status === 429) {
            limited = attempt;
            break;
        }
    }
    check('rate limit do login responde 429', limited !== null && limited.json && limited.json.isSuccess === false, limited && limited.text);
    return token;
}

async function interceptorTests(token) {
    console.log('[test] interceptor (em processo)');
    Object.assign(process.env, testEnv('interceptor'));
    process.chdir(ROOT);
    require('annotation-js');
    require(path.join(ROOT, 'common/safe-populate'));
    global.config = require(path.join(ROOT, 'config/config'))();
    global.config.paths.root = ROOT;
    global.utils = require(path.join(ROOT, 'utils/utils'));
    global.log = { info() {}, warn() {}, error() {} };
    global.swaggerSpec = {
        paths: {
            '/api/protected': { get: { requireAD: true } },
            '/api/public': { get: { requireAD: false } },
            '/api/local': { get: { requireAD: false, onlyLocalhost: true } }
        }
    };
    const AuthToken = require(path.join(ROOT, 'common/auth-token'));
    const interceptor = require(path.join(ROOT, 'common/request-interceptor'))();

    function run(routePath, headers, remoteAddress = '203.0.113.5') {
        return new Promise((resolve) => {
            let status = 200;
            let req = {
                headers: Object.assign({ 'user-agent': 'test', host: 'localhost' }, headers),
                body: {},
                method: 'GET',
                originalUrl: routePath,
                route: { path: routePath },
                socket: { remoteAddress }
            };
            let res = {
                status(code) { status = code; },
                send() {},
                end() { resolve({ status, next: false }); }
            };
            interceptor.authenticate(req, res, () => resolve({ status: 200, next: true, user: req.user }));
        });
    }

    let ok = await run('/api/protected', { token });
    check('token válido libera rota protegida', ok.next === true && ok.user && ok.user.email === 'admin@test.com', JSON.stringify(ok));
    let none = await run('/api/protected', {});
    check('sem token retorna 401', none.status === 401 && none.next === false);
    let parts = token.split('.');
    let tamperedPayload = Buffer.from(JSON.stringify(Object.assign({}, JSON.parse(Buffer.from(parts[1], 'base64').toString()), { level: 99 }))).toString('base64url');
    let tampered = await run('/api/protected', { token: parts[0] + '.' + tamperedPayload + '.' + parts[2] });
    check('token adulterado retorna 401', tampered.status === 401 && tampered.next === false);
    let expiredToken = require('jws').sign({ header: { alg: 'HS256', typ: 'JWT' }, payload: { email: 'admin@test.com', exp: Math.floor(Date.now() / 1000) - 10 }, secret: KEY });
    let expired = await run('/api/protected', { token: expiredToken });
    check('token expirado retorna 401', expired.status === 401 && expired.next === false);
    let noneAlg = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url') + '.' + parts[1] + '.';
    let algNone = await run('/api/protected', { token: noneAlg });
    check('token com alg=none retorna 401', algNone.status === 401 && algNone.next === false);
    let otherUser = AuthToken.sign({ email: 'ghost@test.com', fp: 'x' });
    let ghost = await run('/api/protected', { token: otherUser });
    check('token assinado para usuário inexistente retorna 401', ghost.status === 401 && ghost.next === false);
    let wrongFp = AuthToken.sign({ email: 'admin@test.com', fp: '0'.repeat(64) });
    let fp = await run('/api/protected', { token: wrongFp });
    check('token com senha alterada (fingerprint) retorna 401', fp.status === 401 && fp.next === false);
    let pub = await run('/api/public', {});
    check('rota pública sem token é liberada', pub.next === true);
    let undocumented = await run('/api/undocumented', {});
    check('rota sem documentação exige autenticação (fail-closed)', undocumented.status === 401 && undocumented.next === false);
    let remoteLocal = await run('/api/local', { host: 'localhost' }, '203.0.113.5');
    check('onlyLocalhost ignora cabeçalho Host forjado', remoteLocal.status === 403 && remoteLocal.next === false);
    let loopback = await run('/api/local', {}, '127.0.0.1');
    check('onlyLocalhost libera loopback', loopback.next === true);
}

function connectorTests() {
    console.log('[test] conector de banco / binder (em processo)');
    const SqlBinder = require(path.join(ROOT, 'common/sql-binder'));
    const sqlType = require(path.join(ROOT, 'common/enum/sqltype.enum'));
    const dbConfig = require(path.join(ROOT, 'config/dbconfig'));
    const dbEngine = require(path.join(ROOT, 'common/database-connector'))();

    let bound = SqlBinder.bind("SELECT * FROM t WHERE a = '${a}' AND b = ${ b } AND c = '${obj.c}' AND d = '${missing}'", { a: "x'; DROP TABLE t; --", b: 2, obj: { c: true } });
    check('binder converte ${nome} em ? preservando a ordem', bound.sql === 'SELECT * FROM t WHERE a = ? AND b = ? AND c = ? AND d = ?' && bound.values[0] === "x'; DROP TABLE t; --" && bound.values[1] === 2 && bound.values[2] === true && bound.values[3] === null, JSON.stringify(bound));
    check('binder separa lotes antes do bind', SqlBinder.splitScripts("UPDATE t SET a = '${a}'; DELETE FROM t WHERE b = '${b}';").length === 2);
    check('binder detecta ? literal (parâmetro de saída)', SqlBinder.hasLiteralQuestionMark('{call p(?, ${x})}') === true && SqlBinder.hasLiteralQuestionMark('SELECT ${x}') === false);

    let execute = (sql, type, bindVars) => new Promise((resolve) => dbEngine.execute(dbConfig.GSENSEX, sql, type, bindVars, resolve));

    return (async () => {
        let insert = await execute("INSERT INTO administrator (email, password, name, level) VALUES ('${email}', '${password}', '${name}', ${level})", sqlType.UPDATE, { email: 'user2@test.com', password: 'h', name: "O'Brien; DROP TABLE administrator; --", level: 2 });
        check('UPDATE/INSERT via prepared statement devolve chave gerada', insert.isSuccess === true && Array.isArray(insert.response) && insert.response.length === 1, JSON.stringify(insert));

        let select = await execute("SELECT * FROM administrator WHERE name = '${name}' AND level = ${level} AND ${nothing} IS NULL", sqlType.SELECT, { name: "O'Brien; DROP TABLE administrator; --", level: 2, nothing: null });
        check('SELECT com string hostil, número e NULL', select.isSuccess === true && select.size === 1 && select.response[0].email === 'user2@test.com', JSON.stringify(select));

        let batch = await execute("UPDATE administrator SET level = ${level} WHERE email = '${email}'; UPDATE administrator SET name = '${name}' WHERE email = '${email}';", sqlType.STATEMENT, { level: 3, email: 'user2@test.com', name: 'Renamed' });
        check('lote STATEMENT em transação devolve total de linhas', batch.isSuccess === true && batch.response === 2, JSON.stringify(batch));

        let after = await execute("SELECT name, level FROM administrator WHERE email = '${email}'", sqlType.SELECT, { email: 'user2@test.com' });
        check('lote aplicado', after.response[0].name === 'Renamed' && after.response[0].level === 3, JSON.stringify(after));

        let big = await execute("SELECT ${big} AS big, ${dbl} AS dbl, ${flag} AS flag, ${when} AS d FROM administrator WHERE email = '${email}'", sqlType.SELECT, { big: 9007199254740000, dbl: 1.5, flag: true, when: new Date('2024-01-02T03:04:05Z'), email: 'user2@test.com' });
        check('parâmetros long, double, boolean e Date', big.isSuccess === true && big.response[0].big === 9007199254740000 && big.response[0].dbl === 1.5, JSON.stringify(big));

        let del = await execute("DELETE FROM administrator WHERE email = '${email}'", sqlType.DELETE, { email: 'user2@test.com' });
        check('DELETE via prepared statement', del.isSuccess === true, JSON.stringify(del));

        let bad = await execute("SELECT * FROM tabela_inexistente WHERE x = '${x}'", sqlType.SELECT, { x: 1 });
        check('erro de banco não expõe detalhes internos', bad.isSuccess === false && bad.message.message.indexOf('tabela_inexistente') === -1 && bad.message.additionalInformation === null, JSON.stringify(bad));
    })();
}

(async () => {
    let server = null;
    try {
        await ensureDriver();
        server = await startServer();
        let token = await httpTests();
        await interceptorTests(token);
        await connectorTests();
        console.log('\n' + passed + ' verificações OK');
        process.exitCode = 0;
    } catch (err) {
        console.error('\n' + (err.stack || err));
        if (server) {
            console.error('--- saída do servidor ---\n' + server.output());
        }
        process.exitCode = 1;
    } finally {
        if (server) {
            server.child.kill();
        }
        setTimeout(() => process.exit(), 200).unref();
    }
})();
