"use strict";

function ServerResponse() {
	this.recentServerErrors = [];
	this.recentClientErrors = [];
}

ServerResponse.prototype.serverError = function(error, message) {
	this.recentServerErrors.push({message: error.message, timestamp: new Date()});
	if (this.recentServerErrors.length == 201) {
		this.recentServerErrors.splice(0,1);
	}
	
	return {statusCode:"6000", message: message};
}

ServerResponse.prototype.clientError= function(error, message) {
	this.recentClientErrors.push({message: error.message, timestamp: new Date()});
	if (this.recentClientErrors.length == 201) {
		this.recentClientErrors.splice(0,1);
	}
	
	return {statusCode:"7000", message: message};
}

ServerResponse.prototype.inputError = function(message) {
	return {statusCode: "5000", message: message};
}

ServerResponse.prototype.configFailed = function(message) {
	return {statusCode: "5006", message: message};
}

ServerResponse.prototype.createSuccess = function(message) {
	return {statusCode: "1000", message: message};
}

ServerResponse.prototype.saveSuccess = function(message) {
	return {statusCode: "1001", message: message};
}

ServerResponse.prototype.deleteSuccess = function(message) {
	return {statusCode: "1002", message: message};
}

ServerResponse.prototype.listSuccess = function(message, data) {
	return {statusCode: "1004", message: message, data: data};
}

ServerResponse.prototype.getSuccess = function(message, data) {
	return {statusCode: "1003", message: message, data: data};
}

ServerResponse.prototype.cloneSuccess = function(message) {
	return {statusCode: "1005", message: message};
}

ServerResponse.prototype.renameSuccess = function(message) {
	return {statusCode: "1006", message: message};
}

ServerResponse.prototype.versionMismatch = function(message, data) {
	return {statusCode: "5001", message: message};
}

ServerResponse.prototype.objectNotExists = function(message) {
	return {statusCode: "5002", message: message};
}

ServerResponse.prototype.objectExists = function(message, data) {
	return {statusCode: "5003", message: message, data: data};
}

ServerResponse.prototype.invalidInList = function(message) {
	return {statusCode: "5004", message: message};
}

ServerResponse.prototype.evaluateSuccess = function(message, data) {
	return {statusCode: "2000", message: message, data: data};
}

ServerResponse.prototype.evaluateError = function(message, data) {
	return {statusCode: "6001", message: message, data: data};
}

module.exports = new ServerResponse();