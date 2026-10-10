/* ==========================================================================
   particles.js — one lightweight canvas that powers every scene's atmosphere:
   twinkling stars, drifting glow motes, falling petals, fireflies, and
   short-lived sparkle bursts. Each scene just asks for a "preset".
   Glow and petal sprites are pre-rendered once, so each frame is mostly
   cheap drawImage calls (friendly to modest Android phones).
   ========================================================================== */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* How many of each thing a scene wants (tuned for a ~390x844 phone).
     `bright` scales star brightness. */
  var PRESETS = {
    intro:  { stars: 120, bright: 1.0,  motes: 16, petals: 0,  flies: 0  },
    moon:   { stars: 70,  bright: 0.85, motes: 8,  petals: 12, flies: 12 },
    garden: { stars: 26,  bright: 0.55, motes: 6,  petals: 12, flies: 14 },
    letter: { stars: 54,  bright: 0.75, motes: 12, petals: 8,  flies: 8  },
    sky:    { stars: 140, bright: 1.1,  motes: 14, petals: 0,  flies: 4  },
    finale: { stars: 64,  bright: 0.85, motes: 14, petals: 26, flies: 22 }
  };

  var GLOW_COLORS = ['255,240,214', '255,205,225', '214,196,250', '255,255,255', '255,226,160'];
  var STAR_TINTS = ['#fff7ec', '#fff7ec', '#ffe3ee', '#e6dcff', '#fff0cf'];
  var PETAL_COLORS = [
    ['#fbd0dc', '#ec9cb6'],
    ['#fff1dc', '#efcf95'],
    ['#e1d2f8', '#b99be3'],
    ['#fff3f1', '#f4bdcb']
  ];

  function glowSprite(rgb, size) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(' + rgb + ',1)');
    grad.addColorStop(0.22, 'rgba(' + rgb + ',0.55)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }

  function petalSprite(c1, c2, size) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, size * 0.05, 0, size * 0.95);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(size / 2, size * 0.96);
    g.bezierCurveTo(size * 0.02, size * 0.68, size * 0.12, size * 0.1, size / 2, size * 0.04);
    g.bezierCurveTo(size * 0.88, size * 0.1, size * 0.98, size * 0.68, size / 2, size * 0.96);
    g.fill();
    return c;
  }

  class Engine {
    constructor(canvas, opts) {
      opts = opts || {};
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.reduced = !!opts.reduced;
      this.quality = opts.quality || 1;
      this.w = 0; this.h = 0; this.dpr = 1; this.areaK = 1;
      this.t = 0; this.last = 0; this.running = false; this.raf = 0;
      this.stars = []; this.motes = []; this.petals = []; this.flies = []; this.sparks = [];
      this.presetName = 'intro';
      this.preset = PRESETS.intro;
      this.hooks = [];
      this.glow = GLOW_COLORS.map(function (c) { return glowSprite(c, 64); });
      this.petalSprites = PETAL_COLORS.map(function (c) { return petalSprite(c[0], c[1], 48); });

      this.tick = this.tick.bind(this);
      var self = this;
      this._resizeTimer = 0;
      window.addEventListener('resize', function () {
        clearTimeout(self._resizeTimer);
        self._resizeTimer = setTimeout(function () { self.resize(); }, 120);
      });
      this.resize();
    }

    /* ---------- sizing ---------- */
    resize() {
      var w = window.innerWidth, h = window.innerHeight;
      var maxDpr = this.quality < 0.8 ? 1.25 : 2;
      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      var ow = this.w, oh = this.h;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.areaK = clamp((w * h) / 329160, 0.55, 2.2) * this.quality;

      if (ow && oh) {
        var rx = w / ow, ry = h / oh;
        [this.stars, this.motes, this.petals, this.flies].forEach(function (arr) {
          arr.forEach(function (p) { p.x *= rx; p.y *= ry; });
        });
      }
      if (this.reduced) this.renderStatic();
    }

    /* ---------- control ---------- */
    setPreset(name) {
      if (!PRESETS[name]) return;
      this.presetName = name;
      this.preset = PRESETS[name];
      if (this.reduced) this.renderStatic();
    }

    onFrame(fn) { this.hooks.push(fn); }

    start() {
      if (this.reduced) { this.renderStatic(); return; }
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }

    /* ---------- factories ---------- */
    makeStar(full) {
      var big = Math.random() < 0.07;
      return {
        x: rand(0, this.w), y: rand(0, this.h * 0.95),
        r: rand(0.4, 1.4) * (big ? 1.7 : 1),
        base: rand(0.35, 0.95), speed: rand(0.6, 2.2), phase: rand(0, TAU),
        color: pick(STAR_TINTS), big: big, gi: (Math.random() * this.glow.length) | 0,
        v: full ? 1 : 0, dying: false
      };
    }
    makeMote() {
      return {
        x: rand(0, this.w), y: rand(0, this.h),
        size: rand(10, 28), vy: -rand(5, 14), vx: rand(-3, 3),
        sway: rand(6, 20), swaySpeed: rand(0.2, 0.6), phase: rand(0, TAU),
        alpha: rand(0.18, 0.5), gi: (Math.random() * 3) | 0, v: 0, dying: false
      };
    }
    makePetal() {
      return {
        x: rand(0, this.w), y: rand(-this.h * 0.7, -12),
        size: rand(11, 19), vy: rand(22, 44), vx: rand(-8, 8),
        sway: rand(14, 38), swaySpeed: rand(0.4, 1.0), phase: rand(0, TAU),
        rot: rand(0, TAU), spin: rand(-1.1, 1.1),
        flip: rand(0, TAU), flipSpeed: rand(1.4, 3.0),
        alpha: rand(0.6, 0.92), pi: (Math.random() * this.petalSprites.length) | 0,
        v: 0, dying: false
      };
    }
    makeFly() {
      return {
        x: rand(0, this.w), y: rand(this.h * 0.25, this.h),
        ang: rand(0, TAU), speed: rand(10, 26), size: rand(18, 34),
        pulse: rand(0.8, 1.8), phase: rand(0, TAU),
        gi: Math.random() < 0.7 ? 4 : 1, v: 0, dying: false
      };
    }

    /* ---------- population control ---------- */
    fill(arr, target, make, perFrame) {
      var active = 0, i;
      for (i = 0; i < arr.length; i++) if (!arr[i].dying) active++;
      if (active < target) {
        for (i = 0; i < perFrame && active < target; i++) { arr.push(make.call(this)); active++; }
      } else if (active > target) {
        var marked = 0;
        for (i = 0; i < arr.length && marked < perFrame; i++) {
          if (!arr[i].dying) { arr[i].dying = true; marked++; }
        }
      }
    }

    reconcile() {
      var p = this.preset, k = this.areaK;
      this.fill(this.stars, Math.round(p.stars * k), this.makeStar, 3);
      this.fill(this.motes, Math.round(p.motes * k), this.makeMote, 1);
      this.fill(this.petals, Math.round(p.petals * k), this.makePetal, 1);
      this.fill(this.flies, Math.round(p.flies * k), this.makeFly, 1);
    }

    /* ---------- fade helper: returns false if the particle should be removed ---------- */
    fade(p, dt, rate) {
      p.v += (p.dying ? -1 : 1) * dt * rate;
      if (p.v > 1) p.v = 1;
      if (p.v <= 0) { if (p.dying) return false; p.v = 0; }
      return true;
    }

    /* ---------- drawing ---------- */
    drawStars(dt, t) {
      var ctx = this.ctx, bright = this.preset.bright, arr = this.stars;
      for (var i = arr.length - 1; i >= 0; i--) {
        var s = arr[i];
        if (!this.fade(s, dt, 0.6)) { arr.splice(i, 1); continue; }
        var tw = 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        var a = clamp(s.base * tw * s.v * bright, 0, 1);
        if (a < 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
        if (s.big) {
          var gs = s.r * 14;
          ctx.globalAlpha = a * 0.5;
          ctx.drawImage(this.glow[s.gi], s.x - gs / 2, s.y - gs / 2, gs, gs);
        }
      }
    }

    drawMotes(dt, t) {
      var ctx = this.ctx, arr = this.motes;
      for (var i = arr.length - 1; i >= 0; i--) {
        var m = arr[i];
        if (!this.fade(m, dt, 0.4)) { arr.splice(i, 1); continue; }
        m.y += m.vy * dt;
        m.x += (m.vx + Math.cos(t * m.swaySpeed + m.phase) * m.sway * 0.4) * dt;
        if (m.y < -m.size) { m.y = this.h + m.size; m.x = rand(0, this.w); }
        ctx.globalAlpha = m.alpha * m.v;
        ctx.drawImage(this.glow[m.gi], m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
      }
    }

    drawFlies(dt, t) {
      var ctx = this.ctx, arr = this.flies, w = this.w, h = this.h;
      for (var i = arr.length - 1; i >= 0; i--) {
        var f = arr[i];
        if (!this.fade(f, dt, 0.5)) { arr.splice(i, 1); continue; }
        f.ang += (Math.sin(t * 0.7 + f.phase) * 1.3 + rand(-0.6, 0.6)) * dt;
        /* gently steer back toward the middle if wandering off-screen */
        if (f.x < 20 || f.x > w - 20 || f.y < h * 0.12 || f.y > h - 10) {
          var toward = Math.atan2(h * 0.6 - f.y, w * 0.5 - f.x);
          var diff = Math.atan2(Math.sin(toward - f.ang), Math.cos(toward - f.ang));
          f.ang += diff * 1.8 * dt;
        }
        f.x += Math.cos(f.ang) * f.speed * dt;
        f.y += Math.sin(f.ang) * f.speed * dt;
        var pulse = 0.5 + 0.5 * Math.sin(t * f.pulse + f.phase);
        var a = (0.25 + 0.75 * pulse * pulse) * f.v;
        ctx.globalAlpha = a;
        var s = f.size * (0.7 + 0.3 * pulse);
        ctx.drawImage(this.glow[f.gi], f.x - s / 2, f.y - s / 2, s, s);
      }
    }

    drawPetals(dt, t) {
      var ctx = this.ctx, arr = this.petals;
      for (var i = arr.length - 1; i >= 0; i--) {
        var p = arr[i];
        if (!this.fade(p, dt, 0.5)) { arr.splice(i, 1); continue; }
        p.y += p.vy * dt;
        p.x += (p.vx + Math.cos(t * p.swaySpeed + p.phase) * p.sway) * dt;
        p.rot += p.spin * dt;
        p.flip += p.flipSpeed * dt;
        if (p.y > this.h + p.size) { p.y = -p.size; p.x = rand(0, this.w); }
        if (p.x < -30) p.x = this.w + 20; else if (p.x > this.w + 30) p.x = -20;
        ctx.globalAlpha = p.alpha * p.v;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(0.4 + 0.6 * Math.abs(Math.cos(p.flip)), 1);
        ctx.drawImage(this.petalSprites[p.pi], -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    }

    drawSparks(dt, petalPass) {
      var ctx = this.ctx, arr = this.sparks;
      for (var i = arr.length - 1; i >= 0; i--) {
        var s = arr[i];
        if (!petalPass) {
          /* physics runs once per frame, in the glow pass */
          s.life += dt;
          if (s.life >= s.max) { arr.splice(i, 1); continue; }
          var drag = Math.pow(0.9, dt * 10);
          s.vx *= drag; s.vy = s.vy * drag + (s.petal ? 70 : 24) * dt;
          s.x += s.vx * dt; s.y += s.vy * dt;
          s.rot += s.spin * dt;
        }
        if (!!s.petal !== !!petalPass) continue;
        var k = 1 - s.life / s.max;
        if (petalPass) {
          ctx.globalAlpha = clamp(k * 1.4, 0, 0.95);
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rot);
          ctx.drawImage(this.petalSprites[s.pi], -s.size / 2, -s.size / 2, s.size, s.size);
          ctx.restore();
        } else {
          ctx.globalAlpha = Math.pow(k, 1.3);
          var sz = s.size * (0.5 + 0.5 * k);
          ctx.drawImage(this.glow[s.gi], s.x - sz / 2, s.y - sz / 2, sz, sz);
        }
      }
    }

    tick(now) {
      if (!this.running) return;
      this.raf = requestAnimationFrame(this.tick);
      var dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
      this.last = now;
      this.t += dt;
      var t = this.t, ctx = this.ctx;

      this.reconcile();
      ctx.clearRect(0, 0, this.w, this.h);

      ctx.globalCompositeOperation = 'lighter';
      this.drawStars(dt, t);
      this.drawMotes(dt, t);
      this.drawFlies(dt, t);
      this.drawSparks(dt, false);

      ctx.globalCompositeOperation = 'source-over';
      this.drawPetals(dt, t);
      this.drawSparks(dt, true);

      ctx.globalAlpha = 1;
      for (var i = 0; i < this.hooks.length; i++) this.hooks[i](t, dt);
    }

    /* Reduced-motion: a calm, still star field and nothing else. */
    renderStatic() {
      this.stars.length = 0;
      var n = Math.round(this.preset.stars * this.areaK);
      for (var i = 0; i < n; i++) this.stars.push(this.makeStar(true));
      var ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.globalCompositeOperation = 'lighter';
      this.drawStars(0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    /* ---------- public effects ---------- */
    burst(x, y, o) {
      if (this.reduced) return;
      o = o || {};
      var n = Math.round((o.count || 28) * Math.min(1, this.quality + 0.25));
      var sp = o.spread || 1, sz = o.size || 1, i, a, v;
      for (i = 0; i < n; i++) {
        a = rand(0, TAU); v = rand(50, 230) * sp;
        this.sparks.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
          life: 0, max: rand(0.9, 1.7), size: rand(12, 28) * sz,
          gi: (Math.random() * this.glow.length) | 0, petal: false, rot: 0, spin: 0
        });
      }
      var pn = Math.round((o.petals || 0) * Math.min(1, this.quality + 0.25));
      for (i = 0; i < pn; i++) {
        a = rand(0, TAU); v = rand(60, 200) * sp;
        this.sparks.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60,
          life: 0, max: rand(1.6, 2.8), size: rand(13, 21),
          pi: (Math.random() * this.petalSprites.length) | 0, petal: true,
          rot: rand(0, TAU), spin: rand(-4, 4)
        });
      }
      if (this.sparks.length > 260) this.sparks.splice(0, this.sparks.length - 260);
    }

    sparkle(x, y) { this.burst(x, y, { count: 6, spread: 0.45, size: 0.65 }); }
  }

  window.QuinnParticles = { Engine: Engine };
})();
