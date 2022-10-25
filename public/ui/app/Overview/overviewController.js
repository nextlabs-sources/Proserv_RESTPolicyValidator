mainApp.controller('overviewController', ['$scope', '$rootScope', '$state', 'loggerService', '$stateParams', '$filter', 'toastService', 'overviewServices',
		function($scope, $rootScope, $state, loggerService, $stateParams, $filter, toastService, overviewServices) {

			overviewServices.getConfiguration(function(response) {
				$scope.configurations = response.data;
				$scope.originalConfigs = JSON.parse(JSON.stringify($scope.configurations));
			});

			$scope.resourceAttributes = JSON.parse(JSON.stringify($rootScope.resourceAttributes));
			$scope.subjectAttributes = JSON.parse(JSON.stringify($rootScope.subjectAttributes));

			$scope.save = function(form, configuration) {
				if (form.$invalid) {
					form.$setDirty();
					for ( var field in form) {
						if (field[0] == '$')
							continue;
						// console.log(field);
						form[field].$touched = true;
						form[field].$dirty = true;
					}
					toastService.notify({
						delay: 50000,
						msg: $filter('translate')('form.invalid.input'),
						type: "toast-error"
					})
					return;
				}
				$scope.updateConfigCoro(configuration);
			}

			$scope.changeActiveConfiguration = function() {
				overviewServices.changeActiveConfiguration($scope.configurations.active, function(response) {
					//ignore
				})
			}

			$scope.test = function(form, configuration) {
				if (form.$invalid) {
					form.$setDirty();
					for ( var field in form) {
						if (field[0] == '$')
							continue;
						// console.log(field);
						form[field].$touched = true;
						form[field].$dirty = true;
					}
					toastService.notify({
						delay: 50000,
						msg: $filter('translate')('form.invalid.input'),
						type: "toast-error"
					})
					return;
				}

				overviewServices.testConfiguration(configuration, function(response) {
					toastService.notify({
						type: "toast-success",
						msg: $filter('translate')('configuration.test.success'),
						delay: 3000
					});
				})
			}

			// $scope.subjectAttributes = [{key: '', type: 'single'}];
			// $scope.resourceAttributes = [{key: '', type: 'single'}];

			$scope.addSubjectAttribute = function () {
				$scope.subjectAttributes.push({key: '', type: 'single'})
			}

			$scope.saveSubjectAttributes = function () {
				overviewServices.updateSubjectAttributes($scope.subjectAttributes.filter(e => Boolean(e.key)), function(response){
					if (response.statusCode === "1001") {
							$rootScope.subjectAttributes = $scope.subjectAttributes;
					}
				})
			}

			$scope.deleteSubjectAttribute = function (index) {
				$scope.subjectAttributes.splice(index, 1);
			}

			$scope.addResourceAttribute = function () {
				$scope.resourceAttributes.push({key: '', type: 'single'})
			}

			$scope.saveResourceAttributes = function () {
				overviewServices.updateResourceAttributes($scope.resourceAttributes.filter(e => Boolean(e.key)), function(response){
					if (response.statusCode === "1001") {
							$rootScope.resourceAttributes = $scope.resourceAttributes;
					}
				})
			}

			$scope.deleteResourceAttribute = function (index) {
				$scope.resourceAttributes.splice(index, 1);
			}

			$scope.$on("otherClick", function(event, params) {
				var result = $scope.dataPristine();
				result.destination = params.destination;
				$scope.$emit('otherClickResponse',result);
			})

			$scope.$on("saveAndProceed", function(event, callback) {
				var success = true;
				overviewServices.updateSubjectAttributes($scope.subjectAttributes.filter(e => Boolean(e.key)), function(response){
					if (response.statusCode === "1001") {
							$rootScope.subjectAttributes = $scope.subjectAttributes;
					} else {
						success = false;
					}
				})
				overviewServices.updateResourceAttributes($scope.resourceAttributes.filter(e => Boolean(e.key)), function(response){
					if (response.statusCode === "1001") {
							$rootScope.resourceAttributes = $scope.resourceAttributes;
					} else {
						success = false;
					}
				})

				success = $scope.updateAllConfigsCoro() && success

				if (success) {
					callback();
				}
				// console.log($scope.formName);
				// $scope.save($scope.formName, $scope.configurations);
			});

			$scope.updateConfigCoro = async function (config) {
				var response = await overviewServices.updateConfigurationDeferred(config);
				if (response.data.statusCode === "1001") {
					Object.assign($scope.configurations,(await overviewServices.getConfigurationDeferred()).data);
					$scope.originalConfigs = JSON.parse(JSON.stringify($scope.configurations));
					return true;
				} else {
					console.log('Error saving configuration');
					return false;
				}
			}

			$scope.updateAllConfigsCoro = async function () {
					var configs = $scope.configurations.configurations;
					var oconfigs = $scope.originalConfigs.configurations;
					var flag = true;
					for (i in configs) {
						if (angular.toJson(configs[i]) !== angular.toJson(oconfigs[i])) {
							var response = await overviewServices.updateConfigurationDeferred(configs[i]);
						}
						flag = flag && (response.data.statusCode === "1001");
					}
					if (flag) {
						Object.assign($scope.configurations,(await overviewServices.getConfigurationDeferred()).data);
						$scope.originalConfigs = JSON.parse(JSON.stringify($scope.configurations));
						return true;
					} else {
						console.log('Error saving configuration');
						return false;
					}
			}

			$scope.dataPristine = function () {
				return {pristine: angular.toJson($scope.configurations) === angular.toJson($scope.originalConfigs) && angular.toJson($scope.subjectAttributes) === angular.toJson($rootScope.subjectAttributes) && angular.toJson($scope.resourceAttributes) === angular.toJson($rootScope.resourceAttributes)};
			}

		}])
