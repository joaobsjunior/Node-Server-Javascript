"use strict";

let config = {
    app: {
        name: "Node Server - API",
        // Loaded after the app boot
        actualName: ""
    },
    routes: {},
    // Loaded after the app boot
    loadedRoutes: [],
    encoding: "utf8",
    ldap: {
        url: "ldap://0.0.0.0:389",
        baseDN: "dc=domain,dc=local",
        username: "user@domain.com",
        password: "password"
    },
    keyRequestAutentication: "@1b%2c^3d&4#$",
    server: {
        port: 9090,
        // Loaded after the app boot
        actualPort: "",
        disableInterceptor: true,
        debugPosts: true,
        maxRows: 1000,
        mail: {
            service: "smtp",
            host: "smtp@domain.com.br",
            port: 587,
            auth: {
                user: "username",
                pass: "password"
            },
            subjectPrefix: "Node Server | ",
            sendEmail: true, // para desabilitar envio de email: false.
            overrideFrom: "no-reply@domain.com.br",
            overrideTo: "contact@domain.com.br"
        }
    },
    paths: {
        root: ".",
        app: "app",
        config: "config",
        common: "common",
        voucher: "/opt/voucher",
        voucherBank: "/opt/voucher/bank"
    },
    log: {
        // info, warn, error
        level: "info",
        // file, console, all
        type: "all",
        file: {
            path: "./output-server.log"
        }
    },
    resources: {
        defaultVersion: "v1"
    },
};

module.exports = function () {
    return config;
};