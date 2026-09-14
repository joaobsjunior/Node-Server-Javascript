'use strict';
const routeCreator = require('./../../common/route-creator')();

let AppUtil = require('./../../common/app-util');
let ResponseData = require('./../../common/response-data');
const messageEnum = require('./../../common/enum/message.enum');
let _ = require('lodash');

class CEPService {

	constructor(appContext, httpOptions) {
		this._context = appContext;
		this._options = JSON.parse(JSON.stringify(httpOptions));

		//INIT REPOSITORY
		let servicePath = httpOptions.getLocalPathPBase() + '/cep/:zipCode';

		//LIST
		this._getAddress = (req, res) => {
			// Aceita apenas CEP numérico (8 dígitos, com ou sem hífen); evita injeção no envelope SOAP
			let zipCode = String(req.params.zipCode || '').replace(/-/g, '');
			if (!/^\d{8}$/.test(zipCode)) {
				res.status(422);
				ResponseData.errorResponse(new Error('CEP inválido'), (data) => {
					data.message.setMessage(messageEnum.server412);
					res.send(data);
					res.end();
				});
				return;
			}
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
				zipCode: zipCode
			});
			let address = {
				zipCode: zipCode
			};
			let uri = "https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl";
			fetch(uri, {
				method: 'POST',
				body: body,
				headers: {
					'Content-Type': 'text/xml; charset=utf-8'
				},
				// Timeout evita requisições penduradas quando o serviço externo não responde
				signal: AbortSignal.timeout(15000)
			}).then((response) => response.text()).then((responseBody) => {
				let faultstring = responseBody.match(/<faultstring>(.*?)<\/faultstring>/);
				if (faultstring) {
					let error = new Error(faultstring[1]);
					ResponseData.errorResponse(error, (data) => {
						data.message.setMessage(faultstring[1]);
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
						ResponseData.errorResponse(error, (data) => {
							data.message.setMessage(messageEnum.server422);
							res.send(data);
							res.end();
						});
					}
				}
			}).catch((error) => {
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