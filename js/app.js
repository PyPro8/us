/* ==========================================================================
   app.js — scene manager and every interaction.
   Scenes: intro → moon → garden → letter → sky → finale (→ replay → intro)
   Each scene's enter() resets its own state first, so replay is always clean
   and no scene can be left half-finished.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.QUINN_CONTENT;
  var Engine = window.QuinnParticles.Engine;
  var Flowers = window.QuinnFlowers;
  var Music = window.QuinnMusic;
  var NS = 'http://www.w3.org/2000/svg';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function T(ms) { return reduced ? 0 : ms; }

  var lowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
               (navigator.deviceMemory && navigator.deviceMemory <= 2);
  var engine = new Engine($('#particles'), { reduced: reduced, quality: lowEnd ? 0.65 : 1 });

  /* ------------------------------------------------------------------------
     Timers that belong to the current scene (cleared on every scene change)
     ------------------------------------------------------------------------ */
  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ------------------------------------------------------------------------
     Text splitting: [data-split="words|chars"]
     ------------------------------------------------------------------------ */
  function splitText(el) {
    var mode = el.dataset.split;
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    var i = 0;
    if (mode === 'chars') {
      text.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'sc'; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--i', i++);
        s.textContent = ch;
        el.appendChild(s);
      });
    } else {
      var words = text.split(' ');
      words.forEach(function (w, idx) {
        var s = document.createElement('span');
        s.className = 'sw'; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--i', i++);
        s.textContent = w;
        el.appendChild(s);
        if (idx < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    }
  }

  function restartReveal(root) {
    root.classList.remove('is-revealed');
    $$('.reveal-later.is-shown', root).forEach(function (e) { e.classList.remove('is-shown'); });
    void root.offsetWidth;
    later(function () { root.classList.add('is-revealed'); }, T(250));
  }
  function show(el, ms) { later(function () { el.classList.add('is-shown'); }, T(ms)); }

  /* ------------------------------------------------------------------------
     Scene manager
     ------------------------------------------------------------------------ */
  var ORDER = ['intro', 'moon', 'garden', 'letter', 'sky', 'finale'];
  var current = null, locked = false;
  var scenes = {};

  var backdropEls = $$('.backdrop');
  var activeBackdrop = backdropEls[0];
  var dotEls = $$('#progressDots .dot');

  function updateDots(id) {
    var n = ORDER.indexOf(id);
    dotEls.forEach(function (d, i) {
      d.classList.toggle('is-current', i === n);
      d.classList.toggle('is-done', i < n);
    });
  }

  function goTo(id) {
    if (locked || id === current) return;
    locked = true;
    var prev = current;
    current = id;
    clearTimers();

    if (prev) {
      var pe = $('#scene-' + prev);
      pe.classList.remove('is-active');
      pe.setAttribute('inert', ''); pe.setAttribute('aria-hidden', 'true');
      if (scenes[prev] && scenes[prev].exit) scenes[prev].exit();
    }

    backdropEls.forEach(function (b) {
      var on = b.dataset.backdrop === id;
      b.classList.toggle('is-active', on);
      if (on) activeBackdrop = b;
    });
    engine.setPreset(id);
    updateDots(id);

    var next = $('#scene-' + id);
    setTimeout(function () {
      next.classList.add('is-active');
      next.removeAttribute('inert'); next.removeAttribute('aria-hidden');
      next.scrollTop = 0;
      if (scenes[id] && scenes[id].enter) scenes[id].enter();
    }, prev ? T(650) : 0);

    setTimeout(function () { locked = false; }, prev ? T(1500) : 100);
  }

  /* ------------------------------------------------------------------------
     Parallax (very gentle; drifts on its own when there's no mouse)
     ------------------------------------------------------------------------ */
  var par = { x: 0, y: 0, tx: 0, ty: 0, lastMove: -99999 };
  if (!reduced) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      par.lastMove = performance.now();
      par.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      par.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    engine.onFrame(function (t, dt) {
      if (performance.now() - par.lastMove > 3500) {
        par.tx = Math.sin(t * 0.12) * 0.7;
        par.ty = Math.cos(t * 0.09) * 0.4;
      }
      var k = Math.min(1, dt * 2);
      par.x += (par.tx - par.x) * k;
      par.y += (par.ty - par.y) * k;
      if (activeBackdrop) {
        activeBackdrop.style.setProperty('--px', par.x.toFixed(3));
        activeBackdrop.style.setProperty('--py', par.y.toFixed(3));
      }
    });
  }

  function centerOf(el, yFrac) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * (yFrac === undefined ? 0.5 : yFrac) };
  }

  /* ========================================================================
     SCENE 1 — entrance
     ======================================================================== */
  var enterBtn = $('#enterButton');
  var entering = false;

  scenes.intro = {
    enter: function () {
      entering = false;
      enterBtn.classList.remove('is-pressed');
      restartReveal($('#scene-intro'));
      show(enterBtn, 5000);
    }
  };

  enterBtn.addEventListener('click', function () {
    if (entering || locked) return;
    entering = true;
    Music.start();                         /* first user gesture → audio is allowed to begin */
    var c = centerOf(enterBtn);
    engine.burst(c.x, c.y, { count: 52, spread: 1.15, petals: 6 });
    enterBtn.classList.add('is-pressed');
    var veil = $('#veil');
    veil.style.setProperty('--vx', c.x + 'px');
    veil.style.setProperty('--vy', c.y + 'px');
    veil.classList.remove('is-bursting'); void veil.offsetWidth;
    if (!reduced) veil.classList.add('is-bursting');
    setTimeout(function () { goTo('moon'); }, T(650));
    setTimeout(function () { veil.classList.remove('is-bursting'); }, 2000);
  });

  /* ========================================================================
     SCENE 2 — moon
     ======================================================================== */
  var hillFlowers = $('#hillFlowers');
  (function buildHillFlowers() {
    [
      { type: 'cosmos', x: 15, w: 64, b: 1.5 },
      { type: 'tulip',  x: 37, w: 54, b: 0 },
      { type: 'rose',   x: 63, w: 68, b: 2 },
      { type: 'daisy',  x: 86, w: 58, b: 0.5 }
    ].forEach(function (d, i) {
      var el = document.createElement('div');
      el.className = 'mini';
      el.style.cssText = '--x:' + d.x + '%;--w:' + d.w + 'px;--b:' + d.b + ';--fd:' + (i * 0.35) + 's;--sd:' + (-i * 1.7) + 's';
      el.innerHTML = Flowers.svg(d.type);
      hillFlowers.appendChild(el);
    });
  })();

  scenes.moon = {
    enter: function () {
      hillFlowers.classList.remove('is-blooming');
      restartReveal($('#scene-moon'));
      later(function () { hillFlowers.classList.add('is-blooming'); }, T(2400));
      show($('#toGarden'), 6400);
    }
  };
  $('#toGarden').addEventListener('click', function () { goTo('garden'); });

  /* ========================================================================
     SCENE 3 — garden
     ======================================================================== */
  var GARDEN = [
    { type: 'rose',     x: 13, s: 1.2,  lift: 0,   label: 'rose' },
    { type: 'tulip',    x: 32, s: 1.0,  lift: 4.5, label: 'tulip' },
    { type: 'cosmos',   x: 51, s: 1.32, lift: 0,   label: 'cosmos' },
    { type: 'daisy',    x: 70, s: 1.0,  lift: 5,   label: 'daisy' },
    { type: 'lavender', x: 88, s: 1.15, lift: 1,   label: 'lavender' }
  ];
  var garden = $('#garden');
  var field = $('#gardenField');
  var note = $('#note'), noteKicker = $('#noteKicker'), noteText = $('#noteText');
  var hint = $('#gardenHint');
  var gardenNext = $('#gardenNext');
  var progress = $('#gardenProgress');
  var flowerEls = [];
  var found = {};
  var foundCount = 0;
  var activeFlower = null;
  var swapTimer = 0;

  (function buildGarden() {
    GARDEN.forEach(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'flower';
      b.dataset.index = i;
      b.style.cssText = '--x:' + d.x + '%;--s:' + d.s + ';--lift:' + d.lift + ';--fd:' + (0.3 + i * 0.4).toFixed(2) + 's;--sd:' + (-i * 1.3) + 's';
      b.setAttribute('aria-label', 'Open a message from the ' + d.label);
      b.innerHTML = '<span class="flower__glow"></span>' + Flowers.svg(d.type);
      b.addEventListener('click', function () { onFlower(i); });
      field.appendChild(b);
      flowerEls.push(b);

      var dot = document.createElement('i');
      progress.appendChild(dot);
    });

    /* a soft row of grass blades along the ground */
    var grass = $('#gardenGrass'), blades = '', cols = ['#34205a', '#3f2a6b', '#2e4f66', '#3a2a63'];
    for (var k = 0; k < 64; k++) {
      var x = (k / 64) * 400 + Math.random() * 5;
      var h = 14 + Math.random() * 24, lean = (Math.random() - 0.5) * 12, w = 2 + Math.random() * 2.4;
      blades += '<path d="M' + x.toFixed(1) + ' 40 Q' + (x + lean * 0.4).toFixed(1) + ' ' + (40 - h * 0.55).toFixed(1) + ' ' + (x + lean).toFixed(1) + ' ' + (40 - h).toFixed(1) +
        ' L' + (x + w).toFixed(1) + ' 40Z" fill="' + cols[k % cols.length] + '"/>';
    }
    grass.innerHTML = blades;
  })();

  function updateProgress() {
    $$('i', progress).forEach(function (d, i) { d.classList.toggle('is-found', !!found[i]); });
  }

  function restingHint() {
    if (foundCount >= GARDEN.length) return C.garden.done;
    return foundCount ? C.garden.more : C.garden.tap;
  }

  function closeNote(silent) {
    clearTimeout(swapTimer);
    note.classList.remove('is-open', 'is-swapping');
    note.setAttribute('inert', '');
    activeFlower = null;
    flowerEls.forEach(function (f) { f.classList.remove('is-active'); });
    if (!silent) {
      hint.textContent = restingHint();
      hint.classList.remove('is-dim');
    }
  }

  function onFlower(i) {
    if (activeFlower === i) { closeNote(); return; }
    var el = flowerEls[i];
    var data = C.flowers[i] || { kicker: '', text: '' };

    var c = centerOf(el, 0.3);
    engine.burst(c.x, c.y, { count: 22, spread: 0.75, petals: 4 });
    el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop');

    function reveal() {
      noteKicker.textContent = data.kicker;
      noteText.textContent = data.text;
      note.classList.remove('is-swapping');
      note.classList.add('is-open');
      note.removeAttribute('inert');
      hint.classList.add('is-dim');
      activeFlower = i;
      flowerEls.forEach(function (f, idx) { f.classList.toggle('is-active', idx === i); });
      el.classList.add('is-found');
      if (!found[i]) { found[i] = true; foundCount++; updateProgress(); }
      if (foundCount >= 1) gardenNext.classList.add('is-shown');
      if (foundCount >= GARDEN.length) gardenNext.classList.add('is-glowing');
    }

    clearTimeout(swapTimer);
    if (activeFlower !== null) {
      /* one message at a time: fade the old one out, then swap in the new one */
      note.classList.add('is-swapping');
      swapTimer = setTimeout(reveal, 220);
    } else {
      reveal();
    }
  }

  $('#noteClose').addEventListener('click', function () { closeNote(); });
  $('#scene-garden').addEventListener('click', function (e) {
    if (activeFlower === null) return;
    if (e.target.closest('.flower, .note, .garden-next')) return;
    closeNote();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current === 'garden' && activeFlower !== null) closeNote();
  });

  scenes.garden = {
    enter: function () {
      garden.classList.remove('is-blooming');
      closeNote(true);
      found = {}; foundCount = 0; updateProgress();
      flowerEls.forEach(function (f) { f.classList.remove('is-found', 'is-ready', 'is-active', 'is-pop'); });
      gardenNext.classList.remove('is-shown', 'is-glowing');
      hint.textContent = C.garden.growing;
      hint.classList.remove('is-dim');
      void garden.offsetWidth;

      later(function () { garden.classList.add('is-blooming'); }, T(500));
      flowerEls.forEach(function (f, i) {
        later(function () { f.classList.add('is-ready'); }, T(500 + (0.3 + i * 0.4) * 1000 + 1900));
      });
      later(function () { if (!foundCount && activeFlower === null) hint.textContent = C.garden.tap; }, T(3000));
      show(gardenNext, 16000);
    }
  };
  gardenNext.addEventListener('click', function () { goTo('letter'); });

  /* ========================================================================
     SCENE 4 — letter
     ======================================================================== */
  var envelope = $('#envelope'), envelopeWrap = $('#envelopeWrap'), envelopeHint = $('#letterHint');
  var letter = $('#letter'), letterScroll = $('#letterScroll'), letterBody = $('#letterBody');
  var letterSkip = $('#letterSkip'), letterNext = $('#letterNext');
  var chars = [], typing = { raf: 0, start: 0, idx: 0, done: true }, autoFollow = true, opened = false;

  function buildLetter() {
    letterBody.innerHTML = '';
    chars = [];
    var speed = 24, t = 400;
    C.letter.forEach(function (block) {
      var p = document.createElement('p');
      p.className = 'letter__' + block.kind;
      block.text.split(' ').forEach(function (word, wi, arr) {
        var w = document.createElement('span');
        w.className = 'w';
        word.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'c';
          s.textContent = ch;
          w.appendChild(s);
          chars.push({ el: s, t: t });
          t += speed;
          if ('.!?'.indexOf(ch) !== -1) t += 280;
          else if (',;:'.indexOf(ch) !== -1) t += 130;
          else if (ch === '—') t += 160;
        });
        p.appendChild(w);
        if (wi < arr.length - 1) { p.appendChild(document.createTextNode(' ')); t += speed * 0.6; }
      });
      letterBody.appendChild(p);
      t += 520;
    });
  }

  function followScroll() {
    if (!autoFollow || typing.idx === 0) return;
    var last = chars[Math.min(typing.idx, chars.length) - 1].el;
    var bottom = last.offsetTop + last.offsetHeight;
    var view = letterScroll.clientHeight;
    if (bottom - letterScroll.scrollTop > view - 40) letterScroll.scrollTop = bottom - view + 52;
  }

  function stopTyping() { cancelAnimationFrame(typing.raf); }

  function finishTyping(instant) {
    stopTyping();
    typing.done = true;
    chars.forEach(function (c) {
      if (instant) c.el.classList.add('instant');
      c.el.classList.add('on');
    });
    typing.idx = chars.length;
    letterSkip.classList.remove('is-shown');
    later(function () { letterNext.classList.add('is-shown'); }, T(instant ? 200 : 700));
  }

  function startTyping() {
    if (reduced) { finishTyping(true); return; }
    typing = { raf: 0, start: performance.now(), idx: 0, done: false };
    function step(now) {
      var el = now - typing.start;
      while (typing.idx < chars.length && chars[typing.idx].t <= el) {
        chars[typing.idx].el.classList.add('on');
        typing.idx++;
      }
      followScroll();
      if (typing.idx >= chars.length) { finishTyping(false); return; }
      typing.raf = requestAnimationFrame(step);
    }
    typing.raf = requestAnimationFrame(step);
  }

  function openEnvelope() {
    if (opened) return;
    opened = true;
    var c = centerOf(envelope, 0.4);
    engine.burst(c.x, c.y, { count: 30, spread: 0.8, petals: 5 });
    envelope.classList.add('is-open');
    envelopeHint.classList.add('is-hidden');
    later(function () {
      envelopeWrap.classList.add('is-gone');
      letter.classList.add('is-visible');
      later(startTyping, T(900));
      later(function () { if (!typing.done) letterSkip.classList.add('is-shown'); }, T(1800));
    }, T(2100));
  }

  envelope.addEventListener('click', openEnvelope);
  letterSkip.addEventListener('click', function () { finishTyping(true); });
  letterNext.addEventListener('click', function () { goTo('sky'); });
  ['wheel', 'touchstart'].forEach(function (ev) {
    letterScroll.addEventListener(ev, function () { autoFollow = false; }, { passive: true });
  });

  scenes.letter = {
    enter: function () {
      stopTyping();
      opened = false; autoFollow = true;
      envelope.classList.remove('is-open');
      envelopeWrap.classList.remove('is-gone');
      envelopeHint.classList.remove('is-hidden');
      letter.classList.remove('is-visible');
      letterSkip.classList.remove('is-shown');
      letterNext.classList.remove('is-shown');
      buildLetter();
      letterScroll.scrollTop = 0;
      typing = { raf: 0, start: 0, idx: 0, done: false };
    },
    exit: function () { stopTyping(); }
  };

  /* ========================================================================
     SCENE 5 — constellation that draws a "Q"
     ======================================================================== */
  var SKY_STARS = [
    [130, 38], [193, 62], [224, 130], [197, 196], [127, 222],
    [63, 191], [36, 125], [67, 62], [234, 236], [270, 282]
  ];
  var SKY_SIZES = [1.1, 0.8, 1.0, 0.9, 1.2, 0.8, 1.0, 0.85, 0.9, 1.15];
  /* order of taps; `from` = which star the new line starts at; `close` = extra closing line */
  var SKY_SEQ = [
    { i: 0 }, { i: 1, from: 0 }, { i: 2, from: 1 }, { i: 3, from: 2 }, { i: 4, from: 3 },
    { i: 5, from: 4 }, { i: 6, from: 5 }, { i: 7, from: 6, close: 0 }, { i: 8, from: 3 }, { i: 9, from: 8 }
  ];
  var SPARK_D = 'M0 -9 C1.2 -3 3 -1.2 9 0 C3 1.2 1.2 3 0 9 C-1.2 3 -3 1.2 -9 0 C-3 -1.2 -1.2 -3 0 -9Z';

  var skySvg = $('#constellationSvg');
  var skyPrompt = $('#skyPrompt'), skyMessage = $('#skyMessage'), skyNext = $('#skyNext'), skySkip = $('#skySkip');
  var skyStep = 0, skyDone = false, starEls = [], linesG = null;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function buildSky() {
    skySvg.innerHTML = '';
    skySvg.classList.remove('is-complete');
    var defs = el('defs', {});
    defs.innerHTML = '<radialGradient id="skyHalo"><stop offset="0" stop-color="#fff3d6" stop-opacity=".95"/>' +
      '<stop offset=".35" stop-color="#f7c5dc" stop-opacity=".45"/><stop offset="1" stop-color="#cbb6ee" stop-opacity="0"/></radialGradient>';
    skySvg.appendChild(defs);
    linesG = el('g', {});
    skySvg.appendChild(linesG);
    var starsG = el('g', {});
    skySvg.appendChild(starsG);
    starEls = [];

    SKY_STARS.forEach(function (p, i) {
      var g = el('g', { 'class': 'cstar', transform: 'translate(' + p[0] + ' ' + p[1] + ')', role: 'button', tabindex: '-1', 'aria-label': 'Star ' + (i + 1) + ' of ' + SKY_STARS.length });
      g.style.setProperty('--tw', (i * 0.37).toFixed(2) + 's');
      g.appendChild(el('circle', { 'class': 'cstar__halo', r: 17, fill: 'url(#skyHalo)' }));
      var s = el('g', { transform: 'scale(' + SKY_SIZES[i] + ')' });
      s.appendChild(el('path', { 'class': 'cstar__core', d: SPARK_D }));
      g.appendChild(s);
      g.appendChild(el('circle', { 'class': 'cstar__hit', r: 24 }));
      g.addEventListener('click', function () { onStar(i); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStar(i); }
      });
      starsG.appendChild(g);
      starEls.push(g);
    });
  }

  function skyPoint(x, y) {
    var r = skySvg.getBoundingClientRect();
    return { x: r.left + (x / 300) * r.width, y: r.top + (y / 320) * r.height };
  }

  function setNext(i) {
    starEls.forEach(function (s, idx) {
      var isNext = idx === i;
      s.classList.toggle('is-next', isNext);
      s.setAttribute('tabindex', isNext ? '0' : '-1');
    });
  }

  function drawLine(a, b, instant) {
    var p1 = SKY_STARS[a], p2 = SKY_STARS[b];
    var len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    var ln = el('line', { 'class': 'cline', x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] });
    ln.style.setProperty('--len', len.toFixed(1));
    linesG.appendChild(ln);
    if (instant || reduced) { ln.classList.add('is-drawn'); return; }
    void ln.getBoundingClientRect();
    requestAnimationFrame(function () { ln.classList.add('is-drawn'); });
  }

  function onStar(i) {
    if (skyDone) return;
    var step = SKY_SEQ[skyStep];
    if (i !== step.i) {
      var nx = starEls[step.i];
      nx.classList.remove('is-nudge'); void nx.getBoundingClientRect(); nx.classList.add('is-nudge');
      return;
    }
    starEls[i].classList.add('is-lit');
    var pt = skyPoint(SKY_STARS[i][0], SKY_STARS[i][1]);
    engine.burst(pt.x, pt.y, { count: 14, spread: 0.6, size: 0.8 });
    if (step.from !== undefined) drawLine(step.from, i);
    if (step.close !== undefined) later(function () { drawLine(i, step.close); }, T(450));
    skyStep++;
    if (skyStep >= SKY_SEQ.length) { setNext(-1); completeSky(false); }
    else setNext(SKY_SEQ[skyStep].i);
  }

  function completeSky(instant) {
    if (skyDone) return;
    skyDone = true;
    skySkip.classList.remove('is-shown');
    later(function () {
      skySvg.classList.add('is-complete');
      skyPrompt.classList.add('is-dim');
      var c = skyPoint(140, 150);
      engine.burst(c.x, c.y, { count: 80, spread: 1.3 });
    }, T(instant ? 0 : 800));
    show(skyMessage, instant ? 300 : 1700);
    show(skyNext, instant ? 900 : 4200);
  }

  function skipSky() {
    if (skyDone) return;
    starEls.forEach(function (s) { s.classList.remove('is-next'); s.classList.add('is-lit'); s.setAttribute('tabindex', '-1'); });
    SKY_SEQ.forEach(function (st) {
      if (st.from !== undefined) drawLine(st.from, st.i, true);
      if (st.close !== undefined) drawLine(st.i, st.close, true);
    });
    skyStep = SKY_SEQ.length;
    completeSky(true);
  }

  scenes.sky = {
    enter: function () {
      skyDone = false; skyStep = 0;
      buildSky();
      skyPrompt.classList.remove('is-dim');
      [skyMessage, skyNext, skySkip].forEach(function (b) { b.classList.remove('is-shown'); });
      later(function () { setNext(0); }, T(1400));
      later(function () { if (!skyDone) skySkip.classList.add('is-shown'); }, T(14000));
    }
  };
  skyNext.addEventListener('click', function () { goTo('finale'); });
  skySkip.addEventListener('click', skipSky);

  /* ========================================================================
     SCENE 6 — finale
     ======================================================================== */
  var heroEl = $('#heroBloom');
  heroEl.innerHTML = Flowers.hero();
  var replayBtn = $('#replayButton'), finaleDate = $('#finaleDate');

  scenes.finale = {
    enter: function () {
      heroEl.classList.remove('is-blooming');
      restartReveal($('#scene-finale'));
      later(function () { heroEl.classList.add('is-blooming'); }, T(500));
      later(function () {
        var c = centerOf(heroEl);
        engine.burst(c.x, c.y, { count: 70, spread: 1.4, petals: 20 });
      }, T(2000));
      later(function () {
        var w = window.innerWidth, h = window.innerHeight;
        engine.burst(w * 0.2, h * 0.5, { count: 30, spread: 0.9, petals: 8 });
        engine.burst(w * 0.8, h * 0.5, { count: 30, spread: 0.9, petals: 8 });
      }, T(3400));
      show(finaleDate, 7200);
      show(replayBtn, 8200);
    }
  };

  $('#scene-finale').addEventListener('pointerdown', function (e) {
    if (current === 'finale' && !e.target.closest('button')) engine.sparkle(e.clientX, e.clientY);
  });

  replayBtn.addEventListener('click', function () { goTo('intro'); });

  /* ========================================================================
     Boot
     ======================================================================== */
  $$('[data-split]').forEach(splitText);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) engine.stop(); else engine.start();
  });

  engine.start();
  goTo('intro');
})();
