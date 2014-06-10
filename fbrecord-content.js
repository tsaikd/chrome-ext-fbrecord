
(function($) {
	var $body = $("body");

	setInterval(function() {
		$body.find("div[data-cursor]:not([fbrecord-init])").each(function() {
			var $t = $(this);
			$t.attr("fbrecord-init", "1");
			var permalink = $t.find("a[href] > abbr[title]:first").parent().attr("href");
			$t.attr("fbrecord-permalink", permalink);
			var key = "fbrecord-read-permalink-" + permalink;
			chrome.storage.sync.get(key, function(data) {
				if (data[key]) {
					$t.addClass("fbrecord-read fbrecord-folded");
				}
			});

			$t.find(".userContent:empty").each(function() {
				if ($(this).index() === 1) {
					$(this).prev().addClass("fbrecord-folded-moveup");
				}
			});
		});
	}, 1000);

	$body
	.on("mouseenter", "div[fbrecord-init][fbrecord-permalink]:not(.fbrecord-read)", function() {
		var $t = $(this);
		$t.addClass("fbrecord-read");
	})
	.on("mouseleave", "div.fbrecord-read[fbrecord-init][fbrecord-permalink]", function(e) {
		var $t = $(this);
		var permalink = $t.attr("fbrecord-permalink");
		var key = "fbrecord-read-permalink-" + permalink;
		if (e.shiftKey) {
			$t.removeClass("fbrecord-read fbrecord-folded");
			chrome.storage.sync.remove(key);
		} else {
			$t.addClass("fbrecord-folded");
			var data = {};
			data[key] = new Date().getTime();
			chrome.storage.sync.set(data);
		}
	});

	/* used for debug
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		for (key in changes) {
			var storageChange = changes[key];
			console.log('Storage key "%s" in namespace "%s" changed. ' +
						'Old value was "%s", new value is "%s".',
						key,
						namespace,
						storageChange.oldValue,
						storageChange.newValue);
		}
	});
	*/
})(jQuery);
