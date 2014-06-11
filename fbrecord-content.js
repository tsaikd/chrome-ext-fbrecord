
(function($) {
	var $body = $("body");
	var gdata = {
		cards: [],
		cardNameMap: {},
		cardTimeMap: {},
		dirtyCount: 0,
		dirtyTime: new Date().getTime()
	};

	function addReadCard(name) {
		if (isCardRead(name)) {
			return;
		}
		var setdata = {
			n: name,
			t: new Date().getTime()
		};
		gdata.cards.push(setdata);
		gdata.cardNameMap[setdata.n] = setdata;
		gdata.cardTimeMap[setdata.t] = setdata;
		gdata.dirtyCount++;
		gdata.dirtyTime = new Date().getTime();
	}

	function removeReadCard(name) {
		if (!isCardRead(name)) {
			return;
		}
		var setdata = gdata.cardNameMap[name];
		var i = gdata.cards.indexOf(setdata);
		if (i >= 0) {
			gdata.cards.splice(i, 1);
			delete gdata.cardNameMap[setdata.n];
			delete gdata.cardTimeMap[setdata.t];
			gdata.dirtyCount++;
			gdata.dirtyTime = new Date().getTime();
		}
	}

	function isCardRead(name) {
		return !!gdata.cardNameMap[name];
	}

	function cleanOldCard() {
		var num = gdata.cards.length >> 1;
		var delList = [];
		for (var t in gdata.cardTimeMap) {
			if (num-- < 1) {
				break;
			}
			delList.push(gdata.cardTimeMap[t]);
		}
		delList.forEach(function(setdata) {
			removeReadCard(setdata.n);
		});
	}

	function dirtyAutoSave() {
		if (gdata.dirtyCount < 1) {
			return;
		}
		if (gdata.dirtyCount > 9) {
			saveStorage();
		}
		var passTime = (new Date().getTime()) - gdata.dirtyTime;
		if (passTime > 30000) {
			saveStorage();
		}
	}

	function loadStorage() {
		gdata.cards = [];
		gdata.cardNameMap = {};
		gdata.cardTimeMap = {};
		chrome.storage.sync.get("fbrecord_num", function(vals) {
			var fbrecord_num = vals["fbrecord_num"] || 0;
			for (var i=0 ; i<fbrecord_num ; i++) {
				var key = "fbrecord_data_" + i;
				chrome.storage.sync.get(key, function(vals) {
					if (vals && vals[key] && vals[key].length) {
						gdata.cards = gdata.cards.concat(vals[key]);
						vals[key].forEach(function(setdata) {
							gdata.cardNameMap[setdata.n] = setdata;
							gdata.cardTimeMap[setdata.t] = setdata;
						});
					}
				});
			}
		});
	}

	function saveStorage(cb) {
		if (gdata.dirtyCount < 1) {
			if (cb) {
				cb.apply(this, []);
			}
			return;
		}
		var CARDS_PER_SLOT = 40;
		var setdata = {};
		for (var i=0 ; i<chrome.storage.sync.MAX_ITEMS ; i++) {
			var key = "fbrecord_data_" + i;
			var val = gdata.cards.slice(i*CARDS_PER_SLOT, (i+1)*CARDS_PER_SLOT);
			if (val.length) {
				setdata[key] = val;
			} else {
				setdata["fbrecord_num"] = i;
				break;
			}
		}
		chrome.storage.sync.clear(function() {
			chrome.storage.sync.set(setdata, function() {
				if (chrome.runtime.lastError) {
					if (gdata.cards.length > 100) {
						cleanOldCard();
						saveStorage(cb);
					} else {
						console.error(chrome.runtime.lastError);
					}
				} else {
					gdata.dirtyCount = 0;
					gdata.dirtyTime = new Date().getTime();
					if (cb) {
						cb.apply(this, arguments);
					}
				}
			});
		});
	}

	loadStorage();

	setInterval(dirtyAutoSave, 2000);

	setInterval(function() {
		$body.find("div[data-cursor]:not([fbrecord-init])").each(function() {
			var $t = $(this);
			$t.attr("fbrecord-init", "1");
			var permalink = $t.find("a[href] > abbr[title]:first").parent().attr("href");
			$t.attr("fbrecord-permalink", permalink);
			if (isCardRead(permalink)) {
				$t.addClass("fbrecord-read fbrecord-folded");
			}

			$t.find(".userContent:empty").each(function() {
				if ($(this).index() === 1) {
					$(this).prev().addClass("fbrecord-folded-moveup");
				}
			});
		});
	}, 2000);

	$(window).on("beforeunload", function() {
		saveStorage();
		if (gdata.dirtyCount > 0) {
			return "Facebook Read Cards Record is saving your data...";
		}
	});

	$body
	.on("mouseenter", "div[fbrecord-init][fbrecord-permalink]:not(.fbrecord-read)", function() {
		var $t = $(this);
		$t.addClass("fbrecord-read");
	})
	.on("mouseleave", "div.fbrecord-read[fbrecord-init][fbrecord-permalink]", function(e) {
		var $t = $(this);
		var permalink = $t.attr("fbrecord-permalink");
		if (e.shiftKey) {
			$t.removeClass("fbrecord-read fbrecord-folded");
			removeReadCard(permalink);
		} else {
			$t.addClass("fbrecord-folded");
			addReadCard(permalink);
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
	//*/
})(jQuery);
