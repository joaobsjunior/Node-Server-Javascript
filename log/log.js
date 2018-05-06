'use strict';

let config = require('../config/config')();
let logConfig = config.log;
let logStreams = [];


var
	logComponent = {}
	;

function setDependencies() {
	let bunyan = require('bunyan');

	function DevelopmentRawStream() { }

	DevelopmentRawStream.prototype.write = function (rec) {
		let severityLevel = bunyan.nameFromLevel[rec.level];
		console[severityLevel](
			rec.msg
		);
	};


	let consoleLog = {
		level: logConfig.level,
		stream: new DevelopmentRawStream(),
		type: 'raw'
	};

	let fileLog = {
		level: logConfig.level,
		path: logConfig.file.path
	};

	switch (logConfig.type) {
		case 'file':
			logStreams.push(fileLog);
			break;
		case 'all':
			logStreams.push(fileLog, consoleLog);
			break;
		default:
			logStreams.push(consoleLog);
	}

	logComponent = bunyan.createLogger({
		name: config.app.name,
		streams: logStreams
	});
}

function log(strMessage, strType) {

	let logType;

	switch (strType) {
		case 'warning':
			logType = 'warn';
			break;
		case 'error':
			logType = 'error';
			break;
		default:
			logType = 'info';

	}
	if (strMessage.length == 1) {
		strMessage = strMessage[0];
	}
	logComponent[logType](strMessage);
}

function generateLogInterface(strLogType) {
	return function () {
		let args = utils.getArrayFromArguments(arguments);
		log(args, strLogType);
	};
}

let logInterface = {
	info: generateLogInterface('info'),
	warn: generateLogInterface('warn'),
	error: generateLogInterface('error')
};

function makePublic() {
	module.exports = logInterface;
}

function init() {
	setDependencies();
	makePublic();
}

init();
