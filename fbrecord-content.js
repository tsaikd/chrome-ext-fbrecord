(function($) {
	var $body = $("body");
	var gdata = {
		usageBytes: 0,
		saving: false,
		cards: [],
		cardNameMap: {},
		cardTimeMap: {},
		dirtyCount: 0,
		dirtyTime: new Date().getTime(),
		config: {
			isBindKeyWrite: true
		}
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
		if (gdata.dirtyCount < 1) {
			gdata.dirtyTime = new Date().getTime();
		}
		gdata.dirtyCount++;
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
		var num = Math.round(gdata.cards.length / 3);
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
		var passTime = (new Date().getTime()) - gdata.dirtyTime;
		if (passTime > 30000) {
			return saveStorage();
		}
	}

	function loadSlot(num, fbrecord_num, cb) {
		var key = "fbrecord_data_" + num;
		chrome.storage.sync.get(key, function(vals) {
			if (vals && vals[key] && vals[key].length) {
				gdata.cards = gdata.cards.concat(vals[key]);
				vals[key].forEach(function(setdata) {
					gdata.cardNameMap[setdata.n] = setdata;
					gdata.cardTimeMap[setdata.t] = setdata;
				});
			}
			if (num < fbrecord_num) {
				loadSlot(num+1, fbrecord_num, cb);
			} else {
				if (cb) {
					cb.apply(this, []);
				}
			}
		});
	}

	function loadStorage(cb) {
		gdata.cards = [];
		gdata.cardNameMap = {};
		gdata.cardTimeMap = {};
		chrome.storage.sync.get("fbrecord_num", function(vals) {
			var fbrecord_num = vals["fbrecord_num"] || 0;
			loadSlot(0, fbrecord_num, cb);
		});
	}

	function saveStorage(cb) {
		if (gdata.dirtyCount < 1 || gdata.saving) {
			if (cb) {
				cb.apply(this, []);
			}
			return;
		}
		gdata.saving = true;
		var CARDS_PER_SLOT = 30;
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
		chrome.storage.sync.set(setdata, function() {
			if (chrome.runtime.lastError) {
				if (gdata.cards.length > 300) {
					cleanOldCard();
					chrome.storage.sync.clear(function() {
						gdata.saving = false;
						saveStorage(cb);
					});
				} else {
					console.error(chrome.runtime.lastError);
				}
			} else {
				gdata.dirtyCount = 0;
				gdata.dirtyTime = new Date().getTime();
				gdata.saving = false;
				if (cb) {
					cb.apply(this, arguments);
				}
			}
		});
	}

	function clearStorage(cb) {
		chrome.storage.sync.clear(function() {
			gdata = {
				usageBytes: 0,
				saving: false,
				cards: [],
				cardNameMap: {},
				cardTimeMap: {},
				dirtyCount: 0,
				dirtyTime: new Date().getTime()
			};
			$body.find(".fbrecord-init").removeClass("fbrecord-init fbrecord-read fbrecord-folded");

			if (cb) {
				cb.apply(this, arguments);
			}
		});
	}

	function updateStorageUsage(cb) {
		chrome.storage.sync.getBytesInUse(function(num) {
			gdata.usageBytes = num || 0;
			if (cb) {
				cb.apply(this, arguments);
			}
		});
	}

	function saveStorageKeyEventCb(e) {
		if (e.keyCode === 119) { // 'w'
			saveStorage();
		}
	}

	function applyConfig() {
		if (gdata.config.isBindKeyWrite) {
			$(document).on("keypress", "*", saveStorageKeyEventCb);
		} else {
			$(document).off("keypress", "*", saveStorageKeyEventCb);
		}
	}

	function scrollToLastViewPosition(maxTime) {
		if (new Date().getTime() > maxTime) {
			return;
		}
		if (!gdata.cards.length) {
			return;
		}

		var lastcard = gdata.cards[gdata.cards.length - 1],
			$read;

		$read = $(".fbrecord-init[fbrecord-permalink='" + lastcard.n + "']");
		if ($read.length) {
			$body.scrollTop($read.offset().top);
		} else {
			$body.scrollTop($body.scrollTop() + $(window).height());
			setTimeout(function() {
				scrollToLastViewPosition(maxTime);
			}, 500);
		}
	}

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			/* used for debug
			console.log(sender.tab ?
						"from a content script:" + sender.tab.url :
						"from the extension", request);
			//*/
			if (request.get == "gdata") {
				sendResponse(gdata);
			}
			if (request.get == "usage") {
				updateStorageUsage(function() {
					sendResponse(gdata);
				});
				return true; // use sendResponse later
			}
			if (request.do == "sync") {
				saveStorage(function() {
					updateStorageUsage(function() {
						sendResponse(gdata);
					});
				});
				return true; // use sendResponse later
			}
			if (request.do == "clear") {
				clearStorage(function() {
					sendResponse(gdata);
				});
				return true; // use sendResponse later
			}
			if (request.do == "config") {
				chrome.storage.sync.set({
					fbrecord_config: request.config
				});
				gdata.config = request.config;
				applyConfig();
				return true; // use sendResponse later
			}
			if (request.do == "scroll") {
				scrollToLastViewPosition(new Date().getTime() + request.maxTime * 1000);
				return true; // use sendResponse later
			}
		}
	);

	loadStorage(function() {
		setInterval(dirtyAutoSave, 2000);

		setInterval(function() {
			$body.find("div[data-cursor]:not(.fbrecord-init)").each(function() {
				var $t = $(this);
				$t.addClass("fbrecord-init");
				var permalink = $t.find("a[href] > abbr[title]:first").parent().attr("href") || "";
				permalink = permalink.replace(/^https?:\/\/www.facebook.com/, "");
				var mat = permalink.match(/^\/photo\.php\?fbid=(\d+)/);
				if (mat) {
					permalink = "/photo/" + mat[1];
				}
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
	});

	$(window).on("beforeunload", function() {
		saveStorage();
		if (gdata.dirtyCount > 0) {
			return "Facebook Read Cards Record is saving your data...";
		}
	});

	$body
	.on("mouseenter", "div.fbrecord-init[fbrecord-permalink]:not(.fbrecord-read)", function() {
		var $t = $(this);
		$t.addClass("fbrecord-read");
	})
	.on("mouseleave", "div.fbrecord-init.fbrecord-read[fbrecord-permalink]", function(e) {
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

	chrome.storage.sync.get("fbrecord_config", function(vals) {
		gdata.config = vals["fbrecord_config"] || {};
		applyConfig();
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
