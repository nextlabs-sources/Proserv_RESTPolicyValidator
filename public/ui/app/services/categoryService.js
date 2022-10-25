mainApp.factory('Category', ['$rootScope', '$filter', function($rootScope, $filter) {

	function Category(type, param) {

		if (type == "json") {
			this._parseJSON(param);
			return;
		}

		this.type = type;

		try {
			this._setVariables(type, param);
			this._setInitialAttributes(type, param);
		} catch (error) {
			throw error;
		}


	}

	Category.prototype._setVariables = function(type, param) {
		switch (type) {
			case "Subject":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_SUBJECT;
			this.attributeId = $rootScope.SUBJECT_ID;
			this.attributePrefix = $rootScope.ID_SUBJECT;
			this.refId = "subject";
			break;

			case "From Resource":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_RESOURCE;
			this.attributeId = $rootScope.RESOURCE_ID;
			this.attributePrefix = $rootScope.ID_RESOURCE;
			this.refId = "fromResource";
			break;

			case "To Resource":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_RESOURCE;
			this.attributeId = $rootScope.RESOURCE_ID;
			this.attributePrefix = $rootScope.ID_RESOURCE;
			this.refId = "toResource";
			break;

			case "Action":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_ACTION;
			this.attributeId = $rootScope.ACTION_ID;
			this.attributePrefix = $rootScope.ID_ACTION;
			this.refId = "action";
			break;

			case "Application":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_APPLICATION;
			this.attributeId = $rootScope.APPLICATION_ID;
			this.attributePrefix = $rootScope.ID_APPLICATION
			this.refId = "application";
			break;

			case "Recipient":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_RECIPIENT;
			if (param instanceof Array) {
				this.attributeId = $rootScope.RECIPIENT_EMAIL;
			} else {
				this.attributeId = $rootScope.RECIPIENT_ID;
			}
			this.attributePrefix = $rootScope.ID_RECIPIENT;
			this.refId = "recipient";
			break;

			case "Host":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_HOST;
			if (!param) {
				param = "localhost";
			}
			if (this._validateIPAddress(param)) {
				this.attributeId = $rootScope.HOST_INET_ADDRESS;
				param = this._convertIPAddress(param).toString();
			} else {
				this.attributeId = $rootScope.HOST_NAME;
			}
			this.attributePrefix = $rootScope.ID_HOST;
			this.refId = "host"
			break;

			case "Environment":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_ENVIRONMENT;
			this.attributePrefix = $rootScope.ID_ENVIRONMENT;
			this.refId = "environment";
			break;

			case "NamedAttribute":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_NAMED_ATTRIBUTE + param;
			this.attributePrefix = this.categoryId;
			this.refId = "namedAttribute";
			this.namedAttributeName = param;
			break;

			case "DiscretionaryPolicies":
			this.categoryId = $rootScope.ID_ATTRIBUTE_CATEGORY_POD;
			this.attributeId = $rootScope.POD_ID;
			this.attributePrefix = $rootScope.ID_POD;
			this.refId = "pod";
			break;

			default :
			throw Error("Invalid category type: " + type);
		}
	}

	Category.prototype._setInitialAttributes = function(type, param) {
		this.attributes = [];

		if (type != "Environment" && type != "NamedAttribute") {
			var identifiedAttribute = {
				dataType: "string",
				attributeId: this.attributeId,
				value: param,
				valueType: "single"
			}

			this.attributes.push(identifiedAttribute);
		}

		if (type == "From Resource") {
			var resourceType = {
				dataType: "string",
				attributeId: "resource-type",
				value: "",
				valueType: "single"

			}
			this.attributes.push(resourceType);

			var resourceDimension = {
				dataType: "string",
				attributeId: "resource-dimension",
				value: "from",
				valueType: "single"
			}

			this.attributes.push(resourceDimension);

			var cache = {
				dataType: "string",
				attributeId: "nocache",
				value: "yes",
				valueType: "single"
			}

			this.attributes.push(cache);
		}

		if (type == "To Resource") {
			var resourceType = {
				dataType: "string",
				attributeId: "resource-type",
				value: "",
				valueType: "single"

			}
			this.attributes.push(resourceType);

			var resourceDimension = {
				dataType: "string",
				attributeId: "resource-dimension",
				value: "to",
				valueType: "single"
			}

			this.attributes.push(resourceDimension);

			var cache = {
				dataType: "string",
				attributeId: "nocache",
				value: "yes",
				valueType: "single"
			}

			this.attributes.push(cache);
		}

		if (type === "DiscretionaryPolicies") {
			var policyIgnore = {
				dataType: "string",
				attributeId: "pod-ignore-built-in",
				value: "false",
				valueType: "single"
			}

			this.attributes.push(policyIgnore);
		}
	}

	Category.prototype.recheckHost = function() {
		if (!this.attributes[0].value) {
			this.attributes[0].value = "localhost";
		}

		if (this._validateIPAddress(this.attributes[0].value)) {
			this.attributeId = $rootScope.HOST_INET_ADDRESS;
			this.attributes[0].attributeId = this.attributeId;
			this.attributes[0].value = this._convertIPAddress(this.attributes[0].value).toString();
		} else {
			this.attributeId = $rootScope.HOST_NAME;
			this.attributes[0].attributeId = this.attributeId;
		}

	}

	Category.prototype._validateIPAddress = function(ipAddress) {
		if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
			return true;
		} else {
			return false;
		}
	}

	Category.prototype._convertIPAddress = function(ipAddress) {
		var ipAddressInArray = ipAddress.split(".");
		var result = 0;
		for (var i = 0; i < ipAddressInArray.length; i++) {
			var power = 3 - i;
			var ip = parseInt(ipAddressInArray[i]);
			result += ip * Math.pow(256, power);
		}
		return result;
	}

	Category.prototype.getType = function() {
		return this.type;
	}

	Category.prototype.addAttribute = function(key, value, valueType) {
		if (!this.attributes) {
			this.attributes = [];
		}
		var newAttribute = {
			dataType: "string",
			attributeId: key,
			value: value,
			valueType: valueType

		}
		this.attributes.push(newAttribute);
	}

	Category.prototype.removeAttribute = function(index) {
		if (index > -1) {
			this.attributes.splice(index, 1);
		}
	}

	Category.prototype.toXACMLJSON = function(index) {
		var _this = this;

		var jsonObject = {
			"CategoryId": this.categoryId,
			"Attribute":[]
		}

		if (index) {
			jsonObject.Id = this.refId + index;
		}

		if (this.attributes) {
			this.attributes.forEach(function(attribute, index) {

				var attributeId;

				if (attribute.attributeId == "resource-type") {
					attributeId = $rootScope.ID_RESOURCE_RESOURCE_TYPE;
				} else if (attribute.attributeId == "resource-dimension") {
					attributeId = $rootScope.ID_RESOURCE_RESOURCE_DIMENSION;
				} else {
					attributeId = $rootScope.resolveURI(_this.attributePrefix, attribute.attributeId);
				}

				if (!attribute.value) {
					attribute.value = "";
				}

				jsonObject.Attribute.push({
					"DataType": $rootScope.DATA_TYPE_SCHEMA + attribute.dataType,
					"AttributeId": attributeId,
					"Value": attribute.value,
					"IncludeInResult": false,
					"Issuer" : ""
				});
			});
		}

		return jsonObject;
	}

	Category.prototype.toXACMLJSONIgnoreError = function(index) {
		var _this = this;

		var jsonObject = {
			"CategoryId": this.categoryId,
			"Attribute":[]
		}

		if (index) {
			jsonObject.Id = this.refId + index;
		}

		if (this.attributes) {
			this.attributes.forEach(function(attribute, index) {

				var attributeId;

				if (attribute.attributeId == "resource-type") {
					attributeId = $rootScope.ID_RESOURCE_RESOURCE_TYPE;
				} else if (attribute.attributeId == "resource-dimension") {
					attributeId = $rootScope.ID_RESOURCE_RESOURCE_DIMENSION;
				} else {
					attributeId = $rootScope.resolveURI(_this.attributePrefix, attribute.attributeId);
				}

				if (!attribute.value) {
					attribute.value = "";
				}

				jsonObject.Attribute.push({
					"DataType": $rootScope.DATA_TYPE_SCHEMA + attribute.dataType,
					"AttributeId": attributeId,
					"Value": attribute.value,
					"IncludeInResult": false,
					"Issuer" : ""
				});
			});
		}

		return jsonObject;
	}

	Category.prototype.validateToXACMLJSON = function() {
		var _this = this;
	}

	Category.prototype._parseJSON =  function(jsonObject) {

		if (jsonObject.CategoryId) {
			var subStrings = jsonObject.CategoryId.split(":");
			var jCategoryType = subStrings[subStrings.length - 1];
			if (jCategoryType) {

				// process the CategoryId to get the category type
				if (jCategoryType.split("-").length ==2 && jCategoryType.split("-")[0] === "environment") {
					this.type = "NamedAttribute";
					this.categoryId = jsonObject.CategoryId;
					this.attributePrefix = this.categoryId;
					this.refId = "namedAttribute";
				} else {
					if (!$rootScope.CATEGORY_TYPE[jCategoryType]) {
						throw new Error("Category is unrecognizable: " + jCategoryType);
					} else {
						if (jCategoryType === "resource") {
							if (jsonObject.Attribute && jsonObject.Attribute.length >= 4) {
								//check for compulsory attributes
                
								if (jsonObject.Attribute[0].AttributeId != $rootScope.ID_RESOURCE_RESOURCE_ID) {
									throw new Error("Invalid resource: Attribute at index 0 must be resource-id");
								}
								if (jsonObject.Attribute[1].AttributeId != $rootScope.ID_RESOURCE_RESOURCE_TYPE) {
									throw new Error("Invalid resource: Attribute at index 1 must be resource-type");
								}

								if (jsonObject.Attribute[2].AttributeId != $rootScope.ID_RESOURCE_RESOURCE_DIMENSION) {
									throw new Error("Invalid resource: Attribute at index 2 must be resource-dimension");
								}

								if (jsonObject.Attribute[3].AttributeId != $rootScope.resolveURI($rootScope.ID_RESOURCE, "nocache")) {
									throw new Error("Invalid resource: Attribute at index 3 must be nocache");
								}


								if (jsonObject.Attribute[2].Value === "from") {
									this.type = "From Resource";
								} else if (jsonObject.Attribute[2].Value ==="to") {
									this.type = "To Resource";
								} else {
									throw new Error("Invalid resource: Cannot find attribute for resource dimension");
								}
							} else {
								throw new Error("Invalid resource: One ore more attributes among (ID, type, dimession, nocache) missed");
							}
						} else {
							this.type = $rootScope.CATEGORY_TYPE[jCategoryType];
						}

						//setting all fixed variables based on the category type
						this._setVariables(this.type);
					}
				}

				if (!jsonObject.Attribute || jsonObject.Attribute.length == 0) {
					if (this.type != "Environment" && this.type != "NamedAttribute") {
						this._setInitialAttributes(this.type, "");
					}
				} else {
					this.attributes = [];
					var _this = this;
					jsonObject.Attribute.forEach(function(attribute) {
						if (!attribute.AttributeId) {
							throw new Error("Invalid attribute in the JSON object: No Attribute ID found");
						}

						if (attribute.AttributeId != $rootScope.ID_RESOURCE_RESOURCE_TYPE &&
							attribute.AttributeId !=$rootScope.ID_RESOURCE_RESOURCE_DIMENSION) {

							var temp = attribute.AttributeId.replace(_this.attributePrefix + ":", "");
						}

						if (!attribute.Value) {
							attribute.Value = "";
						}
						var temp = attribute.AttributeId
            .replace("urn:oasis:names:tc:xacml:1.0:resource:", "")
            .replace("urn:oasis:names:tc:xacml:2.0:resource:", "")
            .replace("urn:oasis:names:tc:xacml:3.0:resource:", "")
            .replace("urn:oasis:names:tc:xacml:1.0:subject:", "")
            .replace("urn:oasis:names:tc:xacml:2.0:subject:", "")
            .replace("urn:oasis:names:tc:xacml:3.0:subject:", "")
            .replace("urn:oasis:names:tc:xacml:1.0:action:", "")
            .replace("urn:oasis:names:tc:xacml:2.0:action:", "")
            .replace("urn:oasis:names:tc:xacml:3.0:action:", "")
            .replace("urn:nextlabs:names:evalsvc:1.0:host:", "")
            .replace("urn:nextlabs:names:evalsvc:1.0:application:", "")
            .replace("urn:nextlabs:names:evalsvc:1.0:resource:", "");
						var attributeKey = temp;
						if (attribute.Value instanceof Array) {
							_this.addAttribute(attributeKey, attribute.Value, "multi");
						} else {
							_this.addAttribute(attributeKey, attribute.Value, "single");
						}
					})
				}
			}
		} else {
			throw new Error("Invalid JSON object: No Category ID");
		}
	}

	return Category;

}]);
