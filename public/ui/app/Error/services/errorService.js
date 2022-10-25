mainApp.factory('errorService', ['networkService', '$location', '$filter', 'configService', 'statusCodeService',
	function(networkService, $location, $filter, configService, statusCodeService) {
	var listClientError = function(callback) {
		networkService.get(configService.getUrl("error.client.list"), function(data) {
			statusCodeService.list("Error", callback,  data);
		});
	}

	var listServerError = function(callback) {
		networkService.get(configService.getUrl("error.server.list"), function(data) {
			statusCodeService.list("Error", callback,  data);
		});
	}

	return {
		listClientError: listClientError,
		listServerError: listServerError
	}
}]);