'use strict';

var config = {
    app: {
        name: 'Node-Server',
        // Loaded after the app boot
        actualName: ''
    },
    routes: {},
    // Loaded after the app boot
    loadedRoutes: [],
    encoding: 'utf8',
    ldap: {
        url: 'ldap://10.200.1.10:389',
        baseDN: 'dc=domain,dc=local',
        username: 'user@domain.local',
        password: 'password'
    },
    keyRequestAutentication: '<PASSWORD>',
    server: {
        port: 9090,
        // Loaded after the app boot
        actualPort: '',
        disableInterceptor: true,
        debugPosts: true,
        maxRows: 1000,
        mail: {
            service: 'smtp',
            host: '<HOST>',
            port: 587,
            auth: {
                user: '<USER>',
                pass: '<PASSWORD>'
            },
            subjectPrefix: 'Node-Server | ',
            sendEmail: true, // para desabilitar envio de email: false.
            overrideFrom: 'no-reply@domain.com.br',
            overrideTo: 'contact@domain.com.br'
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
            path: './output-server.log'
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

