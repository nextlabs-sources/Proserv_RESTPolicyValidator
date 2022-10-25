mainApp.controller('appController', ['$scope', '$rootScope', 'networkService', 'configService', 'loggerService', '$location', '$templateCache', '$timeout', '$mdConstant',
	'sharedService', '$filter', '$state', '$mdDialog', 'testSetServices', 'testCaseServices', 'toastService', 'overviewServices',
		function($scope, $rootScope, networkService, configService, loggerService, $location, $templateCache, $timeout, $mdConstant,
			sharedService, $filter, $state, $mdDialog, testSetServices, testCaseServices, toastService, overviewServices) {

			configService.setConfig(MainAppConfig);
			$scope.layout = {
				response:  true
			}
			$scope.obj = {responseOptions : {
				mode: "view",
				expanded: true
			}}

			overviewServices.getUsername(function (response) {
				$scope.user = { username: response.data };
			});

			overviewServices.getResourceAttributes(function(response) {
				$rootScope.resourceAttributes = response.data;
			});

			overviewServices.getSubjectAttributes(function(response) {
				$rootScope.subjectAttributes = response.data;
			});

			$scope.rawResponse = {rendered: false};
        	$scope.current = {
						currentScreen: "Home",
						currentSettingsScreen: "PC"
					}
        	$scope.response = {testSetNotMultiRequest:false};
        	$scope.renderView = true;

        	$scope.chipSeparators = [$mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON];

			var url = $location.url();
			if (url.indexOf('/') == 0)
				url = url.substring(1);
			if (url[url.length - 1] == '/')
				url = url.substring(0, url.length - 1);

			$scope.onLoad = function (instance) {
            	instance.expandAll();
        	};



			var findAndSet = function(parent, tab, index) {
				if (!tab.children) {
					// a test set without children or a test case or overview page
					if (url.indexOf("TestCase") == 0 && parent) {
						// a test case
						if (url.endsWith(encodeURI("/" + parent.title + "/" + tab.title))) {
							// current url matches with the test case
							$scope.current.currentTab = tab.url
							$scope.current.currentTestCase =  tab;
							$scope.current.currentTestCaseIndex = index;
							$scope.current.currentTestSet = parent;
							parent.expanded = true;
							parent.icon = "fa-folder-open-o";
							return true;
						}
					} else if (url.indexOf("TestSet") == 0) {
						//a test set
						if (url.endsWith(encodeURI("/" + tab.title))) {
							// current url matches with the test set
							$scope.current.currentTab = tab.url
							$scope.current.currentTestSet = tab;
							return true;
						}
					}
				} else {
					if (url.endsWith(encodeURI("/" + tab.title))) {
						//current url matches with tab title
						$scope.current.currentTab = tab.url;
						$scope.current.currentTestSet = tab;
						return true;
					} else {
						var found = false;
						for (var i = 0; i < tab.children.length; i ++) {
							if (findAndSet(tab, tab.children[i], i)) {
								found =  true;
								break;
							}
						}
						if (found) return true;
					}
				}
				return false;
			}


			$scope.activeTabFound = false;

			if (url.endsWith(encodeURI("Settings"))) {
				$scope.current.currentTab = "Settings";
				$scope.current.currentScreen = "Settings";
				$scope.activeTabFound = true;
			} else if (url.endsWith(encodeURI("Home"))) {
				$scope.current.currentTab = "Home";
				$scope.current.currentScreen = "Home";
				$scope.activeTabFound = true;
			} else if (url.endsWith(encodeURI("Error"))) {
				$scope.current.currentTab = "Error";
				$scope.current.currentScreen = "Error";
				$scope.activeTabFound = true;
			}

			$scope.loadData = function() {
				$scope.tree = {
					tabs:[],
					selectedTabs:[]
				}
				testSetServices.listTestSet(function(response) {
					if (!response.data) {
						loggerService.getLogger().error("Unable to retrieve data from response");
						return;
					}

					response.data.forEach(function(testSet, index) {

						var testSetTab = {
							title : testSet,
							url : "TestSet({id:'" + testSet + "'})",
							icon : "fa-folder-o",
							openOptions: false
						}

						testSetTab.children = [];
						$scope.tree.tabs.push(testSetTab);

						testCaseServices.listTestCase(testSet, function(response) {
							if (response.data) {
								response.data.forEach(function(testCase, index) {
									testSetTab.children.push({
										title : testCase.name,
										url : "TestCase({id:'" + testCase.name + "', testSet:'" + testSetTab.title + "'})",
										icon : "fa-file-text-o",
										expectedResult: testCase.expectedResult,
										version: testCase.version,
										openOptions:false,
										description: testCase.description
									});
								});
							}

							if (!$scope.activeTabFound) {
								if (findAndSet(undefined, testSetTab, $scope.tree.tabs.indexOf(testSetTab))) {
									$scope.activeTabFound = true;
								}
							}
						});
					});
				});
			}

			$scope.loadData();



			$scope.createNewTestSet = function(ev) {

				var confirm = $mdDialog.prompt()
				.title($filter('translate')('dialog.CreateNewTestSet'))
				.placeholder($filter('translate')('name.label'))
				.targetEvent(ev)
				.ok($filter('translate')('create.label'))
				.cancel($filter('translate')('cancel.label'));

				$mdDialog.show(confirm).then(function(result) {
					if (!result || result.length === 0 || result.length > 255) {
						var length = (result)?result.length:0;
						toastService.notify({
							type: "toast-error",
							delay: 2000000,
							msg: $filter('translate')('invalid.test.set.name.length') + length
						})
						return;
					}

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

					testSetServices.createTestSet(result, function(response) {
						$scope.tree.tabs.push({
							title : result,
							url : "TestSet({id:'" + result + "'})",
							icon : "fa-folder-o",
							index: $scope.tree.tabs.length,
							openOptions: false
						});
					})
				}, function() {

				});
			};



			var saveAndProceedDialog = function(callback) {
				$mdDialog.show({
					controller:  function($scope,$mdDialog) {
						$scope.hide = function() {
							$mdDialog.hide();
						};

						$scope.cancel = function() {
							$mdDialog.cancel();
						};

						$scope.proceed = function(save) {
							$mdDialog.hide(save);
						};
					},
					templateUrl: 'ui/app/templates/dialog-unsaved-data.html',
					parent: angular.element(document.body),
					targetEvent: undefined,
					clickOutsideToClose:true,

				 })
				.then(function(save) {
					if (save) {
						$scope.$broadcast("saveAndProceed", callback);
					} else {
						callback();
					}
				}, function() {
					//ignore
				});

				/*var confirm = $mdDialog.confirm()
				.title($filter('translate')('unsaved.data.title'))
				.textContent($filter('translate')('unsaved.data.text'))
				.ariaLabel('unsaved data')
				.targetEvent(event)
				.ok($filter('translate')('save.and.proceed.label'))
				.cancel($filter('translate')('proceed.label'))
				.clickOutsideToClose(true)
				.escapeToClose(true);

				$mdDialog.show(confirm).then(function() {
					$scope.$broadcast("saveAndProceed", callback);
				}, function() {
					callback();
				});*/
			}

			$scope.settings = function() {
				$scope.dismissResult();
				if (!$scope.current.currentTab  || $scope.current.currentTab.indexOf("TestCase") != 0) {
					$scope.current.currentTab = "Settings";
					$scope.current.currentScreen = "Settings";
					$state.go("Settings");
				} else {
					$scope.$broadcast("otherClick", {destination:"Settings"});
				}
			}

			$scope.goHome = function() {
				$scope.dismissResult();
				if ((!$scope.current.currentTab  || $scope.current.currentTab.indexOf("TestCase") != 0) && $scope.current.currentTab !== "Settings") {
					$scope.current.currentTab = "Home";
					$scope.current.currentScreen = "Home";
					$state.go("Home");
				} else {
					$scope.$broadcast("otherClick", {destination:"Home"});
				}
			}

			$scope.error = function() {
				$scope.dismissResult();

				if (!$scope.current.currentTab  || $scope.current.currentTab.indexOf("TestCase") != 0 || $scope.current.currentTab === "Settings") {
					$scope.current.currentTab = "Error";
					$scope.current.currentScreen = "Error";
					$state.go("Error");
				} else {
					$scope.$broadcast("otherClick", {destination:"Error"});
				}
			}

			$scope.$on("otherClickResponse", function(event, result) {
				var callback =  function() {
					$scope.current.currentTab = result.destination;
					if (result.destination === 'Settings') {
						$scope.current.currentScreen = "Settings";
					} else if (result.destination === 'Error') {
						$scope.current.currentScreen = "Error";
					} else if (result.destination === 'Home') {
						$scope.current.currentScreen = "Home";
					}
					$state.go(result.destination);
				}
				if (result.pristine) {
					callback();
				} else {
					saveAndProceedDialog(callback);
				}
			});

			$scope.onTestCaseClick = function(parent, tab, index) {

				$scope.dismissResult();

				if (!$scope.current.currentTab  || $scope.current.currentTab.indexOf("TestCase") != 0) {
					$scope.current.currentTab = tab.url;
					$scope.current.currentTestCase = tab;
					$scope.current.currentTestCaseIndex = index;
					$state.go("TestCase", {id: tab.title, testSet: parent.title});
				} else {
					if ($scope.current.currentTestCase && tab.title == $scope.current.currentTestCase.title) {
						return;
					}
					$scope.$broadcast("testCaseClick", {parent: parent, tab:tab, index: index});
				}
			}

			$scope.onTestSetClick = function(tab, index) {

				$scope.dismissResult();

				if (!$scope.current.currentTab || $scope.current.currentTab.indexOf("TestCase") != 0) {
					$scope.current.currentTab = tab.url;
					$scope.current.currentTestSet = tab;
					$state.go("TestSet", {id: tab.title});
					$scope.expandTab(tab);

				} else {
					$scope.$broadcast("testSetClick", {tab:tab});
				}
			}

			$scope.$on('testCaseClickResponse', function(event, result) {
				var callback = function() {
					$scope.current.currentTab = result.tab.url;
					$scope.current.currentTestCase = result.tab;
					$scope.current.currentTestCaseIndex = result.index;
					$state.go("TestCase", {testSet: result.parent.title, id: result.tab.title});
				}

				if (result.pristine) {
					callback();
				} else {
					saveAndProceedDialog(callback);
				}
			})

			$scope.$on('testSetClickResponse', function(event, result) {
				var callback = function() {
					$scope.current.currentTab = result.tab.url;
					$scope.current.currentTestSet = result.tab;
					$state.go("TestSet", {id: result.tab.title});
					$scope.expandTab(result.tab);
				}

				if (result.pristine) {
					callback();
				} else {
					saveAndProceedDialog(callback);
				}
			})

			$scope.expandTab = function(tab) {
				tab.expanded = !tab.expanded;
				if (tab.expanded) {
					tab.icon = "fa-folder-open-o";
				} else {
					tab.icon = "fa-folder-o";
				}
			}

			$scope.isActiveTab = function(tabUrl) {
				return $scope.current.currentTab == tabUrl
			}

			$scope.isActiveSettingsTab = function(screen) {
				return $scope.current.currentSettingsScreen === screen;
			}

			$scope.setSettingsScreen = function(screen) {
				$scope.current.currentSettingsScreen = screen;
			}

			/*$scope.$on('$locationChangeStart', function(next, current) {
				url = current.substring(current.indexOf('#') + 2)
				angular.forEach($scope.tree.tabs, function(tab) {
					findAndSet(undefined, tab)
				});
			})*/

			$scope.parseTimeFromString = function(timeString) {
				if (!timeString) {
					return "";
				}
				var date = new Date();
				date.setHours(parseInt(timeString.slice(0, 2)));
				date.setMinutes(parseInt(timeString.slice(2, 4)));
				return date;
			}

			$scope.parseTimeToString = function(date, withSeparator) {
				if (!date) {
					return "";
				}
				var hour = date.getHours();
				var hourString = hour.toString();
				var min = date.getMinutes();
				var minString = min.toString();
				if (hour < 10) {
					hourString = "0" + hourString;
				}

				if (min < 10) {
					minString = "0" + minString;
				}
				if (withSeparator) {
					return hourString + ":" + minString;
				} else {
					return hourString + minString;
				}
			}

			$scope.abs = function(number) {
				return Math.abs(number);
			}

			$scope.getDateFormat = function() {
				loggerService.getLogger().debug("The date format is  = " + configService.configObject['date.format']);
				return configService.configObject['date.format']
			}

			$scope.$on('ui.layout.loaded', function(){
        		$timeout(function(){
         			$scope.layout.response = true;
        		}, 100);
      		})

      		$scope.dismissResult = function() {
      			$scope.renderView=false;
      			$timeout(function(){
         			$scope.layout.response = false;
         			//$scope.response.requestResponse = undefined;
         			$scope.renderView = true;
        		}, 100);
      		}

      		$scope.goToTestSet = function(tab) {
      			$state.go("TestSet", {id: tab.title});
      		}

      		$scope.testSpecialCharactersForName = function(s) {
      			var regex = /[\/\\<>\[\]*?.+:|{}!@#\$%^&]+/;
      			if (regex.test(s)) {
      				return false;
      			}
      			return true;
      		}

		}]);
