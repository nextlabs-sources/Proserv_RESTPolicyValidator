var mainApp = angular.module('mainApp', ['ui.router', 'ui.bootstrap', 'uiSwitch', 'ngSanitize', 'pascalprecht.translate',
/* <% templates-main %> */'ngAnimate', 'ngMessages', 'ngMaterial', 'ui.utils.masks', 'ui.layout', 'ng.jsoneditor']);

mainApp.run(function($rootScope, $templateCache) {
	$rootScope.$on('$viewContentLoaded', function() {
		$templateCache.remove("ui/app/TestSet/testSet.html");
		$templateCache.remove("ui/app/TestCase/testCase.html");
		$templateCache.remove("ui/app/Error/error.html");
		$templateCache.remove("ui/app/Error/overview.html");
	});

	$rootScope.resolveURI = function() {
		var uri = "";

		for (var i = 0; i < arguments.length; i++) {
			uri += arguments[i];
			if (i != arguments.length - 1) {
				uri += ":";
			}
		}

		return uri;
	}

	$rootScope.URN_NEXTLABS = "urn:nextlabs:names:evalsvc:1.0";
	$rootScope.URN_XACML = "urn:oasis:names:tc:xacml";
	$rootScope.DATA_TYPE_SCHEMA = "http://www.w3.org/2001/XMLSchema#";

	$rootScope.ID_ATTRIBUTE_CATEGORY_SUBJECT = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "subject-category", "access-subject");
	$rootScope.ID_ATTRIBUTE_CATEGORY_RESOURCE = $rootScope.resolveURI($rootScope.URN_XACML, "3.0", "attribute-category", "resource");
	$rootScope.ID_ATTRIBUTE_CATEGORY_ACTION = $rootScope.resolveURI($rootScope.URN_XACML, "3.0", "attribute-category", "action");
	$rootScope.ID_ATTRIBUTE_CATEGORY_ENVIRONMENT = $rootScope.resolveURI($rootScope.URN_XACML, "3.0", "attribute-category", "environment");
	$rootScope.ID_ATTRIBUTE_CATEGORY_APPLICATION = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "attribute-category", "application");
	$rootScope.ID_ATTRIBUTE_CATEGORY_POD = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "attribute-category", "pod");
	$rootScope.ID_ATTRIBUTE_CATEGORY_HOST = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "attribute-category", "host");
	$rootScope.ID_ATTRIBUTE_CATEGORY_NAMED_ATTRIBUTE = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "attribute-category", "environment-");
	$rootScope.ID_ATTRIBUTE_CATEGORY_RECIPIENT = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "subject-category", "recipient-subject");


	$rootScope.CATEGORY_TYPE = {};
	$rootScope.CATEGORY_TYPE["access-subject"] = "Subject";
	$rootScope.CATEGORY_TYPE["resource"] = "From Resource";
	$rootScope.CATEGORY_TYPE["action"] = "Action";
	$rootScope.CATEGORY_TYPE["environment"] = "Environment";
	$rootScope.CATEGORY_TYPE["application"] = "Application";
	$rootScope.CATEGORY_TYPE["pod"] = "DiscretionaryPolicies";
	$rootScope.CATEGORY_TYPE["recipient-subject"] = "Recipient";
	$rootScope.CATEGORY_TYPE["host"] = "Host";
	$rootScope.CATEGORY_TYPE["environment-"] = "NamedAttribute";

	$rootScope.ID_SUBJECT = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "subject");
	$rootScope.ID_SUBJECT_SUBJECT_ID = $rootScope.resolveURI($rootScope.ID_SUBJECT, "subject-id");

	$rootScope.ID_ACTION = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "action");
	$rootScope.ID_ACTION_ACTION_ID = $rootScope.resolveURI($rootScope.ID_ACTION, "action-id");

	$rootScope.ID_RESOURCE = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "resource");
	$rootScope.ID_RESOURCE_RESOURCE_ID = $rootScope.resolveURI($rootScope.ID_RESOURCE, "resource-id");
	$rootScope.ID_RESOURCE_RESOURCE_TYPE = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "resource", "resource-type");
	$rootScope.ID_RESOURCE_RESOURCE_DIMENSION = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "resource", "resource-dimension");

	$rootScope.ID_APPLICATION = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "application");
	$rootScope.ID_APPLICATION_APPLICATION_ID = $rootScope.resolveURI($rootScope.ID_APPLICATION, "application-id");

	$rootScope.ID_POD = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "pod");
	$rootScope.ID_POD_POD_ID = $rootScope.resolveURI($rootScope.ID_POD, "pod-id");
	$rootScope.ID_POD_IGNORE_BUILT_IN = $rootScope.resolveURI($rootScope.ID_POD, "pod-ignore-built-in");

	$rootScope.ID_RECIPIENT = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "recipient");
	$rootScope.ID_RECIPIENT_RECIPIENT_EMAIL = $rootScope.resolveURI($rootScope.ID_RECIPIENT, "email");
	$rootScope.ID_RECIPIENT_RECIPIENT_ID = $rootScope.resolveURI($rootScope.ID_RECIPIENT, "id");

	$rootScope.ID_HOST = $rootScope.resolveURI($rootScope.URN_NEXTLABS, "host");
	$rootScope.ID_HOST_HOST_NAME = $rootScope.resolveURI($rootScope.ID_HOST, "name");
	$rootScope.ID_HOST_HOST_INET_ADDRESS = $rootScope.resolveURI($rootScope.ID_HOST, "inet_address");

	$rootScope.ID_ENVIRONMENT = $rootScope.resolveURI($rootScope.URN_XACML, "1.0", "environment");

	$rootScope.SUBJECT_ID = "subject-id";
	$rootScope.RESOURCE_ID = "resource-id";
	$rootScope.ACTION_ID = "action-id";
	$rootScope.APPLICATION_ID = "application-id";
	$rootScope.POD_ID = "pod-id";
	$rootScope.RECIPIENT_ID = "id";
	$rootScope.RECIPIENT_EMAIL = "email";
	$rootScope.HOST_NAME ="name";
	$rootScope.HOST_INET_ADDRESS = "inet_address";

	$rootScope.subjectAttributes = [];
	$rootScope.resourceAttributes = [];

	//add support for endsWith in IE
	if (!String.prototype.endsWith) {
		String.prototype.endsWith = function(searchString, position) {
			var subjectString = this.toString();
			if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
				position = subjectString.length;
			}
			position -= searchString.length;
			var lastIndex = subjectString.lastIndexOf(searchString, position);
			return lastIndex !== -1 && lastIndex === position;
		};
	}

});

mainApp.config(['$stateProvider', '$urlRouterProvider', '$translateProvider', '$mdThemingProvider', '$compileProvider', '$httpProvider',
		function($stateProvider, $urlRouterProvider, $translateProvider, $mdThemingProvider, $compileProvider, $httpProvider) {

			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|data):/);

			$urlRouterProvider.otherwise('/Home');

			$mdThemingProvider.theme('default').primaryPalette('grey').accentPalette('orange');

			// remove the trailing slash at the end of the url if exists
			$urlRouterProvider.rule(function($injector, $location) {

				var path = $location.path();
				var hasTrailingSlash = path[path.length - 1] === '/';

				if (hasTrailingSlash) {

					// if last charcter is a slash, return the same url
					// without the slash
					var newPath = path.substr(0, path.length - 1);
					return newPath;
				}

			});

			$stateProvider.state('Settings', {
				url : '/Settings',
				templateUrl : 'ui/app/Overview/overview.html',
				controller : 'overviewController'
			}).state('TestSet', {
				url : '/TestSet/{id}',
				templateUrl : 'ui/app/TestSet/testSet.html',
				controller : 'testSetController',
			}).state('TestCase', {
				url : '/TestCase/{testSet}/{id}',
				templateUrl : 'ui/app/TestCase/testCase.html',
				controller : 'testCaseController'
			}).state('Error', {
				url : '/Error',
				templateUrl : 'ui/app/Error/error.html',
				controller : 'errorController'
			}).state('Home', {
				url : '/Home',
				templateUrl : 'ui/app/Home/home.html',
				controller : 'homeController'
			})

			$translateProvider.useStaticFilesLoader({
				prefix : 'ui/app/i18n/',
				suffix : '.json'
			});
			$translateProvider.preferredLanguage('en');
			// Enable escaping of HTML
			$translateProvider.useSanitizeValueStrategy('escape');

			$httpProvider.defaults.cache = false;
			if (!$httpProvider.defaults.headers.get) {
				$httpProvider.defaults.headers.get = {};
			}

    		// disable IE ajax request caching
    		$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

		}]);

mainApp.filter('num', function() {
	return function(input) {
		return parseInt(input, 10);
	}
});

mainApp.filter('insensitiveExactMatch', function() {
    return function(input, prop, value) {
    	console.log(input);
    	console.log(prop);
    	console.log(value);
        var retValue = [];
        input.forEach(function(item) {
            if(item[prop] && item[prop].toLowerCase() === value.toLowerCase()) {
                 retValue.push(item);
            }
        });
        return retValue;
    };
});
