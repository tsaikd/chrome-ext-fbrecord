
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

	$scope.manifest = chrome.runtime.getManifest();
	$scope.gdata = {};
	$scope.empty_gdata = {
		usageBytes: 0,
		cards: []
	};

	$scope.update = function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {get: "usage"}, function(response) {
				$scope.$apply(function() {
					$scope.gdata = response || $scope.empty_gdata;
				});
			});
		});
	};

	$scope.clear = function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {do: "clear"}, function(response) {
				$scope.$apply(function() {
					$scope.gdata = response || $scope.empty_gdata;
				});
			});
		});
	};

	$scope.sync = function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {do: "sync"}, function(response) {
				$scope.$apply(function() {
					$scope.gdata = response || $scope.empty_gdata;
				});
			});
		});
	};

	$scope.config = function() {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {do: "config", config: $scope.gdata.config}, function(response) {
				$scope.$apply(function() {
					$scope.gdata = response || $scope.empty_gdata;
				});
			});
		});
	};

	$scope.update();

}])

;
