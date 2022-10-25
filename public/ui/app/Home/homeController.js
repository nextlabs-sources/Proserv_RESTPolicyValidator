mainApp.controller('homeController', ['$scope', 'networkService', 'loggerService', 
	'sharedService', '$filter', '$state', '$mdDialog', 'testSetServices', 'testCaseServices', 'toastService',
		function($scope, networkService, loggerService, 
			sharedService, $filter, $state, $mdDialog, testSetServices, testCaseServices, toastService) {

			$scope.toggleAll = function() {
				if ($scope.tree.selectedTabs.length === $scope.tree.tabs.length) {
					$scope.tree.selectedTabs = [];
				} else {
					$scope.tree.selectedTabs = $scope.tree.tabs.slice(0);
				}
			}

			$scope.allIsChecked = function() {
				return ($scope.tree.selectedTabs.length == $scope.tree.tabs.length);
			}

			$scope.someIsChecked =  function() {
				return ($scope.tree.selectedTabs.length > 0 && $scope.tree.tabs.length !== $scope.tree.selectedTabs.length);
			}

			$scope.toggleTestSet = function(tab) {

				var search = $filter('filter')($scope.tree.selectedTabs, {title: tab.title}, true);

				if (search.length === 0) {
					$scope.tree.selectedTabs.push(tab);
				} else {
					var index = $scope.tree.selectedTabs.indexOf(search[0]);
					$scope.tree.selectedTabs.splice(index, 1);
				}
			}

			$scope.testSetIsCheck = function(tab) {
				var search = $filter('filter')($scope.tree.selectedTabs, {title: tab.title}, true);
				return search.length !== 0;
			}

			$scope.optionClick = function(tab) {
				tab.openOptions = !tab.openOptions;
			}

      		$scope.goToTestSet = function(tab) {
      			$scope.current.currentTestSet = tab;
      			$scope.current.currentTab = tab.url;
      			$state.go("TestSet", {id: tab.title});
      		}

      		$scope.cloneTestSet = function(ev, testSet) {
      			var confirm = $mdDialog.prompt()
				.title($filter('translate')('dialog.CloneTestSet'))
				.placeholder($filter('translate')('new.name.label'))
				.targetEvent(ev)
				.ok($filter('translate')('clone.label'))
				.cancel($filter('translate')('cancel.label'));

				$mdDialog.show(confirm).then(function(result) {
					if (!$scope.testSpecialCharactersForName(result)) {
						toastService.notify({
							type: "toast-error",
							delay: 2000000,
							msg: $filter('translate')('invalid.name')
						})
						return;
					}
					
					var duplicate = $filter('filter')($scope.tree.tabs,  function(item) {
							return item.title.toLowerCase() == result.toLowerCase();
						}, true);

					if (duplicate.length != 0) {
						toastService.notify({
							type: "toast-error",
							delay: 2000000,
							msg: $filter('translate')('test.set.duplicate')
						})
						return;
					}

					testSetServices.cloneSingle(testSet.title, result, function(response) {
						$scope.loadData();
					})
				}, function() {
					//ignore
				});
			  }
			  
			  //Rename testSet function
			  $scope.renameTestSet = function(ev, testSet) {
				var confirm = $mdDialog.prompt()
			  .title($filter('translate')('dialog.RenameTestSet'))
			  .placeholder($filter('translate')('new.name.label'))
			  .targetEvent(ev)
			  .ok($filter('translate')('rename.label'))
			  .cancel($filter('translate')('cancel.label'));

			  $mdDialog.show(confirm).then(function(result) {
				  if (!$scope.testSpecialCharactersForName(result)) {
					  toastService.notify({
						  type: "toast-error",
						  delay: 2000000,
						  msg: $filter('translate')('invalid.name')
					  })
					  return;
				  }
				  
				  var duplicate = $filter('filter')($scope.tree.tabs,  function(item) {
						  return item.title.toLowerCase() == result.toLowerCase();
					  }, true);

				  if (duplicate.length != 0) {
					  toastService.notify({
						  type: "toast-error",
						  delay: 2000000,
						  msg: $filter('translate')('test.set.duplicate')
					  })
					  return;
				  }

				  testSetServices.renameTestSet(testSet.title, result, function(response) {
					  $scope.loadData();
				  })
			  }, function() {
				  //ignore
			  });
			}

      		$scope.deleteTestSet = function(ev, tab) {

				if (!tab) {
					tab = $scope.current.currentTestSet;
				}

				var index = $scope.tree.tabs.indexOf(tab);

				var confirm = $mdDialog.confirm().title($filter('translate')('delete.confirm.title')).textContent($filter('translate')('delete.confirm.text')).ariaLabel('').targetEvent(ev).ok(
						$filter('translate')('delete.label')).cancel($filter('translate')('cancel.label'));

				$mdDialog.show(confirm).then(function() {
					testSetServices.deleteTestSet([tab.title], function(response) {
						//$scope.tree.tabs.splice(index, 1);
						$scope.current.currentTestSet = undefined;
						$scope.tree.selectedTabs = [];
						$scope.loadData();
					})
				}, function() {
					//ignore
				});

			}

			$scope.deleteTestSets = function(ev) {
				var confirm = $mdDialog.confirm().title($filter('translate')('delete.confirm.title')).textContent($filter('translate')('delete.confirm.text')).ariaLabel('').targetEvent(ev).ok(
						$filter('translate')('delete.label')).cancel($filter('translate')('cancel.label'));

				var titles = [];
				for (var i = 0; i < $scope.tree.selectedTabs.length; i ++) {
					titles.push($scope.tree.selectedTabs[i].title);
				}

				$mdDialog.show(confirm).then(function() {
					testSetServices.deleteTestSet(titles, function(response) {
						//$scope.tree.tabs.splice(index, 1);
						$scope.current.currentTestSet = undefined;
						$scope.tree.selectedTabs = [];
						$scope.loadData();
					})
				}, function() {
					//ignore
				});
			}

		}]);
