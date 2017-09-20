'use strict';

// constants
const routeCreator = require('../../../common/route-creator')();

// repository patterns
let UserRepository = require('./User.persistence');

// model domains
let User = require('./User.model');
let DealerResponse = require('../sales/dealer/DealerResponse.model');
let AppUtil = require('../../../common/app-util');
let Response = require('../../../common/model/Response.model');
let ResponseData = require('../../../common/response-data');
const messageEnum = require('../../../common/enum/message.enum');

//controller
let UserController = require('./User.controller');

// const
const CONTEXT_SITUACAO_POLITICA_TARIFARIA = 'User';

class UserService {

	constructor(appContext, httpOptions) {
		this._context = appContext;
		this._options = JSON.parse(JSON.stringify(httpOptions));

		//INIT REPOSITORY
		let servicePath = httpOptions.getLocalPathPBase() + '/user';
		let userRepository = new UserRepository();


		//LIST
		this._listUser = (req, res) => {
			var data_context = req.query;
			var user = new User();

			try {
				global.populateToService(user, data_context, "query", "USERS_GET_RESPONSE", "query", 2);
				var dataController = new UserController(user, 'list');
				if (dataController instanceof Response) {
					res.status(422);
					res.send(dataController);
					res.end();
					return;
				}
			} catch (err) {
				res.status(500);
				ResponseData.errorResponse(err, (data) => {
					data.message.setMessage(messageEnum.server500);
					res.send(data);
					res.end();
				});
				return;
			}

			userRepository.listDataAll(user, req, res, (data) => {
				res.send(data);
				res.end();
			});
		}



		/*----------------------------- ROUTES -----------------------------*/



		/**
		 * @swagger
		 * /api/user/users:
		 *   get:
		 *     tags:
		 *       - domain_service
		 *     summary:
		 *     requireAD: true 
		 *     groupAD: 
		 *       - Sales-Admin
		 *     description: 
		 *     parameters:
		 *     produces:
		 *       - application/json
		 *     responses:
		 *       200:
		 *         description:
		 *         schema:
		 *           $ref: '#/definitions/User'
		 */
		routeCreator.bind(this._context, this._options.verbEnum.GET, servicePath+"/users", this._listUser);



	}
}

module.exports = exports = UserService;