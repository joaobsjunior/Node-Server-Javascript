'use strict';
const routeCreator = require('./common/route-creator')();
let soaConnector   = new require('./common/soa-connector')();

//TODO: Implementar log.
class ResourceBase {
	constructor(appContext,httpOptions,localUrlPath,gatewayUrlPath) {
		this._context  = appContext;
		this._options  = JSON.parse(JSON.stringify(httpOptions));
		this._options.localParam.path   = httpOptions.getLocalPathPBase()+localUrlPath;
		this._options.gatewayParam.path = httpOptions.getGatewayPathPBase()+gatewayUrlPath;

		// Mapear Rota para o SOA (callback para rota Express)
		this._get  = (req, res) => { soaConnector.invoke( this._options.gatewayParam, this._options.verbEnum.GET, res ); }
		this._post = (req, res) => { soaConnector.invoke( this._options.gatewayParam, this._options.verbEnum.POST, res, req.body ); }

		// Criar Rotas do Express
		routeCreator.bind(this._context, this._options.verbEnum.GET, this._options.localParam.path, this._get);
        routeCreator.bind(this._context, this._options.verbEnum.POST, this._options.localParam.path, this._post);
	}
}

module.exports = exports = Score;
