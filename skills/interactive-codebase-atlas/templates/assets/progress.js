/* ============================================================================
   Progress store. No account, no database, no analytics, no third party — but,
   when the atlas is served rather than opened as a file, progress lives in
   `progress/progress.json` inside the atlas directory rather than only in the
   browser. Clearing browsing data no longer clears what you have read.

   Two backends, chosen at boot by whether the server answers /api/progress:

     file     the JSON file is the source of truth; localStorage is kept as a
              mirror, so the atlas still works if the server goes away
     browser  localStorage only — what `file://` and any plain static host get

   See references/progress.md. The single rule that keeps this working across
   atlas updates: item ids are permanent.
   ========================================================================== */
(function (global) {
  'use strict';

  var STORE_VERSION = 1;
  var STATES = ['not-started', 'started', 'viewed', 'completed'];
  var ENDPOINT = 'api/progress';
  var SAVE_DEBOUNCE_MS = 400;

  function key(repoName) {
    return 'codebase-atlas:' + repoName + ':v1';
  }

  function blank() {
    return {
      storeVersion: STORE_VERSION,
      atlasSchemaVersion: null,
      lastVisitAt: null,
      lastSeenAtlasCommit: null,
      reviewedChangeGroups: {},
      lastLocation: null,
      depthPreference: 'balanced',
      focusMode: false,
      ambientMotion: true,
      theme: 'auto',
      items: {}
    };
  }

  function normalise(parsed) {
    var base = blank();
    // Preserve unknown keys written by a newer atlas.
    for (var k in parsed) if (Object.prototype.hasOwnProperty.call(parsed, k)) base[k] = parsed[k];
    if (!base.items || typeof base.items !== 'object') base.items = {};
    if (!base.reviewedChangeGroups || typeof base.reviewedChangeGroups !== 'object') base.reviewedChangeGroups = {};
    return base;
  }

  function hasItems(doc) {
    return !!(doc && doc.items && Object.keys(doc.items).length);
  }

  /**
   * Ask the server whether it can hold progress in a file, and what it holds.
   * Resolves to `{mode, data}` — never rejects, because a missing endpoint is
   * the ordinary `file://` case, not an error worth blocking the atlas on.
   */
  function hydrate(repoName, atlasMeta) {
    var localRaw = null;
    try { localRaw = global.localStorage.getItem(key(repoName)); } catch (e) { /* private mode */ }
    var localDoc = null;
    try { localDoc = localRaw ? normalise(JSON.parse(localRaw)) : null; } catch (e) { localDoc = null; }

    if (!global.fetch || global.location.protocol === 'file:') {
      return Promise.resolve(new Progress(repoName, atlasMeta, localDoc, 'browser'));
    }

    return global.fetch(ENDPOINT, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(String(r.status))); })
      .then(function (remote) {
        var doc = hasItems(remote) ? normalise(remote) : null;
        var p = new Progress(repoName, atlasMeta, doc || localDoc, 'file');
        // First run against a server, with reading history already in this
        // browser: adopt it and push it up, so switching to file storage never
        // looks like the progress was lost.
        if (!doc && hasItems(localDoc)) p.flush();
        return p;
      })
      .catch(function () {
        return new Progress(repoName, atlasMeta, localDoc, 'browser');
      });
  }

  function Progress(repoName, atlasMeta, preloaded, mode) {
    this.key = key(repoName);
    this.meta = atlasMeta || {};
    this.mode = mode || 'browser';
    this.data = preloaded ? normalise(preloaded) : blank();
    this.syncState = 'idle';        // idle | saving | saved | error
    this._listeners = [];
    this._timer = null;
    this._pendingReplace = false;
    // Migrate forward in place. Never clear on a version bump.
    if (this.data.storeVersion !== STORE_VERSION) {
      this.data.storeVersion = STORE_VERSION;
    }
    this.data.atlasSchemaVersion = this.meta.atlasSchemaVersion || this.data.atlasSchemaVersion;

    // A tab being closed or hidden is the moment an unsaved debounce would be
    // lost. `keepalive` is what lets the request outlive the page.
    var self = this;
    if (this.mode === 'file' && global.addEventListener) {
      global.addEventListener('pagehide', function () { self.flush(true); });
      global.addEventListener('visibilitychange', function () {
        if (global.document && global.document.visibilityState === 'hidden') self.flush(true);
      });
    }
  }

  Progress.hydrate = hydrate;

  /** Where this reader's progress actually lives — surfaced in the UI. */
  Progress.prototype.storageMode = function () { return this.mode; };

  /**
   * `item()` materialises a blank entry whenever anything merely *reads* a
   * section's state, so the live map fills up with rows that record nothing.
   * Those are dropped on the way out: the stored document should contain
   * things the reader actually did, and an empty row that survives a reset —
   * only to be merged back by another tab — is worse than noise.
   */
  function isUntouched(it) {
    return !!it && it.state === 'not-started' && !it.bookmarked && !it.unclear &&
           !it.seenHash && !it.openCount && !it.firstOpenedAt && !it.completedAt;
  }

  Progress.prototype.serialisable = function () {
    var out = {};
    for (var k in this.data) if (Object.prototype.hasOwnProperty.call(this.data, k)) out[k] = this.data[k];
    out.items = {};
    for (var id in this.data.items) {
      if (!Object.prototype.hasOwnProperty.call(this.data.items, id)) continue;
      if (!isUntouched(this.data.items[id])) out.items[id] = this.data.items[id];
    }
    return out;
  };

  Progress.prototype._save = function (replace) {
    // localStorage is written in both modes: in `browser` it is the store, in
    // `file` it is a mirror that keeps the atlas usable if the server stops.
    try {
      global.localStorage.setItem(this.key, JSON.stringify(this.serialisable()));
    } catch (e) {
      /* private mode or quota — the atlas stays usable without persistence */
    }
    if (this.mode === 'file') this._schedulePush(replace);
    for (var i = 0; i < this._listeners.length; i++) this._listeners[i](this);
  };

  Progress.prototype._schedulePush = function (replace) {
    var self = this;
    if (replace) this._pendingReplace = true;
    this.syncState = 'saving';
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(function () { self.flush(); }, SAVE_DEBOUNCE_MS);
  };

  /**
   * Write the document to the server now. `keepalive` is used on the unload
   * path so a pending save survives the page going away.
   */
  Progress.prototype.flush = function (keepalive) {
    if (this.mode !== 'file' || !global.fetch) return Promise.resolve();
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    var replace = this._pendingReplace;
    this._pendingReplace = false;
    var self = this;
    var url = ENDPOINT + (replace ? '?mode=replace' : '');
    return global.fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(this.serialisable()),
      keepalive: !!keepalive
    }).then(function (r) {
      self.syncState = r.ok ? 'saved' : 'error';
      self._notify();
    }).catch(function () {
      // The mirror in localStorage still has it; the next save retries.
      self.syncState = 'error';
      self._notify();
    });
  };

  Progress.prototype._notify = function () {
    for (var i = 0; i < this._listeners.length; i++) this._listeners[i](this);
  };

  Progress.prototype.onChange = function (fn) { this._listeners.push(fn); };

  Progress.prototype.item = function (id) {
    if (!this.data.items[id]) {
      this.data.items[id] = {
        state: 'not-started', bookmarked: false, unclear: false,
        firstOpenedAt: null, lastOpenedAt: null, completedAt: null,
        seenHash: null, openCount: 0, updatedAt: null
      };
    }
    return this.data.items[id];
  };

  /* Every mutation stamps the item. The server merges two tabs' documents by
     preferring the newer stamp per item, so neither tab erases the other. */
  function touch(it) { it.updatedAt = new Date().toISOString(); return it; }

  Progress.prototype.state = function (id) { return this.item(id).state; };

  /* Opening advances not-started -> started. It never completes anything:
     "opened" is not "understood". */
  Progress.prototype.open = function (id, contentHash) {
    var it = this.item(id);
    var now = new Date().toISOString();
    if (!it.firstOpenedAt) it.firstOpenedAt = now;
    it.lastOpenedAt = now;
    it.openCount += 1;
    if (it.state === 'not-started') it.state = 'started';
    if (contentHash) it.seenHash = contentHash;   // clears the "updated" badge
    touch(it);
    this.data.lastVisitAt = now;
    this._save();
    return it;
  };

  /* Reaching the end of the content may advance to viewed — but never past it. */
  Progress.prototype.markViewed = function (id) {
    var it = this.item(id);
    if (it.state === 'not-started' || it.state === 'started') { it.state = 'viewed'; touch(it); this._save(); }
  };

  Progress.prototype.setState = function (id, state) {
    if (STATES.indexOf(state) === -1) return;
    var it = this.item(id);
    it.state = state;
    it.completedAt = state === 'completed' ? new Date().toISOString() : null;
    touch(it);
    this._save();
  };

  Progress.prototype.toggleComplete = function (id) {
    var it = this.item(id);
    this.setState(id, it.state === 'completed' ? 'viewed' : 'completed');
  };

  Progress.prototype.toggleFlag = function (id, flag) {
    var it = this.item(id);
    it[flag] = !it[flag];
    touch(it);
    this._save();
    return it[flag];
  };

  Progress.prototype.setLocation = function (sectionId, stepId) {
    this.data.lastLocation = { sectionId: sectionId, stepId: stepId || null };
    this._save();
  };

  /* Reviewing a conceptual change group is an acknowledgement that the reader
     has read what moved — never a claim that its affected concepts are now
     understood. Completion state is untouched on purpose. */
  Progress.prototype.markChangeGroupReviewed = function (id, reviewed) {
    if (typeof id !== 'string' || !id) return false;
    if (!this.data.reviewedChangeGroups || typeof this.data.reviewedChangeGroups !== 'object') {
      this.data.reviewedChangeGroups = {};
    }
    if (reviewed === false) delete this.data.reviewedChangeGroups[id];
    else this.data.reviewedChangeGroups[id] = new Date().toISOString();
    this._save();
    return reviewed !== false;
  };

  Progress.prototype.isChangeGroupReviewed = function (id) {
    return !!(this.data.reviewedChangeGroups && this.data.reviewedChangeGroups[id]);
  };

  /* Page load must never call this. The reader explicitly finishes catch-up
     before the indexed commit becomes "last seen" — otherwise simply opening
     the atlas would silently consume the change review they never read. */
  Progress.prototype.finishCatchUp = function (commit) {
    if (typeof commit !== 'string' || !commit) return false;
    this.data.lastSeenAtlasCommit = commit;
    this._save();
    return true;
  };

  Progress.prototype.pref = function (name, value) {
    if (value === undefined) return this.data[name];
    this.data[name] = value;
    this._save();
    return value;
  };

  /* An item is "changed for this reader" when its content hash moved since they
     last opened it. A changed item keeps its completion state — the badge
     informs, it never demotes. */
  Progress.prototype.isUpdatedSinceSeen = function (id, contentHash) {
    var it = this.data.items[id];
    if (!it || !it.seenHash || !contentHash) return false;
    return it.seenHash !== contentHash;
  };

  Progress.prototype.summary = function (ids) {
    var out = { total: ids.length, completed: 0, viewed: 0, started: 0, notStarted: 0, bookmarked: 0, unclear: 0 };
    for (var i = 0; i < ids.length; i++) {
      var it = this.data.items[ids[i]];
      if (!it) { out.notStarted++; continue; }
      if (it.state === 'completed') out.completed++;
      else if (it.state === 'viewed') out.viewed++;
      else if (it.state === 'started') out.started++;
      else out.notStarted++;
      if (it.bookmarked) out.bookmarked++;
      if (it.unclear) out.unclear++;
    }
    out.percent = out.total ? Math.round((out.completed / out.total) * 100) : 0;
    return out;
  };

  Progress.prototype.filter = function (ids, mode, hashes) {
    var self = this;
    return ids.filter(function (id) {
      var it = self.data.items[id];
      if (mode === 'unfinished') return !it || it.state !== 'completed';
      if (mode === 'bookmarked') return !!(it && it.bookmarked);
      if (mode === 'unclear') return !!(it && it.unclear);
      if (mode === 'changed') return self.isUpdatedSinceSeen(id, hashes && hashes[id]);
      return true;
    });
  };

  Progress.prototype.reset = function () {
    var prefs = {
      depthPreference: this.data.depthPreference,
      theme: this.data.theme,
      focusMode: this.data.focusMode,
      ambientMotion: this.data.ambientMotion
    };
    this.data = blank();
    this.data.depthPreference = prefs.depthPreference;
    this.data.theme = prefs.theme;
    this.data.focusMode = prefs.focusMode;
    this.data.ambientMotion = prefs.ambientMotion;
    // `replace`, not a merge: the server's newest-wins rule would otherwise
    // hand back every item this reset was meant to clear.
    this._save(true);
  };

  Progress.prototype.exportJSON = function () { return JSON.stringify(this.serialisable(), null, 2); };

  Progress.prototype.importJSON = function (text) {
    var incoming = JSON.parse(text);
    if (!incoming || typeof incoming.items !== 'object') throw new Error('Not a progress export');
    for (var id in incoming.items) {
      if (Object.prototype.hasOwnProperty.call(incoming.items, id)) {
        this.data.items[id] = touch(incoming.items[id]);
      }
    }
    // Change-group review is reading history too, and carries across browsers
    // for the same reason item state does.
    var groups = incoming.reviewedChangeGroups;
    if (groups && typeof groups === 'object') {
      for (var g in groups) {
        if (Object.prototype.hasOwnProperty.call(groups, g)) this.data.reviewedChangeGroups[g] = groups[g];
      }
    }
    if (typeof incoming.lastSeenAtlasCommit === 'string') this.data.lastSeenAtlasCommit = incoming.lastSeenAtlasCommit;
    this._save();
  };

  /* When an atlas update merged two items, transfer the old item's progress once. */
  Progress.prototype.applyMerges = function (items) {
    var changed = false;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item.mergedFrom) continue;
      var sources = [].concat(item.mergedFrom);
      for (var s = 0; s < sources.length; s++) {
        var from = this.data.items[sources[s]];
        if (!from || this.data.items[item.id]) continue;
        this.data.items[item.id] = from;
        delete this.data.items[sources[s]];
        changed = true;
      }
    }
    if (changed) this._save();
  };

  global.AtlasProgress = Progress;
})(window);
