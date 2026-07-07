"use strict";

/**
 * requireEnv - Reads a required environment variable.
 * Aborts the process with a clear message (naming the variable, never its value)
 * when it is missing.
 */
function requireEnv(name) {
    let value = process.env[name];
    if (value === undefined || value === "") {
        console.error("[config] Variável de ambiente obrigatória ausente: " + name);
        console.error("[config] Defina " + name + " antes de iniciar o servidor (ver .env.example).");
        process.exit(1);
    }
    return value;
}

/**
 * optionalEnv - Reads an optional environment variable, falling back to a default.
 */
function optionalEnv(name, defaultValue) {
    let value = process.env[name];
    if (value === undefined || value === "") {
        return defaultValue;
    }
    return value;
}

let mailUser = optionalEnv("MAIL_USER", null);
let mailPass = optionalEnv("MAIL_PASS", null);
let sendEmail = Boolean(mailUser && mailPass);
if (!sendEmail) {
    console.warn("[config] MAIL_USER/MAIL_PASS não definidas: envio de e-mail desabilitado (sendEmail=false).");
}

let corsOrigins = optionalEnv("CORS_ORIGINS", "")
    .split(",")
    .map(function (origin) { return origin.trim(); })
    .filter(function (origin) { return origin.length > 0; });

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
        url: optionalEnv("LDAP_URL", "ldap://0.0.0.0:389"),
        baseDN: optionalEnv("LDAP_BASE_DN", "dc=domain,dc=local"),
        username: optionalEnv("LDAP_USERNAME", ""),
        password: optionalEnv("LDAP_PASSWORD", "")
    },
    keyRequestAutentication: requireEnv("KEY_REQUEST_AUTH"),
    cors: {
        origins: corsOrigins
    },
    gateway: {
        hostName: optionalEnv("GATEWAY_HOST", ""),
        port: parseInt(optionalEnv("GATEWAY_PORT", "0"), 10)
    },
    server: {
        port: parseInt(optionalEnv("PORT", "9090"), 10),
        // Loaded after the app boot
        actualPort: "",
        disableInterceptor: true,
        debugPosts: true,
        maxRows: 1000,
        bodyLimit: optionalEnv("BODY_LIMIT", "1mb"),
        mail: {
            service: "smtp",
            host: optionalEnv("MAIL_HOST", ""),
            port: parseInt(optionalEnv("MAIL_PORT", "587"), 10),
            auth: {
                user: mailUser,
                pass: mailPass
            },
            subjectPrefix: "Node Server | ",
            sendEmail: sendEmail,
            overrideFrom: optionalEnv("MAIL_FROM", ""),
            overrideTo: optionalEnv("MAIL_TO", "")
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
