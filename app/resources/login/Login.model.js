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
  constructor(
    username = null,
    password = null
  ) {
    /*
    @Annotation(
        LOGIN[column="username"],
    )
    @type{string}
    */
    this.username = username;
    /*
    @Annotation(
        LOGIN[column="password"],
    )
    @type{string}
    */
    this.password = password;
  }
}

try {
  module.exports = exports = Login;
} catch (e) {
  exports = Login;
}