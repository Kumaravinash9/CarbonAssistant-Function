var config = require('./config')
const requestLib = require('request');

exports.processRequest = function(parameters) {
    return new Promise(function(resolve, reject) {
        if (parameters.origin != "" && parameters.destination !== "") {
            let origin = parameters.origin,
                destination = parameters.destination,
                passengers = 1;

            if (parameters.passengers !== "")
                passengers = parameters.passengers;

            var options = {
                uri: config.endpoint + "/trains",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "origin": origin,
                    "destination": destination,
                    "passengers": passengers
                }
            };

            requestLib(options, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    console.log(body);
                    let basicResponseString = 'CO2 emissions due to train journey from ' + origin + ' to ' + destination;

                    let finalResponseString;
                    if (passengers === 1)
                        finalResponseString = basicResponseString;
                    else
                        finalResponseString = basicResponseString + ' carrying ' + passengers + ' passengers';

                    let carbonEmission = body.emissions.CO2;
                    resolve(finalResponseString + ' are ' + carbonEmission + ' kg.\n');
                } else {
                    if (body.err !== undefined) {
                        console.log("Error: " + JSON.stringify(body));
                        reject(body.err);
                    } else {
                        reject("Sorry, we are facing a temporary outage. Please contact our support.");
                    }
                }
            });
        } else {
            reject("Sorry, need a valid origin and destination of your train journey. Could you please say it again?");
        }
    });
}