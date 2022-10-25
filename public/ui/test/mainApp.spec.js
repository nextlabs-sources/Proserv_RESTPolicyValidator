describe("Testing appController", function() {

	var appController, configService, $scope;

	beforeEach(module('mainApp'));

	beforeEach(inject(function($injector) {
		configService = $injector.get('configService');
		configService.configObject['logLevel'] = 0;
	}));

	beforeEach(inject(function($rootScope, $controller) {
		$scope = $rootScope.$new();
		appController = $controller('appController', {
			$scope : $scope
		});
	}));

	it("should be initialized successfully with all config", function() {
		expect(window.MainAppConfig).toEqual(
				configService.configObject)
	});

});