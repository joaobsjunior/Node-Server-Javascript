'use strict';
// To work colors with bash initialize npm with $ FORCE_COLOR=1
// Example: $ FORCE_COLOR=1 npm start /path/to/your/script.js
const chalk = require('chalk');
require('annotation-js');
global.annotationsDebug = false;

console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log(chalk.blue.bold(' Node Server'));
console.log(chalk.blue.bold('#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-#'));
console.log('Informaçcoes Tecnicas');
console.log('#####################');
console.log('Protocolo: REST');
console.log('Formato  : JSON');
console.log('Versao   : 1.0');
console.log('Empresa Responsável: Node Server Online');
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

var os = require('os');
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
    //ActiveDirectory = require('activedirectory');

	global.mail = mail;
	global.path = path;

	// Setting configurations
	config.paths.root = path.resolve(__dirname);
	config.paths.app = path.resolve(__dirname) + '/app/resources';
	global.config = config;

	//LDAP
	//global.AD = new ActiveDirectory(global.config.ldap);

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
		extended: false
	}));

	app.use(bodyParser.json());

	app.use(express.static(path.join(__dirname, 'public')));

	let BasePath = path.resolve(__dirname, './app/resources');

	let httpOptions = require('./common/http-options')();
	httpOptions.localParam.version = 'api';
	httpOptions.localParam.pathBase = '';
	httpOptions.gatewayParam.hostName = 'localhost';
	httpOptions.gatewayParam.port = 7101;
	httpOptions.gatewayParam.pathBase = '/servico/rest';

	let Factory = new require('./common/resource-factory')(app, httpOptions);

	/*ENTRY POINTS*/
	
	Factory.create(path.resolve(__dirname, './app/resources/login/Login.service.js'));


}


/**
 * startServer - Exposes container and application to the world
 */
function startServer() {

	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family === 'IPv4' && !address.internal) {
				addresses.push(address.address);
			}
		}
	}

	var serverIP = addresses[0];

	var swaggerJSDoc = require('swagger-jsdoc');

	// swagger definition
	var swaggerDefinition = {
		info: {
			title: 'domain - APIs',
			version: '1.0.0',
			description: 'Lista de APIs de integração do Node Server.',
		},
		host: serverIP + ':' + config.server.port,
		basePath: '/',
	};

	var options = {
		swaggerDefinition: swaggerDefinition,
		apis: [
			/*DOCUMENTATION*/
			'./app/resources/login/*.js',
		],
	};

	console.log("host externo: http://" + serverIP + ":" + config.server.port + "/api-docs/");
	console.log("host local: http://localhost:" + config.server.port + "/api-docs/");

	// initialize swagger-jsdoc
	var swaggerSpec = swaggerJSDoc(options);
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