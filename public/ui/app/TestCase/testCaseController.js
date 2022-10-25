mainApp.controller('testCaseController', ['$scope', '$rootScope', '$state', 'loggerService', '$stateParams', '$filter',
	'dialogService', 'Category', 'testCaseServices', 'toastService', 'evaluateService', '$mdDialog', '$mdSidenav',
	function ($scope, $rootScope, $state, loggerService, $stateParams, $filter,
		dialogService, Category, testCaseServices, toastService, evaluateService, $mdDialog, $mdSidenav) {

		$scope.testCaseName = $stateParams.id;
		$scope.testSetName = $stateParams.testSet;
		$scope.categories = new Map();
		$scope.raw = {
			options: {
				mode: "code",
				onError: function (error) {
					loggerService.getLogger().error(error);
				}
			}
		};
		$scope.expectedResult = {
		};
		$scope.allCategories = ["Subject", "Action", "From Resource", "To Resource", "Application", "Recipient", "Host", "NamedAttribute", "Environment"];
		$scope.onDesign = true;
		$scope.loadedFlag = false;
		$scope.rendered = true;
		$scope.jsonEditRendered = true;
		$scope.extra = { description: "" };
		$scope.evaluated = false;
		$scope.jsonActive = false;
		$scope.jsonValid = true;
		$scope.testCaseTab = { selected: 0 };

		testCaseServices.getTestCase($scope.testCaseName, $scope.testSetName, function (response) {
			if (response.statusCode === "5002") {
				$scope.current.currentTestCase = undefined;
				$scope.current.currentTestCaseIndex = undefined;
				$scope.rendered = false;
				return;
			} else {
				if (!response.data || !response.data.Request || !response.data.version || !response.data.expectedResult) {
					loggerService.getLogger().error("Invalid response received");
					toastService.notify({
						delay: 50000,
						msg: $filter('translate')('ERROR.unknown'),
						type: "toast-error"
					})
					return;
				}
			}

			loadResponse(response);

		});

		var loadResponse = function (response) {
			$scope.expectedResult = { data: response.data.expectedResult };
			$scope.extra.description = response.data.description;
			$scope.version = response.data.version;

			var request = response.data.Request;
			if (angular.equals(request, {}) || !request.Category || request.Category.length == 0) {
				$scope.categories.set("Subject", [new Category("Subject", "")]);
				$scope.categories.set("Action", [new Category("Action", "")]);
				$scope.categories.set("From Resource", [new Category("From Resource", "")]);
				$scope.categories.set("Application", [new Category("Application", "")]);
			} else {
				try {
					request.Category.forEach(function (jCategory, index) {
						var category = new Category("json", jCategory);
						if ($scope.categories.get(category.getType())) {
							$scope.categories.get(category.getType()).push(category);
						} else {
							$scope.categories.set(category.getType(), [category]);
						}
					})
				} catch (error) {
					loggerService.getLogger().error(error);
					toastService.notify({
						type: "toast-error",
						msg: $filter('translate')('invalid.json.validate') + error.message,
						delay: 50000
					});
				}
			}
		}

		$scope.saveTestCase = function (form, callback) {
			if ($scope.onDesign) {
				if (form.$invalid) {
					form.$setDirty();
					for (var field in form) {
						if (field[0] == '$')
							continue;
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

				var testCaseObject = {
					"Request": {
						"ReturnPolicyIdList": "true",
						"Category": []
					},
					version: $scope.version
				};

				try {
					$scope.categories.forEach(function (categories, type) {
						categories.forEach(function (category) {
							testCaseObject.Request.Category.push(category.toXACMLJSON());
						})
					});
				} catch (error) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: error.message
					});
					return;
				}

				testCaseServices.saveTestCase($scope.testCaseName, $scope.testSetName, testCaseObject, $scope.expectedResult.data, $scope.extra.description,
					function (response) {
						// if version mismatches, load the data from the server to the UI
						if (response.statusCode === "5001") {
							return;
						} else {
							form.$setPristine();
							$scope.version = $scope.version + 1;
							$scope.current.currentTestSet.children[$scope.current.currentTestCaseIndex].expectedResult = $scope.expectedResult.data;
							if (callback) {
								callback();
							}
						}
					});
			} else {
				if (!$scope.validateRawRequest()) {
					return;
				}
				var testCaseObject = angular.copy($scope.raw.request);
				testCaseObject.version = $scope.version;
				testCaseServices.saveTestCase($scope.testCaseName, $scope.testSetName, testCaseObject, $scope.expectedResult.data, $scope.extra.description,
					function (response) {
						if (response.statusCode === "5001") {
							return;
						} else {
							$scope.version = $scope.version + 1;
							$scope.current.currentTestSet.children[$scope.current.currentTestCaseIndex].expectedResult = $scope.expectedResult.data;
							$scope.requestReset = angular.copy($scope.raw.request);
							if (callback) {
								callback();
							}
						}
					});
			}
		}

		$scope.onExpectedResultChange = function (newExpectedResult) {
			$scope.expectedResult.data = newExpectedResult;
		}

		$scope.recheckHost = function (index) {
			$scope.categories.get('Host')[index].recheckHost();
		}

		$scope.changeRecipientMode = function (index) {
			if ($scope.categories.get('Recipient')[index].attributes[0].attributeId === "email") {
				$scope.categories.get('Recipient')[index].attributes[0].value = [];
				$scope.categories.get('Recipient')[index].attributes.splice(1);
			} else {
				$scope.categories.get('Recipient')[index].attributes[0].value = "";
			}
		}

		$scope.addNamedAttribute = function (ev) {
			var confirm = $mdDialog.prompt()
				.title($filter('translate')('dialog.AddNamedAttribute'))
				.placeholder($filter('translate')('name.label'))
				.targetEvent(ev)
				.ok($filter('translate')('create.label'))
				.cancel($filter('translate')('cancel.label'));

			$mdDialog.show(confirm).then(function (result) {
				/*
				 * var duplicate = $filter('filter')($scope.tabs,
				 * {"title":result}, true); if (duplicate.length != 0) {
				 * toastService.notify({ type: "toast-error", delay: 2000000,
				 * msg: $filter('translate')('test.set.duplicate') }) return; }
				 */

				var regex = /^\w+$/;

				if (!regex.test(result)) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: $filter('translate')('named.attribute.invalid.name')
					});

					return;
				}

				for (var i = 0; i < $scope.categories.get('NamedAttribute').length; i++) {
					if ($scope.categories.get('NamedAttribute')[i].namedAttributeName === result) {
						toastService.notify({
							type: "toast-error",
							delay: 2000000,
							msg: $filter('translate')('named.attribute.duplicate')
						});
						return;
					}
				}

				var namedAttribute = new Category("NamedAttribute", result);
				$scope.categories.get('NamedAttribute').push(namedAttribute);
			}, function () {

			});
		}

		$scope.removeNamedAttribute = function (index) {
			$scope.categories.get('NamedAttribute').splice(index, 1);
		}

		$scope.getNamedAttributeName = function (namedAttribute) {
			var tempArr = namedAttribute.categoryId.split(':');
			return tempArr[tempArr.length - 1].split("-")[1];
		}

		$scope.onTestCaseEditorLoad = function (editor) {
		}

		$scope.jsonRequest = function () {
			if (!$scope.jsonValid) {
				return;
			}
			$scope.onDesign = false;
			$scope.closeResult();
			$scope.rawResponse.rendered = true;
			$scope.loadedFlag = true;
			$scope.raw.request = {
				"Request": {
					"ReturnPolicyIdList": "false",
					"Category": []
				}
			};
			$scope.categories.forEach(function (categories, type) {
				categories.forEach(function (category) {
					try {
						category.validateToXACMLJSON();
					} catch (error) {
						toastService.notify({
							type: "toast-error",
							delay: 2000000,
							msg: error.message
						});
					}
					//allow user to switch to json payload tab even if the design has error; only display error in the previous step
					$scope.raw.request.Request.Category.push(category.toXACMLJSONIgnoreError());
				});
			});

			$scope.requestReset = angular.copy($scope.raw.request);

			if ($scope.evaluated) {
				$scope.layout.response = true;
			}
		}

		$scope.deselectJsonRequest = function () {
			if (!$scope.validateRawRequest()) {
				$scope.jsonValid = false;
				$scope.testCaseTab.selected = 1;
			} else {
				$scope.jsonValid = true;
				$scope.testCaseTab.selected = 0;
			}
		}

		$scope.designRequest = function () {
			if (!$scope.jsonValid) {
				return;
			}

			$scope.onDesign = true;
			$scope.rawResponse.rendered = false;
			if (!$scope.raw.request && !$scope.loadedFlag) {
				// first load
				return;
			}

			if ($scope.raw.request) {
				if (!$scope.raw.request.Request || !$scope.raw.request.Request.Category || !$scope.raw.request.Request.Category instanceof Array) {
					toastService.notify({
						type: "toast-error",
						msg: $filter('translate')('invalid.json.error') + "Undefined request",
						delay: 50000
					});
					return;
				}
			}

			if (angular.equals($scope.raw.request, {}) || angular.equals($scope.raw.request.Request, {})
				|| !$scope.raw.request.Request.Category || $scope.raw.request.Request.Category.length == 0) {

				toastService.notify({
					msg: $filter('translate')('empty.request.warn'),
					type: "toast-warn",
					delay: 50000
				});

				// populate default data
				$scope.categories.clear();

				$scope.categories.set("Subject", [new Category("Subject", "")]);
				$scope.categories.set("Action", [new Category("Action", "")]);
				$scope.categories.set("From Resource", [new Category("From Resource", "")]);
				$scope.categories.set("Application", [new Category("Application", "")]);
			} else {
				var tempCategories = [];
				var categoryCheck = {
					"Subject": false,
					"From Resource": false,
					"Action": false,
					"Application": false
				}

				var compusoryCat = ["Subject", "From Resource", "Action", "Application"];
				try {
					$scope.raw.request.Request.Category.forEach(function (jCategory, index) {
						var category = new Category("json", jCategory);
						categoryCheck[category.getType()] = true;
						tempCategories.push(category);
					});

					for (var i = 0; i < compusoryCat.length; i++) {
						if (!categoryCheck[compusoryCat[i]]) {
							throw new Error("Category " + compusoryCat[i] + " not found");
						}
					}
				} catch (error) {
					// design interface data is not changed

					loggerService.getLogger().error(error);
					toastService.notify({
						type: "toast-error",
						msg: $filter('translate')('invalid.json.error') + error.message,
						delay: 50000
					});

					return;
				}

				// modify the design data
				$scope.categories.clear();
				tempCategories.forEach(function (category) {
					if ($scope.categories.get(category.getType())) {
						$scope.categories.get(category.getType()).push(category);
					} else {
						$scope.categories.set(category.getType(), [category]);
					}
				})
			}

			if ($scope.evaluated) {
				$scope.layout.response = false;
				$scope.expandResult();
			}

		}

		$scope.validateRawRequest = function () {
			if (angular.equals($scope.raw.request, {}) || angular.equals($scope.raw.request.Request, {})
				|| !$scope.raw.request.Request.Category || $scope.raw.request.Request.Category.length == 0) {
				toastService.notify({
					msg: $filter('translate')('empty.json.validate'),
					type: "toast-warn",
					delay: 50000
				});
				return false;
			} else {
				var categoryCheck = {
					"Subject": false,
					"From Resource": false,
					"Action": false,
					"Application": false
				}

				var compusoryCat = ["Subject", "From Resource", "Action", "Application"];
				try {
					for (var i = 0; i < $scope.raw.request.Request.Category.length; i++) {
						var jCategory = $scope.raw.request.Request.Category[i];
						var category = new Category("json", jCategory);
						categoryCheck[category.getType()] = true;
					};

					for (var i = 0; i < compusoryCat.length; i++) {
						if (!categoryCheck[compusoryCat[i]]) {
							throw new Error("Category " + compusoryCat[i] + " not found");
						}
					}

				} catch (error) {

					loggerService.getLogger().error(error);
					toastService.notify({
						type: "toast-error",
						msg: $filter('translate')('invalid.json.validate') + error.message,
						delay: 50000
					});

					return false;
				}

				toastService.notify({
					type: "toast-success",
					msg: $filter('translate')('valid.json.validate'),
					delay: 50000
				});

				return true;
			}
		}

		$scope.addAttribute = function (category) {
			category.addAttribute("", "", "single");
		}

		$scope.valueTypeChange = function (attribute) {
			if (attribute.valueType === 'single') {
				attribute.value = "";
			} else {
				attribute.value = [];
			}
		}

		$scope.valueKeyChange = function (attribute, attrib) {
			attribute.valueType = attrib.type;
			$scope.valueTypeChange(attribute);
		}

		$scope.deleteAttribute = function (category, index) {
			if (category.getType() != "Environment" && category.getType() != "NamedAttribute" && category.getType() != "From Resource" && category.getType() != "To Resource") {
				category.removeAttribute(index + 1);
			} else if (category.getType() === "From Resource" || category.getType() === "To Resource") {
				category.removeAttribute(index + 4);
			} else {
				category.removeAttribute(index);
			}

			$scope.formDirty = true;
		}

		$scope.addCategory = function (category) {
			if (category === "NamedAttribute") {
				$scope.categories.set(category, []);
			} else {
				$scope.categories.set(category, [new Category(category, "")]);
			}
		}

		$scope.removeCategory = function (category) {
			$scope.categories.delete(category);
		}

		$scope.evaluate = function () {
			if ($scope.onDesign) {
				$scope.raw.request = {
					"Request": {
						"nochace": "yes",
						"ReturnPolicyIdList": "true",
						"Category": []
					}
				};
				try {
					$scope.categories.forEach(function (categories, type) {
						categories.forEach(function (category) {
							$scope.raw.request.Request.Category.push(category.toXACMLJSON());
						})
					});
				} catch (error) {
					toastService.notify({
						type: "toast-error",
						delay: 2000000,
						msg: error.message
					});
					return;
				}
			}

			if (!$scope.onDesign) {
				$scope.jsonEditRendered = false;
			}

			evaluateService.evaluate($scope.raw.request, function (response, request_time) {
				$scope.evaluated = true;
				$scope.rerender();
				// Fix for compatibility with new CC
				$scope.resObj = "Result" in response.data.Response ? response.data.Response.Result[0] : response.data.Response[0];
				$scope.response.time = request_time;
				try {
					if ($scope.resObj.Decision === "Permit" && $scope.expectedResult.data === "allow" ||
						$scope.resObj.Decision === "Deny" && $scope.expectedResult.data === "deny" ||
						$scope.resObj.Decision === "NotApplicable" && $scope.expectedResult.data === "notapplicable") {
						$scope.response.status = "passed"
					} else {
						$scope.response.status = "failed"
					}
				} catch (error) {
					toastService.notify({
						type: "toast-error",
						msg: $filter('translate')('ERROR.unexpected'),
						delay: 50000
					});
				}

				if ($scope.onDesign) {
					$scope.expandResult();
				} else {
					$scope.layout.response = true;
				}



			});
		}

		$scope.rerender = function () {
			$scope.jsonEditRendered = true;
		}

		$scope.dataPristine = function () {
			if ($scope.formDirty) {
				return { pristine: false };
			}

			if ($scope.onDesign) {
				if ($scope.requestForm.$pristine) {
					return { pristine: true };
				} else {
					return { pristine: false };
				}
			} else {
				return { pristine: angular.equals($scope.raw.request, $scope.requestReset) };
			}
		}

		$scope.discard = function () {
			if ($scope.onDesign) {
			} else {
				$scope.raw.request = angular.copy($scope.requestReset);
			}
		}

		$scope.$on("testCaseClick", function (event, params) {
			var result = $scope.dataPristine();
			result.parent = params.parent;
			result.tab = params.tab;
			result.index = params.index;
			$scope.$emit('testCaseClickResponse', result);
		});

		$scope.$on("testSetClick", function (event, params) {
			var result = $scope.dataPristine();
			result.tab = params.tab;
			$scope.$emit('testSetClickResponse', result);
		});

		$scope.$on("otherClick", function (event, params) {
			var result = $scope.dataPristine();
			result.destination = params.destination;
			$scope.$emit('otherClickResponse', result);
		})

		$scope.$on("saveAndProceed", function (event, callback) {
			$scope.saveTestCase($scope.requestForm, callback);
		});

		$scope.expandResult = function () {
			$mdSidenav("result-panel")
				.open()
				.then(function () {
				});
		}

		$scope.closeResult = function () {
			$mdSidenav("result-panel")
				.close()
				.then(function () {
				});
		}

		$scope.subjectAttributesContains = function (key) {
			for (i in $rootScope.subjectAttributes) {
				if ($rootScope.subjectAttributes[i].key === key) {
					return true;
				}
			}
			return false;
		}

		$scope.resourceAttributesContains = function (key) {
			for (i in $rootScope.resourceAttributes) {
				if ($rootScope.resourceAttributes[i].key === key) {
					return true;
				}
			}
			return false;
		}

	}])
