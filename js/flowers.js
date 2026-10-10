/* ==========================================================================
   flowers.js — hand-built SVG flowers (no images, no dependencies).
   Every petal is a separate <path class="petal"> so CSS can bloom them one
   by one. Rotation lives on a wrapper <g> (attribute), the bloom animation
   lives on the inner path (CSS), so the two never fight.
   ========================================================================== */
(function () {
  'use strict';

  var uid = 0;
  function f(n) { return Math.round(n * 100) / 100; }

  /* A petal pointing "up" from (cx,cy). */
  function petalPath(cx, cy, len, wid) {
    return 'M' + cx + ' ' + cy +
      ' C' + f(cx - wid) + ' ' + f(cy - len * 0.25) + ' ' + f(cx - wid * 0.95) + ' ' + f(cy - len * 0.85) + ' ' + cx + ' ' + f(cy - len) +
      ' C' + f(cx + wid * 0.95) + ' ' + f(cy - len * 0.85) + ' ' + f(cx + wid) + ' ' + f(cy - len * 0.25) + ' ' + cx + ' ' + cy + 'Z';
  }

  /* A broad petal with a soft notch at the tip (cosmos). */
  function notchedPath(cx, cy, len, wid) {
    return 'M' + cx + ' ' + cy +
      ' C' + f(cx - wid) + ' ' + f(cy - len * 0.3) + ' ' + f(cx - wid * 1.1) + ' ' + f(cy - len * 0.8) + ' ' + f(cx - wid * 0.55) + ' ' + f(cy - len * 0.98) +
      ' C' + f(cx - wid * 0.2) + ' ' + f(cy - len * 1.02) + ' ' + f(cx - wid * 0.05) + ' ' + f(cy - len * 0.9) + ' ' + cx + ' ' + f(cy - len * 0.84) +
      ' C' + f(cx + wid * 0.05) + ' ' + f(cy - len * 0.9) + ' ' + f(cx + wid * 0.2) + ' ' + f(cy - len * 1.02) + ' ' + f(cx + wid * 0.55) + ' ' + f(cy - len * 0.98) +
      ' C' + f(cx + wid * 1.1) + ' ' + f(cy - len * 0.8) + ' ' + f(cx + wid) + ' ' + f(cy - len * 0.3) + ' ' + cx + ' ' + cy + 'Z';
  }

  /* A ring of petals around (cx,cy). */
  function ring(o) {
    var out = '', shape = o.shape || petalPath;
    for (var i = 0; i < o.count; i++) {
      var a = f((o.offset || 0) + (360 / o.count) * i);
      var d = f((o.delay || 0) + i * (o.step === undefined ? 0.06 : o.step));
      out += '<g transform="rotate(' + a + ' ' + o.cx + ' ' + o.cy + ')">' +
        '<path class="petal" style="--d:' + d + 's" d="' + shape(o.cx, o.cy, o.len, o.wid) + '" fill="' + o.fill + '"' +
        (o.stroke ? ' stroke="' + o.stroke + '" stroke-width=".5"' : '') + '/></g>';
    }
    return out;
  }

  function grad(id, from, to) {
    return '<linearGradient id="' + id + '" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/></linearGradient>';
  }

  function stemParts(id, topY) {
    var defs = '<linearGradient id="' + id + 's" gradientUnits="userSpaceOnUse" x1="0" y1="' + topY + '" x2="0" y2="158">' +
      '<stop offset="0" stop-color="#a7d8b4"/><stop offset="1" stop-color="#4b8c7a"/></linearGradient>';
    var body = '<path class="stem" pathLength="100" d="M50 ' + topY + ' C46 ' + (topY + 36) + ' 55 ' + (topY + 70) + ' 50 158"' +
      ' fill="none" stroke="url(#' + id + 's)" stroke-width="3" stroke-linecap="round"/>' +
      '<path class="leaf leaf--r" style="--ld:.05s" d="M51 118 C66 104 82 108 90 98 C86 116 68 126 51 118Z" fill="#86bf9a"/>' +
      '<path class="leaf leaf--l" style="--ld:.2s" d="M49 134 C34 122 20 126 12 116 C16 134 32 142 49 134Z" fill="#6fae8a"/>';
    return { defs: defs, body: body };
  }

  function wrap(type, defs, body) {
    return '<svg class="flower-svg" data-flower="' + type + '" viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<defs>' + defs + '</defs>' + body + '</svg>';
  }

  var builders = {
    rose: function (id) {
      var st = stemParts(id, 52);
      var defs = st.defs + grad(id + 'a', '#e46f98', '#f8bfd3') + grad(id + 'b', '#f09ab9', '#fde0ea') + grad(id + 'c', '#c9577f', '#ef8fb0');
      var head =
        ring({ count: 6, offset: 0,  len: 31, wid: 19, fill: 'url(#' + id + 'a)', cx: 50, cy: 48, delay: 0,    step: 0.07 }) +
        ring({ count: 6, offset: 30, len: 24, wid: 15, fill: 'url(#' + id + 'b)', cx: 50, cy: 48, delay: 0.25, step: 0.07 }) +
        ring({ count: 5, offset: 12, len: 17, wid: 11, fill: 'url(#' + id + 'c)', cx: 50, cy: 48, delay: 0.5,  step: 0.07 }) +
        ring({ count: 4, offset: 45, len: 10, wid: 7,  fill: '#b24a72',           cx: 50, cy: 48, delay: 0.7,  step: 0.07 }) +
        '<circle class="core" cx="50" cy="48" r="3" fill="#f6d79a"/>';
      return wrap('rose', defs, st.body + head);
    },

    daisy: function (id) {
      var st = stemParts(id, 50);
      var defs = st.defs + '<radialGradient id="' + id + 'k"><stop offset="0" stop-color="#ffe49a"/><stop offset="1" stop-color="#eeb94f"/></radialGradient>';
      var head =
        ring({ count: 14, offset: 12.8, len: 23, wid: 6.6, fill: '#fdeef0', cx: 50, cy: 46, delay: 0,    step: 0.04 }) +
        ring({ count: 14, offset: 0,    len: 28, wid: 6.8, fill: '#fffaf1', stroke: '#e9d6ee', cx: 50, cy: 46, delay: 0.15, step: 0.04 }) +
        '<circle class="core" cx="50" cy="46" r="8" fill="url(#' + id + 'k)"/>' +
        '<circle class="core" cx="50" cy="46" r="3.4" fill="#e3a94a"/>';
      return wrap('daisy', defs, st.body + head);
    },

    tulip: function (id) {
      var st = stemParts(id, 66);
      var defs = st.defs + grad(id + 'a', '#e8648f', '#f6a9c4') + grad(id + 'b', '#f2879f', '#fcd0dc');
      var cup =
        '<g transform="translate(50 66) scale(1.2) translate(-50 -66)">' +
          '<path class="petal" style="--d:0s"   d="M50 66 C28 62 24 36 30 18 C42 24 50 40 50 66Z" fill="url(#' + id + 'a)"/>' +
          '<path class="petal" style="--d:.12s" d="M50 66 C72 62 76 36 70 18 C58 24 50 40 50 66Z" fill="url(#' + id + 'a)"/>' +
          '<path class="petal" style="--d:.28s" d="M50 68 C36 60 36 34 50 14 C64 34 64 60 50 68Z" fill="url(#' + id + 'b)"/>' +
        '</g>';
      return wrap('tulip', defs, st.body + cup);
    },

    lavender: function (id) {
      var st = stemParts(id, 40);
      var defs = st.defs + grad(id + 'a', '#9b7fd6', '#d3c0f5');
      var buds = '', i, y, side, cx, tilt, d;
      for (i = 0; i < 11; i++) {
        y = 74 - i * 5.1;
        side = i % 2 === 0 ? -1 : 1;
        cx = 50 + side * (4.2 - i * 0.14);
        tilt = side * 28;
        d = i * 0.07;
        buds += '<g transform="rotate(' + tilt + ' ' + f(cx) + ' ' + f(y) + ')">' +
          '<ellipse class="petal petal--c" style="--d:' + f(d) + 's" cx="' + f(cx) + '" cy="' + f(y) + '" rx="4.4" ry="7" fill="url(#' + id + 'a)"/></g>';
      }
      buds += '<g><ellipse class="petal petal--c" style="--d:.8s" cx="50" cy="16" rx="3.4" ry="6.4" fill="url(#' + id + 'a)"/></g>';
      return wrap('lavender', defs, st.body + buds);
    },

    cosmos: function (id) {
      var st = stemParts(id, 50);
      var defs = st.defs + grad(id + 'a', '#c79bee', '#f8bcd9') + grad(id + 'b', '#e4b8f2', '#fcd9ea');
      var head =
        ring({ count: 8, offset: 22.5, len: 25, wid: 16, fill: 'url(#' + id + 'b)', shape: notchedPath, cx: 50, cy: 48, delay: 0,    step: 0.07 }) +
        ring({ count: 8, offset: 0,    len: 31, wid: 17, fill: 'url(#' + id + 'a)', shape: notchedPath, cx: 50, cy: 48, delay: 0.2,  step: 0.07 }) +
        '<circle class="core" cx="50" cy="48" r="5.6" fill="#f5cd7a"/>' +
        '<circle class="core" cx="50" cy="48" r="2.4" fill="#d99a3e"/>';
      return wrap('cosmos', defs, st.body + head);
    }
  };

  function svg(type) {
    var id = 'fl' + (uid++);
    return (builders[type] || builders.rose)(id);
  }

  /* The big luminous bloom for the finale (viewBox 0 0 200 200). */
  function hero() {
    var id = 'hb' + (uid++), i, a, x, y, out;
    var defs = grad(id + 'a', '#a98be6', '#e6d9fb') + grad(id + 'b', '#ee86ae', '#fcd3e2') +
      grad(id + 'c', '#f4c88a', '#fff1d6') + grad(id + 'd', '#d3567f', '#f59cba') +
      '<radialGradient id="' + id + 'k"><stop offset="0" stop-color="#fff0c4"/><stop offset="1" stop-color="#eab35a"/></radialGradient>';

    /* orbiting lights + four tiny blossoms */
    var orbit = '<g class="hero__orbit">' +
      '<circle cx="100" cy="100" r="90" fill="none" stroke="#f2dfba" stroke-opacity=".32" stroke-width=".8" stroke-dasharray="1 6" stroke-linecap="round"/>';
    for (i = 0; i < 14; i++) {
      a = (i / 14) * Math.PI * 2;
      x = f(100 + Math.cos(a) * 90); y = f(100 + Math.sin(a) * 90);
      orbit += '<circle class="hero__dot" style="--dl:' + f(i * 0.31) + 's" cx="' + x + '" cy="' + y + '" r="' + (i % 3 === 0 ? 2 : 1.3) + '" fill="#fff0cf"/>';
    }
    for (i = 0; i < 4; i++) {
      a = (i / 4) * Math.PI * 2 + 0.4;
      x = f(100 + Math.cos(a) * 90); y = f(100 + Math.sin(a) * 90);
      orbit += '<g transform="translate(' + x + ' ' + y + ')">' +
        ring({ count: 5, offset: 0, len: 9, wid: 5.4, fill: '#fbd0dc', cx: 0, cy: 0, delay: 1.6 + i * 0.2, step: 0.05 }) +
        '<circle class="core" cx="0" cy="0" r="1.8" fill="#f6d79a"/></g>';
    }
    orbit += '</g>';

    /* the bloom itself */
    var bloom = '<g class="hero__bloom">' +
      ring({ count: 16, offset: 0,  len: 64, wid: 22, fill: 'url(#' + id + 'a)', cx: 100, cy: 100, delay: 0,    step: 0.05 }) +
      ring({ count: 12, offset: 15, len: 50, wid: 19, fill: 'url(#' + id + 'b)', cx: 100, cy: 100, delay: 0.35, step: 0.05 }) +
      ring({ count: 8,  offset: 0,  len: 36, wid: 15, fill: 'url(#' + id + 'c)', cx: 100, cy: 100, delay: 0.7,  step: 0.05 }) +
      ring({ count: 6,  offset: 30, len: 22, wid: 10, fill: 'url(#' + id + 'd)', cx: 100, cy: 100, delay: 1.0,  step: 0.05 }) +
      '<circle class="core" cx="100" cy="100" r="9" fill="url(#' + id + 'k)"/>' +
      '<circle class="core" cx="100" cy="100" r="3.6" fill="#d99a3e"/></g>';

    /* four-point sparkles */
    var spark = 'M0 -7 C.9 -2.4 2.4 -.9 7 0 C2.4 .9 .9 2.4 0 7 C-.9 2.4 -2.4 .9 -7 0 C-2.4 -.9 -.9 -2.4 0 -7Z';
    var sparkles = '';
    [[38, 40, 1], [166, 50, 0.8], [152, 162, 1.1], [44, 152, 0.7]].forEach(function (s, n) {
      sparkles += '<g transform="translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')"><path class="hero__spark" style="--dl:' + f(n * 0.9) + 's" d="' + spark + '" fill="#fff4d8"/></g>';
    });

    return '<svg class="hero-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<defs>' + defs + '</defs>' + orbit + bloom + sparkles + '</svg>';
  }

  window.QuinnFlowers = { svg: svg, hero: hero, types: Object.keys(builders) };
})();
