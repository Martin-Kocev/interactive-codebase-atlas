/* ============================================================================
   Codebase Atlas — template layer.

   The one place that turns data/ui.json into strings and DOM. assets/atlas.js
   holds no user-facing copy of its own; it asks this module for everything.
   That is the whole point: rewording, reordering, retitling or re-theming the
   atlas is an edit to data/ui.json, never an edit to JavaScript.

   Exposes window.AtlasUI:
     UI.load(ui)              install the parsed ui.json
     UI.get(path, fallback)   raw lookup by dotted path ("views.data.fields")
     UI.t(path, vars)         string lookup with {{placeholder}} interpolation
     UI.has(path)             does this key exist
     UI.inline(text)          `code` and *emphasis* marks → escaped HTML
     UI.esc(text)             HTML-escape
     UI.h / UI.frag           the DOM builders (shared with atlas.js)
     UI.prose(text, attrs)    <p> of authored prose, marks rendered
     UI.kv(item, fields, ctx) a <dl class="kv"> built from a ui.json field list
     UI.applyTheme()          write theme.cssVars onto :root

   Field lists (views.*.fields) are the declarative half. One row is:
     { label, from }            read item.from, dotted paths allowed
     { label, compute }         call ctx.compute[name](item) — for anything the
                                data cannot express directly ("Talks to")
     { label, ..., join }       array values joined with this separator
     { label, ..., mapLabels }  array of atlas ids → their titles, via ctx.label
     { label, ..., fallback }   shown when the value is empty (default "—")
     { ..., when: "prop" }      row is skipped unless item.prop is non-empty
   Deleting a row hides it; moving a row moves it. No code change either way.
   ========================================================================== */
(function () {
  'use strict';

  var UI = {};
  var data = null;

  /* ----------------------------------------------------------- DOM base -- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  /**
   * The only two inline marks the authored data uses: `code` and *emphasis*.
   * Escaped first, so content stays text and never becomes markup. The single
   * alternation matters — a code span is consumed whole, so an asterisk inside
   * one (`/api/v1/admin/**`) can never be mistaken for emphasis.
   */
  function inline(s) {
    return esc(s).replace(/`([^`\n]+)`|\*([^*\n]+)\*/g, function (m, code, em) {
      return code != null ? '<code>' + code + '</code>' : '<em>' + em + '</em>';
    });
  }

  function h(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === 'class') node.className = attrs[k];
      // Authored prose marks paths and symbols with `backticks`. Render those as
      // real inline code wherever they appear — a visible backtick reads as
      // markdown that failed. Escaped first, so this stays text, not markup.
      else if (k === 'text' && /[`*]/.test(String(attrs[k]))) node.innerHTML = inline(attrs[k]);
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    // Several call sites pass a single node or a DocumentFragment rather than an
    // array (h('dl', …, frag(...))). Normalise instead of throwing on .forEach.
    if (kids != null && !Array.isArray(kids)) kids = [kids];
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function frag(kids) {
    var f = document.createDocumentFragment();
    (kids || []).forEach(function (k) { if (k) f.appendChild(k); });
    return f;
  }

  function text(s) { return document.createTextNode(s == null ? '' : String(s)); }

  /* ------------------------------------------------------------ lookup --- */

  function dig(root, dotted) {
    var cur = root;
    var parts = String(dotted).split('.');
    for (var i = 0; i < parts.length; i += 1) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  UI.load = function (ui) { data = ui || {}; return UI; };
  UI.raw = function () { return data; };
  UI.has = function (path) { return dig(data, path) !== undefined; };

  UI.get = function (path, fallback) {
    var v = dig(data, path);
    return v === undefined ? fallback : v;
  };

  /**
   * A string from ui.json with {{placeholders}} filled in. A missing key returns
   * the key itself rather than an empty string — a visible `views.data.heading`
   * in the page is a bug report; a blank heading is a mystery.
   */
  UI.t = function (path, vars) {
    var v = dig(data, path);
    if (typeof v !== 'string') return v === undefined ? String(path) : String(v);
    if (!vars) return v;
    return v.replace(/\{\{(\w+)\}\}/g, function (m, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m;
    });
  };

  /** Plural helper for the "{{count}} commit{{s}}" shape used in notices. */
  UI.plural = function (n, one, many) { return n === 1 ? (one || '') : (many == null ? 's' : many); };

  UI.esc = esc;
  UI.inline = inline;
  UI.h = h;
  UI.frag = frag;
  UI.text = text;

  UI.prose = function (body, attrs) {
    var out = {};
    for (var k in (attrs || {})) out[k] = attrs[k];
    out.html = inline(body);
    return h('p', out);
  };

  /* ------------------------------------------------------- field tables -- */

  function valueFor(item, field, ctx) {
    var raw;
    if (field.compute) {
      var fn = ctx && ctx.compute && ctx.compute[field.compute];
      raw = fn ? fn(item, ctx) : undefined;
    } else if (field.from) {
      raw = dig(item, field.from);
    }
    if (Array.isArray(raw)) {
      if (field.mapLabels && ctx && ctx.label) raw = raw.map(ctx.label);
      raw = raw.filter(function (x) { return x != null && x !== ''; }).join(field.join || ', ');
    }
    if (raw == null || raw === '') {
      return field.fallback !== undefined ? field.fallback : UI.t('common.dash');
    }
    return String(raw);
  }

  /**
   * A <dl class="kv"> built entirely from a ui.json field list. `ctx.compute`
   * supplies the handful of values the data cannot express as a plain property
   * ("Talks to" has to walk the connection list); everything else is a lookup.
   */
  UI.kv = function (item, fields, ctx, className) {
    var rows = [];
    (fields || []).forEach(function (field) {
      if (field.when) {
        var gate = dig(item, field.when);
        if (!gate || (Array.isArray(gate) && !gate.length)) return;
      }
      rows.push(h('dt', { text: field.label }));
      rows.push(h('dd', { text: valueFor(item, field, ctx) }));
    });
    if (!rows.length) return null;
    // `className` lets a caller in a narrow container ask for the stacked
    // variant — a 7.5rem label column beside a 10rem value column wraps every
    // few words, which is unreadable in a card three-across.
    return h('dl', { class: className || 'kv' }, rows);
  };

  UI.field = valueFor;

  /* ---------------------------------------------------------- fragments -- */

  /** Named {title, body} empty state from ui.json, e.g. 'views.glossary.empty'. */
  UI.empty = function (path, vars) {
    var spec = dig(data, path) || {};
    return h('div', { class: 'empty' }, [
      h('strong', { text: spec.title ? UI.t(path + '.title', vars) : '' }),
      text(spec.body ? UI.t(path + '.body', vars) : '')
    ]);
  };

  /** The heading + lede pair every section view opens with. */
  UI.sectionHead = function (viewKey, vars) {
    return h('div', { class: 'section-head' }, [
      h('h2', { text: UI.t('views.' + viewKey + '.heading', vars) }),
      h('p', { class: 'lede', text: UI.t('views.' + viewKey + '.lede', vars) })
    ]);
  };

  /** A segmented control from a ui.json [{id,label}] list. */
  UI.segmented = function (options, current, onPick, ariaLabel, style) {
    return h('div', { class: 'segmented', role: 'group', 'aria-label': ariaLabel || null, style: style || null },
      (options || []).map(function (opt) {
        return h('button', {
          text: opt.label,
          'aria-pressed': current === opt.id ? 'true' : 'false',
          onclick: function () { onPick(opt.id); }
        });
      }));
  };

  /** theme.cssVars → custom properties on :root, overriding the stylesheet. */
  UI.applyTheme = function () {
    var vars = UI.get('theme.cssVars', {}) || {};
    var root = document.documentElement;
    Object.keys(vars).forEach(function (name) { root.style.setProperty(name, vars[name]); });
  };

  window.AtlasUI = UI;
})();
