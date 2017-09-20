'use strict';

let httpCommand    = require('http');

exports = module.exports = () => {
    return {
        getQueryString : ( query ) => {
            if (Object.keys(query).length === 0) return '';
            
            let queryString = '?';
            for (var propName in query) {
                if (query.hasOwnProperty(propName)) {
                    console.log(propName, query[propName]);
                    queryString += (queryString=='?'?'':'&')+propName+'='+query[propName];
                }
            }
            return queryString;
        },
        invoke : (options,response,data) => {
            // options.method = verb;
			// console.log(">>> headers: "+JSON.stringify(options));

            var dataResponse = "";
            let _options = {
                hostname: options.hostName,
                port: options.port,
                path: options.path,
                method: options.method,
                headers: { 'Content-Type':'application/json; charset=UTF-8' }
            };

            console.log(">>> headers: "+JSON.stringify(options));

            //
            let req = httpCommand.request(_options, res => {
                console.log(`OPTIONS: ${JSON.stringify(options)}`);
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    // console.log(`BODY: ${ch  unk}`);
                    dataResponse += chunk;
                });	

                //
                res.on('end', () => {
                    console.log('No more data in response.');
                    // response.header(200,{"Content-Type":"application/json; charset=UTF-8"});
                    //response.
                    response.send(`${dataResponse}`);
                    response.end();
                });

                //
                res.on('error', (e) => {
                    console.log(`problem with request: ${e.message}`);
                });                			
            });

            //
            if(data != undefined) {
                let bodyString = JSON.stringify(data); 
                console.log(">>> payload: "+bodyString);
                req.write(bodyString);
            }
            req.end();		
        } 
    }
}