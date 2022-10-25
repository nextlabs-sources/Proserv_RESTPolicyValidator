/*
 * This is a service for sharing data between controllers
 */

mainApp.factory('sharedService', function() {
	var sharedService = {};
	sharedService.data = {};
	return sharedService;
});