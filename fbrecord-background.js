
var gdata = {
	usageBytes: 0
};

function updateStorageUsage(cb) {
	chrome.storage.sync.getBytesInUse(function(num) {
		gdata.usageBytes = num || 0;
		if (cb) {
			cb.apply(this, arguments);
		}
	});
}

function clearStorage(cb) {
	chrome.storage.sync.clear(function() {
		gdata.usageBytes = 0;
		if (cb) {
			cb.apply(this, arguments);
		}
	});
}
