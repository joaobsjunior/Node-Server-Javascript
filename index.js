'use strict';
// To work colors with bash initialize npm with $ FORCE_COLOR=1
// Example: $ FORCE_COLOR=1 npm start /path/to/your/script.js
const chalk = require('chalk');
require('annotation-js');
// Substitui populateToService (baseado em eval) por uma versão segura
require('./common/safe-populate');
let Route = require('./route/Route');
global.annotationsDebug = false;

console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log(chalk.blue.bold(' Node Server'));
console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log('Informaçcoes Tecnicas');
console.log('#####################');
console.log('Protocolo: REST');
console.log('Formato  : JSON');
console.log('Versao   : 1.0');
console.log('Empresa Responsável: Node Server');
console.log(chalk.blue.bold('----------------------------------------------------------------------------------'));
console.log(chalk.white.bgGreen.bold('Inicializando Gateway'));
console.log('Inicializando variaveis...');

var
	// Node arguments
	nodeArgs,
	// Local arguments
	args = {
		port: '',
		name: ''
	},
	// Port of application
	port,
	// Instance name
	instanceName,
	// The application
	app,
	// The framework
	express,
	// Generic Configurations  ( server, paths )
	config,
	// Generic tools
	utils,
	// Component to control log
	log,
	// The modules to preload in this application
	modulesDependencies,
	// The loaded controllers
	controllers = {},
	// Generate the path under a pattern and do the require
	dependenciesRequirer,
	// Easy wrapper to get the libs, without passing the path
	getCommon,
	// Easy wrapper to get dependencies, withou passing the path
	getDependency,
	// Component to read the routes
	routeReader,
	// Component to connect at SOA
	soaConnector,
	// Component to parse the HTTP body requisition
	bodyParser,
	//
	httpCommand,
	//
	objResource,
	//
	path,
	helmet,
	interceptor,
	token,
	fs,
	httpOptions;

let os = require('os');
const mail = require('./common/mailer');
const { rateLimit } = require('express-rate-limit');


/**
 * setDependencies - The step to set all required things
 */
function setDependencies() {
	path = require('path');
	config = require('./config/config')();
	interceptor = require('./common/request-interceptor')();
	httpCommand = require('http');
	express = require('express');
	helmet = require('helmet')
	fs = require('fs');
	bodyParser = require('body-parser');

	global.mail = mail;
	global.path = path;

	// Setting configurations
	config.paths.root = path.resolve(__dirname);
	config.paths.app = path.resolve(__dirname) + '/app/resources/sales';
	global.config = config;

	let temp = path.resolve(config.paths.root, 'tmp');
	if (!fs.existsSync(temp)) {
		fs.mkdirSync(temp);
	}
	process.env.TMPDIR = temp;
	process.env.TMP = temp;
	process.env.TEMP = temp;

	global.interceptor = interceptor;

	app = express();

	// Setting utils
	utils = require('./utils/utils');
	global.utils = utils;

	// Setting log component
	log = require('./log/log');
	global.log = log;

}

/**
 * configServer - The step to set container configs
 */
function configServer() {

	app.disable('x-powered-by');
	app.set('trust proxy', config.server.trustProxy);
	app.use(helmet());

	// Limite global de requisições por IP (RATE_LIMIT_MAX=0 desabilita)
	if (config.server.rateLimitMax > 0) {
		app.use(rateLimit({
			windowMs: config.server.rateLimitWindowMs,
			limit: config.server.rateLimitMax,
			standardHeaders: 'draft-7',
			legacyHeaders: false
		}));
	}

	// Allowing CORS only for origins listed in CORS_ORIGINS
	app.use((req, res, next) => {
		let origin = req.headers.origin;
		if (origin && config.cors.origins.indexOf(origin) !== -1) {
			res.header("Access-Control-Allow-Origin", origin);
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
			res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		}
		next();
	});

	app.use(bodyParser.urlencoded({
		limit: config.server.bodyLimit,
		extended: false
	}));

	app.use(bodyParser.json({
		limit: config.server.bodyLimit
	}));

	let httpOptions = require('./common/http-options')();
	httpOptions.localParam.version = 'api';
	httpOptions.localParam.pathBase = '';
	httpOptions.gatewayParam.hostName = config.gateway.hostName;
	httpOptions.gatewayParam.port = config.gateway.port;
	httpOptions.gatewayParam.pathBase = '/servico/rest';

	// Proteção contra força bruta no login (RATE_LIMIT_LOGIN_MAX=0 desabilita)
	if (config.auth.loginRateLimitMax > 0) {
		app.use(httpOptions.getLocalPathPBase() + '/manager/login', rateLimit({
			windowMs: config.auth.loginRateLimitWindowMs,
			limit: config.auth.loginRateLimitMax,
			standardHeaders: 'draft-7',
			legacyHeaders: false,
			message: {
				isSuccess: false,
				size: 0,
				message: {
					message: 'Muitas tentativas de login. Tente novamente mais tarde.'
				},
				response: []
			}
		}));
	}

	let Factory = new require('./common/resource-factory')(app, httpOptions);

	/*----------------- ENTRY POINTS -----------------*/
	let route = Route.factory(Factory);

}


/**
 * startServer - Exposes container and application to the world
 */
function startServer() {

	let interfaces = os.networkInterfaces();
	let addresses = [];
	for (let k in interfaces) {
		for (let k2 in interfaces[k]) {
			let address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}

	let serverIP = addresses[0];

	let swaggerJSDoc = require('swagger-jsdoc');

	// swagger definition
	let swaggerDefinition = {
		info: {
			title: 'Node Server - APIs',
			version: '1.0.0',
			description: 'Lista de APIs de integração do Node Server',
		},
		host: serverIP + ':' + config.server.port,
		basePath: '/',
	};

	let options = {
		swaggerDefinition: swaggerDefinition,
		apis: Route.documentation(),
	};

	console.log("host externo: http://" + serverIP + ":" + config.server.port + "/api-docs/");
	console.log("host local: http://localhost:" + config.server.port + "/api-docs/");

	// initialize swagger-jsdoc
	let swaggerSpec = swaggerJSDoc(options);
	global.swaggerSpec = swaggerSpec;

	/*app.get('/swagger.json', function (req, res) {
		res.setHeader('Content-Type', 'application/json');
		res.send(swaggerSpec);
	});*/

	app.listen(config.server.port, () => {
		console.log('Server started....');
	});
}

function init() {

	// getNodeArguments ();
	setDependencies();
	configServer();
	// readRoutes ();
	startServer();
}

init();