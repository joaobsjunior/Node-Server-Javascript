'use strict';
// To work colors with bash initialize npm with $ FORCE_COLOR=1
// Example: $ FORCE_COLOR=1 npm start /path/to/your/script.js
const chalk = require('chalk');
require('annotation-js');
global.annotationsDebug = false;

console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log(chalk.blue.bold(' Node-Server'));
console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log('Informaçcoes Tecnicas');
console.log('#####################');
console.log('Protocolo: REST');
console.log('Formato  : JSON');
console.log('Versao   : 1.0');
console.log('Empresa Responsável: Node-Server Online');
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
	//LDAP
	ActiveDirectory,
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
	httpOptions;

let os = require('os');
const jws = require('jws');
const mail = require('./common/mailer');


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
	bodyParser = require('body-parser');
	ActiveDirectory = require('activedirectory');

	global.mail = mail;
	global.path = path;

	// Setting configurations
	config.paths.root = path.resolve(__dirname);
	config.paths.app = path.resolve(__dirname) + '/app/resources/sales';
	global.config = config;

	//LDAP
	global.AD = new ActiveDirectory(global.config.ldap);

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

	app.use(helmet());

	// Allowing CORS for communication
	app.use((req, res, next) => {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, username, token, project");
		res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
		next();
	});

	app.use(bodyParser.urlencoded({
		limit: '50mb',
		extended: false
	}));

	app.use(bodyParser.json({
		limit: '50mb'
	}));

	app.use(express.static(path.join(__dirname, 'public')));

	let BasePath = path.resolve(__dirname, './app/resources');

	let httpOptions = require('./common/http-options')();
	httpOptions.localParam.version = 'api';
	httpOptions.localParam.pathBase = '';
	httpOptions.gatewayParam.hostName = '10.200.1.190';
	httpOptions.gatewayParam.port = 7101;
	httpOptions.gatewayParam.pathBase = '/servico/rest';

	let Factory = new require('./common/resource-factory')(app, httpOptions);

	/*----------------- ENTRY POINTS -----------------*/
	// DOMAIN
	Factory.create(BasePath + '/login/Login.service.js');
	Factory.create(BasePath + '/cep/CEP.service.js');
	
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
			title: 'NodeServer - APIs',
			version: '1.0.0',
			description: 'Lista de APIs de integração do Node-Server.',
		},
		host: serverIP + ':' + config.server.port,
		basePath: '/',
	};

	let options = {
		swaggerDefinition: swaggerDefinition,
		apis: [
			/*DOCUMENTATION*/
			// DOMAIN
			'./app/resources/login/*.js',
			'./app/resources/cep/*.js',
		],
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

(function () {
	var childProcess = require("child_process");
	var oldSpawn = childProcess.spawn;

	function mySpawn() {
		console.log('spawn called');
		console.log(arguments);
		var result = oldSpawn.apply(this, arguments);
		return result;
	}
	childProcess.spawn = mySpawn;
})();

init();
