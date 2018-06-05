"use strict";

let config = {
    app: {
        name: "Node-API",
        // Loaded after the app boot
        actualName: ""
    },
    routes: {},
    // Loaded after the app boot
    loadedRoutes: [],
    encoding: "utf8",
    ldap: {
        url: "ldap://localhost:389",
        baseDN: "dc=domain,dc=local",
        username: "user@domain.local",
        password: "password"
    },
    keyRequestAutentication: "password",
    server: {
        port: 9090,
        // Loaded after the app boot
        actualPort: "",
        disableInterceptor: true,
        debugPosts: true,
        maxRows: 1000,
        mail: {
            service: "smtp",
            host: "localhost",
            port: 587,
            auth: {
                user: "gncsys",
                pass: "password"
            },
            subjectPrefix: "NodeServer | ",
            sendEmail: true, // to disable email send
            overrideFrom: "no-reply@domain",
            overrideTo: "contact@domain"
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
    }
};

module.exports = function () {
    return config;
};