/* ==========================================================================
   music.js — discreet soundtrack control.
   - Never autoplays: playback starts from the "Step inside" tap.
   - If no file exists at content.js → music.src, the button stays hidden and
     the experience carries on silently (nothing pretends to be playing).
   - Pauses automatically when the tab is hidden; respects a manual pause.
   ========================================================================== */
(function () {
  'use strict';

  var cfg = (window.QUINN_CONTENT && window.QUINN_CONTENT.music) || {};
  var audio = document.getElementById('soundtrack');
  var btn = document.getElementById('musicButton');

  var started = false;
  var failed = false;
  var userPaused = false;
  var resumeOnShow = false;
  var fadeTimer = 0;
  var targetVolume = typeof cfg.volume === 'number' ? cfg.volume : 0.5;

  function setState(state) {
    if (!btn) return;
    btn.dataset.state = state;
    var playing = state === 'playing';
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    btn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    btn.title = playing ? 'Pause music' : 'Play music';
  }

  function markUnavailable() {
    if (failed) return;
    failed = true;
    clearInterval(fadeTimer);
    if (btn) { btn.classList.remove('is-available'); btn.dataset.state = 'unavailable'; }
    if (window.console && console.info) {
      console.info('[Quinn] No soundtrack found at "' + cfg.src + '". Add a file there to enable music; the site works silently without it.');
    }
  }

  function fadeTo(vol, ms) {
    clearInterval(fadeTimer);
    var from = audio.volume, steps = Math.max(1, Math.round(ms / 50)), n = 0;
    fadeTimer = setInterval(function () {
      n++;
      audio.volume = Math.max(0, Math.min(1, from + (vol - from) * (n / steps)));
      if (n >= steps) clearInterval(fadeTimer);
    }, 50);
  }

  function attemptPlay() {
    var p;
    try { p = audio.play(); } catch (e) { markUnavailable(); return; }
    if (p && typeof p.then === 'function') {
      p.then(function () {
        if (failed) return;
        setState('playing');
        fadeTo(targetVolume, 2400);
      }).catch(function (err) {
        if (err && err.name === 'NotAllowedError') setState('paused'); /* blocked: the button lets her start it */
        else markUnavailable();
      });
    }
  }

  function start() {
    if (started || failed) return;
    started = true;
    if (!audio || !cfg.src) { markUnavailable(); return; }
    audio.addEventListener('error', markUnavailable);
    audio.volume = 0;
    audio.src = cfg.src;
    if (btn) btn.classList.add('is-available');
    setState('paused');
    attemptPlay();
  }

  function toggle() {
    if (!started || failed || !audio) return;
    if (!audio.paused) {
      userPaused = true;
      clearInterval(fadeTimer);
      audio.pause();
      setState('paused');
    } else {
      userPaused = false;
      attemptPlay();
    }
  }

  if (btn) btn.addEventListener('click', toggle);

  document.addEventListener('visibilitychange', function () {
    if (!started || failed || !audio) return;
    if (document.hidden) {
      resumeOnShow = !audio.paused;
      if (resumeOnShow) { audio.pause(); }
    } else if (resumeOnShow && !userPaused) {
      resumeOnShow = false;
      attemptPlay();
    }
  });

  if (audio) {
    audio.addEventListener('pause', function () { if (!failed && started && (audio.paused)) setState('paused'); });
    audio.addEventListener('playing', function () { if (!failed) setState('playing'); });
  }

  window.QuinnMusic = { start: start, toggle: toggle };
})();
