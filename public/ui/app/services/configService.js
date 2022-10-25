/*
	This is a shared service for app level config settings
 */
mainApp.factory('configService', ['networkService', '$location', '$filter', function(networkService, $location, $filter) {
	this.configObject = {};
	var configCallback = function(data) {
		this.configObject = (data) ? data : {};
	}

	var getConfig = function() {
		networkService.get("../config/config.json", configCallBack);
	}

	var setConfig = function(obj) {
		this.configObject = obj;
		if (!obj.isOnline) {
			networkService.onlyGet(true);
		}
	}
	var getUrl = function(key) {
		var urlConfig = this.configObject.isOnline ? this.configObject.url['online'] : this.configObject.url['offline'];

		var baseUrl = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/" + urlConfig.projectName + "/";

		return baseUrl + urlConfig.map[key];
	}

	var getSortOrders = function() {
		var orders = [{
			label : $filter('translate')("sort.order.asc"),
			value : "asc"
		}, {
			label : $filter('translate')("sort.order.desc"),
			value : "desc"
		}]
		return orders;
	}

	return {
		configObject : this.configObject,
		getConfig : getConfig,
		setConfig : setConfig,
		getUrl : getUrl,
		getSortOrders : getSortOrders
	}
}]);