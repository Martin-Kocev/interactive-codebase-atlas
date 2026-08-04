/* ============================================================================
   Architecture map — an SVG built from components + connections.
   Category is encoded by hue AND shape AND glyph AND a text kind label, so the
   map stays readable without colour. Only the selected path animates.
   ========================================================================== */
(function (global) {
  'use strict';

  /* Every category is distinguished FOUR ways — hue, outline shape, drawn icon,
     and a text label — so the map stays fully readable without colour. */
  var CATEGORY = {
    frontend:   { hue: 'frontend', shape: 'round',   icon: 'window',    label: 'Frontend' },
    admin:      { hue: 'frontend', shape: 'round',   icon: 'window',    label: 'Admin UI' },
    mobile:     { hue: 'frontend', shape: 'round',   icon: 'device',    label: 'Client' },
    cli:        { hue: 'frontend', shape: 'rect',    icon: 'terminal',  label: 'CLI' },
    backend:    { hue: 'backend',  shape: 'rect',    icon: 'server',    label: 'Service' },
    api:        { hue: 'backend',  shape: 'rect',    icon: 'exchange',  label: 'API' },
    worker:     { hue: 'backend',  shape: 'rect',    icon: 'cycle',     label: 'Worker' },
    domain:     { hue: 'domain',   shape: 'hex',     icon: 'hexagon',   label: 'Domain' },
    'shared-lib': { hue: 'domain', shape: 'hex',     icon: 'hexagon',   label: 'Shared' },
    'shared-ui':  { hue: 'domain', shape: 'hex',     icon: 'hexagon',   label: 'Shared UI' },
    database:   { hue: 'database', shape: 'cyl',     icon: 'cylinder',  label: 'Database' },
    cache:      { hue: 'database', shape: 'cyl',     icon: 'cylinder',  label: 'Cache' },
    storage:    { hue: 'database', shape: 'cyl',     icon: 'cylinder',  label: 'Storage' },
    queue:      { hue: 'events',   shape: 'diamond', icon: 'stack',     label: 'Queue' },
    events:     { hue: 'events',   shape: 'diamond', icon: 'broadcast', label: 'Events' },
    external:   { hue: 'external', shape: 'rect',    icon: 'outbound',  label: 'External' },
    infra:      { hue: 'infra',    shape: 'rect',    icon: 'cube',      label: 'Infra' },
    build:      { hue: 'infra',    shape: 'rect',    icon: 'gear',      label: 'Build' },
    tests:      { hue: 'tests',    shape: 'rect',    icon: 'check',     label: 'Tests' }
  };
  var FALLBACK = { hue: 'external', shape: 'rect', icon: 'cube', label: 'Component' };

  function meta(category) { return CATEGORY[category] || FALLBACK; }

  var NODE_W = 176, NODE_H = 94, GAP_X = 54, GAP_Y = 70, PAD = 52;

  function seedOf(text) {
    var seed = 0;
    for (var i = 0; i < text.length; i++) seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    return Math.abs(seed);
  }

  function finiteNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function normalized(value) {
    return Math.max(0, Math.min(1, value));
  }

  function layoutKey(component) {
    var authored = component.map && typeof component.map.layoutKey === 'string'
      ? component.map.layoutKey
      : '';
    return authored + '\u0000' + String(component.id || '');
  }

  function islandPath(x, y, w, h, inset, seed) {
    var s = seed % 13;
    x += inset; y += inset; w -= inset * 2; h -= inset * 2;
    return 'M' + (x + w * .08) + ',' + (y + h * .56) +
      'C' + (x + w * .02) + ',' + (y + h * (.31 + s * .004)) + ' ' + (x + w * .2) + ',' + y + ' ' + (x + w * .43) + ',' + (y + h * .08) +
      'C' + (x + w * .61) + ',' + (y - h * .01) + ' ' + (x + w * .91) + ',' + (y + h * .2) + ' ' + (x + w * .96) + ',' + (y + h * .48) +
      'C' + (x + w * 1.02) + ',' + (y + h * .76) + ' ' + (x + w * .78) + ',' + (y + h * .94) + ' ' + (x + w * .56) + ',' + (y + h * .88) +
      'C' + (x + w * .35) + ',' + (y + h * 1.02) + ' ' + (x + w * .12) + ',' + (y + h * .84) + ' ' + (x + w * .08) + ',' + (y + h * .56) + 'Z';
  }

  function shapePath(shape, x, y, w, h) {
    var r = 10;
    if (shape === 'round') return roundRect(x, y, w, h, 999);
    if (shape === 'rect') return roundRect(x, y, w, h, r);
    if (shape === 'cyl') {
      var e = 9;
      return 'M' + x + ',' + (y + e) +
        'a' + (w / 2) + ',' + e + ' 0 0 1 ' + w + ',0' +
        'v' + (h - 2 * e) +
        'a' + (w / 2) + ',' + e + ' 0 0 1 ' + (-w) + ',0Z';
    }
    if (shape === 'diamond') {
      var cx = x + w / 2, cy = y + h / 2;
      return 'M' + cx + ',' + y + 'L' + (x + w) + ',' + cy + 'L' + cx + ',' + (y + h) + 'L' + x + ',' + cy + 'Z';
    }
    if (shape === 'hex') {
      var i = 16;
      return 'M' + (x + i) + ',' + y + 'H' + (x + w - i) + 'L' + (x + w) + ',' + (y + h / 2) +
             'L' + (x + w - i) + ',' + (y + h) + 'H' + (x + i) + 'L' + x + ',' + (y + h / 2) + 'Z';
    }
    return roundRect(x, y, w, h, r);
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    return 'M' + (x + r) + ',' + y + 'H' + (x + w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
           'V' + (y + h - r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r +
           'H' + (x + r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + (-r) +
           'V' + (y + r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) + 'Z';
  }

  function el(name, attrs, text) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function truncate(text, max) {
    return text.length > max ? text.slice(0, max - 1) + '…' : text;
  }

  /**
   * render(container, components, connections, options)
   *   options.onSelectNode(id) / onSelectEdge(id)
   *   options.selected — currently selected component id
   *   options.activeEdgeIds — edges to animate (only the selected path)
   */
  function render(container, components, connections, options) {
    options = options || {};
    container.innerHTML = '';
    if (!components.length) return;

    // Layer components; fall back to a single row when no layers were authored.
    var layers = {};
    components.forEach(function (c) {
      var l = typeof c.layer === 'number' ? c.layer : 0;
      (layers[l] = layers[l] || []).push(c);
    });
    var layerKeys = Object.keys(layers).map(Number).sort(function (a, b) { return a - b; });
    layerKeys.forEach(function (key) {
      layers[key].sort(function (a, b) { return layoutKey(a).localeCompare(layoutKey(b)); });
    });
    var widest = Math.max.apply(null, layerKeys.map(function (k) { return layers[k].length; }));
    var hasAuthoredX = components.some(function (c) { return c.map && finiteNumber(c.map.x); });
    var hasAuthoredY = components.some(function (c) { return c.map && finiteNumber(c.map.y); });

    var columns = hasAuthoredX ? Math.max(3, widest) : widest;
    var rows = hasAuthoredY ? Math.max(3, layerKeys.length) : layerKeys.length;
    var width = PAD * 2 + columns * NODE_W + (columns - 1) * GAP_X;
    var height = PAD * 2 + rows * NODE_H + (rows - 1) * GAP_Y;

    var svg = el('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      // Never scale past 1:1 — an upscaled map turns components into billboards.
      style: 'max-width:' + width + 'px; margin:0 auto;',
      role: 'img',
      'aria-label': 'Architecture map: ' + components.length + ' components connected by ' +
                    connections.length + ' communication paths. A text list follows.'
    });

    var defs = el('defs', {});
    var shadow = el('filter', { id: 'island-shadow', x: '-30%', y: '-30%', width: '160%', height: '180%' });
    shadow.appendChild(el('feDropShadow', { dx: '0', dy: '6', stdDeviation: '5', 'flood-color': '#05364d', 'flood-opacity': '.28' }));
    defs.appendChild(shadow);
    var water = el('pattern', { id: 'water-ripples', width: '70', height: '34', patternUnits: 'userSpaceOnUse' });
    water.appendChild(el('path', { d: 'M4 18c8-5 16-5 24 0s16 5 24 0', fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.14', 'stroke-width': '1.2' }));
    defs.appendChild(water);
    var arrow = el('marker', { id: 'route-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' });
    arrow.appendChild(el('path', { d: 'M0 0L8 4L0 8Z', fill: 'context-stroke' }));
    defs.appendChild(arrow);
    svg.appendChild(defs);
    svg.appendChild(el('rect', { class: 'ocean-field', x: 0, y: 0, width: width, height: height, rx: 24 }));
    svg.appendChild(el('rect', { class: 'ocean-ripples', x: 0, y: 0, width: width, height: height, rx: 24, fill: 'url(#water-ripples)' }));

    var pos = {};
    layerKeys.forEach(function (lk, li) {
      var row = layers[lk];
      var rowWidth = row.length * NODE_W + (row.length - 1) * GAP_X;
      var startX = (width - rowWidth) / 2;
      row.forEach(function (c, ci) {
        var authoredX = c.map && finiteNumber(c.map.x);
        var authoredY = c.map && finiteNumber(c.map.y);
        pos[c.id] = {
          x: authoredX
            ? PAD + normalized(c.map.x) * Math.max(0, width - PAD * 2 - NODE_W)
            : startX + ci * (NODE_W + GAP_X),
          y: authoredY
            ? PAD + normalized(c.map.y) * Math.max(0, height - PAD * 2 - NODE_H)
            : PAD + li * (NODE_H + GAP_Y),
          w: NODE_W, h: NODE_H,
          sourceX: authoredX ? 'authored' : 'fallback',
          sourceY: authoredY ? 'authored' : 'fallback'
        };
      });
    });

    /* Edges leave and enter at node EDGES, never at centres — a stroke that
       crosses a node body reads as a mistake, not a connection. */
    function route(a, b) {
      var ax = a.x + a.w / 2, bx = b.x + b.w / 2;
      if (a.y + a.h <= b.y) {                       // a sits above b
        var y1 = a.y + a.h, y2 = b.y, m = (y1 + y2) / 2;
        return 'M' + ax + ',' + y1 + 'C' + ax + ',' + m + ' ' + bx + ',' + m + ' ' + bx + ',' + y2;
      }
      if (b.y + b.h <= a.y) {                       // a sits below b
        var y3 = a.y, y4 = b.y + b.h, m2 = (y3 + y4) / 2;
        return 'M' + ax + ',' + y3 + 'C' + ax + ',' + m2 + ' ' + bx + ',' + m2 + ' ' + bx + ',' + y4;
      }
      // Same row: leave the right edge, enter the left edge, bow outward.
      var left = a.x < b.x ? a : b, right = a.x < b.x ? b : a;
      var lx = left.x + left.w, rx = right.x;
      var ly = left.y + left.h / 2, ry = right.y + right.h / 2;
      var mx = (lx + rx) / 2;
      return 'M' + lx + ',' + ly + 'C' + mx + ',' + ly + ' ' + mx + ',' + ry + ' ' + rx + ',' + ry;
    }

    // Edges first so nodes sit above them.
    var edgeLayer = el('g', { 'data-edges': '' });
    connections.forEach(function (conn) {
      var a = pos[conn.from], b = pos[conn.to];
      if (!a || !b) return;
      var d = route(a, b);
      var active = (options.activeEdgeIds || []).indexOf(conn.id) !== -1;
      var dim = options.selected && !active;
      var path = el('path', {
        class: 'edge', d: d, 'data-id': conn.id,
        'data-mechanism': conn.mechanism || 'dependency',
        'data-direction': conn.direction || 'one-way',
        'marker-end': 'url(#route-arrow)',
        'marker-start': conn.direction === 'two-way' ? 'url(#route-arrow)' : null,
        'data-active': active ? 'true' : null,
        'data-dimmed': dim ? 'true' : null
      });
      path.appendChild(el('title', {}, (conn.mechanism || 'dependency') + ': ' + (conn.label || conn.id)));
      var hit = el('path', { d: d, stroke: 'transparent', 'stroke-width': 14, fill: 'none', style: 'cursor:pointer' });
      hit.addEventListener('click', function () { if (options.onSelectEdge) options.onSelectEdge(conn.id); });
      edgeLayer.appendChild(path);
      edgeLayer.appendChild(hit);
    });
    svg.appendChild(edgeLayer);

    var neighbours = {};
    connections.forEach(function (c) {
      (neighbours[c.from] = neighbours[c.from] || {})[c.to] = true;
      (neighbours[c.to] = neighbours[c.to] || {})[c.from] = true;
    });

    components.forEach(function (c) {
      var p = pos[c.id], m = meta(c.category);
      var related = !options.selected || options.selected === c.id ||
                    (neighbours[options.selected] && neighbours[options.selected][c.id]);

      var seed = seedOf(c.id);
      var g = el('g', {
        class: 'node', tabindex: '0', role: 'button',
        'data-id': c.id,
        'data-map-x': p.x,
        'data-map-y': p.y,
        'data-map-source-x': p.sourceX,
        'data-map-source-y': p.sourceY,
        'data-selected': options.selected === c.id ? 'true' : null,
        'data-dimmed': related ? null : 'true',
        'aria-label': c.name + ' — ' + m.label + '. ' + (c.responsibility || ''),
        style: '--cat: var(--cat-' + m.hue + ')'
      });
      g.appendChild(el('ellipse', { class: 'node__wake', cx: p.x + p.w / 2, cy: p.y + p.h * .83, rx: p.w * .44, ry: p.h * .16 }));
      g.appendChild(el('path', { class: 'node__cliff', d: islandPath(p.x, p.y + 8, p.w, p.h, 8, seed), filter: 'url(#island-shadow)' }));
      g.appendChild(el('path', { class: 'node__sand', d: islandPath(p.x, p.y + 2, p.w, p.h, 6, seed) }));
      g.appendChild(el('path', { class: 'node__shape', d: islandPath(p.x, p.y, p.w, p.h, 13, seed) }));

      var hillX = p.x + p.w * (.34 + (seed % 9) / 100);
      g.appendChild(el('path', { class: 'node__hill', d: 'M' + (hillX - 22) + ',' + (p.y + 48) + 'L' + hillX + ',' + (p.y + 20) + 'L' + (hillX + 24) + ',' + (p.y + 48) + 'Z' }));
      g.appendChild(el('circle', { class: 'node__tree', cx: p.x + p.w - 42, cy: p.y + 35, r: 8 }));
      g.appendChild(el('circle', { class: 'node__tree', cx: p.x + 34, cy: p.y + 43, r: 6 }));

      var icon = global.AtlasIcons
        ? global.AtlasIcons.group(m.icon, p.x + 20, p.y + 25, 1)
        : null;
      if (icon) { icon.setAttribute('stroke', 'var(--cat)'); g.appendChild(icon); }

      g.appendChild(el('rect', { class: 'node__labelplate', x: p.x + 18, y: p.y + 53, width: p.w - 36, height: 28, rx: 8 }));
      g.appendChild(el('text', { class: 'node__kind', x: p.x + 39, y: p.y + 34 }, m.label.toUpperCase()));
      g.appendChild(el('text', { class: 'node__label', x: p.x + p.w / 2, y: p.y + 71, 'text-anchor': 'middle' }, truncate(c.name, 24)));

      // A changed component gets a station tick, not a coloured dot.
      if (c.changed && (c.changed.state === 'new' || c.changed.state === 'updated')) {
        g.appendChild(el('line', {
          class: 'node__tick', x1: p.x + p.w - 31, y1: p.y + 21, x2: p.x + p.w - 18, y2: p.y + 21,
          stroke: 'var(--mark)'
        }));
      }

      function pick() { if (options.onSelectNode) options.onSelectNode(c.id); }
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      svg.appendChild(g);
    });

    container.appendChild(svg);

    // Now that the paths are laid out, feed each animated stroke its real
    // length so the draw-on completes exactly once instead of looping.
    Array.prototype.forEach.call(svg.querySelectorAll('.edge[data-active="true"]'), function (p) {
      var len = 1000;
      try { len = Math.ceil(p.getTotalLength()); } catch (e) { /* keep the fallback */ }
      p.style.setProperty('--len', len);
    });

    // Keyboard: arrows move between nodes in document order.
    var nodes = Array.prototype.slice.call(svg.querySelectorAll('.node'));
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = nodes.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      var next = nodes[(i + (e.key === 'ArrowRight' ? 1 : nodes.length - 1)) % nodes.length];
      next.focus();
    });
  }

  function legend(components) {
    var seen = {}, out = [];
    components.forEach(function (c) {
      var m = meta(c.category);
      if (seen[m.label]) return;
      seen[m.label] = true;
      out.push(m);
    });
    return out;
  }

  /* Outline shape alone repeats across categories (API and Worker are both
     rectangles), so the legend shows the drawn icon as well as the shape. */
  function legendMark(m) {
    var wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '.35ch';
    var swatch = document.createElement('i');
    swatch.setAttribute('data-shape', m.shape);
    wrap.appendChild(swatch);
    if (global.AtlasIcons) wrap.appendChild(global.AtlasIcons.svg(m.icon, { size: 13 }));
    return wrap;
  }

  global.AtlasMap = { render: render, meta: meta, legend: legend, legendMark: legendMark };
})(window);
