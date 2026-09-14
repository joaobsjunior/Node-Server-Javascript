'use strict';
const test = require('node:test');
const assert = require('node:assert');
const _ = require('lodash');
const sqlEscape = require('../common/sql-escape');
const DB = require('../common/enum/database.enum');

test('escapa aspas simples duplicando-as (todos os dialetos)', () => {
    assert.strictEqual(sqlEscape.escapeString("a'b", DB.POSTGRESQL), "a''b");
    assert.strictEqual(sqlEscape.escapeString("a'b", DB.MARIADB), "a''b");
});

test('em MySQL/MariaDB a barra invertida também é escapada', () => {
    assert.strictEqual(sqlEscape.escapeString("a\\'b", DB.MARIADB), "a\\\\''b");
    assert.strictEqual(sqlEscape.escapeString("a\\b", DB.POSTGRESQL), "a\\b");
});

test('remove bytes nulos', () => {
    assert.strictEqual(sqlEscape.escapeString("a\0b", DB.MARIADB), "ab");
});

test('mantém números, booleanos e null', () => {
    assert.strictEqual(sqlEscape.escapeValue(42, DB.MARIADB), 42);
    assert.strictEqual(sqlEscape.escapeValue(true, DB.MARIADB), true);
    assert.strictEqual(sqlEscape.escapeValue(null, DB.MARIADB), null);
    assert.strictEqual(sqlEscape.escapeValue(undefined, DB.MARIADB), undefined);
    assert.strictEqual(sqlEscape.escapeValue(Infinity, DB.MARIADB), 0);
});

test('payload clássico de SQL injection deixa de fechar o literal', () => {
    const sql = "SELECT * FROM administrator WHERE email = '${email}' AND password = '${password}'";
    const bind = sqlEscape.escapeBindVars({ email: "x@y.z' OR 1=1 -- ", password: "p" }, DB.MARIADB);
    const compiled = _.template(sql)(bind);
    assert.strictEqual(compiled, "SELECT * FROM administrator WHERE email = 'x@y.z'' OR 1=1 -- ' AND password = 'p'");
});

test('objetos são serializados e escapados', () => {
    assert.strictEqual(sqlEscape.escapeValue({ a: "'" }, DB.MARIADB), "{\"a\":\"''\"}");
});
