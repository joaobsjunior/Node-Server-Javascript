'use strict';

/**
 * Substitui global.populateToService (annotation-js) por uma implementação
 * sem eval.
 *
 * A versão original monta strings de código com valores vindos do cliente e
 * as executa com eval(): um campo anotado com @type{number} que receba um
 * texto não numérico é avaliado como código JavaScript (execução remota de
 * código). Esta versão mantém a mesma semântica de mapeamento e conversão de
 * tipos, mas atribui os valores com _.set, sem interpretar nada como código.
 *
 * Deve ser carregado após require('annotation-js'), que define
 * Object.prototype.getAnnotations (usado aqui para ler as anotações).
 */

const _ = require('lodash');

const FORBIDDEN_SEGMENTS = ['__proto__', 'constructor', 'prototype'];

function isSafePath(key) {
    return String(key).split('.').every((segment) => FORBIDDEN_SEGMENTS.indexOf(segment) === -1);
}

/**
 * convertValue - Mesma conversão de annotation-js (getValueTypeForEval), sem
 * a serialização para código.
 */
function convertValue(value, type) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    switch (String(type || 'string').toLowerCase()) {
        case 'date': {
            let date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        }
        case 'string':
            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        case 'boolean':
            return (value === true || value === 'true' || value === '1' || value === 1);
        case 'number': {
            let parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        }
        case 'integer': {
            let raw = value;
            if (typeof raw === 'string') {
                raw = raw.replace(/\D/g, '');
                raw = raw ? raw : 0;
            }
            let parsed = parseFloat(raw);
            return isNaN(parsed) ? null : parsed;
        }
        default:
            return value;
    }
}

function hasOwn(obj, key) {
    return obj !== null && obj !== undefined && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * populateToService - Preenche `variable` a partir de `req` seguindo as
 * anotações da classe (mesma assinatura da função original).
 */
function populateToService(variable, req, reqType, mainAnnotation, annotationParam, maxLevel = 2, stringConcat = '') {
    if (!variable || typeof variable.getAnnotations !== 'function') {
        return;
    }
    let annotations = variable.getAnnotations(mainAnnotation, maxLevel);
    let source = req || {};
    let type = reqType || 'query';
    let incrementValue = {};

    Object.keys(annotations).forEach((key) => {
        let meta = annotations[key];
        if (typeof meta === 'function' || !meta || !isSafePath(key)) {
            return;
        }
        if (type === 'body') {
            let raw = _.get(source, key);
            if (raw === undefined) {
                return;
            }
            _.set(variable, key, convertValue(raw, meta.type));
            return;
        }
        let name = meta[annotationParam];
        if (name === undefined || name === null || !isSafePath(name)) {
            return;
        }
        incrementValue[name] = (incrementValue[name] || 0) + 1;
        let keyJoin = name + stringConcat + incrementValue[name];
        if (hasOwn(source, name)) {
            _.set(variable, key, convertValue(source[name], meta.type));
        } else if (hasOwn(source, keyJoin)) {
            _.set(variable, key, convertValue(source[keyJoin], meta.type));
        }
    });
}

/**
 * install - Registra a versão segura no escopo global.
 */
function install() {
    global.populateToService = populateToService;
    return populateToService;
}

module.exports = exports = {
    populateToService,
    convertValue,
    install
};
