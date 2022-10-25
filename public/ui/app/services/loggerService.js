/*
	This is a shared service for app level logging
 */
mainApp.factory('loggerService', ['configService', function(configService) {
	var log = function(data, level) {
		if (configService.configObject && (level <= configService.configObject['logLevel'])) {
			loggerService.getLogger().log(data);
		}
	}
	var _console = null;
	var getLogger = function() {
		if (!_console) {
			var _tempConsole = {
				log : function() {

				}
			}
			_console = (configService.configObject && (1 <= configService.configObject['logLevel'])) ? window.console : _tempConsole;
		}
		// add check for log level
		// window.loggerService.getLogger().log(configService.configObject);
		return _console;
	}
	return {
		log : log,
		getLogger : getLogger
	}
}]);