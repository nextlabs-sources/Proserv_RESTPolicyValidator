mainApp.factory('overviewServices', ['networkService', 'loggerService', 'configService', '$filter', 'statusCodeService', 'evaluateService',
	function(networkService, loggerService, configService, $filter, statusCodeService, evaluateService) {

		var dummyRequest = {"Request": {
			"ReturnPolicyIdList": "true",
			"Category": [
			{
				"CategoryId": "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject",
				"Attribute": [
				{
					"AttributeId": "urn:oasis:names:tc:xacml:1.0:subject:subject-id",
					"Value": "TestUser",
					"IncludeInResult": "false"
				}
				]
			},
			{
				"CategoryId": "urn:oasis:names:tc:xacml:3.0:attribute-category:resource",
				"Attribute": [
				{
					"DataType": "http://www.w3.org/2001/XMLSchema#anyURI",
					"AttributeId": "urn:oasis:names:tc:xacml:1.0:resource:resource-id",
					"Value": "ValidateConnectionResource",
					"IncludeInResult": "false"
				},
				{
					"DataType": "http://www.w3.org/2001/XMLSchema#string",
					"AttributeId": "urn:nextlabs:names:evalsvc:1.0:resource:resource-type",
					"Value": "fso",
					"IncludeInResult": false,
					"Issuer": ""
				}
				]

			},
			{
				"CategoryId": "urn:oasis:names:tc:xacml:3.0:attribute-category:action",
				"Attribute": [
				{
					"DataType": "http://www.w3.org/2001/XMLSchema#string",
					"AttributeId": "urn:oasis:names:tc:xacml:1.0:action:action-id",
					"Value": "TEST",
					"IncludeInResult": "false"
				}
				]
			},
			{
				"CategoryId": "urn:nextlabs:names:evalsvc:1.0:attribute-category:application",
				"Attribute": [
				{
					"DataType": "http://www.w3.org/2001/XMLSchema#string",
					"AttributeId": "urn:nextlabs:names:evalsvc:1.0:application:application-id",
					"Value": "restvalidator",
					"IncludeInResult": "false"
				}
				]
			}
			]
		}}

		var getConfiguration = function(callback) {
			networkService.get(configService.getUrl("configuration.get"), function(data) {
					statusCodeService.get("Configuration", callback, data);
				});
		}

		var getConfigurationDeferred = function(callback) {
			return networkService.get(configService.getUrl("configurations.get"), null, true);
		}

		var getResourceAttributes = function(callback) {
			networkService.get(configService.getUrl("configuration.rattrib.get"), function(data) {
					statusCodeService.get("Configuration", callback, data);
				});
		}

		var getSubjectAttributes = function(callback) {
			networkService.get(configService.getUrl("configuration.sattrib.get"), function(data) {
					statusCodeService.get("Configuration", callback, data);
				});
		}

		var updateConfiguration = function(options, callback) {

			networkService.put(configService.getUrl("configuration.update"),
				{options: options}, function(data) {
					statusCodeService.modify("Configuration", callback, data);
				});
		}

		var updateConfigurationDeferred = function(options) {
			return networkService.put(configService.getUrl("configuration.update"), {options: options}, null, true);
		}

		var updateResourceAttributes = function(options, callback) {
			networkService.put(configService.getUrl("configuration.rattrib.update"),
				{options: options}, function(data) {
					statusCodeService.modify("Configuration", callback, data);
				});
		}

		var updateSubjectAttributes = function(options, callback) {
			networkService.put(configService.getUrl("configuration.sattrib.update"),
				{options: options}, function(data) {
					statusCodeService.modify("Configuration", callback, data);
				});
		}

		var testConfiguration = function(options, callback) {
			networkService.put(configService.getUrl("configuration.test"), {options: options, dummyRequest: dummyRequest},
				function(data) {
					statusCodeService.evaluate("Configuration", callback, data);
				});
		}

		var changeActiveConfiguration = function(index, callback) {
			networkService.put(configService.getUrl("configuration.changeActiveConfiguration"), {index: index}, function(data) {
				statusCodeService.modify("Configuration", callback, data);
			});
		}

		var getUsername = function (callback) {
			networkService.get(configService.getUrl("username.get"), function (data) {
				callback(data);
			});
		}

		return {
			getConfiguration: getConfiguration,
			getConfigurationDeferred: getConfigurationDeferred,
			updateConfiguration: updateConfiguration,
			updateConfigurationDeferred: updateConfigurationDeferred,
			testConfiguration: testConfiguration,
			changeActiveConfiguration: changeActiveConfiguration,
			updateResourceAttributes: updateResourceAttributes,
			updateSubjectAttributes: updateSubjectAttributes,
			getResourceAttributes: getResourceAttributes,
			getSubjectAttributes: getSubjectAttributes,
			getUsername: getUsername
		}

	}]);
