/*
 * This is a service for general functions
 */

mainApp.factory('generalService', ['configService', function(configService) {

	var booleanValues = [true, false];

	var contains = function(needle) {
		// Per spec, the way to identify NaN is that it
		// is not equal to itself
		var findNaN = needle !== needle;
		var indexOf;

		if (!findNaN && typeof Array.prototype.indexOf === 'function') {
			indexOf = Array.prototype.indexOf;
		} else {
			indexOf = function(needle) {
				var i = -1, index = -1;

				for (i = 0; i < this.length; i++) {
					var item = this[i];

					if ((findNaN && item !== item) || item === needle) {
						index = i;
						break;
					}
				}

				return index;
			};
		}

		return indexOf.call(this, needle) > -1;
	};

	var containsObject = function(list, obj) {
		var i;
		for (i = 0; i < list.length; i++) {
			loggerService.getLogger().debug("List Object Id is = " + list[i].id);
			if (list[i].id == obj.id) {
				return true;
			}
		}

		return false;
	}

	var isSubFolder = function(sub, parent) {
		return sub.lastIndexOf(parent, 0) === 0;
	}

	var stringStartWith = function(string, text) {
		return string.lastIndexOf(text, 0) === 0;
	}


	return {
		contains : contains,
		containsObject : containsObject,
		isSubFolder : isSubFolder,
		getBooleanValuesArray : getBooleanValuesArray,
		stringStartWith : stringStartWith
	}
}]);