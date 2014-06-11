
angular.module("fbrecord-popup", [])

.filter('bytes', function() {
	return function(bytes, precision) {
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		if (typeof precision === 'undefined') precision = 1;
		if (!bytes) return '0 byte';
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
	}
})

.controller("PopupCtrl"
	, [       "$scope"
	, function($scope) {

	var bgpage = chrome.extension.getBackgroundPage();
	$scope.data = bgpage.gdata;

	$scope.update = function() {
		bgpage.updateStorageUsage(function() {
			$scope.$digest();
		});
	};

	$scope.clear = function() {
		bgpage.clearStorage(function() {
			$scope.$digest();
		});
	};

	$scope.update();

}])

;
