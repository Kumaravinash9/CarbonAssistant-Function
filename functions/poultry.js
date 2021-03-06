require('dotenv').config({path: __dirname + '/.env'});
const BASE_URL = process.env.ENDPOINT;
const ENDPOINT = BASE_URL + "/poultry";
const ACCESS_KEY = process.env.ACCESS_KEY;
const requestLib = require('request');
const reverseLookupManager = require('./reverseLookupManager');
const utils = require('./utils');

exports.processRequest = function(conv, parameters, requestReverseLookup) {
    return new Promise(function(resolve, reject) {
        if (parameters.poultry_type !== "") {

            switch (parameters.poultry_type) {
                case "Beef Cow Farming":
                    parameters.poultry_type = "beef";
                    break;
                case "Broiler Chicken Farming":
                    parameters.poultry_type = "broiler chicken";
                    break;
                case "Layer Poultry Farming":
                    parameters.poultry_type = "egg";
                    break;
                case "Lamp Farming":
                    parameters.poultry_type = "lamp";
                    break;
                case "Pig Farming":
                    parameters.poultry_type = "pork";
                    break;
                case "Turkey Farming":
                    parameters.poultry_type = "turkey";
            }

            let poultry_type = parameters.poultry_type;
            let poultry_region = "Default",
                poultry_quantity = 1;

            if (parameters.poultry_region !== "")
                poultry_region = parameters.poultry_region;

            if (parameters.poultry_quantity !== "")
                poultry_quantity = parameters.poultry_quantity;


            var options = {
                uri: ENDPOINT,
                method: 'POST',
                headers: {
                    'access-key': ACCESS_KEY
                },
                json: true,
                body: {
                    "type": poultry_type,
                    "region": poultry_region,
                    "quantity": poultry_quantity
                }
            };

            requestLib(options, function(error, response, body) {
                const button = "/";
                const emissionResponse = "The emissions released due to this action are given below";
                if (!error && response.statusCode === 200) {

                    let emission = body.emissions.CO2;
                    let unit = '';
                    if (poultry_type !== 'egg')
                        unit = 'kg(s) ';
                    let basicResponseString = 'CO2 emissions for ' + poultry_quantity + ' ' + unit + poultry_type + ' production';
                    let finalResponseString = "";

                    if (poultry_region != "Default")
                        finalResponseString = basicResponseString + ' in ' + poultry_region + ' is ' + emission;
                    else
                        finalResponseString = basicResponseString + ' is ' + emission;



                    if (requestReverseLookup) {

                        let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                        reverseLookup
                            .then((responses) => {
                                let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                let unit = body.unit;
                                if (unit !== undefined) {
                                    finalResponseString = finalResponseString + ' ' + unit + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse], button);
                                    resolve();
                                } else {
                                    finalResponseString = finalResponseString + ' kg' + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse], button);
                                    resolve();
                                }
                            })
                            .catch((err) => {
                                let unit = body.unit;
                                if (unit !== undefined) {
                                    utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse, button);
                                    resolve();
                                } else {
                                    utils.richResponse(conv, finalResponseString + ' kg', emissionResponse, button);
                                    resolve();
                                }
                            });
                    } else {
                        let unit = body.unit;
                        if (unit !== undefined) {
                            utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse, button);
                            resolve();
                        } else {
                            utils.richResponse(conv, finalResponseString + ' kg', emissionResponse, button);
                            resolve();
                        }
                    }
                } else {
                    // Handle errors here
                    utils.handleError(error, response, body, conv);
                    resolve();
                }
            });

        } else {
            conv.ask("Sorry, I did not understand the poultry type you said.");
            resolve();
        }
    });
}