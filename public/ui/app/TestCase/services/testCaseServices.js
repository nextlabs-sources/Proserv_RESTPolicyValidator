mainApp.factory('testCaseServices', ['networkService', 'loggerService', 'configService', '$filter', 'statusCodeService',
	function(networkService, loggerService, configService, $filter, statusCodeService) {

		var createTestCase = function(testCaseName, testSet, request, expectedResult, callback) {
			networkService.put(configService.getUrl("testCase.create"), 
				{testCaseName: testCaseName, testSet: testSet, request: request, expectedResult: expectedResult}, function(data) {
					statusCodeService.create("TestCase", callback, data);
				});
		}

		var saveTestCase = function(testCaseName, testSet, request, expectedResult, description, callback) {
			networkService.put(configService.getUrl("testCase.save"), 
				{testCaseName: testCaseName, testSet: testSet, request: request, expectedResult: expectedResult, description: description}, function(data) {
					statusCodeService.modify("TestCase", callback, data);
				});
		}

		var listTestCase =  function(testSet, callback) {
			networkService.get(configService.getUrl("testCase.list") +  encodeURIComponent(testSet), function(data) {
				statusCodeService.list("TestCase", callback, data);
			});
		}

		var getTestCase = function(testCaseName, testSet, callback) {
			networkService.get(configService.getUrl("testCase.get") +  encodeURIComponent(testSet) + "/" +  encodeURIComponent(testCaseName), function(data) {
				statusCodeService.get("TestCase", callback, data);
			});
		}

		var deleteTestCase = function(testCases, testSet, callback) {
			networkService.delWithData(configService.getUrl("testCase.delete") + encodeURIComponent(testSet), {testCases: testCases}, function(data) {
				statusCodeService.del("TestCase", callback, data);
			}, "application/json;charset=utf-8");
		}

		var cloneSingle = function(oldName, newName, testSet, callback) {
			networkService.put(configService.getUrl("testCase.cloneSingle"), {oldName: oldName, newName: newName, testSet: testSet}, function(data) {
				statusCodeService.create("TestCase", callback, data);
			});
		}

		var cloneMany = function(testSet, testCases, callback) {
			networkService.put(configService.getUrl("testCase.cloneMany"), {testSet: testSet, testCases: testCases}, function(data) {
				statusCodeService.create("TestCase", callback, data);
			});
		}

		var renameTestCase = function(oldName, newName, testSet, callback) {
			networkService.put(configService.getUrl("testCase.renameTestCase"), {oldName: oldName, newName: newName, testSet: testSet}, function(data) {
				statusCodeService.modify("TestCase", callback, data);
			});
		}
		return {
			createTestCase: createTestCase,
			listTestCase: listTestCase,
			getTestCase: getTestCase,
			deleteTestCase: deleteTestCase,
			saveTestCase: saveTestCase,
			cloneSingle: cloneSingle,
			cloneMany: cloneMany,
			renameTestCase: renameTestCase
		}

	}]);