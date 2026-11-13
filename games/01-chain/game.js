// game.js — Station 1 "Chain Reaction": two-player polymer-chain Snake in a 16-bit RPG world.
(function () {
  'use strict';
  const { LW, LH, P, C, put, rect, text, textC, textW, win, bay } = PX;
  const hl = PX.hline;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, 1280, 720);
  SCENES.preload();

  const AY = 24, COLS = 40, LEARN_ROWS = 13, TEST_ROWS = 18;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const PCOL = [
    { K: P.K, h: C('#ffd0e0'), H: C('#ff5a8a'), M: C('#b02a6a'), name: 'P1', txt: C('#ff8ab0') },
    { K: P.K, h: C('#c8fcff'), H: C('#4ad8ff'), M: C('#1a78c8'), name: 'P2', txt: C('#6ef0ff') },
  ];
  const BOND = C('#d8d8f0');

  // ---------------- content: the quest (LEARN) ----------------
  // when: 'enter' | 'pickup' | n (monomers eaten). fb = fallback seconds after zone entry.
  const ZONES = [
    { scene: 'rig', title: 'QUEST: WHERE DO POLYMERS COME FROM?', pages: [
      { when: 'enter', fb: 0, l: ['WELCOME, CHAINS! YOU ARE TWO POLYMERS-', 'TO-BE. FOLLOW THE JOURNEY: 5 ZONES.'] },
      { when: 'enter', fb: 3.5, l: ['STEER INTO THE GLOWING ITEMS.', 'EACH ONE TEACHES YOU A STEP!'] }] },
    { scene: 'rig', title: 'ZONE 1/5: THE OIL RIG', pickup: { kind: 'barrel', label: 'CRUDE OIL', x: 21, y: 8 }, pages: [
      { when: 'enter', fb: 0, l: ['MOST POLYMERS ARE MADE FROM CRUDE OIL.', 'IT IS DRILLED (EXTRACTED) AT A RIG.'] },
      { when: 'pickup', fb: 7, l: ['CRUDE OIL IS FINITE (NON-RENEWABLE):', 'ONE DAY IT WILL RUN OUT.'] }] },
    { scene: 'refinery', title: 'ZONE 2/5: THE REFINERY', pickup: { kind: 'flask', label: 'FRACTIONS', x: 11, y: 8 }, pages: [
      { when: 'enter', fb: 0, l: ['CRUDE OIL IS PIPED TO A REFINERY.', 'THE TALL TOWER SPLITS IT INTO FRACTIONS.'] },
      { when: 'pickup', fb: 7, l: ['FRACTIONAL DISTILLATION: FRACTIONS', 'ARE SEPARATED BY BOILING POINT.'] }] },
    { scene: 'cracker', title: 'ZONE 3/5: THE CRACKER', pickup: { kind: 'ethene', label: 'ETHENE', x: 20, y: 8 }, pages: [
      { when: 'enter', fb: 0, l: ['HEAVY FRACTIONS ARE CRACKED:', 'HEAT + A CATALYST BREAK THEM UP.'] },
      { when: 'pickup', fb: 7, l: ['CRACKING MAKES SMALLER MOLECULES,', 'SUCH AS ETHENE.'] }] },
    { scene: 'field', title: 'ZONE 4/5: THE MONOMER FIELD', monomers: 7, pages: [
      { when: 'enter', fb: 0, l: ['ETHENE IS A MONOMER: ONE SMALL UNIT.', 'EAT THEM - WATCH YOUR CHAIN GROW!'] },
      { when: 1, fb: 5.5, l: ['POLYMERISATION JOINS THOUSANDS OF', 'MONOMERS INTO A LONG CHAIN: A POLYMER.'] },
      { when: 3, fb: 11, l: ['MANY ETHENE > POLY(ETHENE) = POLYTHENE.', "'POLY' = MANY.   'MER' = UNIT."] },
      { when: 5, fb: 16, l: ['POLYMERS ARE SUPPLIED TO FACTORIES', 'AS GRANULES (PELLETS).'] }] },
    { scene: 'farm', title: 'ZONE 5/5: THE BIOPOLYMER FARM', pickup: { kind: 'corn', label: 'CORN STARCH', x: 20, y: 7 }, pages: [
      { when: 'enter', fb: 0, l: ['BIOPOLYMERS ARE MADE FROM PLANTS:', 'A RENEWABLE SOURCE.'] },
      { when: 'pickup', fb: 6, l: ['PLA IS MADE FROM CORN STARCH OR SUGAR', 'CANE. PLA IS BIODEGRADABLE!'] },
      { when: 'pickup', fb: 11, l: ['PLA IS USED FOR 3D-PRINTING FILAMENT', 'AND FOOD PACKAGING.'] }] },
    { scene: 'ready', title: 'QUEST COMPLETE!', pages: [] },
  ];
  const ZSTART = [0, 7, 19, 31, 43, 63, 77]; // lesson seconds (scaled to learnSeconds)

  // ---------------- content: process-gate questions (TEST) ----------------
  const QS = [
    { q: ['WHICH STEP SPLITS CRUDE OIL', 'BY BOILING POINT?'], a: 'FRACTIONAL DISTILLATION', w: ['CRACKING', 'POLYMERISATION'], why: 'DISTILLATION: BY BOILING POINT' },
    { q: ['WHICH STEP USES HEAT + A', 'CATALYST TO MAKE ETHENE?'], a: 'CRACKING', w: ['FRACTIONAL DISTILLATION', 'POLYMERISATION'], why: 'CRACKING: HEAT + CATALYST' },
    { q: ['WHICH STEP JOINS MONOMERS', 'INTO LONG CHAINS?'], a: 'POLYMERISATION', w: ['CRACKING', 'FRACTIONAL DISTILLATION'], why: 'POLYMERISATION: MONOMERS > POLYMER' },
    { q: ['MOST POLYMERS ARE', 'MADE FROM...'], a: 'CRUDE OIL', w: ['CORN STARCH', 'SUGAR CANE'], why: 'MOST POLYMERS: FROM CRUDE OIL' },
    { q: ['CRUDE OIL IS...'], a: 'FINITE', w: ['RENEWABLE'], why: 'FINITE: IT WILL RUN OUT' },
    { q: ['PLA IS MADE FROM...'], a: 'CORN STARCH', w: ['CRUDE OIL', 'COAL'], why: 'PLA: CORN STARCH OR SUGAR CANE' },
    { q: ['ETHENE IS A...'], a: 'MONOMER', w: ['POLYMER', 'FRACTION'], why: 'ETHENE = A MONOMER (SMALL UNIT)' },
    { q: ['MANY ETHENE MONOMERS', 'JOIN TO MAKE...'], a: 'POLY(ETHENE)', w: ['PLA', 'CRUDE OIL'], why: 'ETHENE > POLY(ETHENE)' },
    { q: ['WHICH POLYMER IS', 'BIODEGRADABLE?'], a: 'PLA', w: ['POLY(ETHENE)'], why: 'PLA IS BIODEGRADABLE' },
    { q: ['WHERE IS CRUDE OIL SPLIT', 'INTO FRACTIONS?'], a: 'REFINERY', w: ['OIL RIG'], why: 'THE REFINERY SPLITS IT' },
    { q: ["'POLY' MEANS..."], a: 'MANY', w: ['UNIT'], why: "'POLY' = MANY, 'MER' = UNIT" },
    { q: ['POLYMERS ARE USUALLY SUPPLIED', 'TO MANUFACTURERS AS...'], a: 'GRANULES', w: ['CRUDE OIL', 'FRACTIONS'], why: 'SUPPLIED AS GRANULES / PELLETS' },
    { q: ['CRACKING BREAKS HEAVY', 'FRACTIONS INTO...'], a: 'SMALLER MOLECULES', w: ['LONG CHAINS', 'CRUDE OIL'], why: 'CRACKING > SMALLER MOLECULES' },
    { q: ['BIOPOLYMERS COME FROM...'], a: 'PLANTS', w: ['CRUDE OIL', 'COAL'], why: 'BIOPOLYMERS: FROM PLANTS' },
    { q: ['WHICH SOURCE IS FINITE?'], a: 'CRUDE OIL', w: ['CORN STARCH', 'SUGAR CANE'], why: 'CRUDE OIL IS FINITE' },
    { q: ['FRACTIONS ARE SEPARATED BY...'], a: 'BOILING POINT', w: ['CATALYST'], why: 'SEPARATED BY BOILING POINT' },
    { q: ['PLA IS USED FOR...'], a: '3D-PRINT FILAMENT', w: ['BOAT HULLS', 'PLUG SOCKETS'], why: 'PLA: FILAMENT + FOOD PACKAGING' },
    { q: ['FIRST STEP OF THE JOURNEY?'], a: 'EXTRACT CRUDE OIL', w: ['CRACKING', 'POLYMERISATION'], why: 'FIRST: CRUDE OIL IS EXTRACTED' },
    { q: ['A POLYMER IS A...'], a: 'LONG CHAIN', w: ['SINGLE MONOMER', 'FRACTION'], why: 'POLYMER = LONG CHAIN OF MONOMERS' },
    { q: ['IS PLA RENEWABLE?'], a: 'YES: PLANTS', w: ['NO: CRUDE OIL'], why: 'PLA COMES FROM PLANTS' },
  ];
  const wrap = (s, n = 13) => { const words = s.split(' '), lines = []; let cur = ''; for (const w of words) { if (cur && (cur + ' ' + w).length > n) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) lines.push(cur); return lines; };

  // ---------------- state ----------------
  let S = null; // whole game state, rebuilt per round / mode
  let clk = 0;  // visual clock (always runs)
  let rng = H.rng(1);

  function makeSnake(i, x, y, dir, len) {
    const d = DIRS[dir], body = [];
    for (let k = 0; k < len; k++) body.push({ x: x - d[0] * k, y: y - d[1] * k });
    return { i, body, dir: d.slice(), queue: [], grow: 0, bonus: 0, ghost: 0, stun: 0, eaten: 0, flash: 0, label: 4 };
  }
  const lenOf = (s) => s.body.length + s.grow;
  const scoreOf = (s) => Math.max(0, lenOf(s) - 3) + s.bonus;

  function base(mode) {
    return { mode, rows: mode === 'learn' ? LEARN_ROWS : TEST_ROWS, snakes: [], items: [], parts: [], pops: [], stepAcc: 0, interval: 0.16,
      enterT: clk, trans: null, flashT: -9, shake: 0, lastScore: '' };
  }

  function setupAttract() {
    S = base('attract');
    S.snakes = [makeSnake(0, 8, 12, 'right', 8), makeSnake(1, 31, 5, 'left', 8)];
    S.interval = 0.11; fillMonomers(5);
  }

  function setupLearn() {
    rng = H.rng((Math.random() * 1e9) | 0);
    S = base('learn');
    S.interval = 0.17;
    S.snakes = [makeSnake(0, 6, 4, 'right', 3), makeSnake(1, 6, 9, 'right', 3)];
    S.zone = -1; S.ready = [false, false]; S.fadeT = clk;
    enterZone(0, false);
    GS.score(0, 0); S.lastScore = '0,0';
  }

  function learnScale() { const L = GS.learnLeft() + GS.t; return Math.max(0.2, (L || 90) / 90); }
  // the learn time used for the schedule: real lesson time from the bridge
  function schedZone() { const sc = learnScale(); let z = 0; for (let k = 0; k < ZSTART.length; k++) if (GS.t >= ZSTART[k] * sc) z = k; return z; }

  function enterZone(z, withMosaic) {
    const prevScene = S.zone >= 0 ? ZONES[S.zone].scene : null;
    const go = () => {
      S.zone = z; const Z = ZONES[z];
      S.zEnter = clk; S.riseT = clk; S.items = []; S.pickup = null; S.zEaten = 0;
      S.unlocked = Z.pages.map((p) => p.when === 'enter' && !p.fb);
      S.page = Z.pages.length ? 0 : -1; S.pageAt = clk; S.typed = 0;
      if (Z.scene !== prevScene) S.riseT = clk; else S.riseT = clk - 9;
      if (Z.pickup) S.pickup = { x: Z.pickup.x, y: Z.pickup.y, kind: Z.pickup.kind, label: Z.pickup.label, eaten: false };
      if (Z.monomers) for (let k = 0; k < Z.monomers; k++) spawnMonomer(true);
      // reposition snakes at the left edge, heading right
      S.snakes.forEach((s, i) => { const L = Math.max(3, Math.min(lenOf(s), 14)); const n = makeSnake(i, Math.min(L - 1, 12) + 1, i ? 9 : 4, 'right', Math.min(L, 13)); n.grow = Math.max(0, L - 13); n.label = 3; S.snakes[i] = n; });
      if (z === 6) GS.sfx('powerup');
    };
    if (withMosaic && prevScene !== ZONES[z].scene) { S.trans = { type: 'mosaic', t0: clk, dur: 0.6, mid: go, done: false }; GS.sfx('select'); }
    else go();
  }

  function setupTest() {
    rng = H.rng((Math.random() * 1e9) | 0);
    const fromLearn = S && S.mode === 'learn';
    S = base('test');
    S.snakes = [makeSnake(0, 6, 13, 'right', 3), makeSnake(1, 33, 4, 'left', 3)];
    S.snakes.forEach((s) => (s.label = 5));
    S.testTotal = Math.max(20, GS.timeLeft()); S.testStart = clk;
    S.q = null; S.nextQ = clk + 4; S.qOrder = shuffle(QS.map((_, i) => i)); S.qIdx = 0;
    S.final = false;
    fillMonomers(4);
    if (fromLearn) S.trans = { type: 'swirl', t0: clk, dur: 0.6, done: true };
    GS.score(0, 0); S.lastScore = '0,0';
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------------- items ----------------
  function occupied(x, y, pad = 0) {
    for (const s of S.snakes) for (const b of s.body) if (Math.abs(b.x - x) <= pad && Math.abs(b.y - y) <= pad) return true;
    return false;
  }
  function inGateZone(x, y) {
    if (!S.q || !S.q.gates) return false;
    return S.q.gates.some((g) => x >= g.cx - 6 && x <= g.cx + 8 && y >= g.cy - 6 && y <= g.cy + 5);
  }
  function freeCell(minRow = 1) {
    for (let tries = 0; tries < 80; tries++) {
      const x = 1 + Math.floor(rng() * (COLS - 2)), y = minRow + Math.floor(rng() * (S.rows - minRow - 1));
      if (occupied(x, y, 1) || inGateZone(x, y) || S.items.some((m) => Math.abs(m.x - x) < 6 && Math.abs(m.y - y) < 3)) continue;
      if (S.pickup && Math.abs(S.pickup.x - x) < 3 && Math.abs(S.pickup.y - y) < 3) continue;
      return { x, y };
    }
    return null;
  }
  function spawnMonomer(quiet, near) {
    let c = null;
    if (near) { for (let k = 0; k < 30 && !c; k++) { const x = near.x + Math.round((rng() - 0.5) * 8), y = near.y + Math.round((rng() - 0.5) * 6); if (x > 0 && x < COLS - 1 && y > 1 && y < S.rows - 1 && !occupied(x, y) && !inGateZone(x, y) && !S.items.some((m) => Math.abs(m.x - x) < 3 && Math.abs(m.y - y) < 2)) c = { x, y }; } }
    if (!c) c = freeCell(S.mode === 'learn' ? 1 : 2);
    if (!c) return;
    S.items.push({ x: c.x, y: c.y, born: clk, ph: rng() * 6 });
  }
  function fillMonomers(n) { while (S.items.length < n) { const before = S.items.length; spawnMonomer(true); if (S.items.length === before) break; } }

  // ---------------- particles & pops ----------------
  function burst(px, py, col, n = 10, sp = 40) { for (let k = 0; k < n; k++) { const a = rng() * 6.28, v = sp * (0.4 + rng()); S.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, c: col, life: 0.6 + rng() * 0.4, t: 0 }); } }
  function pop(str, cx, y, col, scale = 1, dur = 1.0, shadow = P.K) { S.pops.push({ str, cx, y, col, scale, t0: clk, dur, shadow }); }
  const cellPx = (x, y) => [x * 8 + 4, AY + y * 8 + 4];

  function loseSegments(s, n, col) {
    let left = n;
    const fromGrow = Math.min(s.grow, left); s.grow -= fromGrow; left -= fromGrow;
    while (left > 0 && s.body.length > 3) { const t = s.body.pop(); const [px, py] = cellPx(t.x, t.y); burst(px, py, col, 5, 30); left--; }
    if (left > 0) s.bonus = Math.max(0, s.bonus - left);
  }

  // ---------------- snake stepping ----------------
  function readInput(s) {
    if (S.mode === 'attract') return;
    const p = s.i + 1;
    for (const k of ['up', 'down', 'left', 'right']) if (GS.hit(p, k) && s.queue.length < 3) s.queue.push(DIRS[k]);
  }
  function ai(s) {
    const h = s.body[0]; let best = null, bd = 1e9;
    for (const m of S.items) { const d = Math.abs(m.x - h.x) + Math.abs(m.y - h.y); if (d < bd) { bd = d; best = m; } }
    const opts = Object.values(DIRS).filter((d) => !(d[0] === -s.dir[0] && d[1] === -s.dir[1]));
    let pick = s.dir, score = -1e9;
    for (const d of opts) {
      const nx = h.x + d[0], ny = h.y + d[1];
      let sc = 0;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= S.rows || occupied(nx, ny)) sc -= 1000;
      if (best) sc -= Math.abs(best.x - nx) + Math.abs(best.y - ny);
      if (d === s.dir || (d[0] === s.dir[0] && d[1] === s.dir[1])) sc += 0.5;
      if (sc > score) { score = sc; pick = d; }
    }
    s.dir = pick.slice();
  }

  function stepSnakes() {
    const learn = S.mode === 'learn';
    const next = S.snakes.map((s) => {
      if (S.mode === 'attract') ai(s);
      else while (s.queue.length) { const d = s.queue.shift(); if (!(d[0] === -s.dir[0] && d[1] === -s.dir[1]) && !(d[0] === s.dir[0] && d[1] === s.dir[1])) { s.dir = d.slice(); break; } }
      const h = s.body[0]; return { x: h.x + s.dir[0], y: h.y + s.dir[1] };
    });
    // exits / wrapping in LEARN
    if (learn) {
      for (let i = 0; i < 2; i++) {
        const n = next[i];
        if (n.x >= COLS) { if (exitOpen()) { advanceZone(); return; } n.x = 0; }
        if (n.x < 0) n.x = COLS - 1; if (n.y < 0) n.y = S.rows - 1; if (n.y >= S.rows) n.y = 0;
      }
    }
    const crashed = [false, false];
    if (!learn) {
      // head-to-head
      if (next[0].x === next[1].x && next[0].y === next[1].y && !S.snakes[0].ghost && !S.snakes[1].ghost) crashed[0] = crashed[1] = true;
      for (let i = 0; i < 2; i++) {
        const s = S.snakes[i], n = next[i];
        if (n.x < 0 || n.y < 0 || n.x >= COLS || n.y >= S.rows) { crashed[i] = true; continue; }
        if (s.ghost > 0) continue;
        for (const o of S.snakes) {
          if (o.ghost > 0 && o !== s) continue;
          const body = o.body, end = (o.grow > 0) ? body.length : body.length - 1;
          for (let k = 0; k < end; k++) if (body[k].x === n.x && body[k].y === n.y) { crashed[i] = true; break; }
        }
      }
    }
    for (let i = 0; i < 2; i++) {
      const s = S.snakes[i];
      if (crashed[i]) { crash(s); continue; }
      s.body.unshift(next[i]);
      if (s.grow > 0) s.grow--; else s.body.pop();
      eat(s);
      if (S.mode === 'test') gateCheck(s);
    }
  }

  function crash(s) {
    const h = s.body[0], [px, py] = cellPx(h.x, h.y);
    if (S.mode === 'test') {
      loseSegments(s, 3, PCOL[s.i].H);
      pop('CRASH! -3', px, py - 14, P.red, 1, 1.1, P.redDk);
      GS.sfx('hurt', { pan: s.i ? 0.5 : -0.5 });
    }
    burst(px, py, P.white, 8, 50);
    S.shake = clk + 0.2;
    s.ghost = 1.4; s.queue.length = 0;
    // turn to a free direction (prefer the one leading towards the centre)
    const opts = Object.values(DIRS).filter((d) => { const nx = h.x + d[0], ny = h.y + d[1]; return nx >= 0 && ny >= 0 && nx < COLS && ny < S.rows && !(d[0] === s.dir[0] && d[1] === s.dir[1]); });
    opts.sort((a, b) => (Math.abs(h.x + a[0] - 20) + Math.abs(h.y + a[1] - 9)) - (Math.abs(h.x + b[0] - 20) + Math.abs(h.y + b[1] - 9)));
    const back = opts.find((d) => d[0] === -s.dir[0] && d[1] === -s.dir[1]);
    const side = opts.find((d) => d !== back);
    if (side) s.dir = side.slice(); else if (back) { s.body.reverse(); s.dir = back.slice(); }
  }

  function eat(s) {
    const h = s.body[0], [px, py] = cellPx(h.x, h.y);
    for (let k = S.items.length - 1; k >= 0; k--) {
      const m = S.items[k];
      if (m.x === h.x && m.y === h.y) {
        S.items.splice(k, 1); s.grow++; s.eaten++; S.zEaten = (S.zEaten || 0) + 1;
        burst(px, py, P.gold, 8, 35);
        pop(S.mode === 'learn' ? '+1 MONOMER' : '+1', px, py - 12, P.gold);
        GS.sfx('blip', { f: 520 + Math.min(lenOf(s), 40) * 22, dur: 0.06, pan: s.i ? 0.5 : -0.5 });
        if (S.mode === 'learn' && ZONES[S.zone].monomers && S.items.length < 2) { spawnMonomer(); spawnMonomer(); }
      }
    }
    if (S.pickup && !S.pickup.eaten && S.pickup.x === h.x && Math.abs(S.pickup.y - h.y) <= 0) {
      S.pickup.eaten = true; S.pickup.by = s.i; S.pickup.at = clk; s.grow++;
      burst(px, py, P.gold, 18, 50); pop(S.pickup.label + '!', px, py - 16, P.gold);
      GS.sfx('coin');
    }
  }

  // ---------------- LEARN logic ----------------
  function exitOpen() {
    const Z = ZONES[S.zone]; if (S.zone >= 6 || !Z.pages.length) return S.zone === 0 ? false : false;
    return S.page === Z.pages.length - 1 && clk - S.pageAt > 3.5 * minS();
  }
  function minS() { return Math.min(1, learnScale()); }
  function advanceZone() { if (S.zone < 6) enterZone(S.zone + 1, true); }

  function updateLearn(dt) {
    const Z = ZONES[S.zone];
    // timeline: the lesson clock forces progress
    const sz = schedZone();
    if (sz > S.zone && !S.trans) { enterZone(Math.min(6, sz), true); return; }
    // early: intro advances by itself once read
    if (S.zone === 0 && S.page === 1 && clk - S.pageAt > 4 * minS() && !S.trans) { enterZone(1, false); return; }
    const zt = (clk - S.zEnter) / minS();
    // unlock pages
    Z.pages.forEach((p, i) => {
      if (S.unlocked[i]) return;
      if (zt >= p.fb && (p.when === 'enter' || i === 0)) S.unlocked[i] = true;
      if (p.when === 'pickup' && ((S.pickup && S.pickup.eaten) || zt >= p.fb)) S.unlocked[i] = true;
      if (typeof p.when === 'number' && (S.zEaten >= p.when || zt >= p.fb)) S.unlocked[i] = true;
    });
    // pickup auto-eaten when the fallback time passes (keeps the lesson moving)
    const pk = Z.pages.findIndex((p) => p.when === 'pickup');
    if (S.pickup && !S.pickup.eaten && pk >= 0 && zt >= Z.pages[pk].fb) { S.pickup.eaten = true; S.pickup.at = clk; GS.sfx('coin'); const [px, py] = cellPx(S.pickup.x, S.pickup.y); burst(px, py, P.gold, 18, 50); }
    // advance displayed page once the current one has been on screen long enough
    if (S.page >= 0 && S.page + 1 < Z.pages.length && S.unlocked[S.page + 1] && clk - S.pageAt >= 5 * minS()) { S.page++; S.pageAt = clk; S.typed = 0; }
    // typing out
    if (S.page >= 0) {
      const full = Z.pages[S.page].l.join('').length, before = Math.floor(S.typed);
      S.typed = Math.min(full, S.typed + dt * 48);
      if (Math.floor(S.typed / 3) > Math.floor(before / 3) && S.typed < full) GS.sfx('text', { n: 1, gain: 0.7 });
    }
    // pickup drifts towards the nearest head after a few seconds (so every pickup gets eaten)
    if (S.pickup && !S.pickup.eaten && zt > 3.5) {
      S.pickup.drift = (S.pickup.drift || 0) + dt;
      if (S.pickup.drift > 0.35) {
        S.pickup.drift = 0; let best = null, bd = 1e9;
        S.snakes.forEach((s) => { const h = s.body[0], d = Math.abs(h.x - S.pickup.x) + Math.abs(h.y - S.pickup.y); if (d < bd) { bd = d; best = h; } });
        if (best) { const dx = Math.sign(best.x + 3 - S.pickup.x), dy = Math.sign(best.y - S.pickup.y); if (Math.abs(best.y - S.pickup.y) > 0) S.pickup.y += dy; else S.pickup.x += dx; }
      }
    }
    // monomers drift too in the field
    if (Z.monomers && zt > 4) S.items.forEach((m, i) => { if (Math.floor(clk * 2.2 + i) % 7 !== 0 || m.moved === Math.floor(clk * 2.2)) return; m.moved = Math.floor(clk * 2.2); const h = S.snakes[i % 2].body[0]; if (Math.abs(h.x - m.x) + Math.abs(h.y - m.y) > 2) { const nx = rng() < 0.5 ? m.x + Math.sign(h.x - m.x) : m.x, ny = nx === m.x ? m.y + Math.sign(h.y - m.y) : m.y; if (!S.items.some((o) => o !== m && Math.abs(o.x - nx) < 4 && Math.abs(o.y - ny) < 3)) { m.x = nx; m.y = ny; } } });
    // ready screen: both press a
    if (S.zone === 6) {
      for (let i = 0; i < 2; i++) if (GS.hit(i + 1, 'a') && !S.ready[i]) { S.ready[i] = true; GS.sfx('select'); }
      if (S.ready[0] && S.ready[1] && !S.readyAt) S.readyAt = clk;
      if (S.readyAt && clk - S.readyAt > 0.5) GS.skipLearn();
      return;
    }
    stepTick(dt);
  }

  // ---------------- TEST logic ----------------
  function testProg() { return H.clamp(1 - GS.timeLeft() / S.testTotal); }
  function startQuestion() {
    const qd = QS[S.qOrder[S.qIdx++ % S.qOrder.length]];
    const p = testProg();
    let opts = [qd.a].concat(qd.w);
    if (p < 0.3 && opts.length > 2) opts = [qd.a, qd.w[0]];
    opts = shuffle(opts.slice());
    const n = opts.length, slots = n === 3 ? [4, 18, 32] : [9, 27];
    const gates = opts.map((label, i) => {
      let cy = 0;
      for (let t = 0; t < 30; t++) { cy = 5 + Math.floor(rng() * 9); let ok = true; for (const s of S.snakes) for (const b of s.body) if (b.x >= slots[i] - 1 && b.x <= slots[i] + 3 && b.y >= cy - 1 && b.y <= cy + 2) ok = false; if (ok) break; }
      return { cx: slots[i], cy, label, lines: wrap(label), correct: label === qd.a, broken: false };
    });
    const dur = H.lerp(17, 12, p);
    S.q = { d: qd, gates, t0: clk, dur, locked: [false, false], resolved: null, resolveT: 0 };
    // clear monomers from under gates/signs
    S.items = S.items.filter((m) => !inGateZone(m.x, m.y));
    GS.sfx('select'); GS.tone({ f: 'E5', type: 'square', dur: 0.12, gain: 0.05 });
  }
  function gateCheck(s) {
    const q = S.q; if (!q || q.resolved) return;
    const h = s.body[0];
    for (const g of q.gates) {
      if (h.x < g.cx || h.x > g.cx + 2 || h.y < g.cy || h.y > g.cy + 1) continue;
      if (q.locked[s.i] || g.broken) return;
      const [px, py] = cellPx(g.cx, g.cy);
      if (g.correct) {
        const pts = S.final ? 10 : 5;
        s.bonus += pts; q.resolved = { by: s.i }; q.resolveT = clk;
        pop('CORRECT! +' + pts, px + 8, py - 34, P.green, 1, 1.4, P.greenDk);
        burst(px + 4, py + 4, P.gold, 24, 70); burst(px + 4, py + 4, P.green, 12, 50);
        for (let k = 0; k < 4; k++) spawnMonomer(false, { x: g.cx + 1, y: g.cy + 8 });
        GS.sfx('powerup', { pan: s.i ? 0.4 : -0.4 }); GS.sfx('sparkle', { n: 5 });
      } else {
        g.broken = true; q.locked[s.i] = true; q.wrongAt = clk; q.wrongBy = s.i;
        loseSegments(s, 3, PCOL[s.i].H);
        pop('WRONG! -3', px + 8, py - 34, P.red, 1, 1.4, P.redDk);
        S.flashT = clk; S.shake = clk + 0.25;
        GS.sfx('hurt', { pan: s.i ? 0.4 : -0.4 }); GS.sfx('error');
        if (q.locked[0] && q.locked[1]) { q.resolved = { by: -1 }; q.resolveT = clk; }
      }
      return;
    }
  }
  function updateTest(dt) {
    const p = testProg();
    S.interval = H.lerp(0.15, 0.085, p);
    if (!S.final && GS.timeLeft() <= 45 && GS.timeLeft() > 0) { S.final = true; pop('FINAL STRETCH! GATES +10', 160, 80, P.gold, 1, 2.5); GS.sfx('powerup'); }
    // questions
    if (!S.q && clk >= S.nextQ) startQuestion();
    if (S.q) {
      const q = S.q;
      if (!q.resolved && clk - q.t0 > q.dur) { q.resolved = { by: -1, timeout: true }; q.resolveT = clk; GS.sfx('error', { gain: 0.6 }); }
      if (q.resolved && clk - q.resolveT > 2.8) { S.q = null; S.nextQ = clk + H.lerp(5, 2.5, p); }
    }
    fillMonomers(3 + Math.floor(p * 4));
    stepTick(dt);
  }

  function stepTick(dt) {
    S.snakes.forEach(readInput);
    S.stepAcc += dt;
    while (S.stepAcc >= S.interval) { S.stepAcc -= S.interval; stepSnakes(); if (S.trans) break; }
    S.snakes.forEach((s) => { s.ghost = Math.max(0, s.ghost - dt); s.label = Math.max(0, s.label - dt); });
  }

  function updateCommon(dt) {
    S.parts.forEach((q) => { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 90 * dt; });
    S.parts = S.parts.filter((q) => q.t < q.life);
    S.pops = S.pops.filter((q) => clk - q.t0 < q.dur);
    if (S.trans && !S.trans.done && clk - S.trans.t0 >= S.trans.dur / 2) { S.trans.done = true; S.trans.mid && S.trans.mid(); }
    if (S.trans && clk - S.trans.t0 >= S.trans.dur) S.trans = null;
  }

  // ---------------- drawing ----------------
  const BEAD = ['.KKKK.', 'KhHHHK', 'KHHHMK', 'KHHHMK', 'KHMMMK', '.KKKK.'];
  const HEAD = ['.KKKKKK.', 'KhhHHHHK', 'KhHHHHHK', 'KHHHHHMK', 'KHHHHHMK', 'KHHHHMMK', 'KHHMMMMK', '.KKKKKK.'];
  const palOf = (i, ghost) => ghost ? { K: P.K, h: P.white, H: P.grey, M: C('#5a5a8a') } : PCOL[i];
  function drawSnake(s) {
    if (s.ghost > 0 && Math.floor(clk * 12) % 2) return;
    const pal = palOf(s.i, false), b = s.body;
    for (let k = b.length - 1; k >= 1; k--) {
      const x = b[k].x * 8, y = AY + b[k].y * 8;
      PX.sprite(BEAD, pal, x + 1, y + 1);
      put(x + 2, y + 2, pal.h);
      const nb = b[k - 1], dx = nb.x - b[k].x, dy = nb.y - b[k].y;
      if (Math.abs(dx) + Math.abs(dy) === 1) { // bond to the next unit
        if (dx) { const bx = dx > 0 ? x + 7 : x - 1; rect(bx, y + 3, 2, 2, BOND); put(bx, y + 2, P.K); put(bx + 1, y + 2, P.K); put(bx, y + 5, P.K); put(bx + 1, y + 5, P.K); }
        else { const by = dy > 0 ? y + 7 : y - 1; rect(x + 3, by, 2, 2, BOND); put(x + 2, by, P.K); put(x + 2, by + 1, P.K); put(x + 5, by, P.K); put(x + 5, by + 1, P.K); }
      }
    }
    const h = b[0], hx = h.x * 8, hy = AY + h.y * 8;
    PX.sprite(HEAD, pal, hx, hy);
    // eyes look the way the chain is heading
    const [dx, dy] = s.dir;
    const e = dx > 0 ? [[5, 2], [5, 5]] : dx < 0 ? [[2, 2], [2, 5]] : dy < 0 ? [[2, 2], [5, 2]] : [[2, 5], [5, 5]];
    e.forEach(([ex, ey]) => { put(hx + ex, hy + ey, P.white); put(hx + ex + (dx > 0 ? 1 : dx < 0 ? -1 : 0), hy + ey + (dy > 0 ? 1 : dy < 0 ? -1 : 0), P.K); });
    if (s.label > 0 || S.mode === 'learn') textC(PCOL[s.i].name, hx + 4, hy - 10, PCOL[s.i].txt, P.K, 1, P.K);
  }

  function drawMonomers(labelled) {
    S.items.forEach((m) => {
      const [px, py] = cellPx(m.x, m.y), bob = Math.floor(clk * 3 + m.ph) % 2;
      const age = clk - m.born;
      if (age < 0.3 && Math.floor(age * 20) % 2) return;
      SCENES.ethene(px, py + bob, 0.5 + 0.5 * Math.sin(clk * 4 + m.ph));
    });
    if (!labelled) return;
    const boxes = [];
    S.items.forEach((m) => {
      const [px, py] = cellPx(m.x, m.y), lx = Math.max(19, Math.min(LW - 19, px)), ly = Math.max(AY + 1, py - 17);
      if (boxes.some(([bx, by]) => Math.abs(bx - lx) < 40 && Math.abs(by - ly) < 10)) return;
      boxes.push([lx, ly]); textC('ETHENE', lx, ly, P.gold, P.K, 1, P.K);
    });
  }

  function drawPickup() {
    const pk = S.pickup; if (!pk || pk.eaten) return;
    const [px, py] = cellPx(pk.x, pk.y), bob = Math.floor(clk * 3) % 2;
    // pulsing dithered halo
    const r = 14 + (Math.floor(clk * 6) % 2);
    for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) { const d = Math.hypot(x - px, y - py); if (d < r && d > r - 4 && 0.5 > bay(x, y)) put(x, y, P.gold); }
    if (pk.kind === 'barrel') PX.sprite(SCENES.BARREL, SCENES.PAL_BARREL, px - 9, py - 9 + bob, false, 2);
    if (pk.kind === 'flask') PX.sprite(SCENES.FLASK, SCENES.PAL_FLASK, px - 9, py - 9 + bob, false, 2);
    if (pk.kind === 'corn') PX.sprite(SCENES.CORN, SCENES.PAL_CORN, px - 9, py - 11 + bob, false, 2);
    if (pk.kind === 'ethene') SCENES.ethene(px, py + bob, 1);
    // sparkles
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + clk * 2, sx = Math.round(px + Math.cos(a) * 17), sy = Math.round(py + Math.sin(a) * 12); put(sx, sy, P.white); put(sx - 1, sy, P.gold); put(sx + 1, sy, P.gold); put(sx, sy - 1, P.gold); put(sx, sy + 1, P.gold); }
  }
  function drawPickupLabel() {
    const pk = S.pickup; if (!pk || pk.eaten) return;
    const [px, py] = cellPx(pk.x, pk.y), cx = Math.max(40, Math.min(LW - 40, px)), ty = Math.max(AY + 2, py - 30);
    const lw = textW(pk.label) + 8; win(cx - (lw >> 1), ty, lw, 12); textC(pk.label, cx, ty + 3, P.gold, P.K);
  }

  function drawGate(g, q, signOnly) {
    const x = g.cx * 8, y = AY + g.cy * 8, mx = x + 12;
    const resolved = !!q.resolved, reveal = resolved && g.correct, blink = Math.floor(clk * 8) % 2;
    const dim = (resolved && !g.correct) || g.broken;
    if (!signOnly) {
    const st = dim ? C('#3a3a50') : C('#5a4a8a'), lit = dim ? C('#5a5a70') : C('#c8b8f0'), dk = dim ? C('#24243a') : C('#3a2a6a');
    for (let j = 0; j <= 20; j++) for (let i = -1; i <= 24; i++) {
      const cx = i - 11.5, out = j >= 10 ? Math.abs(cx) <= 12.6 : (cx / 12.6) ** 2 + ((j - 10) / 10.5) ** 2 <= 1;
      if (!out) continue;
      const inner = j >= 10 ? Math.abs(cx) <= 8.6 : (cx / 8.6) ** 2 + ((j - 10) / 7) ** 2 <= 1;
      const px = x + i, py = y - 4 + j;
      if (!inner) { const edge = j >= 10 ? Math.abs(cx) > 11.6 : (cx / 11.6) ** 2 + ((j - 10) / 9.5) ** 2 > 1; put(px, py, edge ? P.K : (cx > 0 ? lit : (j % 4 === 0 ? dk : st))); continue; }
      if (dim) { put(px, py, (px + py) % 2 ? C('#14141f') : C('#1e1e30')); continue; }
      const cy = j - 12, a = Math.atan2(cy, cx) + clk * 4 + Math.hypot(cx, cy) * 0.45;
      const v = 0.5 + 0.5 * Math.sin(a * 3);
      put(px, py, v > bay(px, py) ? (reveal ? P.sunHi : P.winP) : (reveal ? P.gold : P.coreDeep));
    }
    PX.hline(x - 1, x + 24, y + 16, P.K);
    if (g.broken) for (let k = 0; k < 14; k++) { put(mx - 7 + k, y - 1 + k, P.red); put(mx - 6 + k, y - 1 + k, P.red); put(mx + 7 - k, y - 1 + k, P.red); put(mx + 6 - k, y - 1 + k, P.red); }
    }
    if (!signOnly) return;
    const lines = g.lines, w = Math.max(...lines.map((l) => textW(l))) + 10, h = lines.length * 9 + 5;
    const sx = Math.round(mx - w / 2), sy = y - 8 - h;
    win(sx, sy, w, h, reveal ? (blink ? PX.WGREEN : PX.WGOLD) : dim ? PX.WGREY : PX.WB);
    lines.forEach((l, i) => textC(l, mx, sy + 3 + i * 9, dim ? P.grey : P.white, P.K));
    if (reveal) PX.sprite(PX.ARROW_D, PX.PAL_ARROW, mx - 3, sy - 8 + (Math.floor(clk * 4) % 2));
  }

  function drawDialog(lines, typed, name = 'PROF. POLY') {
    const bx = 4, by = 131, bw = 312, bh = 42;
    win(bx, by, bw, bh);
    const px0 = bx + 5, py0 = by + 6;
    rect(px0, py0, 30, 30, C('#0a1040'));
    for (let i = 0; i < 30; i++) { put(px0 + i, py0, P.grey); put(px0 + i, py0 + 29, P.white); put(px0, py0 + i, P.grey); put(px0 + 29, py0 + i, P.white); }
    PX.sprite(SCENES.POLY, SCENES.PAL_POLY, px0 + 3, py0 + 4 + (Math.floor(clk * 2) % 2 && typed < 99 ? 1 : 0), false, 2);
    text(name, px0 + 36, by + 5, P.gold, P.K);
    let left = Math.floor(typed);
    lines.forEach((l, i) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; text(s, px0 + 36, by + 17 + i * 11, P.white, P.K); });
    const full = lines.join('').length;
    if (typed >= full) PX.sprite(PX.ARROW_D, PX.PAL_ARROW, bx + bw - 13, by + bh - 9 + (Math.floor(clk * 4) % 2));
  }

  function drawParts() {
    S.parts.forEach((q) => { const x = Math.round(q.x), y = Math.round(q.y); put(x, y, q.c); if (q.t < q.life * 0.5) put(x + 1, y, q.c); });
    S.pops.forEach((q) => {
      const k = clk - q.t0, by = Math.round(q.y - Math.min(10, k * 30) + (k < 0.2 ? -Math.sin(k * 15) * 4 : 0));
      if (k > q.dur - 0.25 && Math.floor(k * 16) % 2) return;
      const x = Math.max(4 + textW(q.str, q.scale) / 2, Math.min(LW - 4 - textW(q.str, q.scale) / 2, q.cx));
      textC(q.str, x, Math.max(26, by), q.col, q.shadow, q.scale, P.K);
    });
  }

  function drawLearn() {
    const Z = ZONES[S.zone];
    const rt = clk - S.riseT;
    SCENES.draw(Z.scene, clk, rt);
    if (S.zone === 6) { drawReady(); return; }
    if (rt > 0.6) {
      drawPickup(); drawMonomers(true);
      S.snakes.forEach(drawSnake);
      drawPickupLabel();
      drawParts();
      if (exitOpen() && S.zone > 0) { const b = Math.floor(clk * 4) % 2; for (let k = 0; k < 3; k++) PX.sprite(PX.ARROW_R, PX.PAL_ARROW, 304 + b, 44 + k * 30); win(262, 112, 50, 13); text('NEXT >', 266, 115, P.gold, P.K); }
    }
    // quest header + controls (always visible during LEARN)
    win(2, 2, 248, 21);
    text(Z.title, 7, 5, P.gold, P.K);
    text('P1: W A S D', 7, 14, PCOL[0].txt, P.K); text('P2: ARROW KEYS', 92, 14, PCOL[1].txt, P.K); text('STEER!', 192, 14, P.white, P.K);
    if (S.page >= 0) drawDialog(Z.pages[S.page].l, S.typed);
  }

  function drawReady() {
    win(10, 26, 300, 150);
    textC('QUEST COMPLETE!', 160, 32, P.gold, P.K, 2);
    const steps = [['CRUDE OIL', P.white], ['FRACTIONAL DISTILLATION', P.white], ['CRACKING', P.white], ['ETHENE = MONOMER', P.white], ['POLYMERISATION', P.white], ['POLY(ETHENE)', P.gold]];
    // journey as a chain
    steps.forEach(([s, c], i) => { const y = 52 + i * 10; text((i ? '> ' : '  ') + s, 18, y, c, P.K); });
    text('NOW THE TEST:', 196, 54, P.cyan, P.K);
    text('ETHENE    +1', 196, 66, P.gold, P.K); text('RIGHT GATE +5', 196, 76, P.green, P.K); text('WRONG GATE -3', 196, 86, C('#ff8a8a'), P.K); text('CRASH     -3', 196, 96, C('#ff8a8a'), P.K);
    text('PLANT ROUTE: CORN STARCH > PLA (BIODEGRADABLE)', 18, 112, P.leafHi, P.K);
    hl(20, 300, 124, P.grey);
    textC('BOTH PRESS A TO START', 160, 130, P.white, P.K);
    const r0 = S.ready[0], r1 = S.ready[1], bl = Math.floor(clk * 3) % 2;
    win(40, 144, 110, 22, r0 ? PX.WGREEN : PX.WB); textC(r0 ? 'P1 READY @' : 'P1: PRESS F', 95, 151, r0 ? P.white : PCOL[0].txt, P.K);
    win(170, 144, 110, 22, r1 ? PX.WGREEN : PX.WB); textC(r1 ? 'P2 READY @' : 'P2: PRESS ENTER', 225, 151, r1 ? P.white : PCOL[1].txt, P.K);
  }

  function drawArena() {
    SCENES.draw('arena', clk);
    if (S.mode === 'test' && S.q) S.q.gates.forEach((g) => drawGate(g, S.q));
    drawMonomers(S.mode !== 'attract' || true);
    S.snakes.forEach(drawSnake);
    if (S.mode === 'test' && S.q) S.q.gates.forEach((g) => drawGate(g, S.q, true));
    drawParts();
    // top window: question / tip
    if (S.mode === 'test') {
      const q = S.q;
      if (q && !q.resolved) {
        win(2, 2, 248, 21, PX.WB);
        rect(6, 5, 14, 15, P.gold); text('?', 8, 6, P.K, 0, 2);
        const lines = q.d.q; lines.forEach((l, i) => text(l, 24, lines.length === 1 ? 9 : 5 + i * 9, P.white, P.K));
        const left = Math.ceil(q.dur - (clk - q.t0));
        text(String(left), 236, 9, left <= 3 ? P.red : P.gold, P.K);
        if (q.wrongAt && clk - q.wrongAt < 1.5) textC(PCOL[q.wrongBy].name + ' LOCKED OUT', 125, 25, P.red, P.K, 1, P.K);
      } else if (q && q.resolved) {
        win(2, 2, 248, 21, PX.WGREEN);
        const who = q.resolved.by >= 0 ? PCOL[q.resolved.by].name + ' GOT IT! ' : (q.resolved.timeout ? "TIME! " : '');
        text(who + 'ANSWER:', 7, 5, P.gold, P.K);
        text(q.d.a + (q.d.why ? '' : ''), 7 + textW(who + 'ANSWER: '), 5, P.white, P.K);
        text(q.d.why, 7, 14, P.white, P.K);
      } else {
        win(2, 2, 248, 21);
        const nx = Math.max(0, Math.ceil(S.nextQ - clk));
        text('EAT ETHENE MONOMERS TO GROW!', 7, 5, P.gold, P.K);
        text('NEXT PROCESS GATE IN ' + nx + '...', 7, 14, P.white, P.K);
      }
      if (S.final) textC('GATES +10', 285, 19, Math.floor(clk * 4) % 2 ? P.gold : P.white, P.K);
    } else {
      win(2, 2, 248, 21); text('CHAIN REACTION', 7, 5, P.gold, P.K); text('GROW YOUR POLYMER CHAIN!', 7, 14, P.white, P.K);
    }
    // bottom HUD: scores
    const [a, b] = S.snakes;
    PX.sprite(HEAD, PCOL[0], 3, 170); text('P1 ' + String(scoreOf(a)).padStart(3, ' '), 14, 171, PCOL[0].txt, P.K);
    PX.sprite(HEAD, PCOL[1], 248, 170); text('P2 ' + String(scoreOf(b)).padStart(3, ' '), 259, 171, PCOL[1].txt, P.K);
    textC('ETHENE +1  GATE +' + (S.final ? 10 : 5) + '  CRASH -3', 160, 171, P.grey, P.K);
  }

  function render() {
    if (!S) return;
    if (S.mode === 'learn') drawLearn(); else drawArena();
    // finishing: transitions, flash, fade
    if (S.trans) {
      const k = (clk - S.trans.t0) / S.trans.dur;
      if (S.trans.type === 'mosaic') PX.mosaic(Math.round(16 - Math.abs(k - 0.5) / 0.5 * 15));
      if (S.trans.type === 'swirl') PX.swirl(1 - k, clk);
    }
    if (clk - S.flashT < 0.1) PX.flash(120, 40, 40);
    if (S.mode === 'learn' && S.fadeT != null) PX.bright(Math.min(15, Math.floor(((clk - S.fadeT) / 0.8) * 15)));
    let ox = 0;
    if (clk < S.shake) ox = (Math.floor(clk * 30) % 2 ? 1 : -1) * 4;
    ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, 1280, 720);
    ctx.save(); ctx.translate(ox, 0); PX.present(ctx); ctx.restore();
  }

  // ---------------- main loop ----------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (GS.phase === 'idle') { clk += dt; if (!S || S.mode !== 'attract') setupAttract(); stepTick(dt); updateCommon(dt); if (S.items.length < 5) fillMonomers(5); }
    else if (GS.running) {
      clk += dt;
      if (S.mode === 'learn' && GS.phase === 'play') setupTest();
      if (S.mode === 'attract') { if (GS.phase === 'learn') setupLearn(); else setupTest(); }
      if (!S.trans || S.trans.type === 'swirl') { if (S.mode === 'learn') updateLearn(dt); else updateTest(dt); }
      updateCommon(dt);
      const sc = S.mode === 'test' ? scoreOf(S.snakes[0]) + ',' + scoreOf(S.snakes[1]) : '0,0';
      if (sc !== S.lastScore) { S.lastScore = sc; const [x, y] = sc.split(','); GS.score(+x, +y); }
    }
    render();
    GS.endFrame();
    requestAnimationFrame(frame);
  }

  GS.init({
    id: 1, title: 'Chain Reaction', mode: 'vs', learnSeconds: 90,
    controls: { p1: 'W A S D to steer  (F = A)', p2: 'Arrow keys to steer  (Enter = A)' },
    onRound() { setupLearn(); },
    onPhase(p, prev) { if (p === 'play') setupTest(); if (p === 'idle') setupAttract(); if (p === 'learn' && (!S || S.mode !== 'learn')) setupLearn(); },
    onPause() {},
  });
  window.__CHAIN = { get S() { return S; } }; // debug hook for headless checks
  setupAttract();
  requestAnimationFrame(frame);
})();
