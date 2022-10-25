mainApp.controller('errorController', ['$scope', '$state', 'loggerService', '$stateParams', '$filter', 'dialogService', 'errorService',
		function($scope, $state, loggerService, $stateParams, $filter, dialogService, errorService) {
			errorService.listServerError(function(response) {
				$scope.serverErrors = response.data;
			});

			errorService.listClientError(function(response) {
				$scope.clientErrors = response.data;
			})
		}])