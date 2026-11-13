// gs-bridge.js — the one shared contract between a station game and the hub.
// The hub (index.html) loads each game in a full-window iframe and sends it the round state ~4x a second.
// The game never runs its own lesson clock: it asks GS what phase it is in and freezes when GS.paused.
// Opened on its own (not in the hub) the bridge runs a local clock with a small dev bar, so every game can be
// played and tested standalone:  games/03-noir/index.html?R=120&learn=30
//
// Usage in a game:
//   GS.init({ id: 3, title: 'The Case of the …', mode: 'coop' | 'vs', learnSeconds: 90,
//             controls: { p1: 'W A S D + F', p2: 'Arrows + Enter' },
//             onRound(roundId) { resetEverything(); },          // a new pair has arrived: reset, start the Learn part
//             onPhase(phase, prev) { ... },                     // 'idle' | 'learn' | 'play' | 'over'
//             onPause(paused) { ... } });
//   each frame:  if (!GS.running) { drawAttractOrFrozen(); } else { update(dt); }   GS.endFrame();
//   GS.score(p1, p2)  (coop: GS.score(team))   GS.sfx('pop')   GS.held(1,'left')  GS.hit(2,'a')
(function () {
  'use strict';
  const GS = (window.GS = {});
  const qs = new URLSearchParams(location.search);
  const embedded = window.parent !== window && qs.get('standalone') !== '1';
  let cfg = { id: 0, title: 'Game', mode: 'vs', learnSeconds: 90, controls: {} };

  // ---------------- state ----------------
  let st = { active: false, roundId: 0, t: 0, R: Number(qs.get('R')) || 300, paused: false, banner: '' };
  let skipped = false, phase = 'idle', lastRound = -1, lastPaused = false;
  let scores = [0, 0];
  GS.phase = 'idle'; GS.paused = false; GS.running = false; GS.t = 0; GS.R = st.R;
  GS.embedded = embedded;

  function computePhase() {
    if (!st.active) return 'idle';
    if (st.t >= st.R) return 'over';
    if (st.t < cfg.learnSeconds && !skipped) return 'learn';
    return 'play';
  }

  function apply(next) {
    st = Object.assign({}, st, next);
    if (st.active && st.roundId !== lastRound) {
      lastRound = st.roundId; skipped = false; scores = [0, 0];
      try { cfg.onRound && cfg.onRound(st.roundId); } catch (e) { console.error(e); }
    }
    const p = computePhase();
    if (p !== phase) {
      const prev = phase; phase = p;
      if (p === 'play' && prev === 'learn') toast('TEST TIME — points count now!');
      try { cfg.onPhase && cfg.onPhase(p, prev); } catch (e) { console.error(e); }
    }
    if (st.paused !== lastPaused) {
      lastPaused = st.paused;
      try { cfg.onPause && cfg.onPause(st.paused); } catch (e) { console.error(e); }
    }
    GS.phase = phase; GS.paused = !!st.paused; GS.t = st.t; GS.R = st.R;
    GS.running = (phase === 'learn' || phase === 'play') && !st.paused;
    render();
  }

  GS.learnLeft = () => Math.max(0, cfg.learnSeconds - st.t);
  GS.timeLeft = () => Math.max(0, st.R - st.t);
  GS.skipLearn = () => { if (phase === 'learn') { skipped = true; apply({}); } };

  GS.score = function (a, b) { scores = [a | 0, b == null ? 0 : b | 0]; renderPill(); };
  GS.scores = () => scores.slice();

  // ---------------- messages from the hub ----------------
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.type !== 'gs-state') return;
    // the hub sends t at send time; keep advancing locally between messages so motion stays smooth
    localBase = { t: m.t, at: performance.now(), paused: m.paused };
    apply({ active: m.active, roundId: m.roundId, t: m.t, R: m.R, paused: m.paused, banner: m.banner || '' });
  });
  let localBase = null;
  setInterval(() => {
    if (embedded && localBase && st.active && !st.paused) {
      const t = localBase.t + (performance.now() - localBase.at) / 1000;
      if (t - localBase.t < 3) apply({ t }); // stop extrapolating if the hub goes quiet
    }
  }, 100);
  setInterval(() => {
    if (!embedded) return;
    window.parent.postMessage({ type: 'gs-status', id: cfg.id, title: cfg.title, mode: cfg.mode, roundId: st.roundId, phase, scores }, '*');
  }, 500);

  // ---------------- standalone clock + dev bar ----------------
  let devClock = null;
  function devStart() { devClock = { start: performance.now(), pausedAt: 0, pausedTotal: 0 }; apply({ active: true, roundId: st.roundId + 1, t: 0, paused: false }); }
  function devPause() {
    if (!devClock) return;
    if (st.paused) { devClock.pausedTotal += performance.now() - devClock.pausedAt; apply({ paused: false }); }
    else { devClock.pausedAt = performance.now(); apply({ paused: true, banner: 'Paused from the dev bar' }); }
  }
  function devEnd() { if (devClock) { devClock.start = performance.now() - st.R * 1000 - devClock.pausedTotal; } }
  setInterval(() => {
    if (embedded || !devClock || st.paused) return;
    apply({ t: (performance.now() - devClock.start - devClock.pausedTotal) / 1000 });
  }, 100);

  // ---------------- input ----------------
  // P1: W A S D move, F = a, G = b.   P2: arrow keys move, Enter = a, Right Shift = b.
  const MAP = {
    1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyF'], b: ['KeyG'] },
    2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['Enter', 'NumpadEnter'], b: ['ShiftRight', 'Slash'] },
  };
  GS.MAP = MAP;
  const held = new Set(), hits = new Set();
  const BLOCK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Tab']);
  window.addEventListener('keydown', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    if (!e.repeat) hits.add(e.code);
    held.add(e.code); unlockAudio();
    if (!embedded) {
      if (e.code === 'F2') devStart();
      if (e.code === 'F3') devPause();
      if (e.code === 'F4') GS.skipLearn();
      if (e.code === 'F6') devEnd();
    }
  }, { passive: false });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
  window.addEventListener('pointerdown', unlockAudio);
  GS.held = (p, btn) => MAP[p][btn].some((c) => held.has(c));
  GS.hit = (p, btn) => MAP[p][btn].some((c) => hits.has(c));
  GS.key = (code) => held.has(code);
  GS.keyHit = (code) => hits.has(code);
  GS.endFrame = () => hits.clear(); // call once at the end of every frame

  // ---------------- sound (shared SOUND kit, optional) ----------------
  let actx = null, kit = null, kitBase = 0;
  GS.muted = qs.get('mute') === '1';
  function unlockAudio() {
    if (!window.SOUND || actx) { if (actx && actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      kit = window.SOUND.kit(actx, { start: 0, delay: 0 });
      kitBase = actx.currentTime;
      GS.audio = actx; GS.kit = kit;
    } catch (e) { actx = null; }
  }
  // GS.sfx(name, params) plays a SOUND-kit effect now. GS.sounds() lists the names.
  GS.sfx = function (name, p) {
    if (GS.muted || !kit || !GS.running && !(p && p.always)) return;
    try { kit.play(name, actx.currentTime - kitBase + 0.01, p); } catch (e) {}
  };
  GS.tone = function (p) { if (!GS.muted && kit) try { kit.tone(actx.currentTime - kitBase + 0.01, p); } catch (e) {} };
  GS.sounds = () => (kit ? kit.sounds : []);

  // ---------------- canvas helper ----------------
  // GS.fit(canvas, 1280, 720): letterboxes a fixed-size canvas into the window.
  GS.fit = function (cv, w, h) {
    w = w || 1280; h = h || 720;
    const f = () => {
      const s = Math.min(innerWidth / w, innerHeight / h);
      Object.assign(cv.style, { position: 'fixed', width: w * s + 'px', height: h * s + 'px', left: (innerWidth - w * s) / 2 + 'px', top: (innerHeight - h * s) / 2 + 'px' });
    };
    addEventListener('resize', f); f();
  };

  // ---------------- overlays ----------------
  const css = `
  #gs-ui{position:fixed;inset:0;pointer-events:none;z-index:99999;font-family:'Inter',system-ui,sans-serif;color:#fff}
  #gs-pill{position:absolute;top:10px;right:12px;background:rgba(10,14,24,.82);border:2px solid rgba(255,255,255,.35);border-radius:14px;padding:6px 14px;font-weight:800;font-size:22px;display:flex;gap:12px;align-items:center;letter-spacing:.5px}
  #gs-pill .ph{font-size:13px;padding:3px 8px;border-radius:7px;background:#3a7bd5}
  #gs-pill .ph.play{background:#e8453c}
  #gs-veil{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;text-align:center;background:rgba(8,10,18,.82);backdrop-filter:blur(3px)}
  #gs-veil h1{font-size:64px;margin:0 0 12px;font-weight:900}
  #gs-veil p{font-size:28px;margin:6px 0;max-width:900px;opacity:.95}
  #gs-veil .big{font-size:110px;font-weight:900}
  #gs-toast{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);opacity:0;font-size:58px;font-weight:900;background:#e8453c;padding:14px 34px;border-radius:18px;transition:all .35s cubic-bezier(.2,1.6,.4,1)}
  #gs-toast.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
  #gs-dev{position:absolute;left:10px;bottom:10px;pointer-events:auto;background:rgba(0,0,0,.7);border-radius:10px;padding:6px 8px;font-size:13px}
  #gs-dev button{font:inherit;margin:2px;padding:4px 8px;border-radius:6px;border:0;cursor:pointer}`;
  let ui, pill, veil, toastEl;
  function build() {
    if (ui) return;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    ui = document.createElement('div'); ui.id = 'gs-ui';
    ui.innerHTML = '<div id="gs-pill"></div><div id="gs-veil"></div><div id="gs-toast"></div>';
    document.body.appendChild(ui);
    pill = ui.querySelector('#gs-pill'); veil = ui.querySelector('#gs-veil'); toastEl = ui.querySelector('#gs-toast');
    if (!embedded) {
      const d = document.createElement('div'); d.id = 'gs-dev';
      d.innerHTML = 'DEV <button data-k="s">F2 start</button><button data-k="p">F3 pause</button><button data-k="l">F4 skip learn</button><button data-k="e">F6 end</button>';
      d.onclick = (e) => { const k = e.target.dataset.k; if (k === 's') devStart(); if (k === 'p') devPause(); if (k === 'l') GS.skipLearn(); if (k === 'e') devEnd(); };
      ui.appendChild(d);
    }
  }
  function mmss(s) { s = Math.ceil(Math.max(0, s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function renderPill() {
    if (!pill) return;
    if (phase === 'learn') pill.innerHTML = `<span class="ph">LEARN</span>${mmss(GS.learnLeft())}<span style="opacity:.6;font-size:15px">then test</span>`;
    else if (phase === 'play') pill.innerHTML = `<span class="ph play">TEST</span>${mmss(GS.timeLeft())}`;
    else pill.innerHTML = `<span class="ph">STATION ${cfg.id}</span>`;
  }
  let toastT = 0;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 2200); }
  GS.toast = toast;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function render() {
    build(); renderPill();
    let html = '';
    if (st.paused && phase !== 'idle') {
      html = `<h1>⏸ PAUSED</h1><p>Hands off the keyboard — eyes on the teacher.</p>${st.banner ? `<p style="font-size:34px;font-weight:800;color:#ffd84a">${esc(st.banner)}</p>` : ''}`;
    } else if (phase === 'idle') {
      html = `<p style="opacity:.7">STATION ${cfg.id}</p><h1>${esc(cfg.title)}</h1><p>${cfg.mode === 'coop' ? '🤝 Work together' : '⚔️ Player vs player'}</p>
        ${cfg.controls.p1 ? `<p>Player 1: <b>${esc(cfg.controls.p1)}</b></p>` : ''}${cfg.controls.p2 ? `<p>Player 2: <b>${esc(cfg.controls.p2)}</b></p>` : ''}
        <p style="opacity:.6;margin-top:24px">${embedded ? 'Waiting for the teacher to start…' : 'Standalone test: press F2 to start a round'}</p>`;
    } else if (phase === 'over') {
      const sc = cfg.mode === 'coop' ? `<div class="big">${scores[0]}</div><p>team points</p>` : `<div class="big">${scores[0]} – ${scores[1]}</div><p>${scores[0] === scores[1] ? 'A draw!' : 'Player ' + (scores[0] > scores[1] ? 1 : 2) + ' wins!'}</p>`;
      html = `<h1>TIME'S UP!</h1>${sc}<p style="margin-top:20px;font-size:34px;font-weight:800;color:#ffd84a">Go to the table → answer Sheet ${cfg.id}</p>`;
    }
    veil.innerHTML = html; veil.style.display = html ? 'flex' : 'none';
    veil.style.background = phase === 'idle' ? 'rgba(8,10,18,.55)' : 'rgba(8,10,18,.82)';
  }

  GS.init = function (c) {
    cfg = Object.assign(cfg, c);
    if (qs.get('learn')) cfg.learnSeconds = Number(qs.get('learn'));
    if (document.body) render(); else addEventListener('DOMContentLoaded', render);
    if (!embedded && qs.get('autostart') === '1') setTimeout(devStart, 300);
    if (embedded) window.parent.postMessage({ type: 'gs-ready', id: cfg.id }, '*');
  };
  // test hook for headless checks: GS._set({active:true, roundId:1, t:100})
  GS._set = (o) => { localBase = null; devClock = null; apply(o); };
})();
