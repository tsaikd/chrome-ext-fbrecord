
var _gaq = _gaq || [];
_gaq.push(["_setAccount", "UA-151772-9"]);
_gaq.push(["_trackPageview"]);

(function() {

	get(chrome.extension.getURL("ga.js"), execute);

	function execute(code) {
		try {
			window.eval(code);
		} catch(e) {
			console.error(e);
		}
	}

	function get(url, callback) {
		var x = new XMLHttpRequest();
		x.onload = x.onerror = function() {
			callback(x.responseText);
		};
		x.open("GET", url);
		x.send();
	}

})();
