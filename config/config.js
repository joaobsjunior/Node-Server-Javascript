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

/**
 * intEnv - Reads an optional integer environment variable (falls back when not numeric).
 */
function intEnv(name, defaultValue) {
    let value = parseInt(optionalEnv(name, ""), 10);
    return isNaN(value) ? defaultValue : value;
}

/**
 * boolEnv - Reads an optional boolean environment variable ("true"/"1" => true).
 */
function boolEnv(name, defaultValue) {
    let value = optionalEnv(name, "").toLowerCase();
    if (value === "true" || value === "1" || value === "yes") {
        return true;
    }
    if (value === "false" || value === "0" || value === "no") {
        return false;
    }
    return defaultValue;
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

let keyRequestAutentication = requireEnv("KEY_REQUEST_AUTH");
if (keyRequestAutentication.length < 32 || keyRequestAutentication === "change-me") {
    console.warn("[config] KEY_REQUEST_AUTH fraca: use um segredo aleatório com pelo menos 32 caracteres (ex.: openssl rand -base64 48).");
}

// "trust proxy" do Express: false (default), true, um número de saltos ou uma lista de IPs/sub-redes.
let trustProxyRaw = optionalEnv("TRUST_PROXY", "");
let trustProxy = false;
if (trustProxyRaw !== "") {
    if (/^\d+$/.test(trustProxyRaw)) {
        trustProxy = parseInt(trustProxyRaw, 10);
    } else if (trustProxyRaw.toLowerCase() === "true") {
        trustProxy = 1;
    } else if (trustProxyRaw.toLowerCase() !== "false") {
        trustProxy = trustProxyRaw;
    }
}

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
        // Tempo de vida do token de autenticação, em segundos (default: 8h)
        tokenTtlSeconds: intEnv("TOKEN_TTL_SECONDS", 8 * 60 * 60)
    },
    cors: {
        origins: corsOrigins
    },
    gateway: {
        hostName: optionalEnv("GATEWAY_HOST", ""),
        port: intEnv("GATEWAY_PORT", 0)
    },
    server: {
        port: intEnv("PORT", 9090),
        // Loaded after the app boot
        actualPort: "",
        debugPosts: true,
        maxRows: 1000,
        bodyLimit: optionalEnv("BODY_LIMIT", "1mb"),
        // Timeout de inatividade do socket por requisição, em ms (0 = default do Node)
        requestTimeoutMs: intEnv("REQUEST_TIMEOUT_MS", 120000),
        // Inclui stack trace / detalhes internos nas respostas de erro (apenas para depuração local)
        exposeErrorDetails: boolEnv("EXPOSE_ERROR_DETAILS", false),
        trustProxy: trustProxy,
        rateLimit: {
            windowMs: intEnv("RATE_LIMIT_WINDOW_MS", 60 * 1000),
            max: intEnv("RATE_LIMIT_MAX", 300),
            loginWindowMs: intEnv("LOGIN_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
            loginMax: intEnv("LOGIN_RATE_LIMIT_MAX", 10)
        },
        upload: {
            // Limites do parser multipart (formidable), em bytes
            maxFileSize: intEnv("UPLOAD_MAX_FILE_SIZE", 10 * 1024 * 1024),
            maxFieldsSize: intEnv("UPLOAD_MAX_FIELDS_SIZE", 1024 * 1024),
            maxFields: intEnv("UPLOAD_MAX_FIELDS", 100),
            maxFiles: intEnv("UPLOAD_MAX_FILES", 10)
        },
        mail: {
            service: "smtp",
            host: optionalEnv("MAIL_HOST", ""),
            port: intEnv("MAIL_PORT", 587),
            // TLS implícito (porta 465). Com false, usa STARTTLS quando o servidor oferecer.
            secure: boolEnv("MAIL_SECURE", false),
            // Exige STARTTLS; falha se o servidor não suportar.
            requireTLS: boolEnv("MAIL_REQUIRE_TLS", false),
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
