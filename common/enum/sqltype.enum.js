'use strict';

const SQLTYPE_ENUM = {
    SELECT: 0,
    INSERT: 1,
    INSERT_ID: 2,
    UPDATE: 3,
    DELETE: 4,
    MERGE: 5,
    PROCEDURE: 6,
    STATEMENT: 7
}


exports = module.exports = SQLTYPE_ENUM;