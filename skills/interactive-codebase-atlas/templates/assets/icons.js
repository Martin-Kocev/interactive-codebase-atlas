/* ============================================================================
   Authored icon set — one consistent 16×16 grid, 1.5 stroke, no fills.
   Drawn geometry, never Unicode glyphs or emoji: a category marker is
   load-bearing information (it is what makes the map readable without colour),
   so it has to render identically on every platform and font stack.
   ========================================================================== */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* Each entry is a list of <path d> strings on a 16×16 grid. */
  var PATHS = {
    /* --- component categories --- */
    window:   ['M2 3.5h12v9H2z', 'M2 6.5h12'],                                  // a screen
    device:   ['M5 2h6v12H5z', 'M7 12.2h2'],                                    // a handheld client
    terminal: ['M2 3.5h12v9H2z', 'M4.6 7l1.8 1.5-1.8 1.5', 'M8.4 10.6h3'],      // a command line
    server:   ['M2.5 3h11v4h-11z', 'M2.5 9h11v4h-11z', 'M4.6 5h.01', 'M4.6 11h.01'],
    exchange: ['M3 6h8', 'M9 4l2 2-2 2', 'M13 10H5', 'M7 12l-2-2 2-2'],         // an API
    cycle:    ['M13 8a5 5 0 1 1-1.6-3.7', 'M13.2 2v3h-3'],                      // a worker
    hexagon:  ['M8 2l5 3v6l-5 3-5-3V5z'],                                       // domain / shared
    cylinder: ['M3 4.2c0-1.2 2.2-2.2 5-2.2s5 1 5 2.2v7.6c0 1.2-2.2 2.2-5 2.2s-5-1-5-2.2z', 'M3 4.2c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2'],
    stack:    ['M2.5 5.5h11', 'M2.5 8.5h11', 'M2.5 11.5h11'],                   // a queue
    broadcast:['M8 8h.01', 'M5.2 5.2a4 4 0 0 0 0 5.6', 'M10.8 10.8a4 4 0 0 0 0-5.6', 'M3 3a7.5 7.5 0 0 0 0 10', 'M13 13a7.5 7.5 0 0 0 0-10'],
    outbound: ['M9 3h4v4', 'M13 3l-6 6', 'M11.5 9.5V13h-9V4h3.5'],              // external service
    cube:     ['M8 2l5.5 3v6L8 14l-5.5-3V5z', 'M2.5 5L8 8l5.5-3', 'M8 8v6'],    // infrastructure
    gear:     ['M8 5.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8', 'M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7L3.6 3.6'],
    check:    ['M3.5 8.4l3 3 6-6.8'],
    /* A file being written, not a floppy disk: an arrow coming to rest inside
       a tray. Marks progress kept in `progress/progress.json` on disk rather
       than in the browser. */
    save:     ['M8 2.6v6.4', 'M5.5 6.9L8 9.4l2.5-2.5', 'M3 10.6v2.8h10v-2.8'],

    /* --- progress states --- */
    circle:      ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8'],
    circleHalf:  ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8', 'M8 2.6v10.8a5.4 5.4 0 0 0 0-10.8z'],
    circleDot:   ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8', 'M8 6.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z'],
    circleCheck: ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8', 'M5.6 8.2l1.7 1.7 3.1-3.5'],
    bookmark:    ['M4.5 2.4h7v11.2L8 10.8l-3.5 2.8z'],
    question:    ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8', 'M6.5 6.4a1.6 1.6 0 0 1 3 .6c0 1.1-1.5 1.3-1.5 2.4', 'M8 11.4h.01'],
    plus:        ['M8 3.5v9', 'M3.5 8h9'],
    minus:       ['M3.5 8h9'],
    arrowRight:  ['M3 8h9', 'M9 5l3 3-3 3'],
    arrowLeft:   ['M13 8H4', 'M7 5L4 8l3 3'],
    play:        ['M5 3.2l7.5 4.8L5 12.8z'],
    pause:       ['M6 3.5v9', 'M10 3.5v9'],
    replay:      ['M3 8a5 5 0 1 0 1.6-3.7', 'M2.8 2v3h3'],
    map:         ['M2.5 4.2l4-1.6 3 1.6 4-1.6v9.2l-4 1.6-3-1.6-4 1.6z', 'M6.5 2.6v9.2', 'M9.5 4.2v9.2'],
    code:        ['M5.4 5.6L2.8 8l2.6 2.4', 'M10.6 5.6L13.2 8l-2.6 2.4', 'M9.2 3.6l-2.4 8.8'],
    alert:       ['M8 2.6a5.4 5.4 0 1 0 0 10.8 5.4 5.4 0 0 0 0-10.8', 'M8 5.4v3.4', 'M8 11.2h.01'],
    beaker:      ['M6.4 2.2v4L3 12a1.2 1.2 0 0 0 1 1.8h8a1.2 1.2 0 0 0 1-1.8L9.6 6.2v-4', 'M5.6 2.2h4.8'],

    /* --- world shell: navigation, ambient water, day/night --- */
    compass:     ['M8 1.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 8 1.8z', 'M10.6 5.4L9.2 9.2 5.4 10.6 6.8 6.8z'],
    island:      ['M2 11.8c1.5-1.2 3-1.3 4.2-.8 1.2.5 2.1.4 3.1-.3 1-.8 2.5-.6 4.7.7', 'M4.2 10.8l2.2-4.7 1.3 2.1 1.2-3 2.6 5.5', 'M3 13.4h10'],
    ship:        ['M2.4 10.2h11.2l-1.7 2.5H4.1z', 'M8 3v7.2', 'M8 3.3l4 3H8z', 'M8 4.1L4.5 7H8z'],
    scroll:      ['M4 2.5h7.2a1.4 1.4 0 0 1 0 2.8H5.4v7.1', 'M11.2 5.3v7.1H5.4a1.4 1.4 0 0 1 0-2.8h4', 'M6.8 7.2h2.8'],
    /* A plotted course: two moorings with a charted line between them. Marks
       the ordered walkthrough, distinct from `ship` (a single guided tour) and
       `compass` (the overview). */
    route:       ['M4.2 12.4c0-2.6 1.9-3.2 3.8-3.9s3.8-1.3 3.8-3.9', 'M4.2 10.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z', 'M11.8 2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z'],
    folder:      ['M2.2 4.4h4l1.1 1.3h6.5v7H2.2z', 'M2.2 4.4V3.2h4.1l1 1.2'],
    file:        ['M4.2 2h5.1l2.5 2.5V14H4.2z', 'M9.3 2v2.5h2.5', 'M6.2 7.3h3.7M6.2 9.6h3.7'],
    waves:       ['M2 5.6c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0', 'M2 9c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0', 'M2 12.4c1.2-1 2.4-1 3.6 0s2.4 1 3.6 0 2.4-1 3.6 0'],
    sun:         ['M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1'],
    moon:        ['M11.8 11.9A5.6 5.6 0 0 1 4.1 4.2a5.6 5.6 0 1 0 7.7 7.7z']
  };

  /** Build a standalone inline <svg> element (for HTML contexts). */
  function svg(name, opts) {
    opts = opts || {};
    var size = opts.size || 16;
    var node = document.createElementNS(NS, 'svg');
    node.setAttribute('viewBox', '0 0 16 16');
    node.setAttribute('width', size);
    node.setAttribute('height', size);
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
    node.setAttribute('stroke-width', opts.stroke || 1.5);
    node.setAttribute('stroke-linecap', 'round');
    node.setAttribute('stroke-linejoin', 'round');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
    node.style.flex = '0 0 auto';
    (PATHS[name] || PATHS.circle).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      node.appendChild(p);
    });
    return node;
  }

  /** Build a <g> of paths translated into an existing SVG (for the map). */
  function group(name, x, y, scale) {
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(' + (scale || 1) + ')');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-width', 1.5);
    g.setAttribute('stroke-linecap', 'round');
    g.setAttribute('stroke-linejoin', 'round');
    (PATHS[name] || PATHS.cube).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      g.appendChild(p);
    });
    return g;
  }

  function has(name) { return Object.prototype.hasOwnProperty.call(PATHS, name); }

  global.AtlasIcons = { svg: svg, group: group, has: has, names: Object.keys(PATHS) };
})(window);
