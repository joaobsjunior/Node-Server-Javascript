'use strict';
let path = require('path');
let entryPoints = [
    // '/login/Login.service.js'
];
class Route {
    constructor(Factory) {
        let basePath = '';
        entryPoints.forEach((value, index) => {
            let basePath = path.resolve(__dirname, '../app' + value);
            Factory.create(basePath);
        });
    }
}
exports = module.exports = Route;