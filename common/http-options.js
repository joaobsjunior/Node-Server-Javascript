'use strict';

// constants
const CryptoJS = require('crypto-js');

function httpOptions () {
    let verbs = {
        POST : 'post'
        ,GET : 'get'
        ,PUT : 'put'
        ,DELETE : 'delete'
    };

    let localParam = {
        version:null,
        pathBase: null,
        path: null,
        method: null,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    };

    let gatewayParam = {
        hostName: null,
        port: null,
        pathBase: null,
        path: null,
        method: null,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    };

    function getLocalPathPBase() {
        return '/'+localParam.version+localParam.pathBase;
    };

    function getGatewayPathPBase(ssl) {
        return 'http'+(ssl!=undefined?'s':'')+'://'+gatewayParam.hostName+':'+gatewayParam.port+gatewayParam.pathBase
    };

    function mapQueryString(req, obj) {
        let reg = new Registro();
        if (Object.keys(req.query).length != 0) {

            for (let propName in req.query) {
                if (req.query.hasOwnProperty(propName)) {
                    for(let key in obj){
                        if(key == propName && key != 'dataParam') {
                            if(!isNaN(req.query[propName])) { obj[key] = parseInt(req.query[propName]); }
                            else { obj[key] = req.query[propName]; };
                        }
                    }
                }
            }
        }
		obj.registro = reg;
        return obj;	
    };

    function mapObject(req) {
        if(req.query.dataParam == undefined || req.query.dataParam == null || req.query.dataParam == '')
            return null;

        if(config.server.debugPosts == true) {
            return JSON.parse(req.query.dataParam);
        } else {
            let bytes  = CryptoJS.AES.decrypt(req.query.dataParam, 'teste');
            let decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            return decryptedData;
        }
    };

    return  {
        verbEnum : verbs
        ,localParam
        ,gatewayParam
        ,getLocalPathPBase
        ,getGatewayPathPBase
        ,mapQueryString
        ,mapObject
    };
};

module.exports = exports = httpOptions;
