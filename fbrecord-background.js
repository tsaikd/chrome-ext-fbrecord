
var data = {
	usageBytes: 0
};

function updateStorageUsage(cb) {
	chrome.storage.sync.getBytesInUse(function(num) {
		data.usageBytes = num || 0;
		if (cb) {
			cb.apply(this, arguments);
		}
	});
}

function clearStorage(cb) {
	chrome.storage.sync.clear(function() {
		data.usageBytes = 0;
		if (cb) {
			cb.apply(this, arguments);
		}
	});
}
