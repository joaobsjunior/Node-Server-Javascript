'use strict';

exports = module.exports = () => {
    return {
        bind : (appInstance, verbName, routePath, callback) => {
            appInstance[verbName](routePath, interceptor.authenticate, callback);
            console.log('RoutePath: '+routePath+' - verb: '+verbName);
        }
    }
}