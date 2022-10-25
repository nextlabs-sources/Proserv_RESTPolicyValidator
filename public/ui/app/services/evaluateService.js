mainApp.factory('evaluateService', ['networkService', 'loggerService', 'configService', '$filter', 'statusCodeService',
		function(networkService, loggerService, configService, $filter, statusCodeService) {

			var evaluate = function(request, callback) {
				var start_time =  new Date().getTime();
				networkService.post(configService.getUrl("evaluate"), {request: request}, function(data) {
					var request_time = new Date().getTime() - start_time;
					statusCodeService.evaluate("Request", callback, data, request_time);
				});
			}

			var evaluateTestCase= function(id, testSet, callback) {
				var start_time = new Date().getTime();
				networkService.post(configService.getUrl("evaluateTestCase"), {id:id, testSet:testSet}, function(data) {
					var request_time = new Date().getTime() - start_time;
					statusCodeService.evaluate("TestCase", callback, data, request_time);
				});
			}

			return {
				evaluate: evaluate,
				evaluateTestCase: evaluateTestCase
			}

		}]);