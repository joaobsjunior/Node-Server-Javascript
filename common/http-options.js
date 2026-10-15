'use strict';

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

    return  {
        verbEnum : verbs
        ,localParam
        ,gatewayParam
        ,getLocalPathPBase
        ,getGatewayPathPBase
    };
};

module.exports = exports = httpOptions;
