"use strict";

var assert = require('assert');
var NextLabsRestPDPEngine = require("./../lib/NextlabsRestPDPEngine");

var jpcOptions = require("./../config/config.json");

var options = jpcOptions.configurations[2];

var sampleRequest = require("./Sample Test Case.json");

var request = {"Request": sampleRequest.Request};

console.log(options);


var engine;

//try to initialize the PDP engine
try {
	engine = new NextLabsRestPDPEngine(options);
} catch (error) {
	console.error("Unable to initialize NextLabs PDP Engine: " + error.message);
}

//console.log(engine);

var promise = engine.evaluate(JSON.stringify(request));

promise.then(function(jsonResponse) {
	console.log(jsonResponse);
}, function(error) {
	console.error(error);
});