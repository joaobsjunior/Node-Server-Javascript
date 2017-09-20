"use strict";

/**
 * @swagger
 * definitions:
 *   User:
 *     type: object	
 *     properties:
 *       id:
 *         type: integer
 *         description: Código do gerente
 *       name:
 *         type: string
 *         description: Nome do gerente
 *       email:
 *         type: string
 *         description: E-mail do gerente
 *       username:
 *         type: string
 *         description: Nome de usuário do gerente
 *       active:
 *         type: boolean
 *         description: Flag se o gerente está ativo ou não
 */
class User {
  constructor(
    id = null,
    name = null,
    email = null,
    username = null,
    active = null
  ) {
    /*
    @Annotation(
        DEALER_RESPONSE[column="usuario_idusuario"],
        KEEP_REGISTERDAY[column="loja_gerente_usuario_idusuario"],
        GET_REGISTERDAY[column="loja_gerente_usuario_idusuario"],
        USERS_GET_RESPONSE[column="idusuario"],
    )
    @type{integer}
    */
    this.id = id;
    this.name = name;
    this.email = email;
    /*
    @Annotation(
        USERS_GET_RESPONSE[column="usuario_ad"],
    )
    @type{string}
    */
    this.username = username;
    /*
    @Annotation(
        USERS_GET_RESPONSE[column="ativo"],
    )
    @type{boolean}
    */
    this.active = active;
  }
}

try {
  module.exports = exports = User;
} catch (e) {
  exports = User;
}