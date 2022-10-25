mainApp.factory('toastService', ['$mdToast', function($mdToast) {

	var last = {
      	bottom: true,
     	top: false,
      	left: false,
      	right: true
    };

  	var toastPosition = angular.extend({},last);

  	var getToastPosition = function() {
    	sanitizePosition();

    	return Object.keys(toastPosition)
      		.filter(function(pos) { return toastPosition[pos]; })
      		.join(' ');
  	};

  	function sanitizePosition() {
	    var current = toastPosition;
    	if ( current.bottom && last.top ) current.top = false;
    	if ( current.top && last.bottom ) current.bottom = false;
    	if ( current.right && last.left ) current.left = false;
    	if ( current.left && last.right ) current.right = false;

	    last = angular.extend({},current);
  	}

	var notify = function(parameter) {
		var type = parameter.type;
		var msg = parameter.msg;
		var delay = parameter.delay;
		setTimeout(function () {
			$mdToast.show({
        	position: getToastPosition(),
			hideDelay: delay,
			templateUrl: "ui/app/templates/toast.html",
			controller : ['$scope', '$mdToast', function($scope, $mdToast) {
				$scope.toastType = type;
				$scope.toastText = msg;	
				$scope.closeToast = function() {
        			$mdToast.hide();
			    };
			}]});
		}, 150);
	}

	return {
		notify : notify
	}
}]);