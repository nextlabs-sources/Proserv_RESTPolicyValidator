/*
  This is a shared service is a gateway for network calls (ajax)
 */
mainApp.factory('networkService', ['$http', '$filter', 'dialogService', 'toastService', function($http, $filter, dialogService, toastService) {
	var errorHandler = function(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
		// handle generic network errors

		console.error("Status error is " + response.status);
		switch (response.status) {
			case 404 :
				console.info("Not found");
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.404'),
					delay: 50000
				})
				break;
			case 500 :
				console.info("Internal");
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.500'),
					delay: 50000
				})
				break;
			default :
				console.info("Unknown");
				toastService.notify({
					type: "toast-error",
					msg: $filter('translate')('ERROR.unknown'),
					delay: 50000
				})

		}
	}

	var get = function(url, callback, deferred=false) {
		if (deferred) {
			return $http({
				method : 'GET',
				url : encodeURI(url),
			})
		} else {
			$http({
				method : 'GET',
				url : encodeURI(url),
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available
				if (callback)
					callback(response.data);
			}, errorHandler);
		}
	}

	var post = function(url, data, callback, deferred=false) {
		if (deferred) {
			return $http({
				method : 'POST',
				data : data,
				url : url
			})
		} else {
			$http({
				method : 'POST',
				data : data,
				url : url
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available
				if (callback)
					callback(response.data);
			}, errorHandler);
		}
	}

	var delWithData = function(url, data, callback, contentType) {

		var req = {
			method : 'DELETE',
			headers : {},
			data : data,
			url : url
		};
		contentType && (req.headers['Content-Type'] = contentType);
		$http(req).then(function successCallback(response) {
			// this callback will be called asynchronously
			// when the response is available
			if (callback)
				callback(response.data);
		}, errorHandler);
	}

	var del = function(url, callback, deferred=false) {
		if (deferred) {
			return $http({
				method : 'DELETE',
				url : url
			})
		} else {
			$http({
				method : 'DELETE',
				url : url
			}).then(function successCallback(response) {
				// this callback will be called asynchronously
				// when the response is available
				if (callback)
					callback(response.data);
			}, errorHandler);
		}
	}

	var put = function(url, data, callback, deferred=false) {
		if (deferred) {
			return $http({
				method : 'PUT',
				data : data,
				url : url
			})
		} else {
			$http({
				method : 'PUT',
				data : data,
				url : url
			}).then(function successCallback(response) {
				if (callback)
					callback(response.data);
			}, errorHandler);
		}
	}

	return {
		get : get,
		post : post,
		put : put,
		del : del,
		delWithData : delWithData
	}
}]);
