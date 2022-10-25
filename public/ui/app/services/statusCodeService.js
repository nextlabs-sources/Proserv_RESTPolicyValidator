mainApp.factory('statusCodeService', ['loggerService', 'configService', '$filter', 'dialogService', 'toastService',
	function(loggerService, configService, $filter, dialogService, toastService) {

	var undefinedStatusCode = function() {
		toastService.notify({
			type: "toast-warn",
			msg: $filter('translate')('status.code.missing'),
			delay: 5000
		})
	}

	var create = function(type, callback, data) {
		var statusCode = data.statusCode;

		if (!statusCode) {
			undefinedStatusCode();
			console.log(data);
			return;
		}

		switch (statusCode) {
			case "1000" :
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('create.saved.notify'),
					delay: 3000
				})
				break;
			case "1005":
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('clone.success.notify'),
					delay: 3000
				})
				break;
			case "5003" :
				if (callback) {
					callback(data);
				}
				loggerService.getLogger().error("Server error " + data.message);
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5003'),
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var evaluate = function(type, callback, data, request_time) {
		var statusCode = data.statusCode;
		if (!statusCode) {
			undefinedStatusCode();
			return;
		}
		switch (statusCode) {
			case "2000" :
				if (callback) {
					callback(data, request_time);
				}
				/*toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('request.evaluated.notify'),
					delay: 2000
				})*/
				break;
			case "6001" :
				loggerService.getLogger().error(data.message);
				toastService.notify({
					type: "toast-error",
					msg: data.message,
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var modify = function(type, callback, data) {
		var statusCode = data.statusCode;
		if (!statusCode) {
			undefinedStatusCode();
			return;
		}
		switch (statusCode) {
			case "1001" :
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('modify.saved.notify'),
					delay: 3000
				})
				break;
			case "1006" :
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('rename.success.notify'),
					delay: 3000
				})
				break;
			case "5001" :
				if (callback) {
					callback(data);
				}
				loggerService.getLogger().error("Server error " + data.message);
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5001'),
					delay: 50000
				})
				break;
			case "5006":
				toastService.notify({
					type: "toast-error",
					msg: data.message,
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var get = function(type, callback, data) {
		var statusCode = data.statusCode;
		if (!statusCode) {
			undefinedStatusCode();
			return;
		}
		switch (statusCode) {
			case "1003" :
				if (callback) {
					callback(data);
				}
				break;
			case "5002":
				if (callback) {
					callback(data);
				}
				loggerService.getLogger().error(data.message);
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5002'),
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var del = function(type, callback, data) {
		var statusCode = data.statusCode;
		if (!statusCode) {
			undefinedStatusCode();
			return;
		}
		switch (statusCode) {
			case "1002" :
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('delete.deleted.notify'),
					delay: 3000
				})
				break;
			case "5002" :
				if (callback) {
					callback(data);
				}
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5002'),
					delay: 50000
				})
				break;
			case "5005" :
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5005'),
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var list = function(type, callback, data) {
		var statusCode = data.statusCode;
		if (!statusCode) {
			undefinedStatusCode();
			return;
		}
		switch (statusCode) {
			case "1004" :
				if (callback) {
					callback(data);
				}
				break;
			case "5000" :
				if (callback) {
					callback(data);
				}
				break;
			case "5004" :
				if (callback) {
					callback(data);
				}
				loggerService.getLogger().info(data.message);
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.5004'),
					delay: 50000
				})
				break;
			case "6000" :
				serverError(data);
				break;
			case "7000" :
				clientError(data);
				break;
			default :
				defaultCode(data);
		}
	}

	var serverError = function(data) {
		loggerService.getLogger().error("Server error " + data.message);
		toastService.notify({
			type: "toast-error",
			msg: $filter('translate')('ERROR.6000') + data.message + ". " + $filter('translate')('log.check'),
			delay: 50000
		});
	}

	var clientError = function(data) {
		loggerService.getLogger().error("Client error " + data.message);
		toastService.notify({
			type: "toast-error",
			msg: $filter('translate')('ERROR.7000') + data.message + ". " + $filter('translate')('contact.admin'),
			delay: 50000
		});
	}

	var defaultCode = function(data) {
		loggerService.getLogger().info(data.message);
		toastService.notify({
			type: "toast-warn",
			msg: data.message,
			delay: 50000
		});
	}

	var getErrors = function() {
		return sessionErrors;
	}

	return {
		create : create,
		get : get,
		modify : modify,
		del : del,
		list : list,
		evaluate : evaluate,
		getErrors: getErrors,
	}
}]);