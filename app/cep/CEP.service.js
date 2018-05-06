'use strict';

// constants
const routeCreator = require('../../../common/route-creator')();
// model domains
let AppUtil = require('../../../common/app-util');
let Response = require('../../../common/model/Response.model');
let ResponseData = require('../../../common/response-data');
const messageEnum = require('../../../common/enum/message.enum');
let _ = require('lodash');
let request = require('request');

//controller

// const
const CONTEXT_SITUACAO_POLITICA_TARIFARIA = 'CEP';

class CEPService {

	constructor(appContext, httpOptions) {
		this._context = appContext;
		this._options = JSON.parse(JSON.stringify(httpOptions));

		//INIT REPOSITORY
		let servicePath = httpOptions.getLocalPathPBase() + '/cep/:zipCode';

		//LIST
		this._getAddress = (req, res) => {
			let xml = `
			<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hs="http://cliente.bean.master.sigep.bsb.correios.com.br/">
			<soapenv:Body>
			<hs:consultaCEP>
			<cep><%- zipCode %></cep>
			</hs:consultaCEP>
			</soapenv:Body>
		   </soapenv:Envelope>
			`;
			let compiled = _.template(xml);
			let body = compiled({
				zipCode: req.params.zipCode
			});
			let address = { zipCode: req.params.zipCode };
			let uri = "https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl";
			request.post(uri, { body: body, headers: { 'Content-Type': 'text/xml; charset=utf-8' } }, (error, response, body) => {
				if (error) {
					console.error(error);
					ResponseData.errorResponse(error, (data) => {
						data.message.setMessage(messageEnum.server422);
						res.send(data);
						res.end();
					});
				} else {
					try {
						address.district = body.match(/<bairro>(.*?)<\/bairro>/)[1].toUpperCase();
						address.state = body.match(/<uf>(.*?)<\/uf>/)[1];
						address.city = body.match(/<cidade>(.*?)<\/cidade>/)[1];
						address.address = body.match(/<end>(.*?)<\/end>/)[1].toUpperCase();
						address.isComplete = true;
						ResponseData.successResponse(address, (data) => {
							res.send(data);
							res.end();
						})
					} catch (error) {
						console.error(error);
						ResponseData.errorResponse(error, (data) => {
							data.message.setMessage(messageEnum.server422);
							res.send(data);
							res.end();
						});
					}
				}
			})

		}


		/*----------------------------- ROUTES -----------------------------*/



		/**
		 * @swagger
		 * /api/cep/:zipCode:
		 *   get:
		 *     tags:
		 *       - domain_service
		 *     summary:
		 *     description: 
		 *     parameters:
		 *     produces:
		 *       - application/json
		 *     responses:
		 *       200:
		 *         description:
		 *         schema:
		 *           $ref: '#/definitions/CEP'
		 */
		routeCreator.bind(this._context, this._options.verbEnum.GET, servicePath, this._getAddress);

	}
}

module.exports = exports = CEPService;