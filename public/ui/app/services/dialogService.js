mainApp.factory('dialogService', ['$uibModal', function($uibModal) {
	var confirm = function(parameter) {
		var title = parameter.title;
		var msg = parameter.msg;
		var ok = parameter.ok;
		var cancel = parameter.cancel;
		$uibModal.open({
			animation : true,
			// template: msg,
			templateUrl : 'ui/app/templates/dialog-confirm.html',
			controller : ['$uibModalInstance', '$scope', function($uibModalInstance, $scope) {
				$scope.title = title;
				$scope.msg = msg;
				$scope.ok = function() {
					$uibModalInstance.dismiss('cancel');
					ok && ok();
				}, $scope.cancel = function() {
					$uibModalInstance.dismiss('cancel');
					cancel && cancel();
				};
			}]
		});
	};
	var notify = function(parameter) {
		var type = parameter.type;
		var title = parameter.title;
		var msg = parameter.msg;
		var ok = parameter.ok;
		$uibModal.open({
			animation : true,
			// template: msg,
			templateUrl : 'ui/app/templates/dialog-notify.html',
			controller : ['$uibModalInstance', '$scope', function($uibModalInstance, $scope) {
				$scope.type = type;
				$scope.title = title;
				$scope.msg = msg;
				$scope.ok = function() {
					$uibModalInstance.dismiss('cancel');
					ok && ok();
				}
			}]
		});
	}

	return {
		confirm : confirm,
		notify : notify
	}
}]);
