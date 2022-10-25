mainApp.factory('testSetServices', ['networkService', 'loggerService', 'configService', '$filter', 'statusCodeService',
	function(networkService, loggerService, configService, $filter, statusCodeService) {

		var createTestSet = function(name, callback) {
			networkService.put(configService.getUrl("testSet.create"), {name: name}, function(data) {
				statusCodeService.create("TestSet", callback, data);
			});
		}

		var listTestSet =  function(callback) {
			networkService.get(configService.getUrl("testSet.list"), function(data) {
				statusCodeService.list("TestSet", callback, data);
			});
		}

		var getTestSet = function(name, callback) {
			networkService.get(configService.getUrl("testSet.get") + encodeURIComponent(name), function(data) {
				statusCodeService.get("TestSet", callback, data);
			});
		}

		var deleteTestSet = function(testSets, callback) {
			networkService.delWithData(configService.getUrl("testSet.delete"), {testSets:testSets}, function(data) {
				statusCodeService.del("TestSet", callback, data);
			},"application/json;charset=utf-8");
		}

		var cloneSingle = function(oldName, newName, callback) {
			networkService.put(configService.getUrl("testSet.cloneSingle"), {oldName: oldName, newName: newName}, function(data) {
				statusCodeService.create("TestSet", callback, data);
			});
		}

		var renameTestSet = function(oldName, newName, callback) {
			networkService.put(configService.getUrl("testSet.renameTestSet"), {oldName: oldName, newName: newName}, function(data) {
				statusCodeService.modify("TestSet", callback, data);
			});
		}

		var cloneMany = function(testSets, callback) {
			networkService.put(configService.getUrl("testSet.cloneMany"), {testSets: testSets}, function(data) {
				statusCodeService.create("TestSet", callback, data);
			});
		}

		return {
			createTestSet: createTestSet,
			listTestSet: listTestSet,
			getTestSet: getTestSet,
			deleteTestSet: deleteTestSet,
			cloneSingle: cloneSingle,
			renameTestSet: renameTestSet,
			cloneMany: cloneMany
		}

	}]);