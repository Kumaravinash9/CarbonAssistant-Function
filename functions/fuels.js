var config = require('./config')
const requestLib = require('request');
const utils = require('./utils');
const reverseLookupManager = require('./reverseLookupManager');

exports.processRequest = function(conv, parameters, requestReverseLookup) {
    return new Promise(function(resolve, reject) {
        if (parameters.fuel_type != "" && parameters.fuel_original !== "") {
            let consumed_quantity = 1,
                consumption_unit = 'Litre(s)',
                consumed_fuel_type = parameters.fuel_type,
                consumed_fuel_original = parameters.fuel_original;

            if (parameters.quantity !== "")
                consumed_quantity = parameters.quantity;

            if (parameters.fuel_type === "fuelCNG")
                consumption_unit = 'kg';

            var options = {
                uri: config.endpoint + "/emissions",
                method: 'POST',
                headers: {
                    'access-key': config.access_key
                },
                json: true,
                body: {
                    "item": consumed_fuel_type,
                    "unit": consumption_unit,
                    "quantity": consumed_quantity
                }
            };

            requestLib(options, function(error, response, body) {
                const emissionResponse = "The emissions released due to this action are given below";
                if (!error && response.statusCode === 200) {
                    console.log(body);
                    if (parameters.emission_type !== "") {
                        let emissionType = parameters.emission_type;
                        let emission;
                        if (emissionType === "CO2")
                            emission = body.emissions.CO2;
                        else if (emissionType === "N2O")
                            emission = body.emissions.N2O;
                        else
                            emission = body.emissions.CH4;

                        let basicResponseString = emissionType + ' emissions due to ' + consumed_quantity + ' ' + consumption_unit + ' of ' +
                            consumed_fuel_original + ' consumption are ' + emission;
                        let finalResponseString = basicResponseString;
                        if (requestReverseLookup) {
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                            reverseLookup
                                .then((responses) => {
                                    let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                    let unit = body.unit;
                                    if (unit !== undefined) {
                                        finalResponseString = finalResponseString + ' ' + unit + ' \n\n' + responses[selectedResponse];
                                        utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                        resolve();
                                    } else {
                                        finalResponseString = finalResponseString + ' kg' + ' \n\n' + responses[selectedResponse];
                                        utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                        resolve();
                                    }
                                })
                                .catch((err) => {
                                    let unit = body.unit;
                                    if (unit !== undefined) {
                                        utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse);
                                        resolve();
                                    } else {
                                        utils.richResponse(conv, finalResponseString + ' kg', emissionResponse);
                                        resolve();
                                    }
                                });
                        } else {
                            let unit = body.unit;
                            if (unit !== undefined) {
                                utils.richResponse(conv, finalResponseString + ' ' + unit, emissionResponse);
                                resolve();
                            } else {
                                utils.richResponse(conv, finalResponseString + ' kg', emissionResponse);
                                resolve();
                            }
                        }
                    } else {
                        let basicResponseString = 'Emissions due to ' + consumed_quantity + ' ' + consumption_unit + ' of ' +
                            consumed_fuel_original + ' consumption';
                        let finalResponseString = basicResponseString;

                        let carbonEmission = body.emissions.CO2;
                        let nitrousEmission = body.emissions.N2O;
                        let methaneEmission = body.emissions.CH4;
                        if (requestReverseLookup) {
                            console.log("Location data:" + JSON.stringify(conv.user.storage.location.coordinates));
                            let reverseLookup = reverseLookupManager.reverseLookup(body.emissions, conv.user.storage.location.coordinates);
                            reverseLookup
                                .then((responses) => {
                                    console.log("responses length: " + responses.length);
                                    let selectedResponse = utils.getRandomNumber(0, responses.length - 1);
                                    console.log("selected response: " + selectedResponse);
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.' + ' \n\n' + responses[selectedResponse];
                                    utils.richResponse(conv, finalResponseString, responses[selectedResponse]);
                                    resolve();
                                })
                                .catch((err) => {
                                    finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                        'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                        "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                        "Methane: " + methaneEmission + ' kg.';
                                    utils.richResponse(conv, finalResponseString, emissionResponse);
                                    resolve();
                                });
                        } else {
                            finalResponseString = finalResponseString + ' are as follows:\n  \n' +
                                'Carbon Dioxide: ' + carbonEmission + ' kg.\n' +
                                "Nitrous Oxide: " + nitrousEmission + ' kg.\n' +
                                "Methane: " + methaneEmission + ' kg.';
                            utils.richResponse(conv, finalResponseString, emissionResponse);
                            resolve();
                        }
                    }
                } else {
                  // Handle errors here
                  if (!error)
                    error = body.error;
                  //Handle the error in the utils function
                  utils.handleError(error, response, body, conv);
                  resolve();
                }
            });
        } else {
            conv.ask("Sorry, I did not understand the fuel type you said.");
            resolve();
        }
    });
}
