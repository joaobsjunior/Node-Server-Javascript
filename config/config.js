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

function optionalBool(name, defaultValue) {
    let value = optionalEnv(name, null);
    if (value === null) {
        return defaultValue;
    }
    return ["1", "true", "yes", "on"].indexOf(String(value).toLowerCase()) !== -1;
}

function optionalInt(name, defaultValue) {
    let value = parseInt(optionalEnv(name, ""), 10);
    return isNaN(value) ? defaultValue : value;
}

let keyRequestAutentication = requireEnv("KEY_REQUEST_AUTH");
if (keyRequestAutentication.length < 32) {
    console.warn("[config] KEY_REQUEST_AUTH possui menos de 32 caracteres: use uma chave longa e aleatória em produção.");
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
    keyRequestAutentication: keyRequestAutentication,
    auth: {
        // Validade do token de autenticação, em segundos (default: 8 horas)
        tokenExpiresIn: optionalInt("TOKEN_EXPIRES_IN", 28800),
        // Limite de tentativas de login por IP dentro da janela (0 desabilita)
        loginRateLimitMax: optionalInt("RATE_LIMIT_LOGIN_MAX", 20),
        loginRateLimitWindowMs: optionalInt("RATE_LIMIT_LOGIN_WINDOW_MS", 900000)
    },
    cors: {
        origins: corsOrigins
    },
    database: {
        // Diretório adicional com drivers JDBC (.jar), além de common/drivers
        driversDir: optionalEnv("DB_DRIVERS_DIR", "")
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
        // Limite global de requisições por IP na janela (0 = desabilitado)
        rateLimitMax: optionalInt("RATE_LIMIT_MAX", 0),
        rateLimitWindowMs: optionalInt("RATE_LIMIT_WINDOW_MS", 900000),
        // Confiar nos cabeçalhos X-Forwarded-* (apenas atrás de proxy reverso)
        trustProxy: optionalBool("TRUST_PROXY", false),
        // Incluir stack trace e detalhes internos nas respostas de erro (apenas desenvolvimento)
        exposeErrorDetails: optionalBool("EXPOSE_ERROR_DETAILS", false),
        upload: {
            // Tamanho máximo de cada arquivo em multipart/form-data, em bytes (default: 10mb)
            maxFileSize: optionalInt("UPLOAD_MAX_FILE_SIZE", 10 * 1024 * 1024),
            maxFields: optionalInt("UPLOAD_MAX_FIELDS", 1000)
        },
        mail: {
            host: optionalEnv("MAIL_HOST", ""),
            port: parseInt(optionalEnv("MAIL_PORT", "587"), 10),
            // true = TLS implícito (porta 465); false = STARTTLS (porta 587)
            secure: optionalBool("MAIL_SECURE", false),
            // Exige STARTTLS quando secure=false (credenciais nunca trafegam em texto puro)
            requireTLS: optionalBool("MAIL_REQUIRE_TLS", true),
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
