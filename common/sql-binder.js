'use strict';
const _ = require('lodash');

// Placeholders no formato ${nome} (ou ${objeto.campo}), opcionalmente envoltos em
// aspas simples ('${nome}'), como usados nos arquivos .sql do projeto.
const PLACEHOLDER = /'?\$\{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\}'?/g;

const MAX_INT32 = 2147483647;
const MIN_INT32 = -2147483648;

/**
 * SqlBinder - Converte SQL com placeholders ${nome} em SQL com parâmetros posicionais (?)
 * e aplica os valores via PreparedStatement, eliminando a interpolação de texto
 * (injeção de SQL) que existia com lodash.template.
 */
class SqlBinder {

    /**
     * bind - Substitui cada ${nome} por "?" e devolve os valores na ordem de ocorrência.
     * @param {string} sql - SQL com placeholders
     * @param {object} bindVars - valores
     * @returns {{sql: string, values: Array}}
     */
    static bind(sql, bindVars = {}) {
        let values = [];
        let text = String(sql).replace(PLACEHOLDER, (match, name) => {
            let value = _.get(bindVars || {}, name);
            values.push(value === undefined ? null : value);
            return '?';
        });
        return {
            sql: text,
            values: values
        };
    }

    /**
     * hasPlaceholders - Indica se o SQL (antes do bind) contém "?" literais
     * (parâmetros de saída de procedures, por exemplo).
     */
    static hasLiteralQuestionMark(sql) {
        return String(sql).replace(PLACEHOLDER, '').indexOf('?') !== -1;
    }

    /**
     * setParameters - Aplica os valores no PreparedStatement/CallableStatement Java (objeto nativo).
     * @param {object} ps - java.sql.PreparedStatement (objeto node-java)
     * @param {Array} values - valores na ordem posicional
     * @param {object} java - instância node-java
     * @param {number} offset - índice inicial (default 1)
     */
    static setParameters(ps, values, java, offset = 1) {
        const Types = java.import('java.sql.Types');
        values.forEach((value, i) => {
            let index = offset + i;
            if (value === null || value === undefined) {
                ps.setNullSync(index, Types.NULL);
            } else if (typeof value === 'boolean') {
                ps.setBooleanSync(index, value);
            } else if (typeof value === 'number') {
                if (Number.isInteger(value)) {
                    if (value >= MIN_INT32 && value <= MAX_INT32) {
                        ps.setIntSync(index, value);
                    } else {
                        ps.setLongSync(index, java.newLong(value));
                    }
                } else if (Number.isFinite(value)) {
                    ps.setDoubleSync(index, value);
                } else {
                    ps.setNullSync(index, Types.NULL);
                }
            } else if (value instanceof Date) {
                let timestamp = java.newInstanceSync('java.sql.Timestamp', java.newLong(value.getTime()));
                ps.setTimestampSync(index, timestamp);
            } else if (Buffer.isBuffer(value)) {
                let bytes = Array.prototype.map.call(value, (b) => (b << 24) >> 24);
                ps.setBytesSync(index, java.newArray('byte', bytes));
            } else if (typeof value === 'string') {
                ps.setStringSync(index, value);
            } else {
                ps.setStringSync(index, JSON.stringify(value));
            }
        });
    }

    /**
     * splitScripts - Separa um lote de comandos (separados por ";") ANTES do bind,
     * para que valores contendo ";" não alterem a quantidade de comandos.
     */
    static splitScripts(sql) {
        return String(sql)
            .split(';')
            .map((script) => script.trim())
            .filter((script) => script.length > 0);
    }
}

module.exports = exports = SqlBinder;
