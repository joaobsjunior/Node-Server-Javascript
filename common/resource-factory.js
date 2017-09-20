'use strict';

exports = module.exports = ( app, httpOptions ) => {
    return {
        create : ( resourcePath ) => {
            let resource = require( resourcePath )
            new resource( app, httpOptions );
        }
    }
}