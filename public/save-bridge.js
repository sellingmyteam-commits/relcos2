(function () {
  if (window === window.parent) return;

  var _setItem = localStorage.setItem.bind(localStorage);
  var _removeItem = localStorage.removeItem.bind(localStorage);
  var _clear = localStorage.clear.bind(localStorage);

  var saveTimer = null;
  function notifyParent() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        window.parent.postMessage({ type: "RELCOS_SAVE_CHANGED" }, "*");
      } catch (e) {}
    }, 800);
  }

  localStorage.setItem = function (key, value) {
    _setItem(key, value);
    notifyParent();
  };

  localStorage.removeItem = function (key) {
    _removeItem(key);
    notifyParent();
  };

  localStorage.clear = function () {
    _clear();
    notifyParent();
  };

  var _idbOpen = indexedDB.open.bind(indexedDB);
  indexedDB.open = function (name, version) {
    var req = version !== undefined ? _idbOpen(name, version) : _idbOpen(name);
    var _onsuccess = null;
    Object.defineProperty(req, "onsuccess", {
      get: function () { return _onsuccess; },
      set: function (fn) {
        _onsuccess = function (e) {
          var db = e.target.result;
          var _createTx = db.transaction.bind(db);
          db.transaction = function (stores, mode) {
            var tx = _createTx(stores, mode);
            if (mode === "readwrite") {
              var _complete = null;
              Object.defineProperty(tx, "oncomplete", {
                get: function () { return _complete; },
                set: function (cb) {
                  _complete = function (ev) {
                    notifyParent();
                    if (cb) cb(ev);
                  };
                },
                configurable: true,
              });
            }
            return tx;
          };
          if (fn) fn(e);
        };
      },
      configurable: true,
    });
    return req;
  };
})();
