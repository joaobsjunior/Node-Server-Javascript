'use strict';
let path = require('path');
let entryPoints = [
    '/cep/CEP.service.js',
    '/manager/login/Login.service.js',
];
class Route {
    constructor() {

    }
    static factory(Factory) {
        let basePath = '';
        entryPoints.forEach((value, index) => {
            let basePath = path.resolve(__dirname, './../app' + value);
            Factory.create(basePath);
        });
    }
    static documentation() {
        let arr = [];
        entryPoints.forEach((value, index) => {
            arr.push('./app' + value);
        });
        return arr;
    }
}
exports = module.exports = Route;