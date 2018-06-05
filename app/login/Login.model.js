"use strict";

/**
 * @swagger
 * definitions:
 *   Login:
 *     type: object	
 *     properties:
 *       username:
 *         type: string
 *         description: Nome de usuário
 *       password:
 *         type: string
 *         description: Senha de usuário
 */
class Login {
  constructor() {
    /*
    @Annotation(
        LOGIN[column="username"],
    )
    @type{string}
    */
    this.username = null;
    /*
    @Annotation(
        LOGIN[column="password"],
    )
    @type{string}
    */
    this.password = null;
  }
}

try {
  module.exports = exports = Login;
} catch (e) {
  exports = Login;
}