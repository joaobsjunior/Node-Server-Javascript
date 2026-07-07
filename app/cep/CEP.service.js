'use strict';
const routeCreator = require('./../../common/route-creator')();

let AppUtil = require('./../../common/app-util');
let Response = require('./../../common/model/Response.model');
let ResponseData = require('./../../common/response-data');
const messageEnum = require('./../../common/enum/message.enum');
let _ = require('lodash');
let fs = require('fs');

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
			let address = {
				zipCode: req.params.zipCode
			};
			let uri = "https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl";
			fetch(uri, {
				method: 'POST',
				body: body,
				headers: {
					'Content-Type': 'text/xml; charset=utf-8'
				}
			}).then((response) => response.text()).then((responseBody) => {
				let faultstring = responseBody.match(/<faultstring>(.*?)<\/faultstring>/);
				if (faultstring) {
					let error = new Error(faultstring[1]);
					console.error(error);
					ResponseData.errorResponse(error, (data) => {
						data.message.setMessage(faultstring);
						res.send(data);
						res.end();
					});
				} else {
					try {
						address.district = responseBody.match(/<bairro>(.*?)<\/bairro>/)[1];
						address.state = responseBody.match(/<uf>(.*?)<\/uf>/)[1];
						address.city = responseBody.match(/<cidade>(.*?)<\/cidade>/)[1];
						address.address = responseBody.match(/<end>(.*?)<\/end>/)[1];
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
			}).catch((error) => {
				console.error(error);
				ResponseData.errorResponse(error, (data) => {
					data.message.setMessage(messageEnum.server422);
					res.send(data);
					res.end();
				});
			})

		}


		/*----------------------------- ROUTES -----------------------------*/

		/**
		 * @swagger
		 * /api/cep/:zipCode:
		 *   get:
		 *     description:
		 *     produces:
		 *       - application/json
		 *     parameters:
		 *     responses:
		 *       200:
		 *         description: login
		 */
		routeCreator.bind(this._context, this._options.verbEnum.GET, servicePath, this._getAddress);

	}
}

module.exports = exports = CEPService;