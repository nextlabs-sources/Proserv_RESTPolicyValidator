mainApp.controller('testSetController', [
	'$scope',
	'$state',
	'loggerService',
	'$stateParams',
	'$filter',
	'dialogService',
	'$mdDialog',
	'testCaseServices',
	'toastService',
	'Category',
	'evaluateService',
	'testSetServices', '$mdSidenav',
	function ($scope, $state, loggerService, $stateParams, $filter, dialogService, $mdDialog, testCaseServices, toastService, Category, evaluateService, testSetServices, $mdSidenav) {

		$scope.testSetName = $stateParams.id;
		$scope.status = new Map();
		$scope.sortProperty = "title";
		$scope.reverse = false;
		$scope.testSetResult = new Map();
		$scope.computed = false;
		$scope.evaluated = false;
		$scope.options = {
			isMultiQuery: true
		};

		$scope.selectedTestCases = [];

		$scope.createNewTestCase = function (ev) {

			var confirm = $mdDialog.prompt().title($filter('translate')('dialog.CreateNewTestCase')).placeholder($filter('translate')('name.label')).targetEvent(ev).ok(
				$filter('translate')('create.label')).cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function (result) {

				if (!result || result.length === 0 || result.length > 255) {
					var length = (result) ? result.length : 0;
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('invalid.test.case.name.length') + length
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

				var checkDuplicate = $filter('filter')($scope.current.currentTestSet.children, function (item) {
					return item.title.toLowerCase() == result.toLowerCase();
				}, true);
				if (checkDuplicate && checkDuplicate.length > 0) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('test.case.duplicate')
					})
					return;
				}

				testCaseServices.createTestCase(result, $scope.current.currentTestSet.title, {
					"Request": {}
				}, "allow", function (response) {
					if (!$scope.current.currentTestSet.children) {
						$scope.current.currentTestSet.children = [];
					}

					var version, expectedResult;
					if (response.data) {
						version = response.data.version;
						expectedResult = response.data.expectedResult;
					} else {
						version = 1;
						expectedResult = "allow";
					}

					var newTab = {
						title: result,
						url: "TestCase({id:'" + result + "', testSet: '" + $scope.current.currentTestSet.title + "'})",
						finalUrl: 'TestCase',
						icon: "fa-file-text-o",
						version: version,
						expectedResult: expectedResult,
						openOptions: false
					}
					$scope.current.currentTestSet.children.push(newTab);
					//dismiss the result if exists
					$scope.dismissResult();

					$scope.current.currentTestCase = newTab;
					$scope.current.currentTab = newTab.url;
					$scope.current.currentTestCaseIndex = $scope.current.currentTestSet.children.length - 1;
					$state.go("TestCase", {
						id: result,
						testSet: $scope.current.currentTestSet.title
					});
				})
			}, function (error) {
				loggerService.getLogger().error(error);
			});
		};

		$scope.sortBy = function (column) {
			$scope.reverse = ($scope.sortProperty === column) ? !$scope.reverse : false;
			$scope.sortProperty = column;
		}

		$scope.expandResult = function (testCase) {
			if (!$scope.evaluated) {
				return;
			}
			testCase.expandResult = !testCase.expandResult;
		}

		$scope.onTestSetLoad = function (instance) {
			instance.expandAll();
		}

		$scope.designRequest = function () {
			$scope.onDesign = true;
			$scope.rawResponse.rendered = false;
			$scope.layout.response = false;
			if (!$scope.computed) {
				$scope.loadTestSet($scope.current.currentTestSet);
				$scope.computed = true;
			}
		}

		$scope.jsonRequest = function () {
			$scope.onDesign = false;
			$scope.rawResponse.rendered = true;
			if ($scope.evaluated) {

				$scope.layout.response = true;
			}
			$scope.closeResult();
		}

		$scope.changeRequestType = function () {
			$scope.evaluated = false;
		}

		$scope.evaluate = function () {
			$scope.total = $scope.current.currentTestSet.children.length;
			$scope.passes = 0;
			$scope.processed = 0;
			$scope.exportObject = {};
			$scope.csvResponses = [];

			if ($scope.invalidOrInComplete) {
				toastService.notify({
					delay: 5000,
					msg: $filter('translate')('invalid.test.cases'),
					type: "toast-error"
				})
				return;
			}
			if ($scope.options.isMultiQuery) {

				$scope.response.testSetNotMultiRequest = false;

				//Sort request from 00,10,20,30.....
				$scope.request.Request.MultiRequests.RequestReference.sort(function (a, b) {
					//a.ReferenceId[0] = subject
					var indexA = a.ReferenceId[0].substring(7, a.ReferenceId[0].length);
					var indexB = b.ReferenceId[0].substring(7, b.ReferenceId[0].length);
					return indexA - indexB;
				});

				$scope.current.requestResponse = undefined;
				// $scope.testSetResult.clear();
				evaluateService.evaluate($scope.request, function (response, request_time) {
					try {
						if (!$scope.onDesign) {
							$scope.layout.response = true;
						}
						$scope.evaluated = true;
						// Fix for compatibility with new CC
						$scope.resArr = "Result" in response.data.Response ? response.data.Response.Result : response.data.Response;
						$scope.response.time = request_time
						if ($scope.resArr) {
							if ($scope.resArr.length == 1 && $scope.resArr[0].Decision === "Indeterminate") {
								toastService.notify({
									type: "toast-error",
									msg: $scope.resArr.Result[0].Status.StatusMessage,
									delay: 5000
								});
							} else {

								$scope.resArr.forEach(function (result, index) {
									$scope.current.currentTestSet.children[index].result = result;
									var decision = result.Decision;
									if (decision === "Permit") {
										$scope.current.currentTestSet.children[index].actualResult = "Allow";
									} else if (decision === "NotApplicable") {
										$scope.current.currentTestSet.children[index].actualResult = "NotApplicable";
									} else {
										$scope.current.currentTestSet.children[index].actualResult = "Deny";
									}
									if ($scope.current.currentTestSet.children[index].actualResult.toLowerCase() === $scope.current.currentTestSet.children[index].expectedResult) {
										$scope.current.currentTestSet.children[index].status = "passed";
										$scope.passes = $scope.passes + 1;
									} else {
										$scope.current.currentTestSet.children[index].status = "failed";
									}

									prepareExportRow($scope.current.currentTestSet.children[index].title,
										$scope.current.currentTestSet.children[index].expectedResult,
										$scope.current.currentTestSet.children[index].actualResult,
										"N.A.",
										$scope.current.currentTestSet.children[index].status,
										result);

									$scope.processed = $scope.processed + 1;
								});

								if ($scope.passes == $scope.total) {
									$scope.response.status = "passed";
								} else {
									$scope.response.status = "failed";
								}
								$scope.response.statusExtra = $scope.passes + " passed/" + $scope.total + " total";

								$scope.exportObject.timestamp = new Date();
								$scope.exportObject.timeTaken = request_time;
							}
						}
					} catch (error) {
						console.error(error);
						toastService.notify({
							type: "toast-error",
							msg: $filter('translate')('ERROR.unexpected') + error,
							delay: 50000
						})
					}
				});
			} else {

				$scope.response.testSetNotMultiRequest = true;

				$scope.exportObject.timestamp = new Date();

				$scope.current.currentTestSet.children.forEach(function (testCase, index) {
					evaluateService.evaluateTestCase(testCase.title, $scope.current.currentTestSet.title, function (response, request_time) {
						try {
							var result = "Result" in response.data.Response ? response.data.Response.Result[0] : response.data.Response[0];

							$scope.current.currentTestSet.children[index].result = result;
							var decision = result.Decision;
							if (decision === "Permit") {
								$scope.current.currentTestSet.children[index].actualResult = "Allow";
							} else if (decision === "NotApplicable") {
								$scope.current.currentTestSet.children[index].actualResult = "NotApplicable";
							} else {
								$scope.current.currentTestSet.children[index].actualResult = "Deny";
							}
							if ($scope.current.currentTestSet.children[index].actualResult.toLowerCase() === $scope.current.currentTestSet.children[index].expectedResult) {
								$scope.current.currentTestSet.children[index].status = "passed";
								$scope.passes = $scope.passes + 1;
							} else {
								$scope.current.currentTestSet.children[index].status = "failed";
							}

							$scope.current.currentTestSet.children[index].time = request_time;

							prepareExportRow($scope.current.currentTestSet.children[index].title,
								$scope.current.currentTestSet.children[index].expectedResult,
								$scope.current.currentTestSet.children[index].actualResult,
								request_time,
								$scope.current.currentTestSet.children[index].status,
								result);

							$scope.processed = $scope.processed + 1;
							if ($scope.processed == $scope.total) {
								$scope.response.testSetNotMultiRequest = false;
							}
						} catch (error) {
							console.error(error);
							toastService.notify({
								type: "toast-error",
								msg: $filter('translate')('ERROR.unexpected') + error,
								delay: 50000
							})
						}
					});
				});

				$scope.evaluated = true;
			}
		}

		var prepareExportRow = function (testCase, expectedResult, actualResult, timeTaken, status, raw) {
			$scope.exportObject[testCase] = {
				expectedResult: expectedResult,
				actualResult: actualResult,
				status: status,
				timeTaken: timeTaken,
				rawResponse: raw
			}

			var csvResponse = testCase
				+ "," + expectedResult
				+ "," + actualResult
				+ "," + timeTaken
				+ "," + status
				+ "," + raw.Status.StatusMessage
				+ ",";

			for (var i = 0; i < raw.Obligations.length; i++) {
				var obligation = raw.Obligations[i];
				csvResponse = csvResponse + obligation.Id;
				csvResponse = csvResponse + "(";
				for (var j = 0; j < obligation.AttributeAssignment.length; j++) {
					csvResponse = csvResponse + obligation.AttributeAssignment[j].AttributeId
						+ ":" + JSON.stringify(obligation.AttributeAssignment[j].Value);
					if (j != obligation.AttributeAssignment.length - 1) {
						csvResponse = csvResponse + ";";
					}
				}
				csvResponse = csvResponse + ")";

				if (i != raw.Obligations.length - 1) {
					csvResponse = csvResponse + ";";
				}
			}

			csvResponse = csvResponse + "\n";
			$scope.csvResponses.push(csvResponse);
		}

		$scope.loadTestSet = function () {
			if (!$scope.current.currentTestSet) {
				return;
			}
			$scope.current.currentTestSet.children = [];
			$scope.invalidOrInComplete = false;

			$scope.request = {
				"Request": {
					"ReturnPolicyIdList": "false",
					"Category": [],
					"MultiRequests": {
						"RequestReference": []
					}
				}
			};

			testCaseServices.listTestCase($scope.current.currentTestSet.title, function (response) {

				if (response.data) {

					response.data.forEach(function (testCase, index) {
						$scope.current.currentTestSet.children.push({
							title: testCase.name,
							url: "TestCase({id:'" + testCase.name + "', testSet:'" + $scope.current.currentTestSet.title + "'})",
							icon: "fa-file-text-o",
							expectedResult: testCase.expectedResult,
							version: testCase.version,
							openOptions: false,
							status: testCase.status
						});

						if (testCase.error) {
							toastService.notify({
								delay: 5000,
								msg: $filter('translate')('test.case.load.invalid') + ": " + testCase.error,
								type: "toast-error"
							});
							$scope.invalidOrInComplete = true;
							return;
						}

						testCaseServices.getTestCase(testCase.name, $scope.current.currentTestSet.title, function (response) {
							if (!response.data || !response.data.Request || !response.data.version || !response.data.expectedResult) {
								loggerService.getLogger().error("Invalid response received");
								toastService.notify({
									delay: 5000,
									msg: $filter('translate')('test.case.load.invalid'),
									type: "toast-error"
								});
								$scope.current.currentTestSet.children[index].status = "invalid";
								$scope.invalidOrInComplete = true;
								return;
							}

							var request = response.data.Request;
							$scope.current.currentTestSet.children[index].description = response.data.description;

							if (angular.equals(request, {}) || !request.Category || request.Category.length == 0) {
								$scope.current.currentTestSet.children[index].status = "incomplete";
								$scope.invalidOrInComplete = true;
							} else {
								var referenceId = [];
								var categories = new Map();

								try {
									request.Category.forEach(function (jCategory, categoryIndex) {
										var category = new Category("json", jCategory);
										if (categories.get(category.getType())) {
											categories.get(category.getType()).push(category);
										} else {
											categories.set(category.getType(), [category]);
										}
									});

									categories.forEach(function (subCategories, type) {
										subCategories.forEach(function (category, cIndex) {
											$scope.request.Request.Category.push(category.toXACMLJSON(index.toString() + cIndex.toString()));
											referenceId.push(category.refId + index + cIndex);
										})
									})
								} catch (error) {
									toastService.notify({
										type: "toast-error",
										msg: $filter('translate')('ERROR.unexpected') + error,
										delay: 50000
									})
								}

								$scope.request.Request.MultiRequests.RequestReference.push({
									"ReferenceId": referenceId
								});
								$scope.current.currentTestSet.children[index].status = "";
								$scope.current.currentTestSet.children[index].actualResult = "";
								$scope.current.currentTestSet.children[index].expandResult = false;
							}
						});
					});
				}
			});
		}

		$scope.goToTestCase = function (testCase, index) {
			$scope.current.currentTestCase = testCase;
			$scope.current.currentTestCaseIndex = index;
			$scope.current.currentTab = testCase.url;
			$state.go("TestCase", { id: testCase.title, testSet: $scope.current.currentTestSet.title });
		}


		$scope.exportResult = function () {
			return encodeURIComponent(JSON.stringify($scope.exportObject, null, '\t'));
		}

		$scope.exportResultCSV = function () {
			var resultString = "Test Case, Expected Result, Actual Result, Time Taken, Status, Message, Obligations\n";

			for (var i = 0; i < $scope.csvResponses.length; i++) {
				resultString = resultString + $scope.csvResponses[i];
			}

			return encodeURIComponent(resultString);
		}

		$scope.toggleAll = function () {
			if ($scope.selectedTestCases.length === $scope.current.currentTestSet.children.length) {
				$scope.selectedTestCases = [];
			} else {
				$scope.selectedTestCases = $scope.current.currentTestSet.children.slice(0);
			}
		}

		$scope.allIsChecked = function () {
			return ($scope.selectedTestCases.length == $scope.current.currentTestSet.children.length);
		}

		$scope.someIsChecked = function () {
			return ($scope.selectedTestCases.length > 0 && $scope.current.currentTestSet.children.length !== $scope.selectedTestCases.length);
		}

		$scope.toggleTestCase = function (tab) {

			var search = $filter('filter')($scope.selectedTestCases, { title: tab.title }, true);

			if (search.length === 0) {
				$scope.selectedTestCases.push(tab);
			} else {
				var index = $scope.selectedTestCases.indexOf(search[0]);
				$scope.selectedTestCases.splice(index, 1);
			}
		}

		$scope.testCaseIsCheck = function (tab) {
			var search = $filter('filter')($scope.selectedTestCases, { title: tab.title }, true);
			return search.length !== 0;
		}

		$scope.optionClick = function (tab) {
			tab.openOptions = !tab.openOptions;
		}

		$scope.deleteTestCase = function (ev, testCase) {
			var confirm = $mdDialog.confirm().title($filter('translate')('delete.confirm.title'))
				.textContent($filter('translate')('delete.confirm.text'))
				.ariaLabel('')
				.targetEvent(ev)
				.ok($filter('translate')('delete.label'))
				.cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function () {
				testCaseServices.deleteTestCase([testCase.title], $scope.current.currentTestSet.title, function (response) {
					$scope.selectedTestCases = [];
					$scope.loadTestSet($scope.current.currentTestSet);
				});
			}, function () {
				//ignore
			});
		}

		$scope.deleteTestCases = function (ev) {
			var confirm = $mdDialog.confirm().title($filter('translate')('delete.confirm.title'))
				.textContent($filter('translate')('delete.confirm.text'))
				.ariaLabel('')
				.targetEvent(ev)
				.ok($filter('translate')('delete.label'))
				.cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function () {
				var testCases = [];

				for (var i = 0; i < $scope.selectedTestCases.length; i++) {
					testCases.push($scope.selectedTestCases[i].title);
				}

				testCaseServices.deleteTestCase(testCases, $scope.current.currentTestSet.title, function (response) {
					$scope.selectedTestCases = [];
					$scope.loadTestSet($scope.current.currentTestSet);
				});
			}, function () {
				//ignore
			});
		}

		$scope.cloneTestCase = function (ev, testCase) {
			var confirm = $mdDialog.prompt()
				.title($filter('translate')('dialog.CloneTestCase'))
				.placeholder($filter('translate')('new.name.label'))
				.initialValue(testCase.title + ' - Copy')
				.targetEvent(ev)
				.ok($filter('translate')('clone.label'))
				.cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function (result) {
				if (!$scope.testSpecialCharactersForName(result)) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('invalid.name')
					})
					return;
				}

				var duplicate = $filter('filter')($scope.current.currentTestSet.children, function (item) {
					return item.title.toLowerCase() == result.toLowerCase();
				}, true);

				if (duplicate.length != 0) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('test.case.duplicate')
					})
					return;
				}

				testCaseServices.cloneSingle(testCase.title, result, $scope.current.currentTestSet.title, function (response) {
					$scope.loadTestSet();
				})
			}, function () {
				//ignore
			});
		}

		$scope.renameTestCase = function (ev, testCase) {
			var confirm = $mdDialog.prompt()
				.title($filter('translate')('dialog.renameTestCase'))
				.placeholder($filter('translate')('new.name.label'))
				.initialValue(testCase.title)
				.targetEvent(ev)
				.ok($filter('translate')('rename.label'))
				.cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function (result) {
				if (!$scope.testSpecialCharactersForName(result)) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('invalid.name')
					})
					return;
				}

				var duplicate = $filter('filter')($scope.current.currentTestSet.children, function (item) {
					return item.title.toLowerCase() == result.toLowerCase();
				}, true);

				if (duplicate.length != 0) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('test.case.duplicate')
					})
					return;
				}

				testCaseServices.renameTestCase(testCase.title, result, $scope.current.currentTestSet.title, function (response) {
					$scope.loadTestSet();
				})
			}, function () {
				//ignore
			});
		}

		$scope.expandResult = function (testCase) {
			$mdSidenav("result-panel")
				.open()
				.then(function () {
					$scope.currentTestCaseDetail = testCase;
				});
		}

		$scope.closeResult = function () {
			$mdSidenav("result-panel")
				.close()
				.then(function () {
				});
		}
	}])
