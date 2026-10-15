'use strict';
const _ = require('lodash');

/**
 * Substitui global.populateToService (annotation-js) por uma implementação sem eval.
 *
 * A versão original montava código JavaScript concatenando valores recebidos na
 * requisição e o executava com eval(), o que permitia execução remota de código
 * para campos de tipo "date" ou sem tipo declarado. Esta versão lê os metadados
 * das anotações (getAnnotations) e atribui os valores convertidos diretamente.
 */

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

function isSafePath(key) {
    return String(key).split('.').every((part) => FORBIDDEN_KEYS.indexOf(part) === -1);
}

function convertValue(annotations, value, type) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
        // Objetos/arrays no lugar de um campo escalar: não há conversão segura
        return null;
    }
    if (typeof annotations.getValueType === 'function') {
        try {
            return annotations.getValueType(value, type);
        } catch (e) {
            return null;
        }
    }
    return value;
}

function populateToService(_variable, _req, _reqType, _mainAnnotation, _annotationParam, _maxLevel = 2, _stringConcat = '') {
    if (!_variable || typeof _variable.getAnnotations !== 'function') {
        throw new Error('populateToService: objeto sem anotações');
    }
    let annotations = _variable.getAnnotations(_mainAnnotation, _maxLevel);
    let req = _req || {};
    let reqType = _reqType || 'query';
    let nameAnnotation = _annotationParam;
    let incrementValue = {};

    for (let key in annotations) {
        if (!annotations.hasOwnProperty(key) || typeof annotations[key] === 'function') {
            continue;
        }
        if (!isSafePath(key)) {
            continue;
        }
        let meta = annotations[key] || {};
        if (reqType === 'body') {
            if (_.has(req, key)) {
                _.set(_variable, key, convertValue(annotations, _.get(req, key), meta.type));
            }
            continue;
        }
        let paramName = meta[nameAnnotation];
        if (paramName === undefined || paramName === null) {
            continue;
        }
        incrementValue[paramName] = (incrementValue[paramName] || 0) + 1;
        let keyJoin = paramName + _stringConcat + incrementValue[paramName];
        if (Object.prototype.hasOwnProperty.call(req, paramName)) {
            _.set(_variable, key, convertValue(annotations, req[paramName], meta.type));
        } else if (Object.prototype.hasOwnProperty.call(req, keyJoin)) {
            _.set(_variable, key, convertValue(annotations, req[keyJoin], meta.type));
        }
    }
}

global.populateToService = populateToService;

module.exports = exports = populateToService;
