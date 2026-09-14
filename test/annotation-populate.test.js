'use strict';
const test = require('node:test');
const assert = require('node:assert');
require('annotation-js');
global.annotationsDebug = false;
const populate = require('../common/annotation-populate');

class Model {
    constructor() {
        /*
        @Annotation(
            LOGIN[column="email"],
        )
        @type{string}
        */
        this.email = null;
        /*
        @Annotation(
            LOGIN[column="password"],
        )
        @type{string}
        */
        this.password = null;
        /*
        @Annotation(
            LOGIN[column="age"],
        )
        @type{number}
        */
        this.age = null;
    }
}

test('preenche campos string a partir do body sem alterar os dados', () => {
    const m = new Model();
    populate.populateToService(m, { email: 'a"b@c.d', password: "p'w\\d\n" }, 'body', 'LOGIN', 'query', 2);
    assert.strictEqual(m.email, 'a"b@c.d');
    assert.strictEqual(m.password, "p'w\\d\n");
});

test('campos numéricos com texto arbitrário nunca são executados como código', () => {
    const m = new Model();
    global.__pwned = false;
    populate.populateToService(m, { age: 'global.__pwned = true' }, 'body', 'LOGIN', 'query', 2);
    assert.strictEqual(global.__pwned, false);
    assert.strictEqual(m.age, null);
    populate.populateToService(m, { age: '42' }, 'body', 'LOGIN', 'query', 2);
    assert.strictEqual(m.age, 42);
});

test('mapeia pelo nome da anotação no modo query', () => {
    const m = new Model();
    populate.populateToService(m, { email: 'x@y.z', age: '7' }, 'query', 'LOGIN', 'column', 2);
    assert.strictEqual(m.email, 'x@y.z');
    assert.strictEqual(m.age, 7);
});

test('valores vazios viram null e install() registra a função global', () => {
    const m = new Model();
    populate.populateToService(m, { email: '' }, 'body', 'LOGIN', 'query', 2);
    assert.strictEqual(m.email, null);
    populate.install();
    assert.strictEqual(global.populateToService, populate.populateToService);
});
