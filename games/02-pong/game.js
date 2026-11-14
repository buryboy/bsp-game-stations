// Heat Pong — Station 2: thermoforming vs thermosetting. Neon Pong on a wet brick wall.
(function () {
  'use strict';
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, 1280, 720);
  const N = window.NEON, C = N.C, sm = H.smooth, E = H.ease;
  const FORM = 'form', SET = 'set';
  const MC = { form: C.cyan, set: C.hot };
  const MW = { form: 'FORMING', set: 'SETTING' };
  const FW = { form: 'thermoforming', set: 'thermosetting' };
  const REASON = { form: 'no cross-links: softens and can be reshaped', set: 'cross-links: set for ever, chars when reheated' };
  const WHITE = [196, 196, 250], BALLTXT = [255, 226, 242], CHAR = [120, 38, 14];

  // ---------------- content (docs/CONTENT.md, station 2) ----------------
  const POLY = [
    { tag: 'Acrylic', name: 'Acrylic (PMMA)', fam: FORM },
    { tag: 'HIPS', name: 'High impact polystyrene (HIPS)', fam: FORM },
    { tag: 'HDPE', name: 'High density polythene (HDPE)', fam: FORM },
    { tag: 'PP', name: 'Polypropylene (PP)', fam: FORM },
    { tag: 'PVC', name: 'Polyvinyl chloride (PVC)', fam: FORM },
    { tag: 'PET', name: 'Polyethylene terephthalate (PET)', fam: FORM },
    { tag: 'ER', name: 'Epoxy resin (ER)', fam: SET },
    { tag: 'MF', name: 'Melamine formaldehyde (MF)', fam: SET },
    { tag: 'PF', name: 'Phenol formaldehyde (PF)', fam: SET },
    { tag: 'PR', name: 'Polyester resin (PR)', fam: SET },
    { tag: 'UF', name: 'Urea formaldehyde (UF)', fam: SET },
  ];
  const CLUES = [
    { text: 'can be reheated and reshaped', fam: FORM },
    { text: 'no cross-links between chains', fam: FORM },
    { text: 'softens when heated', fam: FORM },
    { text: 'can be recycled by remelting', fam: FORM },
    { text: 'has plastic memory', fam: FORM },
    { text: 'only weak forces between chains', fam: FORM },
    { text: 'has cross-links', fam: SET },
    { text: 'chars when reheated', fam: SET },
    { text: 'set once, for ever', fam: SET },
    { text: 'cannot be remoulded', fam: SET },
    { text: 'rigid 3D network of chains', fam: SET },
    { text: 'does not soften when reheated', fam: SET },
  ].map((c) => Object.assign({ clue: true, tag: '?' }, c));
  const cardText = (it) => (it.clue ? '“' + it.text + '”' : it.name);

  // ---------------- layout + timeline ----------------
  const ARENA = 5120, TOP = 150, BOT = 580, MIDY = 365, PX = [82, 1198], PH = 60, FACE = 7, MAXSP = 1000;
  const PANS = [[6.0, 6.7], [21.4, 22.1], [36.2, 36.9], [47.0, 47.7]];
  const ARENA_ON = 47.7, PRACTICE_AT = 55, NEED = 8;
  const F_CAPS = [[7.8, 'long chains, NO cross-links'], [10.2, 'heat it → it softens'], [12.6, 'reshape it again and again'],
    [15.0, 'cool it → it sets hard'], [17.0, 'can be recycled (remelted)'], [18.6, 'plastic memory: bent acrylic'], [19.3, 'goes flat when reheated', true]];
  const S_CAPS = [[23.4, 'chains joined by strong cross-links'], [25.4, 'a rigid 3D network'], [27.4, 'set once (heat or chemical reaction)'],
    [29.4, 'reheat → does NOT soften'], [31.6, 'it chars / burns instead'], [33.6, "can't be remoulded or easily recycled"]];
  const L_FORM = ['Acrylic (PMMA)', 'HIPS · high impact polystyrene', 'HDPE · high density polythene', 'PP · polypropylene', 'PVC · polyvinyl chloride', 'PET · polyethylene terephthalate'];
  const L_SET = ['ER · epoxy resin', 'MF · melamine formaldehyde', 'PF · phenol formaldehyde', 'PR · polyester resin', 'UF · urea formaldehyde'];
  // sounds scored to the same times as the picture
  const SFX = [];
  const ev = (t, name, p) => SFX.push([t, name, p || {}]);
  ev(0.4, 'neon', { dur: 0.9, gain: 0.7 }); ev(1.4, 'neon', { gain: 0.5 }); [1.6, 1.9, 2.2].forEach((t) => ev(t, 'neon', { gain: 0.45 }));
  ev(2.6, 'click'); ev(2.9, 'click');
  PANS.forEach(([a, b]) => ev(a, 'whoosh', { dur: b - a + 0.1, gain: 0.7 }));
  [6.8, 22.3, 37.0, 37.3].forEach((t) => ev(t, 'neon', { dur: 0.35, gain: 0.8 }));
  [7.1, 7.3, 22.6, 22.8, 23.4].forEach((t) => ev(t, 'neon', { gain: 0.4 }));
  F_CAPS.concat(S_CAPS).forEach(([t]) => ev(t, 'neon', { gain: 0.5 }));
  [9.0, 24.4].forEach((t) => ev(t, 'neon', { gain: 0.35 }));
  ev(10.2, 'riser', { dur: 0.9, gain: 0.6 }); ev(15.0, 'click'); ev(29.4, 'riser', { dur: 0.9, gain: 0.6 }); ev(30.6, 'buzz', { f: 70, dur: 0.4, gain: 0.8 });
  L_FORM.forEach((_, i) => ev(37.6 + i * 0.5, 'neon', { gain: 0.4 })); L_SET.forEach((_, i) => ev(40.4 + i * 0.5, 'neon', { gain: 0.4 }));
  ev(43.2, 'neon', { gain: 0.6 }); ev(44.0, 'neon', { gain: 0.6 });
  [47.8, 48.0, 48.2, 48.4].forEach((t) => ev(t, 'neon', { gain: 0.5 }));
  [48.6, 49.4, 50.0, 50.8, 51.6].forEach((t) => ev(t, 'neon', { gain: 0.5 }));

  // ---------------- state ----------------
  let S, cam = 0;
  function fresh() {
    return {
      at: 0, frame: 0, kind: 'attract',
      pads: [{ y: MIDY, vy: 0, mode: FORM, modeT: -9, glitchT: -9 }, { y: MIDY, vy: 0, mode: SET, modeT: -9, glitchT: -9 }],
      ai: [{ decided: false, err: 0 }, { decided: false, err: 0 }],
      ball: null, scores: [0, 0], scoreT: [-9, -9], flash: null, popups: [], sparks: [], smoke: [],
      practiceStarted: false, practiceHits: 0, readyT: -1, testT0: 0, camFrom: ARENA, camT0: -9,
      decks: { poly: [], clue: [] }, last: null, prevS: -1, cardT: -9, rally: 0,
    };
  }
  S = fresh();

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function draw(deck, src) {
    if (!S.decks[deck].length) S.decks[deck] = shuffle(src.slice());
    let it = S.decks[deck].pop();
    if (it === S.last && S.decks[deck].length) { S.decks[deck].unshift(it); it = S.decks[deck].pop(); }
    return it;
  }
  function progress() { if (S.kind !== 'test') return 0; const total = Math.max(30, GS.R - S.testStartGT); return H.clamp((GS.t - S.testStartGT) / total); }
  function nextItem() {
    const pClue = S.kind === 'test' ? 0.22 + 0.33 * progress() : 0.3;
    const it = Math.random() < pClue ? draw('clue', CLUES) : draw('poly', POLY);
    S.last = it; return it;
  }
  const mult = () => (S.kind === 'test' && GS.timeLeft() <= 30 ? 2 : 1);
  const heatOn = () => {
    if (S.kind === 'practice') return true;
    if (S.kind === 'test') { const tt = S.at - S.testT0; return tt > 6 && (tt - 6) % 15 < 6; }
    return S.at % 16 < 6;
  };
  function baseSpeed() {
    if (S.kind === 'practice') return 290;
    if (S.kind === 'attract') return 430;
    return 380 + 240 * progress();
  }
  function sizeBall(b) { b.tag = b.item.tag; b.hw = Math.max(32, N.measure(b.tag, 30, 'P') / 2 + 22); b.hh = 27; }
  function serve(dir, wait) {
    const b = { x: 640, y: MIDY, vx: 0, vy: 0, speed: 0, dir, item: nextItem(), wait: wait || 1.2, born: S.at, heated: false, heatT: -9, passed: -1, wrong: false, smokeT: 0 };
    sizeBall(b); S.ball = b; S.cardT = S.at; S.rally = 0;
    S.ai[0].decided = S.ai[1].decided = false;
    GS.sfx('neon', { gain: 0.5 });
  }
  function launch(b) {
    b.speed = baseSpeed();
    const a = (Math.random() - 0.5) * 0.7;
    b.vx = b.dir * b.speed * Math.cos(a); b.vy = b.speed * Math.sin(a);
  }
  function addScore(i, n, x, y) {
    S.scores[i] += n; S.scoreT[i] = S.at; GS.score(S.scores[0], S.scores[1]);
    popup('+' + n, x, y, C.green, 40);
  }
  function popup(s, x, y, c, size, fam) { S.popups.push({ s, x, y, c, size: size || 32, fam: fam || 'G', t0: S.at }); if (S.popups.length > 12) S.popups.shift(); }
  function sparks(x, y, c, dir, n) {
    for (let i = 0; i < (n || 16); i++) {
      const a = (Math.random() - 0.5) * 2.4, sp = 200 + Math.random() * 380;
      S.sparks.push({ x, y, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp, life: 0.35 + Math.random() * 0.3, c });
    }
    if (S.sparks.length > 160) S.sparks.splice(0, S.sparks.length - 160);
  }
  function setMode(i, m) {
    const p = S.pads[i];
    if (p.mode === m) return;
    p.mode = m; p.modeT = S.at; GS.sfx('click', { f: m === FORM ? 2400 : 1500, pan: i ? 0.6 : -0.6 });
  }

  // ---------------- gameplay ----------------
  function stepPads(dt, human) {
    const b = S.ball;
    for (let i = 0; i < 2; i++) {
      const p = S.pads[i];
      let dv = 0;
      if (human) {
        dv = (GS.held(i + 1, 'down') ? 1 : 0) - (GS.held(i + 1, 'up') ? 1 : 0);
        if (GS.hit(i + 1, 'a')) setMode(i, FORM);
        if (GS.hit(i + 1, 'b')) setMode(i, SET);
      } else {
        const ai = S.ai[i], towards = b && b.wait <= 0 && b.passed < 0 && (i === 0 ? b.vx < 0 : b.vx > 0);
        const ty = towards ? b.y + ai.err : MIDY;
        dv = H.clamp((ty - p.y) / 45, -1, 1);
        if (towards && !ai.decided && Math.abs(b.x - 640) < 120) {
          ai.decided = true; ai.err = (Math.random() - 0.5) * 70;
          const right = b.item.fam; setMode(i, Math.random() < 0.86 ? right : right === FORM ? SET : FORM);
        }
      }
      p.vy += (dv * 640 - p.vy) * Math.min(1, dt * 16);
      p.y = H.clamp(p.y + p.vy * dt, TOP + PH, BOT - PH);
    }
  }
  function contact(i) {
    const p = S.pads[i], b = S.ball;
    const inPath = Math.abs(b.y - p.y) <= PH + b.hh * 0.8;
    if (inPath && p.mode === b.item.fam) return bounce(i);
    b.passed = i; b.wrong = inPath;
    if (inPath) { p.glitchT = S.at; GS.sfx('buzz', { f: 98, dur: 0.3, pan: i ? 0.7 : -0.7 }); }
  }
  function bounce(i) {
    const p = S.pads[i], b = S.ball, dir = i === 0 ? 1 : -1;
    const off = H.clamp((b.y - p.y) / (PH + b.hh), -1, 1);
    const sp = S.kind === 'practice' ? 290 : Math.min(MAXSP, b.speed * 1.06);
    const ang = off * 0.85 + H.clamp(p.vy * 0.0004, -0.2, 0.2);
    b.speed = sp; b.vx = dir * sp * Math.cos(ang); b.vy = sp * Math.sin(ang);
    const wasFam = b.item.fam;
    b.item = nextItem(); sizeBall(b);
    b.x = i === 0 ? PX[0] + FACE + b.hw + 1 : PX[1] - FACE - b.hw - 1;
    b.heated = false; b.heatT = -9; S.cardT = S.at; S.rally++;
    S.ai[0].decided = S.ai[1].decided = false;
    sparks(PX[i], b.y, MC[wasFam], dir);
    GS.sfx('tock', { f: 520 + Math.min(10, S.rally) * 40, pan: i ? 0.6 : -0.6 });
    if (S.kind === 'test') { addScore(i, mult(), PX[i] + dir * 60, p.y - PH - 40); GS.sfx('blip', { f: 'E6', pan: i ? 0.6 : -0.6 }); }
    if (S.kind === 'practice') {
      S.practiceHits++; popup('right!', PX[i] + dir * 70, p.y - PH - 30, C.green, 32);
      GS.sfx('blip', { f: 'E6' });
      if (S.practiceHits >= NEED && S.readyT < 0) { S.readyT = S.at; GS.sfx('success', { f: 'C6' }); }
    }
  }
  function goal(loser) {
    const b = S.ball, w = 1 - loser;
    S.flash = { item: b.item, loser, wrong: b.wrong, t0: S.at, dur: S.kind === 'attract' ? 1.8 : 2.8 };
    if (S.kind === 'test') addScore(w, 3 * mult(), w ? 1150 : 130, 165);
    sparks(loser ? 1270 : 10, b.y, C.red, loser ? -1 : 1, 24);
    GS.sfx('error', { pan: loser ? 0.6 : -0.6 });
    S.ball = null; S.serveDir = loser === 0 ? -1 : 1;
  }
  function heat(b) {
    b.heated = true; b.heatT = S.at;
    if (b.item.fam === FORM) { popup('softens!', b.x, b.y + 70, C.cyan, 32); GS.sfx('swish', { dur: 0.3 }); }
    else { popup('chars!', b.x, b.y + 70, C.hot, 32); GS.sfx('buzz', { f: 70, dur: 0.35, gain: 0.7 }); }
  }
  function stepGame(dt, human) {
    stepPads(dt, human);
    const b = S.ball;
    if (S.flash && S.at - S.flash.t0 > S.flash.dur) { S.flash = null; serve(S.serveDir || 1); }
    if (b) {
      if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0) launch(b); }
      else {
        const pl = b.x - b.hw, pr = b.x + b.hw;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y - b.hh < TOP) { b.y = TOP + b.hh; b.vy = Math.abs(b.vy); GS.sfx('click', { f: 1200 }); }
        if (b.y + b.hh > BOT) { b.y = BOT - b.hh; b.vy = -Math.abs(b.vy); GS.sfx('click', { f: 1000 }); }
        if (b.vx < 0 && b.passed !== 0 && pl > PX[0] + FACE && b.x - b.hw <= PX[0] + FACE) contact(0);
        else if (b.vx > 0 && b.passed !== 1 && pr < PX[1] - FACE && b.x + b.hw >= PX[1] - FACE) contact(1);
        if (S.ball && heatOn() && !b.heated && Math.abs(b.x - 640) < 40) heat(b);
        if (S.ball && b.x < 6) goal(0); else if (S.ball && b.x > 1274) goal(1);
      }
      if (S.ball && b.heated && b.item.fam === SET && S.at - b.smokeT > 0.05) { b.smokeT = S.at; puff(ARENA + b.x, b.y - b.hh); }
    }
    if (S.kind === 'practice' && S.readyT >= 0 && S.at - S.readyT > 1.6) { S.readyT = 1e9; GS.skipLearn(); }
  }
  function puff(x, y) {
    S.smoke.push({ x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 30, r: 6 + Math.random() * 6, t0: S.at, life: 1.4 + Math.random() * 0.6 });
    if (S.smoke.length > 90) S.smoke.shift();
  }
  function stepFx(dt) {
    for (const s of S.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; s.life -= dt; }
    S.sparks = S.sparks.filter((s) => s.life > 0);
    for (const s of S.smoke) { s.x += s.vx * dt; s.y += s.vy * dt; s.r += 14 * dt; }
    S.smoke = S.smoke.filter((s) => S.at - s.t0 < s.life);
    S.popups = S.popups.filter((p) => S.at - p.t0 < 1.2);
  }

  // ---------------- drawing helpers ----------------
  const ln = (x0, y0, x1, y1) => (g) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); };
  const rr = (x, y, w, h, r) => (g) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function frameSign(x, y, w, h, c, k) {
    N.tube(rr(x, y, w, h, 16), c, k, 5);
    N.clip(x + w * 0.2, y); N.clip(x + w * 0.8, y); N.clip(x + w * 0.2, y + h); N.clip(x + w * 0.8, y + h);
  }
  // heat lamp: dome + bulb, wavy heat tubes below when on
  function lamp(x, y, kGlass, on, t) {
    N.blockout(ln(x, y - 40, x, y - 4), 6); N.elec(x, y - 40, -Math.PI / 2);
    N.tube((g) => { g.beginPath(); g.arc(x, y + 30, 40, Math.PI, 0); g.moveTo(x - 48, y + 30); g.lineTo(x + 48, y + 30); }, C.warm, kGlass * (on ? 1 : 0), 6);
    N.tube((g) => { g.beginPath(); g.arc(x, y + 40, 9, 0, Math.PI * 2); }, C.warm, on, 4);
    for (let j = -1; j <= 1; j++) {
      N.tube((g) => { g.beginPath(); for (let s = 0; s <= 16; s++) { const yy = y + 60 + s * 4.5; const xx = x + j * 26 + Math.sin(yy * 0.18 + t * 8 + j) * 6; s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } }, C.red, on, 4);
    }
    N.clip(x - 40, y + 24, 0); N.clip(x + 40, y + 24, 0);
  }
  function demoBall(x, y, r, c, k, soft, t) {
    N.tube((g) => {
      g.beginPath();
      for (let j = 0; j <= 60; j++) {
        const th = j / 60 * Math.PI * 2, s = Math.sin(th);
        const rw = r * (1 + 0.11 * soft * Math.sin(5 * th + t * 7));
        const px = x + Math.cos(th) * rw * (1 + 0.22 * soft), py = y + s * rw * (1 - 0.18 * soft) + soft * 16 * Math.max(0, s) + soft * 10;
        j ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
    }, c, k, 7);
    N.clip(x, y - r - 2, 0);
  }

  // ---------------- LEARN: the long wall of signs ----------------
  function drawScenes(sT, t) {
    const I = (t0, len) => N.ign(sT, t0, len);
    // A: title
    if (N.seen(0)) {
      N.at(0);
      const flk = (i) => { const k = I(0.4 + i * 0.1, 0.3); if (i !== 6 || k === 0 || sT < 1.4) return k; return N.hs(Math.floor(t * 14) + 3) > 0.78 ? 0.25 : 1; };
      const [a0] = N.word('Heat Pong', 640, 300, 150, 'G', C.pink, flk);
      const wg = N.measure('Heat', 150, 'G'), wsp = N.measure('Heat ', 150, 'G') - wg, xa = a0 + wg + 2, xb = a0 + wg + wsp - 2;
      N.blockout((g) => { g.beginPath(); g.moveTo(xa, 300); g.bezierCurveTo(xa + 4, 326, xb - 4, 326, xb, 300); }, 6);
      N.elec(xa, 300, -1.9); N.elec(xb, 300, -1.25);
      N.tube((g) => { g.beginPath(); g.moveTo(330, 388); g.quadraticCurveTo(640, 408, 960, 382); }, C.violet, I(1.4), 6);
      N.elec(330, 388, Math.PI); N.elec(960, 382, 0); N.clip(480, 397); N.clip(800, 395);
      N.text('thermoforming', 590, 462, 46, 'P', C.cyan, I(1.6), { align: 'right' });
      N.text('vs', 640, 462, 46, 'P', C.violet, I(1.9));
      N.text('thermosetting', 690, 462, 46, 'P', C.hot, I(2.2), { align: 'left' });
      frameSign(90, 492, 520, 92, C.violet, I(2.6));
      N.text('PLAYER 1 · W / S move', 350, 530, 28, 'P', WHITE, I(2.6), { maxW: 480 });
      N.text('F = FORMING     G = SETTING', 350, 568, 28, 'P', C.cyan, I(2.7), { maxW: 480 });
      frameSign(670, 492, 520, 92, C.violet, I(2.9));
      N.text('PLAYER 2 · ↑ / ↓ move', 930, 530, 28, 'P', WHITE, I(2.9), { maxW: 480 });
      N.text('Enter = FORMING   R-Shift = SETTING', 930, 568, 28, 'P', C.cyan, I(3.0), { maxW: 480 });
    }
    // B: thermoforming
    if (N.seen(1280)) {
      N.at(1280);
      N.text('Thermoforming', 640, 116, 84, 'G', C.cyan, I(6.8, 0.35));
      N.text('polymers', 990, 112, 34, 'P', C.cyan, I(7.0), { align: 'left' });
      frameSign(50, 170, 390, 250, C.violet, I(7.1));
      const hf = sm(10.2, 11.6, sT) * (1 - sm(15.0, 16.2, sT));
      for (let i = 0; i < 5; i++) {
        const yc = 295 + (i - 2) * 40 * (1 + 0.16 * hf);
        N.tube((g) => {
          g.beginPath();
          for (let j = 0; j <= 34; j++) {
            const x = 75 + j * 10, y = yc + (7 + 8 * hf) * Math.sin(x * 0.05 + i * 1.9 + t * (0.7 + 2.5 * hf)) + (4 + 4 * hf) * Math.sin(x * 0.13 + i * 3.1 - t * (0.5 + 2 * hf));
            j ? g.lineTo(x, y) : g.moveTo(x, y);
          }
        }, C.cyan, I(7.3 + i * 0.12), 5);
      }
      N.text('weak forces between chains', 245, 466, 28, 'P', C.cyan, I(9.0), { maxW: 380 });
      const on = sT >= 10.2 && sT < 15.0 ? I(10.2) : 0;
      lamp(585, 180, 1, on, t);
      demoBall(585, 390, 44, C.cyan, I(7.6), hf, t);
      const bl = sT < 10.2 ? 'hard' : sT < 15.0 ? 'softens!' : 'hard again';
      N.text(bl, 585, 500, 30, 'P', C.cyan, sT < 10.2 ? I(7.6) : sT < 15 ? I(10.6) : I(15.4), { maxW: 220 });
      F_CAPS.forEach(([t0, s, cont], i) => {
        const y = 205 + i * 58;
        if (!cont) N.tube((g) => { g.beginPath(); g.arc(722, y - 10, 5, 0, 7); }, C.pink, I(t0), 4);
        N.text(s, 742, y, 30, 'P', i === 0 ? WHITE : C.cyan, I(t0), { align: 'left', maxW: 500 });
      });
    }
    // C: thermosetting
    if (N.seen(2560)) {
      N.at(2560);
      N.text('Thermosetting', 640, 116, 84, 'G', C.hot, I(22.3, 0.35));
      N.text('polymers', 990, 112, 34, 'P', C.hot, I(22.5), { align: 'left' });
      frameSign(50, 170, 390, 250, C.violet, I(22.6));
      const cy = (i, x) => 295 + (i - 2) * 40 + 6 * Math.sin(x * 0.05 + i * 1.3) + 3 * Math.sin(x * 0.13 + i);
      for (let i = 0; i < 5; i++) {
        N.tube((g) => { g.beginPath(); for (let j = 0; j <= 34; j++) { const x = 75 + j * 10; j ? g.lineTo(x, cy(i, x)) : g.moveTo(x, cy(i, x)); } }, C.hot, I(22.8 + i * 0.12), 5);
      }
      for (let i = 0; i < 4; i++) for (let m = 0; m < 4; m++) {
        const x = 105 + m * 85 + (i % 2) * 42;
        N.tube(ln(x, cy(i, x) + 6, x, cy(i + 1, x) - 6), C.red, I(23.4 + (i * 4 + m) * 0.04, 0.2), 5);
      }
      N.text('cross-links', 300, 466, 30, 'P', C.red, I(24.4));
      N.arrow(222, 456, 160, 440, 148, 372, C.red, sm(24.5, 24.9, sT), t, 6, 5);
      const on = sT >= 29.4 ? I(29.4) : 0, ch = sm(30.2, 31.8, sT);
      lamp(585, 180, 1, on, t);
      const fl = ch > 0 ? 0.5 + 0.5 * N.hs(Math.floor(t * 18)) : 1;
      demoBall(585, 390, 44, H.mix(C.hot, CHAR, ch), I(23.0) * (1 - ch * 0.35) * fl, 0, t);
      if (ch > 0.15 && N.seen(2560) && S.at - (S.demoSmoke || 0) > 0.06 && GS.running) { S.demoSmoke = S.at; puff(2560 + 585, 346); }
      const bl = sT < 29.4 ? 'set hard' : sT < 30.6 ? 'no softening…' : 'it chars!';
      N.text(bl, 585, 500, 30, 'P', sT < 30.6 ? C.hot : C.red, sT < 29.4 ? I(23.2) : sT < 30.6 ? I(29.6) : I(30.6), { maxW: 220 });
      S_CAPS.forEach(([t0, s], i) => {
        const y = 205 + i * 62;
        N.tube((g) => { g.beginPath(); g.arc(722, y - 10, 5, 0, 7); }, C.pink, I(t0), 4);
        N.text(s, 742, y, 30, 'P', i === 0 ? WHITE : C.hot, I(t0), { align: 'left', maxW: 500 });
      });
    }
    // D: the AQA lists + memory hook
    if (N.seen(3840)) {
      N.at(3840);
      N.text('Thermoforming', 330, 122, 60, 'G', C.cyan, I(37.0));
      N.text('Thermosetting', 950, 122, 60, 'G', C.hot, I(37.3));
      N.tube(ln(640, 160, 640, 470), C.violet, I(37.2), 5); N.elec(640, 160, -Math.PI / 2); N.elec(640, 470, Math.PI / 2); N.clip(640, 260, Math.PI / 2); N.clip(640, 380, Math.PI / 2);
      L_FORM.forEach((s, i) => N.text(s, 330, 195 + i * 50, 30, 'P', C.cyan, I(37.6 + i * 0.5), { maxW: 560 }));
      L_SET.forEach((s, i) => N.text(s, 950, 195 + i * 50, 30, 'P', C.hot, I(40.4 + i * 0.5), { maxW: 560 }));
      N.text('thermoFORMING = can be FORMED again', 640, 528, 34, 'P', C.cyan, I(43.2), { maxW: 1100 });
      N.text('thermoSETTING = SET for ever', 640, 576, 34, 'P', C.hot, I(44.0), { maxW: 1100 });
    }
  }

  // ---------------- the arena (practice, test, attract) ----------------
  function drawArena(clk, base, t, sT) {
    N.at(ARENA);
    const I = (o, len) => N.ign(clk, base + o, len);
    const kr = I(0.1, 0.35), hot = heatOn() && S.kind !== 'intro';
    const learnIntro = GS.phase === 'learn' && !S.practiceStarted;
    // rails
    N.tube(ln(40, 140, 1240, 140), C.violet, kr * 0.85, 5); N.tube(ln(40, 590, 1240, 590), C.violet, kr * 0.85, 5);
    N.elec(40, 140, Math.PI); N.elec(1240, 140, 0); N.elec(40, 590, Math.PI); N.elec(1240, 590, 0);
    for (const x of [200, 440, 840, 1080]) { N.clip(x, 140); N.clip(x, 590); }
    // centre net (chase-lit dashes)
    const kn = I(0.2) * (S.flash || learnIntro ? 0.18 : 0.5);
    for (let y = 160, n = 0; y < 572; y += 42, n++) {
      if (hot && y < 250) continue;
      const lit = kn * (0.65 + 0.35 * (((n - t * 6) % 5 + 5) % 5 < 1.5 ? 1 : 0));
      N.tube(ln(640, y, 640, y + 22), C.violet, lit, 5);
    }
    // heat zone
    const hk = hot ? N.ign(t, S.heatOnT || 0, 0.3) : 0;
    lamp(640, 160, 1, hk * kr, t);
    N.text('HEAT ZONE', 698, 194, 26, 'P', C.hot, hk * kr, { align: 'left' });
    if (hk) N.glow(ln(640, 250, 640, 575), [255, 80, 20], 0.06 * kr, 130, 0);
    // scores
    for (let i = 0; i < 2; i++) {
      const k = I(0.5) * N.ign(t, S.scoreT[i], 0.25);
      if (i === 0) { N.text('P1', 40, 104, 30, 'P', C.violet, I(0.5), { align: 'left' }); N.text(String(S.scores[0]), 90, 108, 64, 'G', C.pink, k, { align: 'left' }); }
      else { const cpu = GS.cpu && GS.cpu.on && GS.phase !== 'idle'; N.text(cpu ? 'CPU' : 'P2', 1240, 104, 30, 'P', C.violet, I(0.5), { align: 'right' }); N.text(String(S.scores[1]), cpu ? 1170 : 1190, 108, 64, 'G', C.pink, k, { align: 'right' }); }
    }
    // the card: what the ball is
    const kc = I(0.7);
    frameSign(290, 20, 700, 104, C.violet, kc);
    const it = S.flash ? S.flash.item : S.ball ? S.ball.item : null;
    if (it) {
      const kk = kc * N.ign(t, S.flash ? S.flash.t0 : S.cardT, 0.25);
      const showAns = S.kind === 'practice' || S.kind === 'attract' || S.flash;
      if (showAns) {
        N.text(cardText(it), 640, 66, 34, 'P', WHITE, kk, { maxW: 640 });
        N.text('→ ' + FW[it.fam] + ': use ' + MW[it.fam], 640, 108, 28, 'P', MC[it.fam], kk, { maxW: 640 });
      } else {
        N.text('next ball is…', 640, 50, 24, 'P', C.violet, kk);
        N.text(cardText(it), 640, 100, 40, 'P', WHITE, kk, { maxW: 650 });
      }
    } else if (learnIntro) {
      N.text('HEAT PONG', 640, 88, 48, 'G', C.pink, kc);
    }
    // paddles
    for (let i = 0; i < 2; i++) {
      const p = S.pads[i], x = PX[i], c = MC[p.mode];
      let k = I(0.3) * N.ign(t, p.modeT, 0.2);
      if (t - p.glitchT < 0.7) k *= N.hs(Math.floor(t * 30) + i) > 0.5 ? 1 : 0.12;
      N.tube(ln(x, p.y - PH, x, p.y + PH), c, k, 11);
      N.elec(x, p.y - PH - 8, -Math.PI / 2); N.elec(x, p.y + PH + 8, Math.PI / 2);
      let ly = p.y - PH - 26; if (ly < 180) ly = p.y + PH + 46;
      N.text(MW[p.mode], x, ly, 26, 'P', c, k);
    }
    // ball
    const b = S.ball;
    if (b) {
      const soft = b.heated && b.item.fam === FORM ? sm(b.heatT, b.heatT + 0.4, t) : 0;
      const ch = b.heated && b.item.fam === SET ? sm(b.heatT, b.heatT + 0.4, t) : 0;
      let k = N.ign(t, b.born, 0.45) * (ch ? 0.55 + 0.45 * N.hs(Math.floor(t * 18)) : 1);
      if (b.passed >= 0) k *= 0.85;
      const c = H.mix(C.pink, CHAR, ch * 0.75);
      N.tube((g) => {
        g.beginPath();
        for (let j = 0; j <= 48; j++) {
          const th = j / 48 * Math.PI * 2, co = Math.cos(th), si = Math.sin(th);
          const ex = Math.sign(co) * Math.sqrt(Math.abs(co)), ey = Math.sign(si) * Math.sqrt(Math.abs(si));
          const w = 1 + 0.1 * soft * Math.sin(5 * th + t * 9);
          const px = b.x + ex * b.hw * w * (1 + 0.1 * soft), py = b.y + ey * b.hh * w + soft * Math.max(0, si) * b.hh * 0.5;
          j ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.closePath();
      }, c, k, 6);
      N.text(b.tag, b.x, b.y + 11 + soft * 5, 30, 'P', H.mix(BALLTXT, CHAR, ch * 0.5), k, { lw: 2 });
      // trail of the chunk: a faint streak
      if (b.wait <= 0 && b.speed > 0) N.glow(ln(b.x - b.vx * 0.05, b.y - b.vy * 0.05, b.x - b.vx * 0.12, b.y - b.vy * 0.12), c, 0.25 * k, 8, 0);
    }
    // teaching flash after a point
    const f = S.flash;
    if (f) {
      const e = t - f.t0, fam = f.item.fam, c = MC[fam];
      N.backer(250, 248, 780, 228, 0.35);
      N.text(f.wrong ? 'wrong mode: straight through!' : 'missed it!', 640, 286, 30, 'P', C.red, N.ign(t, f.t0, 0.25));
      N.text(cardText(f.item), 640, 340, 36, 'P', WHITE, N.ign(t, f.t0 + 0.15), { maxW: 740 });
      N.text('= ' + FW[fam], 640, 412, 60, 'G', c, N.ign(t, f.t0 + 0.3));
      N.text(REASON[fam], 640, 458, 28, 'P', c, N.ign(t, f.t0 + 0.45), { maxW: 740 });
      const px = PX[f.loser], py = S.pads[f.loser].y, blink = e < 0.8 ? (Math.floor(e * 7) % 2 ? 1 : 0.15) : 1;
      N.tube((g) => { g.beginPath(); g.arc(px, py, 74, 0, Math.PI * 2); }, C.red, N.ign(t, f.t0 + 0.05) * blink, 5);
      N.tube((g) => { g.beginPath(); g.moveTo(px - 34, py - 34); g.lineTo(px + 34, py + 34); g.moveTo(px + 34, py - 34); g.lineTo(px - 34, py + 34); }, C.red, blink, 8);
    }
    // learn intro: how to play
    if (learnIntro && sT != null) {
      const on = sT < 54.8 ? 1 : 0, J = (t0) => N.ign(sT, t0) * on;
      N.text('Match your paddle to the ball!', 640, 290, 48, 'G', C.pink, J(48.6), { maxW: 900 });
      N.text('thermoforming ball → FORMING paddle', 640, 356, 32, 'P', C.cyan, J(49.4), { maxW: 900 });
      N.text('thermosetting ball → SETTING paddle', 640, 404, 32, 'P', C.hot, J(50.0), { maxW: 900 });
      N.text('wrong mode? it goes straight through', 640, 460, 30, 'P', C.red, J(50.8), { maxW: 900 });
      N.text('the heat lamp gives a hint: softens or chars', 640, 512, 28, 'P', C.violet, J(51.6), { maxW: 900 });
    }
    // controls reminder + counters along the bottom of the field
    if (GS.phase !== 'idle') {
      const kl = I(0.6) * (S.kind === 'test' ? 0.55 : 0.95);
      N.text('F = FORMING', 104, 568, 24, 'P', C.cyan, kl, { align: 'left' });
      N.text('G = SETTING', 104 + N.measure('F = FORMING', 24, 'P') + 26, 568, 24, 'P', C.hot, kl, { align: 'left' });
      if (GS.cpu && GS.cpu.on) N.text('CPU playing \u00b7 any P2 key to join', 1176, 568, 24, 'P', C.violet, kl, { align: 'right' });
      else {
        N.text('R-Shift = SETTING', 1176, 568, 24, 'P', C.hot, kl, { align: 'right' });
        N.text('Enter = FORMING', 1176 - N.measure('R-Shift = SETTING', 24, 'P') - 26, 568, 24, 'P', C.cyan, kl, { align: 'right' });
      }
    }
    if (S.kind === 'practice' && !S.flash) {
      if (S.readyT >= 0) N.text('Ready! Test starting…', 640, 400, 64, 'G', C.green, N.ign(t, S.readyT, 0.3));
      else N.text('practice: ' + S.practiceHits + ' / ' + NEED + ' right', 640, 536, 26, 'P', C.violet, I(0.6) * 0.9);
    }
    if (S.kind === 'test' && mult() === 2) {
      const bl = N.hs(Math.floor(t * 3)) > 0.25 ? 1 : 0.3;
      N.text('×2 POINTS — final 30 s', 640, 536, 28, 'P', C.red, bl);
    }
    // popups + sparks
    for (const p of S.popups) {
      const e = t - p.t0, k = e < 0.9 ? N.ign(t, p.t0, 0.15) : N.hs(Math.floor(t * 30)) > 0.5 ? 1 : 0;
      N.text(p.s, p.x, p.y - e * 36, p.size, p.fam, p.c, k);
    }
    for (const s of S.sparks) N.glow(ln(s.x, s.y, s.x - s.vx * 0.025, s.y - s.vy * 0.025), s.c, Math.min(1, s.life * 3), 3);
  }

  function drawSmoke(g) {
    const cm = N.cam();
    for (const s of S.smoke) {
      const e = (S.at - s.t0) / s.life, x = s.x - cm;
      if (x < -50 || x > 1330) continue;
      g.fillStyle = `rgba(48,44,52,${0.4 * (1 - e)})`;
      g.beginPath(); g.arc(x, s.y, s.r, 0, Math.PI * 2); g.fill();
    }
  }

  // ---------------- CPU Player 2 (bridge: GS.cpu) ----------------
  // Sees only what a player sees: the ball's position/velocity and its label. Decides FORMING/SETTING when the ball
  // crosses the half-way line (right with p = 0.35 + 0.6*skill), re-reads the ball's path every reaction interval,
  // aims at the predicted intercept with an error, and moves with capped speed by pulsing the virtual up/down keys.
  const CPUS = { seen: null, decided: null, pressAt: -1, pressBtn: null, nextLook: 0, ty: MIDY, duty: 0, wasOn: false };
  function predictY(b, x) {
    const t = (x - b.x) / b.vx; if (!(t > 0)) return b.y;
    const lo = TOP + b.hh, hi = BOT - b.hh, span = hi - lo;
    let y = b.y + b.vy * t - lo; y = ((y % (2 * span)) + 2 * span) % (2 * span); if (y > span) y = 2 * span - y;
    return lo + y;
  }
  function runCpu(dt) {
    const on = !!(GS.cpu && GS.cpu.on && GS.running);
    if (on) cpuBrain(dt, GS.cpu.skill); else if (CPUS.wasOn && GS.cpu) GS.cpu.releaseAll();
    CPUS.wasOn = on;
  }
  function cpuBrain(dt, skill) {
    const u = H.clamp((skill - 0.1) / 0.85), react = H.lerp(1.4, 0.35, u), p = S.pads[1], b = S.ball;
    const live = b && b.wait <= 0 && !S.flash, towards = live && b.vx > 0 && b.passed < 0;
    // 1) content decision, made at the half-way line for each new label
    if (towards && b.x >= 640 && CPUS.decided !== b.item) {
      CPUS.decided = b.item;
      const right = Math.random() < 0.35 + 0.6 * skill, m = right ? b.item.fam : b.item.fam === FORM ? SET : FORM;
      CPUS.pressBtn = m === FORM ? 'a' : 'b'; CPUS.pressAt = S.at + react * (0.25 + Math.random() * 0.35);
    }
    if (CPUS.pressAt >= 0 && S.at >= CPUS.pressAt) { GS.cpu.press(CPUS.pressBtn); CPUS.pressAt = -1; }
    // 2) movement: look again every reaction interval, aim at the predicted intercept with an error
    if (S.at >= CPUS.nextLook) {
      CPUS.nextLook = S.at + react * (0.5 + Math.random() * 0.5);
      if (towards) CPUS.ty = predictY(b, PX[1] - FACE - b.hw) + (Math.random() - 0.5) * 2 * H.lerp(95, 12, u);
      else CPUS.ty = H.lerp(MIDY, live ? b.y : MIDY, 0.3) + (Math.random() - 0.5) * 40;
    }
    const d = CPUS.ty - p.y, dead = H.lerp(26, 8, u);
    // speed cap: hold the key only for part of the time (0.5 of full speed at skill 0.1, 0.95 at 0.95)
    CPUS.duty += dt * 10; const onFrac = H.lerp(0.5, 0.95, u), pulse = (CPUS.duty % 1) < onFrac;
    GS.cpu.hold('down', d > dead && pulse); GS.cpu.hold('up', d < -dead && pulse);
  }

  // ---------------- lifecycle ----------------
  function startTest() {
    S.kind = 'test'; S.scores = [0, 0]; S.scoreT = [-9, -9]; GS.score(0, 0);
    S.flash = null; S.popups = []; S.sparks = []; S.readyT = -1;
    S.testT0 = S.at; S.testStartGT = GS.t; S.camFrom = cam; S.camT0 = S.at;
    serve(Math.random() < 0.5 ? -1 : 1, 2.0);
    GS.sfx('neon', { dur: 0.5, gain: 0.8, always: true });
  }
  GS.init({
    id: 2, title: 'Heat Pong', mode: 'vs', learnSeconds: 90,
    controls: { p1: 'W / S move · F = FORMING · G = SETTING', p2: '↑ / ↓ move · Enter = FORMING · Right Shift = SETTING' },
    onRound() { S = fresh(); CPUS.decided = null; CPUS.pressAt = -1; CPUS.ty = MIDY; S.kind = 'intro'; cam = 0; GS.score(0, 0); },
    onPhase(p, prev) {
      if (p === 'play') startTest();
      if (p === 'idle') { S = fresh(); }
    },
  });

  let learnL = 90;
  function camFor(sT) { let c = 0; for (const [a, b] of PANS) c += 1280 * E.inOut(sm(a, b, sT)); return c; }
  let lastHeat = false;
  const DBG = (window.HEATPONG = { ms: 0, state: () => S, goal: (i) => S.ball && goal(i),
    // headless test helper: run the test-phase logic for `sec` game seconds at 60 Hz, p1(S) may steer Player 1
    sim: (sec, p1) => { for (let i = 0; i < sec * 60; i++) { const dt = 1 / 60; S.at += dt; if (p1) p1(S); runCpu(dt); stepGame(dt, true); stepFx(dt); GS.endFrame(); } return S.scores.slice(); } });
  let last = performance.now();
  function frame(now) {
    const tStart = performance.now();
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    if (!GS.paused && GS.phase !== 'over') S.at += dt;
    S.frame++;
    const ph = GS.phase;
    let sT = null;
    if (ph === 'idle') {
      if (S.kind !== 'attract') S.kind = 'attract';
      if (!S.ball && !S.flash) serve(1, 0.8);
      stepGame(dt, false); stepFx(dt); cam = ARENA;
    } else if (ph === 'learn') {
      sT = GS.t * Math.max(1, PRACTICE_AT / Math.max(1, learnL * 0.65));
      if (GS.running) {
        if (S.prevS >= 0 && sT - S.prevS < 1) for (const [t0, name, p] of SFX) if (t0 > S.prevS && t0 <= sT) GS.sfx(name, p);
        S.prevS = sT;
        runCpu(dt);
        if (sT >= ARENA_ON) stepPads(dt, true);
        if (sT >= PRACTICE_AT && !S.practiceStarted) { S.practiceStarted = true; S.kind = 'practice'; serve(1, 1.0); }
        if (S.practiceStarted) stepGame(dt, true);
        stepFx(dt);
      }
      cam = camFor(sT);
    } else if (ph === 'play') {
      if (GS.running) { runCpu(dt); stepGame(dt, true); stepFx(dt); }
      cam = H.lerp(S.camFrom, ARENA, E.inOut(sm(S.camT0, S.camT0 + 0.7, S.at)));
    } else { cam = ARENA; }
    const h = heatOn(); if (h && !lastHeat) { S.heatOnT = S.at; if (S.kind === 'test') GS.sfx('riser', { dur: 0.6, gain: 0.5 }); } lastHeat = h;
    // render
    N.begin(cam);
    if (ph === 'learn' && cam < ARENA - 1) drawScenes(sT, S.at);
    if (N.seen(ARENA)) {
      if (ph === 'learn') drawArena(S.practiceStarted ? S.at : sT, S.practiceStarted ? -10 : ARENA_ON, S.at, sT);
      else if (ph === 'play') drawArena(S.at, S.testT0, S.at, null);
      else drawArena(S.at, -10, S.at, null);
    }
    N.compose(ctx, S.at, drawSmoke, S.frame);
    const ms = performance.now() - tStart; DBG.ms = DBG.ms * 0.95 + ms * 0.05;
    GS.endFrame();
    requestAnimationFrame(frame);
  }
  // learnSeconds may be overridden by ?learn=; read it back the same way the bridge does
  { const q = Number(new URLSearchParams(location.search).get('learn')); if (q) learnL = q; }
  const refreshText = () => N.clearText();
  if (document.fonts) { document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', refreshText); document.fonts.ready.then(refreshText); }
  N.prepare();
  requestAnimationFrame(frame);
})();
