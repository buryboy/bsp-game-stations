// Recycle Run — station 07 (Sustainability & recycling). Co-op night drive: two cars, one team score.
(function () {
  'use strict';
  const { W, HH, HZ, RW, FOC, proj, F } = D;
  const cl = H.clamp, E = H.ease, lerp = H.lerp;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, W, HH);
  D.buildStatic();
  const refresh = () => D.clearSprites();
  if (document.fonts) { document.fonts.ready.then(refresh); document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', refresh); }

  const CARZ = 2.6, CW = 1.25, XMAX = 3.3, BOARDZ = 3.2;
  const PCOL = ['#ff4fd8', '#4ff3ff'], OK = '#5cffb0', BAD = '#ff3d5a', YEL = '#ffe066', ORANGE = '#ff9a3d';
  const rand = Math.random, pick = (a) => a[Math.floor(rand() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ======================================================================= rows (a line of gates across the road)
  const codeOpt = (n) => ({ id: 'code' + n, type: 'code', code: n });
  function mkRow(kind, opts, q, extra) {
    q.forEach((qq) => { if (qq.target == null) qq.target = qq.ans[0]; });
    return Object.assign({ kind, opts, N: opts.length, q, z: 60, resolved: false, res: [null, null], age: 0, born: S ? S.vt : 0, pts: 100, guided: false, question: '', caption: '' }, extra);
  }
  function codeRow(N, recent) {
    let a, b, tries = 0;
    do { a = pick(RR.ITEMS); b = pick(RR.ITEMS); tries++; } while ((a[1] === b[1] || (recent && (recent.includes(a[0]) || recent.includes(b[0])))) && tries < 60);
    if (recent) { recent.push(a[0], b[0]); while (recent.length > 6) recent.shift(); }
    const codes = new Set([a[1], b[1]]);
    while (codes.size < N) codes.add(1 + Math.floor(rand() * 7));
    const list = [...codes].sort((x, y) => x - y);
    const q = [a, b].map((it) => ({ tag: it[0], icon: it[2], ans: [list.indexOf(it[1])], explain: `${it[0]} = ${it[1]} ${RR.CODES[it[1]].ab}` }));
    return mkRow('code', list.map(codeOpt), q, { question: 'WHICH RECYCLING CODE?' });
  }
  const YES = { id: 'yes', type: 'text', label: 'YES: REMELT', sub: 'thermoforming', col: OK, showSub: true };
  const NO = { id: 'no', type: 'text', label: "NO: CAN'T", sub: 'thermosetting', col: ORANGE, showSub: true };
  function remeltQ(it) { return { tag: it[0], sub: it[1], icon: it[3], ans: [it[2] ? 0 : 1], explain: `${it[0]}: ${it[2] ? 'THERMOFORMING, REMELTS' : "THERMOSET, CAN'T REMELT"}` }; }
  function remeltRow(recent) {
    let a, b, tries = 0;
    do { a = pick(RR.REMELT); b = pick(RR.REMELT); tries++; } while ((a === b || (recent && (recent.includes(a[0]) || recent.includes(b[0])))) && tries < 60);
    if (recent) { recent.push(a[0], b[0]); while (recent.length > 6) recent.shift(); }
    return mkRow('remelt', [YES, NO], [remeltQ(a), remeltQ(b)], { question: 'CAN IT BE REMELTED AND RECYCLED?' });
  }
  function ecoRow(used) {
    let e, tries = 0; do { e = pick(RR.ECO); tries++; } while (used.includes(e[0]) && tries < 60);
    used.push(e[0]); while (used.length > 7) used.shift();
    const o = shuffle([e[1], e[2]]).map((l) => ({ id: 'eco|' + l, type: 'text', label: l }));
    const ans = [o.findIndex((x) => x.label === e[1])];
    const q = [0, 1].map(() => ({ ans, explain: 'ANSWER: ' + e[1] }));
    return mkRow('eco', o, q, { question: e[0], shared: true });
  }
  function stepsRow(i) {
    const others = shuffle(RR.STEPS.map((s, k) => k).filter((k) => k !== i)).slice(0, 2);
    const ids = shuffle([i, ...others]);
    const o = ids.map((k) => ({ id: 'step' + k, type: 'text', label: RR.STEPS[k][0], sub: RR.STEPS[k][1], showSub: !!RR.STEPS[k][1] }));
    const ans = [ids.indexOf(i)];
    return mkRow('steps', o, [0, 1].map(() => ({ ans, explain: `STEP ${i + 1}: ${RR.STEPS[i][0]}` })), { question: `RECYCLING ROUTE: STEP ${i + 1} OF 5`, shared: true, pts: 120, stepI: i });
  }
  function compostRow() {
    const bad = shuffle(RR.NOTBIO.slice()).slice(0, 2);
    const o = shuffle([...RR.BIO.map((b) => ({ id: 'bio|' + b[0], type: 'text', label: b[0], icon: b[1], bio: true, sub: b[2] + ': compostable' })),
      ...bad.map((b) => ({ id: 'nb|' + b[0], type: 'text', label: b[0], icon: b[1], sub: 'not biodegradable' }))]);
    const ans = o.map((x, k) => (x.bio ? k : -1)).filter((k) => k >= 0);
    return mkRow('compost', o, [{ ans: ans.slice(), target: ans[0] }, { ans: ans.slice(), target: ans[1] }].map((q) => Object.assign(q, { explain: 'COMPOST: PLA AND POTATOPAK' })), { question: 'WHICH GOES IN THE COMPOST?', shared: true, pts: 150 });
  }
  // tutorial rows (LEARN): fixed cargo, answers highlighted
  function learnCode(n1, n2, codes) {
    const it = (n) => RR.ITEMS.find((x) => x[0] === n);
    const q = [it(n1), it(n2)].map((x) => ({ tag: x[0], icon: x[2], ans: [codes.indexOf(x[1])], explain: `${x[0]} = ${x[1]} ${RR.CODES[x[1]].ab}` }));
    return mkRow('code', codes.map(codeOpt), q, { guided: true });
  }
  function learnRemelt() {
    const f = (n) => RR.REMELT.find((x) => x[0] === n);
    return mkRow('remelt', [YES, NO], [remeltQ(f('YOGHURT POT')), remeltQ(f('MELAMINE PLATE'))], { guided: true });
  }
  function learnCompost() {
    const o = [{ id: 'bio|PLA CUP', type: 'text', label: 'PLA CUP', icon: 'cup', bio: true, sub: 'corn starch: compostable' },
      { id: 'nb|FOAM CUP', type: 'text', label: 'FOAM CUP', icon: 'cup', sub: 'not biodegradable' },
      { id: 'bio|POTATOPAK TRAY', type: 'text', label: 'POTATOPAK TRAY', icon: 'tray', bio: true, sub: 'potato starch: compostable' }];
    const ex = 'COMPOST: PLA AND POTATOPAK';
    return mkRow('compost', o, [{ ans: [0, 2], target: 0, explain: ex }, { ans: [0, 2], target: 2, explain: ex }], { guided: true, shared: true });
  }
  const gateIdx = (row, x) => cl(Math.floor((x + RW) / (2 * RW / row.N)), 0, row.N - 1);

  // ======================================================================= LEARN script (seconds at learnSeconds = 90)
  const BEATS = [
    { d: 6, k: 'title' },
    { d: 3.6, k: 'sign', icon: 'drop', col: '#ffb347', h: 'CRUDE OIL IS FINITE', s: 'most polymers come from it, and it will run out' },
    { d: 3.6, k: 'sign', icon: 'noleaf', col: '#ff7ad9', h: "MOST POLYMERS AREN'T BIODEGRADABLE", s: "oil-based plastics don't break down naturally" },
    { d: 3.6, k: 'sign', icon: 'hourglass', col: YEL, h: 'THEY LAST HUNDREDS OF YEARS', s: 'in landfill and in the ocean' },
    { d: 3.6, k: 'sign', icon: 'fish', col: '#4ff3ff', h: 'MICROPLASTICS HARM WILDLIFE', s: 'tiny bits of plastic in the ocean' },
    { d: 3.6, k: 'sign', icon: 'recycle', col: OK, h: 'SO RECYCLE! EACH HAS A CODE', s: 'the number in the recycling triangle' },
    { d: 6.5, k: 'row', row: () => learnCode('DRINKS BOTTLE', 'MILK BOTTLE', [1, 2]), cap: 'STEER THROUGH THE CODE FOR YOUR CARGO' },
    { d: 6.5, k: 'row', row: () => learnCode('DRAIN PIPE', 'CARRIER BAG', [3, 4]), cap: 'GO WHERE YOUR P1 / P2 OUTLINE IS' },
    { d: 6.5, k: 'row', row: () => learnCode('YOGHURT POT', 'FOAM CUP', [5, 6]), cap: '6 PS = POLYSTYRENE' },
    { d: 6.5, k: 'row', row: () => learnCode('CLING FILM', 'PLA CUP', [4, 7]), cap: '7 OTHER = MIXED OR OTHER POLYMERS' },
    { d: 3.6, k: 'sign', icon: 'recycle', col: OK, h: 'ONLY THERMOFORMING REMELTS', s: 'only thermoforming polymers can be recycled by remelting' },
    { d: 3.6, k: 'sign', icon: 'socket', col: ORANGE, h: "THERMOSETS CAN'T BE REMELTED", s: 'they can be ground up and used as fillers' },
    { d: 6.5, k: 'row', row: learnRemelt, cap: 'THERMOFORMING = YES   THERMOSETTING = NO' },
    { d: 8.6, k: 'steps' },
    { d: 4.4, k: 'sign', icon: 'flame', col: ORANGE, h: 'OR: INCINERATION', s: 'burning it to make electricity, but it releases CO₂', s2: 'other options: REUSE and REDUCE' },
    { d: 7, k: 'row', row: learnCompost, cap: 'BIOPOLYMERS: FROM PLANTS, COMPOSTABLE' },
    { d: 999, k: 'ready' },
  ];
  { let t = 0; for (const b of BEATS) { b.t0 = t; t += b.d; b.t1 = t; } }
  const learnScale = () => cl((GS.learnLeft() + GS.t) / 90, 0.3, 1); // learnSeconds / 90
  const PLAN = [['code', 3], ['eco', 2], ['remelt', 3], ['code', 4], ['steps', 5], ['compost', 2], ['code', 4], ['eco', 2], ['remelt', 3], ['code', 4], ['compost', 2], ['steps', 5], ['eco', 2]];
  const WAVES = {
    code: ['SORT BY CODE', 'match the number in the triangle'],
    eco: ['ECO QUIZ', 'both cars answer'],
    remelt: ['BONUS: REMELT?', 'thermoforming or thermosetting?'],
    steps: ['RECYCLING ROUTE', 'drive the steps in order'],
    compost: ['COMPOST RUN', 'find the biopolymers'],
  };

  // ======================================================================= state
  let S = null;
  const parts = Array.from({ length: 260 }, () => ({ life: 0 }));
  function fresh() {
    return {
      cars: [{ x: -2, vx: 0, roll: 0, shield: 0, glow: 0 }, { x: 2, vx: 0, roll: 0, shield: 0, glow: 0 }],
      score: 0, streak: 0, mult: 1, rows: [], dist: 0, v: 8, pops: [], shake: 0, flashR: 0, flashG: 0,
      beat: -1, ready: [false, false], test: null, banner: null, last: null, vt: S ? S.vt : 0, tier: 0,
      attract: { next: 0.5, recent: [] }, brain: { row: null, wait: 0, target: null, err: 0 }, cpuReadyT: -1, cpuStats: { n: 0, ok: 0 }, p1Stats: { n: 0, ok: 0 },
    };
  }
  S = fresh();
  function resetRound() { S = fresh(); for (const p of parts) p.life = 0; GS.score(0); }

  function spark(x, y, col, n, spd = 340) {
    for (const p of parts) {
      if (n <= 0) break; if (p.life > 0) continue;
      const a = rand() * Math.PI * 2, s = spd * (0.3 + rand());
      Object.assign(p, { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.5 + rand() * 0.5, max: 1, col, sz: 2 + rand() * 3 });
      n--;
    }
  }
  function pop(txt, col, x, y, opt = {}) {
    S.pops.push(Object.assign({ txt, col, x, y, t: 0, life: 1.4, px: 34, vy: -40 }, opt));
    while (S.pops.length > 10) S.pops.shift();
  }
  const carSX = (i) => proj(S.cars[i].x, 0, CARZ)[0];

  // ======================================================================= resolution of a gate row
  function resolve(row) {
    row.resolved = true; row.age = 0; S.last = row;
    const mode = GS.phase === 'idle' ? 'attract' : GS.phase === 'learn' ? 'learn' : 'test';
    GS.sfx('whoosh', { gain: 0.5, dur: 0.3 });
    let calls = 0; const said = new Set();
    for (let i = 0; i < 2; i++) {
      const c = S.cars[i], idx = gateIdx(row, c.x), ok = row.q[i].ans.includes(idx);
      row.res[i] = { idx, ok };
      if (i === 1 && GS.cpu && GS.cpu.on && mode === 'test') { S.cpuStats.n++; if (ok) S.cpuStats.ok++; }
      if (i === 0 && mode === 'test') { S.p1Stats.n++; if (ok) S.p1Stats.ok++; }
      if (mode === 'attract') continue;
      const sx = carSX(i), pan = cl((sx - 640) / 640, -0.8, 0.8);
      if (ok) {
        c.glow = 1; spark(sx, 560, OK, 26); spark(sx, 560, PCOL[i], 14);
        if (mode === 'test') {
          S.streak++; const m = 1 + Math.min(4, Math.floor(S.streak / 2));
          if (m > S.mult) { GS.sfx('powerup', { gain: 0.6 }); pop('COMBO x' + m, YEL, 640, 380, { px: 40, life: 1.2 }); }
          S.mult = m; const pts = row.pts * S.mult; S.score += pts;
          pop('+' + pts, PCOL[i], cl(sx, 120, 1160), 470);
          GS.sfx('success', { pan, gain: 0.7 });
        } else {
          GS.sfx('success', { pan, gain: 0.5 });
          if (!said.has(row.q[i].explain)) { said.add(row.q[i].explain); pop('✓ ' + row.q[i].explain, OK, cl(sx, 300, 980), 430 - calls * 48, { px: 28, life: 2.6, vy: -8, box: true }); calls++; }
        }
      } else {
        if (mode === 'test') {
          S.streak = 0; S.mult = 1; S.score = Math.max(0, S.score - 50);
          c.shield = 1; S.shake = 0.35; S.flashR = 1;
          pop('-50', BAD, cl(sx, 120, 1160), 520, { px: 30 });
          GS.sfx('error', { pan, gain: 0.8 }); GS.sfx('thud', { pan, gain: 0.5 });
        } else { c.shield = 0.6; GS.sfx('error', { pan, gain: 0.4 }); }
        if (!said.has(row.q[i].explain)) { said.add(row.q[i].explain); pop('✗ ' + row.q[i].explain, YEL, cl(sx, 300, 980), 430 - calls * 48, { px: 28, life: 2.8, vy: -8, box: true }); calls++; }
      }
    }
    if (mode === 'test') {
      GS.score(S.score);
      const T = S.test;
      if (row.kind === 'steps') {
        if (!row.res[0].ok || !row.res[1].ok) T.perfect = false;
        if (row.stepI === 4) {
          let script = 'then: new granules → new products';
          if (T.perfect) { S.score += 300; GS.score(S.score); script = 'perfect route! +300'; GS.sfx('sparkle', { gain: 0.8 }); }
          S.banner = { t: 0, dur: 2.2, chrome: 'NEW GRANULES!', script, small: 'e.g. PET bottles → fleece jackets' };
          T.next = 2.4;
        }
      }
    }
  }

  // ======================================================================= updates
  function steer(dt, i, dir) {
    const c = S.cars[i];
    c.vx += (dir * 7.5 - c.vx) * Math.min(1, dt * 9);
    c.x += c.vx * dt;
    if (c.x < -XMAX) { c.x = -XMAX; c.vx = 0; } if (c.x > XMAX) { c.x = XMAX; c.vx = 0; }
    c.roll = lerp(c.roll, -c.vx * 0.012, Math.min(1, dt * 8));
    c.shield = Math.max(0, c.shield - dt * 0.9); c.glow = Math.max(0, c.glow - dt * 1.6);
  }
  function moveWorld(dt) {
    S.dist += S.v * dt;
    for (const r of S.rows) {
      r.z -= S.v * dt; r.age += dt;
      if (!r.resolved && r.z <= CARZ) resolve(r);
    }
    S.rows = S.rows.filter((r) => r.z > 0.5);
    if (S.last && !S.rows.includes(S.last)) S.last.age += dt;
    for (const p of S.pops) p.t += dt;
    S.pops = S.pops.filter((p) => p.t < p.life);
    for (const p of parts) if (p.life > 0) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.vx *= 0.98; }
    S.shake = Math.max(0, S.shake - dt); S.flashR = Math.max(0, S.flashR - dt * 3); S.flashG = Math.max(0, S.flashG - dt * 3);
    if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dur) S.banner = null; }
  }
  const active = () => S.rows.find((r) => !r.resolved);
  const AUTO = new URLSearchParams(location.search).get('auto') === '1';

  function autopilot(dt) {
    const r = active();
    for (let i = 0; i < 2; i++) {
      let tx = i ? 2 : -2;
      if (r) { const gw = 2 * RW / r.N; tx = -RW + (r.q[i].target + 0.5) * gw + (i ? 0.25 : -0.25); }
      const d = tx - S.cars[i].x; steer(dt, i, Math.abs(d) < 0.12 ? 0 : cl(d * 1.5, -1, 1));
    }
  }

  // ---- CPU partner (co-op sidekick): drives car 2 only, carries its own cargo, never steers the human's car.
  const cpuOn = () => !!(GS.cpu && GS.cpu.on && GS.running);
  function cpuBrain(dt, skill) {
    const B = S.brain, r = active(), c = S.cars[1];
    if (r !== B.row) {
      B.row = r; B.target = null; B.err = (rand() - 0.5) * 0.9 * (1 - skill);
      B.wait = lerp(1.4, 0.35, (skill - 0.1) / 0.85) * (0.8 + rand() * 0.5);
    }
    if (r && B.target == null) {
      // shared questions: let the human read and decide first; the CPU only moves in the last ~1.6 s
      const late = r.shared && GS.phase === 'play' ? r.z > CARZ + S.v * 1.6 : false;
      if (!late) { B.wait -= dt; }
      if (!late && B.wait <= 0) {
        const q = r.q[1];
        if (r.guided || GS.phase === 'learn') B.target = q.target;
        else if (rand() < 0.6 + 0.35 * skill) {
          // right answer; with two right gates (compost) prefer the one P1 is not in
          const p1 = gateIdx(r, S.cars[0].x), opts = q.ans.filter((k) => k !== p1);
          B.target = opts.length ? pick(opts) : q.ans[0];
        } else {
          const wrong = r.opts.map((o, k) => k).filter((k) => !q.ans.includes(k));
          B.target = wrong.length ? pick(wrong) : q.ans[0];
        }
      }
    }
    let tx = c.x;
    if (r && B.target != null) { const gw = 2 * RW / r.N; tx = -RW + (B.target + 0.5) * gw + B.err * gw * 0.35; }
    else if (!r) tx = cl(S.cars[0].x + (S.cars[0].x < 0 ? 2.4 : -2.4), -XMAX, XMAX); // drift to a free lane between rows
    const d = tx - c.x, maxDir = lerp(0.55, 1, (skill - 0.1) / 0.85);
    steer(dt, 1, Math.abs(d) < 0.12 ? 0 : cl(d * 1.4, -maxDir, maxDir));
    // LEARN: ready a second after Player 1
    const b = BEATS[S.beat];
    if (GS.phase === 'learn' && b && b.k === 'ready' && S.ready[0] && !S.ready[1]) {
      if (S.cpuReadyT < 0) S.cpuReadyT = 1.0;
      S.cpuReadyT -= dt; if (S.cpuReadyT <= 0) { S.ready[1] = true; GS.sfx('select', { gain: 0.7 }); }
    }
  }
  function steerHumans(dt) {
    for (let i = 0; i < 2; i++) {
      if (i === 1 && cpuOn()) { cpuBrain(dt, GS.cpu.skill); continue; }
      if (AUTO && i === 0) { autopilot1(dt); continue; }
      if (AUTO && !cpuOn()) { autopilot1(dt, 1); continue; }
      const p = i + 1; steer(dt, i, (GS.held(p, 'right') ? 1 : 0) - (GS.held(p, 'left') ? 1 : 0));
    }
  }
  function autopilot1(dt, i = 0) { // test helper (?auto=1): perfect driver for one car
    const r = active(); let tx = i ? 2 : -2;
    if (r) { const gw = 2 * RW / r.N; tx = -RW + (r.q[i].target + 0.5) * gw + (i ? 0.25 : -0.25); }
    const d = tx - S.cars[i].x; steer(dt, i, Math.abs(d) < 0.12 ? 0 : cl(d * 1.5, -1, 1));
    if (AUTO && i === 0 && BEATS[S.beat] && BEATS[S.beat].k === 'ready' && !S.ready[0] && GS.phase === 'learn') S.ready[0] = true;
  }

  function updateAttract(dt) {
    S.v = 10; const A = S.attract;
    autopilot(dt);
    if (!active()) { A.next -= dt; if (A.next <= 0) { const r = codeRow(3, A.recent); r.z = CARZ + S.v * 4; r.born = S.vt; S.rows.push(r); A.next = 1.2; } }
    moveWorld(dt);
  }

  function updateLearn(dt) {
    const sc = learnScale(), lt = GS.t / sc;
    let bi = BEATS.findIndex((b) => lt >= b.t0 && lt < b.t1); if (bi < 0) bi = BEATS.length - 1;
    S.v = 7;
    if (bi !== S.beat) {
      S.beat = bi; const b = BEATS[bi]; S.last = null;
      S.rows = S.rows.filter((r) => r.resolved);
      if (b.k === 'row') {
        const r = b.row(); r.caption = b.cap; r.born = S.vt;
        r.z = CARZ + S.v * Math.max(0.8, (b.t1 - 1.3 - lt) * sc);
        S.rows.push(r); GS.sfx('neon', { gain: 0.5 });
      } else if (b.k !== 'ready') GS.sfx('neon', { gain: 0.35 });
      if (b.k === 'title') GS.sfx('impact', { gain: 0.6 });
    }
    steerHumans(dt);
    if (BEATS[bi].k === 'ready') {
      for (let i = 0; i < 2; i++) if (GS.hit(i + 1, 'a') && !S.ready[i]) { S.ready[i] = true; GS.sfx('select', { gain: 0.7 }); }
      if (S.ready[0] && S.ready[1]) GS.skipLearn();
    }
    moveWorld(dt);
  }

  function startTest() {
    S.rows = []; S.pops = []; S.streak = 0; S.mult = 1; S.banner = null; S.last = null;
    S.test = { t: 0, plan: 0, rowsLeft: 0, kind: null, next: 0.3, stepI: 0, perfect: true, recent: [], eco: [] };
  }
  function updateTest(dt) {
    if (!S.test) startTest();
    const T = S.test; T.t += dt;
    const d = cl(T.t / 200);
    S.v = lerp(9, 16, d);
    const tier = d < 0.33 ? 0 : d < 0.66 ? 1 : 2;
    if (tier > S.tier) { S.tier = tier; pop('SPEED UP!', ORANGE, 640, 380, { px: 44, life: 1.4 }); GS.sfx('riser', { gain: 0.6 }); }
    steerHumans(dt);
    if (!active()) {
      T.next -= dt;
      if (T.next <= 0) {
        if (T.rowsLeft <= 0) {
          const [kind, n] = PLAN[T.plan % PLAN.length]; T.plan++;
          T.kind = kind; T.rowsLeft = n; T.stepI = 0; T.perfect = true;
          const wv = WAVES[kind]; S.banner = { t: 0, dur: 1.9, chrome: wv[0], script: wv[1] };
          GS.sfx('impact', { gain: 0.7 }); T.next = 2.0;
        } else {
          let r;
          if (T.kind === 'code') r = codeRow(d < 0.25 ? 3 : 4, T.recent);
          else if (T.kind === 'remelt') r = remeltRow(T.recent);
          else if (T.kind === 'eco') r = ecoRow(T.eco);
          else if (T.kind === 'steps') r = stepsRow(T.stepI++);
          else r = compostRow();
          const read = lerp(6.2, 3.7, d) + (r.kind === 'eco' || r.kind === 'compost' ? 0.6 : 0);
          r.z = CARZ + S.v * read; r.born = S.vt;
          S.rows.push(r); T.rowsLeft--; T.next = 1.3;
          GS.sfx('neon', { gain: 0.45 });
        }
      }
    }
    moveWorld(dt);
  }

  // ======================================================================= drawing: world
  function drawRoadside(list) {
    // neon marker posts
    list.push({ z: 999, f: () => {
      ctx.save();
      const off = S.dist % 5;
      D.neonStroke(ctx, '#b02cff', 1.4, () => {
        for (let z = 5 - off; z < 70; z += 5) {
          if (z < 1.3) continue;
          for (const s of [-1, 1]) { const [x0, y0] = proj(s * (RW + 0.5), 0, z), [, y1] = proj(s * (RW + 0.5), 0.75, z); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); }
        }
      });
      ctx.restore();
    } });
    const off = S.dist % 14;
    for (let k = 0; k < 6; k++) {
      const z = k * 14 + 14 - off; if (z < 1.6 || z > 80) continue;
      for (const s of [-1, 1]) {
        list.push({ z, f: () => {
          const [x, y] = proj(s * (RW + 2.9), 0, z), sp = D.palmSpr(s > 0), sc = 5 / z;
          ctx.globalAlpha = cl((80 - z) / 20);
          ctx.drawImage(sp.c, x - 150 * sc, y - 420 * sc, 300 * sc, 420 * sc);
          ctx.globalAlpha = 1;
        } });
      }
    }
  }
  function gateCol(row, i) {
    if (row.resolved) {
      const good = row.q[0].ans.includes(i) || row.q[1].ans.includes(i);
      const chosen = (row.res[0] && row.res[0].idx === i) || (row.res[1] && row.res[1].idx === i);
      if (good && (chosen || row.age % 0.2 < 0.12)) return OK;
      if (chosen) return BAD;
      return '#5a3a8a';
    }
    if (row.guided) {
      const a = row.q[0].target === i, b = row.q[1].target === i;
      if (a && b) return OK; if (a) return PCOL[0]; if (b) return PCOL[1];
    }
    return '#4ff3ff';
  }
  function drawRow(row) {
    const z = row.z; if (z < 0.9 || z > 110) return;
    const a = cl((110 - z) / 25) * cl((z - 0.9) / 0.7);
    const gw = 2 * RW / row.N, hb = 2.35, lw = Math.max(1, 10 / z);
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < row.N; i++) {
      const x0 = -RW + i * gw + 0.07, x1 = x0 + gw - 0.14, col = gateCol(row, i);
      const [ax, ay] = proj(x0, 0, z), [bx] = proj(x1, 0, z), [, ty] = proj(x0, hb, z);
      ctx.fillStyle = H.rgba(col, 0.08); ctx.fillRect(ax, ty, bx - ax, ay - ty);
      D.neonStroke(ctx, col, lw, () => { ctx.moveTo(ax, ay); ctx.lineTo(ax, ty); ctx.lineTo(bx, ty); ctx.lineTo(bx, ay); });
      // the finish strip on the road
      ctx.fillStyle = H.rgba(col, 0.5); ctx.fillRect(ax, ay - Math.max(1, lw * 0.6), bx - ax, Math.max(2, lw * 1.2));
      // sign above the gate
      const cx = -RW + (i + 0.5) * gw, signW = Math.min(gw * 0.86, 2.3), sc = (signW * FOC / z) / D.SW;
      const [sx, sy] = proj(cx, hb + 0.06, z), sp = D.signSpr(row.opts[i], row.guided);
      const boardOn = !row.resolved && GS.phase !== 'over' && !(GS.phase === 'learn' && !row.guided);
      ctx.globalAlpha = a * (boardOn ? Math.max(cl((5.0 - z) / 0.8), cl((z - 12) / 3)) : 1);
      ctx.drawImage(sp.c, sx - D.SW * sc / 2, sy - D.SH * sc, D.SW * sc, D.SH * sc);
      ctx.globalAlpha = a;
      if (row.guided && !row.resolved && z < 5) {
        for (let p = 0; p < 2; p++) if (row.q[p].target === i) {
          const bob = Math.sin(S.vt * 6) * 8 * sc, off = (row.q[0].target === row.q[1].target ? (p ? 1 : -1) * 40 * sc : 0);
          const yy = sy - D.SH * sc - 24 * sc + bob, s2 = 40 * sc, xx = sx + off;
          D.neonStroke(ctx, PCOL[p], Math.max(1, 3 * sc), () => { ctx.moveTo(xx - s2, yy - s2 * 0.7); ctx.lineTo(xx, yy); ctx.lineTo(xx + s2, yy - s2 * 0.7); });
        }
      }
    }
    ctx.restore();
  }
  function drawLaneGuides(row) {
    if (!row || row.z < 2) return;
    const gw = 2 * RW / row.N, off = S.dist % 2.4;
    ctx.save(); ctx.globalAlpha = 0.7;
    D.neonStroke(ctx, '#b9a2ff', 1.2, () => {
      for (let b = 1; b < row.N; b++) {
        const x = -RW + b * gw;
        for (let z = 1.6 - off + 2.4; z < row.z; z += 2.4) {
          const z1 = Math.min(row.z, z + 1.1); if (z1 <= 1.5) continue;
          const [x0, y0] = proj(x, 0, Math.max(1.5, z)), [x1, y1] = proj(x, 0, z1); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        }
      }
    });
    ctx.restore();
  }
  function drawCar(i) {
    const c = S.cars[i], [sx, sy] = proj(c.x, 0, CARZ), sp = D.carSpr(i + 1);
    const pw = CW * FOC / CARZ, sc = pw / 388, bob = Math.sin(S.dist * 2.1 + i * 2) * 1.2;
    // shadow + underglow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.ellipse(sx, sy + 2, pw * 0.56, 12, 0, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const ug = ctx.createRadialGradient(sx, sy, 4, sx, sy, pw * 0.75);
    ug.addColorStop(0, H.rgba(PCOL[i], 0.55)); ug.addColorStop(1, H.rgba(PCOL[i], 0));
    ctx.fillStyle = ug; ctx.beginPath(); ctx.ellipse(sx, sy, pw * 0.75, 26, 0, 0, 7); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(sx, sy + bob); ctx.rotate(c.roll);
    ctx.drawImage(sp.c, -sp.w * sc / 2, -sp.h * sc + 6 * sc, sp.w * sc, sp.h * sc);
    // tail-light glow
    ctx.globalCompositeOperation = 'lighter';
    for (const tx of [-112, 112]) {
      const gx = tx * sc, gy = -80 * sc, rg = ctx.createRadialGradient(gx, gy, 2, gx, gy, 70 * sc);
      rg.addColorStop(0, 'rgba(255,60,100,0.6)'); rg.addColorStop(1, 'rgba(255,30,80,0)');
      ctx.fillStyle = rg; ctx.fillRect(gx - 70 * sc, gy - 70 * sc, 140 * sc, 140 * sc);
    }
    ctx.restore();
    // shield flicker (wrong) / green ring (right)
    if (c.shield > 0 && (S.vt * 20) % 2 < 1.3) {
      ctx.save(); ctx.globalAlpha = Math.min(1, c.shield * 1.5);
      D.neonStroke(ctx, BAD, 3, () => { ctx.ellipse(sx, sy - pw * 0.27, pw * 0.66, pw * 0.42, 0, 0, 7); });
      ctx.restore();
    }
    if (c.glow > 0) {
      ctx.save(); ctx.globalAlpha = c.glow; const r = pw * (0.6 + (1 - c.glow) * 0.5);
      D.neonStroke(ctx, OK, 3, () => { ctx.ellipse(sx, sy - pw * 0.27, r, r * 0.6, 0, 0, 7); });
      ctx.restore();
    }
  }
  function drawWorld() {
    const list = [];
    drawRoadside(list);
    for (const r of S.rows) list.push({ z: r.z, f: () => drawRow(r) });
    list.push({ z: CARZ + 0.001, f: () => {
      const o = S.cars[0].x < S.cars[1].x ? [1, 0] : [0, 1], ov = cl(1 - Math.abs(S.cars[0].x - S.cars[1].x) / CW);
      drawCar(o[0]); ctx.globalAlpha = 1 - 0.45 * ov; drawCar(o[1]); ctx.globalAlpha = 1;
    } });
    list.sort((a, b) => b.z - a.z);
    drawLaneGuides(active());
    for (const it of list) it.f();
    // particles
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) if (p.life > 0) { ctx.globalAlpha = cl(p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.sz, p.sz); }
    ctx.restore();
    // speed streaks
    const sp = cl((S.v - 10) / 6);
    if (sp > 0 && GS.running) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,190,240,${0.25 * sp})`; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 14; k++) {
        const a = rand() * Math.PI * 2, r0 = 420 + rand() * 200, r1 = r0 + 80 + rand() * 160;
        const ox = Math.cos(a), oy = Math.sin(a) * 0.6;
        ctx.moveTo(640 + ox * r0, HZ + oy * r0); ctx.lineTo(640 + ox * r1, HZ + oy * r1);
      }
      ctx.stroke(); ctx.restore();
    }
  }

  // ======================================================================= drawing: HUD
  function tagSpr(q, p) {
    const key = 'tag|' + q.tag + '|' + (q.sub || '') + '|' + p;
    let s = D.SPR.get(key); if (s) return s;
    const col = PCOL[p], name = q.tag, nw = D.textW(name, F(30)), sw = q.sub ? D.textW(q.sub, F(24, 500)) : 0;
    const w = Math.ceil(Math.max(nw, sw) + 120), h = q.sub ? 96 : 70;
    const c = H.layer(w + 20, h + 20), g = c.getContext('2d');
    const box = () => g.roundRect(10, 10, w, h, 16);
    g.fillStyle = 'rgba(8,1,22,0.88)'; g.beginPath(); box(); g.fill();
    D.neonStroke(g, col, 1.6, box);
    const is = D.iconSpr(q.icon, 20, col); g.drawImage(is.c, 52 - is.w / 2, 10 + h / 2 - is.h / 2);
    D.neonText(g, name, 90, q.sub ? 42 : 45, F(30), '#ffffff', 1, 'left');
    if (q.sub) D.neonText(g, q.sub, 90, 78, F(24, 500), col, 1, 'left');
    s = { c, w: c.width, h: c.height }; D.SPR.set(key, s); return s;
  }
  const pName = (p) => (p === 1 && GS.cpu && GS.cpu.on ? 'CPU' : 'P' + (p + 1));
  function chipDraw(x, y, p, filled, a = 1) {
    ctx.save(); ctx.globalAlpha = a;
    const box = () => ctx.roundRect(x - 34, y - 18, 68, 36, 10);
    if (filled) { ctx.fillStyle = H.rgba(H.mix(PCOL[p], '#000000', 0.55), 0.95); ctx.beginPath(); box(); ctx.fill(); D.neonStroke(ctx, PCOL[p], 1.4, box); D.drawSpr(ctx, D.neonSpr(pName(p), 24, '#ffffff'), x, y); }
    else { ctx.setLineDash([6, 5]); ctx.strokeStyle = PCOL[p]; ctx.lineWidth = 2; ctx.beginPath(); box(); ctx.stroke(); ctx.setLineDash([]); D.drawSpr(ctx, D.neonSpr(pName(p), 24, PCOL[p]), x, y, 0.55); }
    ctx.restore();
  }
  function boardLayout(row) {
    const gw = 2 * RW / row.N, k = FOC / BOARDZ;
    const cardW = Math.min(300, gw * k - 16), sc = Math.min(cardW / D.SW, 0.86);
    return { gw, sc, xs: row.opts.map((o, i) => 640 + (-RW + (i + 0.5) * gw) * k), top: 124, h: D.SH * sc };
  }
  function drawBoard(row) {
    if (!row) return;
    let a;
    if (!row.resolved) a = cl((row.z - 3.4) / 1.2) * D.flick(S.vt, row.born);
    else a = 1 - cl((row.age - 1.15) / 0.3);
    if (a <= 0) return;
    const L = boardLayout(row);
    ctx.save(); ctx.globalAlpha = a;
    // question / caption line
    const head = row.guided ? row.caption : row.question;
    if (head) D.drawSpr(ctx, D.neonSpr(head, 30, YEL, 1200), 640, 98);
    row.opts.forEach((o, i) => {
      const sp = D.signSpr(o, row.guided), x = L.xs[i], w = D.SW * L.sc;
      ctx.drawImage(sp.c, x - w / 2, L.top, w, L.h);
      const box = () => ctx.roundRect(x - w / 2 + 8 * L.sc, L.top + 8 * L.sc, w - 16 * L.sc, L.h - 16 * L.sc, 18 * L.sc);
      if (row.resolved) {
        const good = row.q[0].ans.includes(i) || row.q[1].ans.includes(i);
        const chosen = row.res.some((r) => r && r.idx === i);
        if (good) { D.neonStroke(ctx, OK, 3, box); D.drawSpr(ctx, D.neonSpr('✓', 44, OK), x + w / 2 - 26, L.top + 26); }
        else if (chosen) { D.neonStroke(ctx, BAD, 3, box); D.drawSpr(ctx, D.neonSpr('✗', 44, BAD), x + w / 2 - 26, L.top + 26); }
      } else if (row.guided) {
        for (let p = 0; p < 2; p++) if (row.q[p].target === i) { ctx.save(); ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(S.vt * 6)); D.neonStroke(ctx, PCOL[p], 2.6, box); ctx.restore(); }
      }
    });
    // P1 / P2 chips show which gate each car is lined up with
    const cy = L.top + L.h + 22;
    for (let p = 0; p < 2; p++) {
      const idx = row.resolved ? row.res[p] && row.res[p].idx : gateIdx(row, S.cars[p].x);
      if (row.guided && !row.resolved && idx !== row.q[p].target) chipDraw(L.xs[row.q[p].target] + (p ? 40 : -40), cy, p, false, a);
      if (idx != null) chipDraw(L.xs[idx] + (p ? 40 : -40), cy, p, true, a);
    }
    ctx.restore();
  }
  function drawTags(row) {
    if (!row || row.resolved || row.shared) return;
    const sx = [carSX(0), carSX(1)], sps = [tagSpr(row.q[0], 0), tagSpr(row.q[1], 1)];
    const overlap = Math.abs(sx[0] - sx[1]) < (sps[0].w + sps[1].w) / 2;
    const fl = D.flick(S.vt, row.born + 0.1);
    for (let p = 0; p < 2; p++) {
      const hw = sps[p].w / 2, x = cl(sx[p], hw + 4, W - hw - 4);
      let y = 470; if (overlap) y = p === (sx[0] < sx[1] ? 1 : 0) ? 470 : 470 - sps[1 - p].h + 14;
      if (overlap && p === (sx[0] < sx[1] ? 0 : 1)) y = 470 - sps[p].h + 6;
      D.drawSpr(ctx, sps[p], x, y, fl);
    }
  }
  function drawScore() {
    const x = 16, y = 10, w = 330, h = 66;
    const bz = ctx.createLinearGradient(0, y, 0, y + h);
    bz.addColorStop(0, '#9aa6d8'); bz.addColorStop(0.18, '#2a2448'); bz.addColorStop(0.55, '#120c26'); bz.addColorStop(0.82, '#3a2a5a'); bz.addColorStop(1, '#c28ad8');
    ctx.fillStyle = bz; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = '#05010e'; ctx.beginPath(); ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(79,243,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 7); ctx.stroke();
    D.drawSpr(ctx, D.neonSpr('TEAM', 24, '#ff4fd8'), x + 54, y + h / 2);
    const s = String(Math.min(999999, S.score)).padStart(6, '0');
    for (let i = 0; i < 6; i++) {
      const lead = i < 6 - String(S.score).length;
      D.drawSpr(ctx, D.neonSpr(s[i], 42, '#aaffff'), x + 122 + i * 34, y + h / 2 + 1, lead ? 0.28 : 1);
    }
    const gl = ctx.createLinearGradient(x, y, x + 200, y + h); gl.addColorStop(0, 'rgba(255,255,255,0.1)'); gl.addColorStop(0.45, 'rgba(255,255,255,0.04)'); gl.addColorStop(0.46, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    // combo
    const m = S.mult;
    D.drawSpr(ctx, D.neonSpr('COMBO x' + m, 28, m > 1 ? YEL : '#7a6aa8'), 470, 32, m > 1 ? 1 : 0.6);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k < Math.min(8, S.streak) ? YEL : 'rgba(120,110,170,0.35)'; ctx.fillRect(386 + k * 21, 56, 16, 7); }
  }
  function drawPops() {
    for (const p of S.pops) {
      const k = p.t / p.life, a = k < 0.1 ? k / 0.1 : 1 - cl((k - 0.75) / 0.25);
      const sp = D.neonSpr(p.txt, p.px, p.col, 1100), x = cl(p.x, sp.tw / 2 + 30, W - sp.tw / 2 - 30);
      const y = p.y + p.vy * p.t;
      if (p.box) { ctx.save(); ctx.globalAlpha = a * 0.8; ctx.fillStyle = 'rgba(8,0,22,0.9)'; ctx.beginPath(); ctx.roundRect(x - sp.tw / 2 - 18, y - p.px * 0.8, sp.tw + 36, p.px * 1.6, 12); ctx.fill(); ctx.restore(); }
      D.drawSpr(ctx, sp, x, y, a, k < 0.1 ? 1.25 - k * 2.5 : 1);
    }
  }
  function drawBanner(b) {
    if (!b) return;
    const p = cl(b.t / 0.4), out = cl((b.t - b.dur + 0.3) / 0.3);
    const sc = 1 + 1.4 * Math.pow(1 - p, 3), a = cl(p * 4) * (1 - out);
    const cs = D.chromeSpr(b.chrome, 84);
    ctx.save(); ctx.globalAlpha = a;
    // dark band behind the slam so it reads over the board / sun
    const g = ctx.createLinearGradient(0, 150, 0, 380); g.addColorStop(0, 'rgba(8,0,22,0)'); g.addColorStop(0.3, 'rgba(8,0,22,0.75)'); g.addColorStop(0.7, 'rgba(8,0,22,0.75)'); g.addColorStop(1, 'rgba(8,0,22,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 150, W, 230);
    D.drawSpr(ctx, cs, 640, 240, 1, sc);
    ctx.restore();
    if (b.t > 0.4 && b.t < 0.9) { const fl = Math.exp(-(b.t - 0.4) * 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,255,${0.3 * fl})`; ctx.fillRect(0, 0, W, HH); ctx.restore(); }
    if (b.t > 0.45 && b.t < 1.3) D.glint(ctx, 340 + (b.t - 0.45) / 0.85 * 600, 214, 40, 0.9 * (1 - out));
    D.drawSpr(ctx, D.scriptSpr(b.script, 56), 640, 316, D.flick(b.t, 0.5) * (1 - out));
    if (b.small) D.drawSpr(ctx, D.neonSpr(b.small, 28, '#4ff3ff', 1100), 640, 372, D.flick(b.t, 0.8) * (1 - out));
  }

  // LEARN overlays ---------------------------------------------------------------------------------------
  function drawLearn() {
    const sc = learnScale(), lt = GS.t / sc, b = BEATS[S.beat] || BEATS[0], bt = lt - b.t0;
    const fade = b.k === 'ready' ? 1 : 1 - cl((lt - (b.t1 - 0.25)) / 0.25);
    if (b.k !== 'title') D.drawSpr(ctx, D.chromeSpr('RECYCLE RUN', 34), 150, 42);
    if (b.k === 'title') {
      const p = cl((bt - 0.15) / 0.45), s2 = 1 + 1.6 * Math.pow(1 - p, 3);
      ctx.save(); ctx.globalAlpha = cl(p * 4) * fade;
      D.drawSpr(ctx, D.chromeSpr('RECYCLE RUN', 108), 640, 190, 1, s2);
      ctx.restore();
      if (p >= 1 && bt < 1.2) { const fl = Math.exp(-(bt - 0.6) * 7); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,200,255,${0.35 * fl})`; ctx.fillRect(0, 0, W, HH); ctx.restore(); }
      const gph = (bt - 0.8) % 2.2; if (bt > 0.8 && gph < 0.75) D.glint(ctx, 260 + (gph / 0.75) * 760, 150 + (gph / 0.75) * 30, 46, 0.95 * fade);
      D.drawSpr(ctx, D.scriptSpr('a co-op night drive', 66), 690, 290, D.flick(bt, 1.0) * fade);
      D.drawSpr(ctx, D.neonSpr('SORT THE PLASTIC. ONE TEAM SCORE.', 30, '#4ff3ff', 1100), 640, 360, D.flick(bt, 1.6) * fade);
    } else if (b.k === 'sign') {
      const on1 = D.flick(bt, 0.05) * fade, on2 = D.flick(bt, 0.45) * fade, on3 = D.flick(bt, 0.9) * fade;
      ctx.save(); ctx.globalAlpha = 0.6 * fade; const g = ctx.createLinearGradient(0, 90, 0, 400); g.addColorStop(0, 'rgba(8,0,22,0)'); g.addColorStop(0.25, 'rgba(8,0,22,0.7)'); g.addColorStop(0.8, 'rgba(8,0,22,0.7)'); g.addColorStop(1, 'rgba(8,0,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 90, W, 310); ctx.restore();
      D.drawSpr(ctx, D.iconSpr(b.icon, 46, b.col), 640, 150, on1);
      D.drawSpr(ctx, D.neonSpr(b.h, 46, b.col, 1200), 640, 232, on1);
      D.drawSpr(ctx, D.neonSpr(b.s, 30, '#ffffff', 1200), 640, 292, on2);
      if (b.s2) D.drawSpr(ctx, D.neonSpr(b.s2, 28, YEL, 1200), 640, 344, on3);
    } else if (b.k === 'steps') {
      ctx.save(); ctx.globalAlpha = 0.65 * fade; const g = ctx.createLinearGradient(0, 80, 0, 420); g.addColorStop(0, 'rgba(8,0,22,0)'); g.addColorStop(0.2, 'rgba(8,0,22,0.75)'); g.addColorStop(0.85, 'rgba(8,0,22,0.75)'); g.addColorStop(1, 'rgba(8,0,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 80, W, 340); ctx.restore();
      D.drawSpr(ctx, D.neonSpr('THE RECYCLING PROCESS', 34, YEL, 1100), 640, 112, D.flick(bt, 0.05) * fade);
      const ST = [['COLLECT', ''], ['SORT', 'by code'], ['WASH', ''], ['SHRED', 'into flakes'], ['MELT', ''], ['NEW GRANULES', 'new products']];
      const pos = [[250, 190], [640, 190], [1030, 190], [250, 300], [640, 300], [1010, 300]];
      ST.forEach(([w, sub], i) => {
        const t0 = 0.5 + i * 1.0, on = D.flick(bt, t0) * fade, [x, y] = pos[i];
        ctx.save(); ctx.globalAlpha = fade; D.drawSpr(ctx, D.deadSpr(w, 36, '#ff7ad9'), x, y); ctx.restore();
        D.drawSpr(ctx, D.neonSpr(w, 36, i === 5 ? OK : '#ff4fd8'), x, y, on);
        D.drawSpr(ctx, D.neonSpr(String(i + 1), 24, '#4ff3ff'), x - D.textW(w, F(36)) / 2 - 30, y, on);
        if (sub) D.drawSpr(ctx, D.neonSpr(sub, 24, '#4ff3ff'), x, y + 38, on);
        if (i < 5 && bt > t0 + 0.4) {
          ctx.save(); ctx.globalAlpha = fade;
          const pr = cl((bt - t0 - 0.4) / 0.4);
          if (i === 2) D.neonArrow(ctx, [[1030, 226], [1030, 248], [250, 248], [250, 268]], pr, '#b9a2ff', 1.6);
          else { const [nx] = pos[i + 1]; const hw = D.textW(w, F(36)) / 2 + 14, nw = D.textW(ST[i + 1][0], F(36)) / 2 + 44; D.neonArrow(ctx, [[x + hw, y], [nx - nw, y]], pr, '#b9a2ff', 1.8); }
          ctx.restore();
        }
      });
      D.drawSpr(ctx, D.scriptSpr('e.g. PET bottles → fleece jackets', 48), 640, 370, D.flick(bt, 6.7) * fade);
    } else if (b.k === 'ready') {
      ctx.save(); const g = ctx.createLinearGradient(0, 90, 0, 420); g.addColorStop(0, 'rgba(8,0,22,0)'); g.addColorStop(0.25, 'rgba(8,0,22,0.7)'); g.addColorStop(0.8, 'rgba(8,0,22,0.7)'); g.addColorStop(1, 'rgba(8,0,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 90, W, 330); ctx.restore();
      const p = cl(bt / 0.4);
      D.drawSpr(ctx, D.chromeSpr('READY?', 92), 640, 180, cl(p * 4), 1 + 1.2 * Math.pow(1 - p, 3));
      D.drawSpr(ctx, D.neonSpr('BOTH PRESS YOUR A BUTTON TO START THE TEST', 30, YEL, 1200), 640, 268, D.flick(bt, 0.4));
      D.drawSpr(ctx, D.neonSpr('P1: F', 34, PCOL[0]), 470, 336, D.flick(bt, 0.6));
      D.drawSpr(ctx, D.neonSpr(GS.cpu && GS.cpu.on ? 'CPU' : 'P2: ENTER', 34, PCOL[1]), 810, 336, D.flick(bt, 0.6));
      for (let i = 0; i < 2; i++) D.drawSpr(ctx, D.neonSpr(S.ready[i] ? '✓ READY' : '...', 28, S.ready[i] ? OK : '#7a6aa8'), i ? 810 : 470, 380);
    }
    // controls, always on screen in LEARN
    const c1 = D.neonSpr('P1 PINK CAR: A / D TO STEER', 24, PCOL[0]), c2 = D.neonSpr(GS.cpu && GS.cpu.on ? 'CPU CYAN CAR: \u2190 / \u2192 TO TAKE OVER' : 'P2 CYAN CAR: \u2190 / \u2192 TO STEER', 24, PCOL[1]);
    D.drawSpr(ctx, c1, 1240 - c2.tw - 50 - c1.tw / 2, 698); D.drawSpr(ctx, c2, 1240 - c2.tw / 2, 698);
  }

  // ======================================================================= frame
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    if (S.shake > 0) ctx.translate((rand() - 0.5) * 14 * S.shake, (rand() - 0.5) * 10 * S.shake);
    D.drawSky(ctx, S.vt);
    D.drawFloor(ctx, S.dist);
    drawWorld();
    ctx.restore();
    const ph = GS.phase;
    const row = active() || (S.last && S.last.resolved && S.last.age < 1.5 ? S.last : null);
    if (ph === 'learn') { drawLearn(); if (row && row.guided) { drawBoard(row); drawTags(row); } }
    else if (ph === 'play' || ph === 'over') {
      drawScore();
      if (!S.banner) drawBoard(row);
      drawTags(active());
      if (ph === 'play' && S.test && S.test.kind && !S.banner) D.drawSpr(ctx, D.neonSpr((WAVES[S.test.kind] || [''])[0], 24, '#b9a2ff'), 790, 34, 0.9);
      drawBanner(S.banner);
    } else if (ph === 'idle') { drawBoard(row); }
    drawPops();
    if (S.flashR > 0) { ctx.fillStyle = `rgba(255,30,80,${0.22 * S.flashR})`; ctx.fillRect(0, 0, W, HH); }
    D.finish(ctx, S.vt, 0.3);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    try {
      if (GS.running) {
        S.vt += dt;
        if (GS.phase === 'learn') updateLearn(dt); else updateTest(dt);
      } else if (GS.phase === 'idle') { S.vt += dt; updateAttract(dt); }
      render();
    } catch (e) { console.error(e); }
    GS.endFrame();
    requestAnimationFrame(frame);
  }

  GS.init({
    id: 7, title: 'Recycle Run', mode: 'coop', learnSeconds: 90,
    controls: { p1: 'A / D steer the pink car (F = ready)', p2: '← / → steer the cyan car (Enter = ready)' },
    onRound() { resetRound(); },
    onPause() {},
    onPhase(p, prev) { if (p === 'play') startTest(); if (p === 'idle') resetRound(); },
  });
  window.RRstats = () => ({ cpu: S.cpuStats, p1: S.p1Stats, score: S.score });
  requestAnimationFrame(frame);
})();
