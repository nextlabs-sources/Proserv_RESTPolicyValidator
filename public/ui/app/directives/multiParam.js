angular.module('mainApp').directive('multiParam', function() {
	return {
		require : "^form",
		restrict : 'E',
		scope : {
			inputTags : '=paramlist',
			autocomplete : '=autocomplete'
		},
		link : function($scope, element, attrs, formCtrl) {
			$scope.form = formCtrl;
			$scope.defaultWidth = 200;
			$scope.tagText = '';
			$scope.placeholder = attrs.placeholder;
			$scope.inputType = attrs.inputType;
			$scope.inputRequired = attrs.inputRequired;
			$scope.name = attrs.name;
			$scope.invalidInput = false;
			$scope.duplicateInput = false;
			$scope.emailPattern = "^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$";
			$scope.resetPlaceholder = angular.copy($scope.placeholder);
			$scope.inputColor = 'black';
			$scope.duplicateMap = {};
			if ($scope.autocomplete) {
				$scope.autocompleteFocus = function(event, ui) {
					$(element).find('input').val(ui.item.value);
					return false;
				};
				$scope.autocompleteSelect = function(event, ui) {
					$scope.$apply('tagText=\'' + ui.item.value + '\'');
					$scope.$apply('addTag()');
					return false;
				};
				$(element).find('input').autocomplete({
					minLength : 0,
					source : function(request, response) {
						var item;
						return response(function() {
							var i, len, ref, results;
							ref = $scope.autocomplete;
							results = [];
							for (i = 0, len = ref.length; i < len; i++) {
								if (window.CP.shouldStopExecution(1)) {
									break;
								}
								item = ref[i];
								if (item.toLowerCase().indexOf(request.term.toLowerCase()) !== -1) {
									results.push(item);
								}
							}
							window.CP.exitedLoop(1);
							return results;
						}());
					},
					focus : function(_this) {
						return function(event, ui) {
							return $scope.autocompleteFocus(event, ui);
						};
					}(this),
					select : function(_this) {
						return function(event, ui) {
							return $scope.autocompleteSelect(event, ui);
						};
					}(this)
				});
			}
			$scope.tagArray = function() {
				if (!$scope.tagText || $scope.tagText.length === 0) {
					$scope.invalidInput = false;
					$scope.duplicateInput = false;
				}
				if ($scope.inputTags === undefined) {
					$scope.inputWidth = '100%';
					return [];
				} else {
					if ($scope.inputTags.length > 0) {
						$scope.inputWidth = 200;
						$scope.placeholder = '';
						if (Object.keys($scope.duplicateMap).length == 0) {
							for (var i = 0; i < $scope.inputTags.length; i++) {
								$scope.duplicateMap[$scope.inputTags[i].value] = true;
							}
						}
					} else {
						$scope.inputWidth = '100%';
						$scope.placeholder = angular.copy($scope.resetPlaceholder);

					}
					return $scope.inputTags;
				}
			};
			$scope.addTag = function() {
				console.debug("Adding tag");
				var tagArray;
				if (!$scope.tagText || $scope.tagText.length === 0) {
					console.debug("Tag length = 0. Skip");
					return;
				}
				tagArray = $scope.tagArray();
				if ($scope.duplicateMap[$scope.tagText]) {
					$scope.duplicateInput = true;
					console.debug("Duplicate input!");
					return;
				} else {
					$scope.duplicateInput = false;
				}

				if ($scope.inputType === "Email") {
					if (!$scope.tagText.match($scope.emailPattern)) {
						$scope.invalidInput = true;
						console.debug("Invalid email");
						return;
					} else {
						$scope.invalidInput = false;
					}
				}

				if (isNaN($scope.tagText)) {
					if ($scope.inputType === "Number" || $scope.inputType === "Integer") {
						$scope.invalidInput = true;
						console.debug("Invalid number");
						return;
					}
				} else {
					if ($scope.inputType === "Integer") {
						if (Number($scope.tagText) % 1 != 0) {
							$scope.invalidInput = true;
							console.debug("Invalid integer");
							return;
						}
					}
				}

				tagArray.push({
					"value" : $scope.tagText
				});
				$scope.duplicateMap[$scope.tagText] = true;
				/* $scope.inputTags = tagArray.join(','); */
				$scope.inputColor = 'black';
				console.debug($scope.duplicateMap);
				return $scope.tagText = '';
			};
			$scope.deleteTag = function(key) {
				console.debug("Deleting tag");
				var tagArray;
				tagArray = $scope.tagArray();
				if (tagArray.length > 0 && $scope.tagText.length === 0 && key === undefined) {
					$scope.duplicateMap[tagArray[tagArray.length - 1].value] = false;
					tagArray.pop();
				} else {
					if (key !== undefined) {
						$scope.duplicateMap[tagArray[key].value] = false;
						tagArray.splice(key, 1);
					}
				}
				console.debug($scope.duplicateMap);
				return tagArray;
			};
			$scope.$watch('tagText', function(newVal, oldVal) {
				$scope.inputColor = "black";
				var tempEl;
				if (!(newVal === oldVal && newVal === undefined)) {
					tempEl = $('<span>' + newVal + '</span>').appendTo('body');
					$scope.inputWidth = tempEl.width() + 5;
					if ($scope.inputWidth < $scope.defaultWidth) {
						$scope.inputWidth = $scope.defaultWidth;
					}
					return tempEl.remove();
				}
			});
			element.bind('keydown', function(e) {
				var key;
				key = e.which;
				if (key === 9 || key === 13) {
					e.preventDefault();
				}
				if (key === 8) {
					return $scope.$apply('deleteTag()');
				}
			});
			return element.bind('keyup', function(e) {
				var key;
				key = e.which;
				if (key === 9 || key === 13) {
					e.preventDefault();
					return $scope.$apply('addTag()');
				}
			});
		},
		templateUrl : "ui/app/templates/multiParam.html",
	};
})