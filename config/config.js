'use strict';

var config = {
    app: {
        name: 'NodeServer-API',
        // Loaded after the app boot
        actualName: ''
    },
    routes: {},
    // Loaded after the app boot
    loadedRoutes: [],
    encoding: 'utf8',
    ldap: {
        url: 'ldap://host:port',
        baseDN: 'dc=dcname,dc=dcname',
        username: 'username@domain',
        password: 'password'
    },
    keyRequestAutentication: 'password',
    server: {
        port: 9090,
        // Loaded after the app boot
        actualPort: '',
        disableInterceptor: true,
        debugPosts: true,
        maxRows: 1000,
        mail: {
            service: 'smtp',
            host: 'localhost',
            port: 587,
            auth: {
                user: 'username',
                pass: 'password'
            },
            subjectPrefix: 'NodeServerJR | ',
            sendEmail: true, // para desabilitar envio de email: false.
            overrideFrom: 'no-reply@domain',
            overrideTo: 'nodeserver@domain',
            domain:'domain',
        }
    },
    paths: {
        root: '.',
        app: 'app',
        config: 'config',
        common: 'common'
    },
    log: {
        // info, warn, error
        level: 'info',
        // file, console, all
        type: 'all',
        file: {
            path: './gateway.log'
        }
    },
    resources: {
        defaultVersion: 'v1'
    },
    mail: {

    },
    urls: {
        // soa: {
        //     protocol: 'http',
        //     env: 'MISP',
        //     url: '10.6.11.159',
        //     port: 7101
        // }
    }
};

module.exports = function () {
    return config;
};