'use strict';
const routeCreator = require('./../../common/route-creator')();

let ResponseData = require('./../../common/response-data');
const messageEnum = require('./../../common/enum/message.enum');

const CORREIOS_URI = "https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente?wsdl";
const CORREIOS_TIMEOUT_MS = 15000;
const ZIP_CODE_PATTERN = /^\d{5}-?\d{3}$/;

class CEPService {

	constructor(appContext, httpOptions) {
		this._context = appContext;
		this._options = JSON.parse(JSON.stringify(httpOptions));

		//INIT REPOSITORY
		let servicePath = httpOptions.getLocalPathPBase() + '/cep/:zipCode';

		let sendError = (res, status, message, error) => {
			res.status(status);
			ResponseData.errorResponse(error || new Error(message), (data) => {
				data.message.setMessage(message);
				res.send(data);
				res.end();
			});
		};

		let extractTag = (xml, tag) => {
			let match = xml.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
			return match ? match[1] : null;
		};

		//LIST
		this._getAddress = (req, res) => {
			let rawZipCode = String(req.params.zipCode || '');
			if (!ZIP_CODE_PATTERN.test(rawZipCode)) {
				sendError(res, 422, messageEnum.server412);
				return;
			}
			// Somente dígitos validados entram no envelope SOAP
			let zipCode = rawZipCode.replace('-', '');
			let body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hs="http://cliente.bean.master.sigep.bsb.correios.com.br/">' +
				'<soapenv:Body><hs:consultaCEP><cep>' + zipCode + '</cep></hs:consultaCEP></soapenv:Body></soapenv:Envelope>';
			let address = {
				zipCode: rawZipCode
			};
			fetch(CORREIOS_URI, {
				method: 'POST',
				body: body,
				headers: {
					'Content-Type': 'text/xml; charset=utf-8'
				},
				signal: AbortSignal.timeout(CORREIOS_TIMEOUT_MS)
			}).then((response) => response.text()).then((responseBody) => {
				let faultstring = extractTag(responseBody, 'faultstring');
				if (faultstring !== null) {
					let error = new Error(faultstring);
					console.error(error);
					sendError(res, 422, faultstring, error);
					return;
				}
				let district = extractTag(responseBody, 'bairro');
				let state = extractTag(responseBody, 'uf');
				let city = extractTag(responseBody, 'cidade');
				let street = extractTag(responseBody, 'end');
				if (district === null || state === null || city === null || street === null) {
					let error = new Error('Resposta inesperada do serviço de CEP');
					console.error(error);
					sendError(res, 422, messageEnum.server422, error);
					return;
				}
				address.district = district;
				address.state = state;
				address.city = city;
				address.address = street;
				address.isComplete = true;
				ResponseData.successResponse(address, (data) => {
					res.send(data);
					res.end();
				});
			}).catch((error) => {
				console.error(error);
				sendError(res, 422, messageEnum.server422, error);
			});

		}


		/*----------------------------- ROUTES -----------------------------*/

		/**
		 * @swagger
		 * /api/cep/:zipCode:
		 *   get:
		 *     description: Consulta de endereço pelo CEP (Correios)
		 *     requireAD: false
		 *     onlyLocalhost: false
		 *     produces:
		 *       - application/json
		 *     parameters:
		 *       - name: zipCode
		 *         in: path
		 *         description: CEP (8 dígitos, com ou sem hífen)
		 *         required: true
		 *         type: string
		 *     responses:
		 *       200:
		 *         description: endereço
		 */
		routeCreator.bind(this._context, this._options.verbEnum.GET, servicePath, this._getAddress);

	}
}

module.exports = exports = CEPService;
