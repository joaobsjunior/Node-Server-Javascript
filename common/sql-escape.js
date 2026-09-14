'use strict';

/**
 * Escapa valores que serão interpolados em comandos SQL montados por template.
 *
 * O projeto compila os arquivos .sql com _.template, inserindo os bind vars
 * diretamente no texto do comando. Sem escape, qualquer valor vindo do
 * cliente (ex.: email do login) permite SQL injection. Este módulo converte
 * cada valor em um literal seguro para o dialeto em uso:
 *   - aspas simples são duplicadas ('' ), o que é válido em todos os dialetos
 *     suportados e também no modo NO_BACKSLASH_ESCAPES do MySQL/MariaDB;
 *   - em MySQL/MariaDB a barra invertida também é duplicada, pois é
 *     caractere de escape no modo padrão;
 *   - bytes nulos são removidos.
 *
 * Números e booleanos são mantidos; null/undefined seguem para o template
 * sem alteração (o _.template renderiza como string vazia, como antes).
 */

const DATABASE_ENUM = require('./enum/database.enum');

function usesBackslashEscape(typeserver) {
    return typeserver === DATABASE_ENUM.MYSQL || typeserver === DATABASE_ENUM.MARIADB;
}

function escapeString(value, typeserver) {
    let escaped = String(value).replace(/\0/g, '');
    if (usesBackslashEscape(typeserver)) {
        escaped = escaped.replace(/\\/g, '\\\\');
    }
    return escaped.replace(/'/g, "''");
}

function escapeValue(value, typeserver) {
    if (value === null || value === undefined) {
        return value;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (value instanceof Date) {
        return escapeString(value.toISOString(), typeserver);
    }
    if (typeof value === 'object') {
        return escapeString(JSON.stringify(value), typeserver);
    }
    return escapeString(value, typeserver);
}

/**
 * escapeBindVars - Retorna uma cópia rasa de bindVars com todos os valores escapados.
 */
function escapeBindVars(bindVars, typeserver) {
    let result = {};
    if (!bindVars || typeof bindVars !== 'object') {
        return result;
    }
    Object.keys(bindVars).forEach((key) => {
        result[key] = escapeValue(bindVars[key], typeserver);
    });
    return result;
}

module.exports = exports = {
    escapeString,
    escapeValue,
    escapeBindVars
};
