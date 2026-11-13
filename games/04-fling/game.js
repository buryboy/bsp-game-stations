// Station 4 · Thermosetting polymers · "Clay Catapult"  (style: claymation-set)
// Side-on clay flinger. Each ammo blob is a thermoset. Hit the product's tower with the right one.
(function () {
  'use strict';
  const W = 1280, HH = 720, GY = 575, G = 980, TAU = Math.PI * 2;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, W, HH);
  const CL = window.CLAY;
  const INK = '#3a2a24', RUST = '#b4472f', CREAM = '#f6efe3', GREEN = '#4f9a52', RED = '#d9473b';
  const PCOL = [null, '#f07b5a', '#5fb6e0'], PINK = [null, '#c2452c', '#2a6f9e'], TBL = '#3d1c10';

  // ---------------- content (docs/CONTENT.md, station 4) ----------------
  const POLY = [
    { id: 'ER', name: 'Epoxy resin', col: '#f2c14e', ink: INK, lines: ['Excellent electrical insulator', 'Strong adhesive'], uses: 'Uses: two-part glue (Araldite), PCBs' },
    { id: 'MF', name: 'Melamine formaldehyde', col: '#ef8fb0', ink: INK, lines: ['Scratch & stain resistant', 'Heat resistant, food safe'], uses: 'Uses: picnic plates, worktops' },
    { id: 'PF', name: 'Phenol formaldehyde', col: '#5e3a2a', ink: CREAM, lines: ['"Bakelite", usually dark', 'Very heat resistant'], uses: 'Uses: saucepan handles, snooker balls' },
    { id: 'PR', name: 'Polyester resin', col: '#a98fe0', ink: INK, lines: ['+ glass fibre = GRP', 'Rigid and hard'], uses: 'Uses: boat hulls, car panels, casting' },
    { id: 'UF', name: 'Urea formaldehyde', col: '#8fcf6f', ink: INK, lines: ['Good electrical insulator', 'Hard, rigid, strong'], uses: 'Uses: plug sockets, light switches' },
  ];
  const ORD = [
    { k: 'socket', name: 'Plug socket', p: 4, why: 'UF: plug sockets & electrical fittings', core: 1 },
    { k: 'switch', name: 'Light switch', p: 4, why: 'UF: good electrical insulator' },
    { k: 'mdf', name: 'Glue inside MDF', p: 4, why: 'UF: the adhesive in MDF' },
    { k: 'boat', name: 'Boat hull', p: 3, why: 'PR + glass fibre = GRP boat hulls', core: 1 },
    { k: 'car', name: 'Car body panel', p: 3, why: 'PR + glass fibre = GRP car panels' },
    { k: 'paperweight', name: 'Paperweight', sub: 'a flower cast inside it', p: 3, why: 'PR: casting & embedding objects' },
    { k: 'pan', name: 'Saucepan handle', p: 2, why: 'PF: very heat resistant', core: 1 },
    { k: 'ball', name: 'Snooker ball', p: 2, why: 'PF (Bakelite): snooker balls' },
    { k: 'plate', name: 'Picnic plate', p: 1, why: 'MF: food safe, scratch resistant', core: 1 },
    { k: 'bowl', name: "Children's bowl", p: 1, why: 'MF: food safe, stain resistant' },
    { k: 'worktop', name: 'Laminated kitchen worktop', p: 1, why: 'MF: laminated kitchen worktops' },
    { k: 'glue', name: 'Two-part adhesive', p: 0, why: 'ER: strong adhesive (Araldite)', core: 1 },
    { k: 'pcb', name: 'Circuit board (PCB)', p: 0, why: 'ER: excellent electrical insulator' },
  ];
  const OK = Object.fromEntries(ORD.map((o) => [o.k, o]));
  const LEARN_ORD = ['glue', 'plate', 'pan', 'boat', 'socket'].map((k) => OK[k]);

  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 997; };
  const sfx = (n, p) => GS.sfx(n, p);

  // ---------------- sprites (all baked once) ----------------
  const SP = {};
  const partB = (key, w, h, col, draw, o = {}) => CL.bake('p_' + key, w, h, Object.assign({ R: 10, lump: 0.8, seed: hash(key), color: col, draw, fps: CL.prn(hash(key), w, h, o.nfp ?? 1, Math.max(8, Math.min(w, h) * 0.25)) }, o));
  const compose = (key, w, h, items) => {
    if (SP['c' + key]) return SP['c' + key];
    const m = 30, C = H.layer(w + m * 2, h + m * 2), c = C.getContext('2d');
    items.forEach(([s, x, y]) => { const sl = CL.sil(s, 6); c.globalAlpha = 0.35; c.drawImage(sl, m + x + 3 - sl.pad, m + y + 4 - sl.pad); c.globalAlpha = 1; c.drawImage(s, m + x - s.pad, m + y - s.pad); });
    C.pad = m; C.w = w; C.h = h;
    return (SP['c' + key] = C);
  };
  const rr = (x, y, w, h, r) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const disc = (x, y, r) => (c) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ball = (key, r, col, spec) => partB(key, r * 2, r * 2, col, disc(r, r, r), { R: Math.max(4, r * 0.6), dome: 1.4, lump: 0.3, spec: spec ?? 0.5, fps: [] });

  const PRODUCTS = {
    boat: () => compose('boat', 150, 84, [
      [partB('cabin', 56, 34, '#f2c14e', rr(0, 0, 56, 34, 8), { R: 7 }), 46, 0],
      [partB('hull', 150, 54, '#f6efe3', (c) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(150, 0); c.quadraticCurveTo(142, 40, 112, 54); c.lineTo(34, 54); c.quadraticCurveTo(8, 40, 0, 0); c.fill(); }, { R: 12, marks: [[14, 30, 136, 30, 1.4]] }), 0, 30],
      [partB('stripe', 128, 10, '#5fb6e0', rr(0, 0, 128, 10, 5), { R: 4, fps: [] }), 11, 40],
    ]),
    socket: () => compose('socket', 110, 104, [
      [partB('splate', 110, 104, '#f3eee6', rr(0, 0, 110, 104, 14), { R: 10, sss: [1.03, 1, 1] }), 0, 0],
      [partB('hole1', 12, 26, '#2e2420', rr(0, 0, 12, 26, 3), { R: 4, dome: -0.6, fps: [] }), 49, 16],
      [partB('hole2', 26, 12, '#2e2420', rr(0, 0, 26, 12, 3), { R: 4, dome: -0.6, fps: [] }), 20, 62],
      [partB('hole2', 26, 12, '#2e2420', rr(0, 0, 26, 12, 3), { R: 4, dome: -0.6, fps: [] }), 64, 62],
    ]),
    switch: () => compose('switch', 104, 104, [
      [partB('swplate', 104, 104, '#f3eee6', rr(0, 0, 104, 104, 14), { R: 10, sss: [1.03, 1, 1] }), 0, 0],
      [partB('rocker', 40, 58, '#ffffff', rr(0, 0, 40, 58, 8), { R: 8, marks: [[6, 29, 34, 29, 1.6]] }), 32, 23],
    ]),
    pan: () => compose('pan', 176, 74, [
      [partB('panbody', 96, 60, '#b9b6b0', rr(0, 0, 96, 60, [6, 6, 26, 26]), { R: 12, spec: 0.55, sss: [1.03, 1, 1.02] }), 4, 14],
      [partB('panrim', 104, 14, '#d3cfc6', rr(0, 0, 104, 14, 7), { R: 5, spec: 0.5, fps: [] }), 0, 8],
      [partB('panhandle', 78, 20, '#3b2a22', rr(0, 0, 78, 20, 10), { R: 8, marks: [[60, 3, 60, 17, 1.4]] }), 98, 18],
    ]),
    plate: () => compose('plate', 140, 48, [
      [partB('plate', 140, 48, '#f2c14e', (c) => { c.beginPath(); c.ellipse(70, 24, 70, 24, 0, 0, TAU); c.fill(); }, { R: 10 }), 0, 0],
      [partB('plin', 90, 26, '#f6d77a', (c) => { c.beginPath(); c.ellipse(45, 13, 45, 13, 0, 0, TAU); c.fill(); }, { R: 6, dome: 0.5, fps: [] }), 25, 9],
    ]),
    bowl: () => compose('bowl', 124, 72, [
      [partB('bowl', 124, 72, '#7fd0e0', (c) => { c.beginPath(); c.moveTo(0, 8); c.quadraticCurveTo(62, -6, 124, 8); c.quadraticCurveTo(120, 72, 62, 72); c.quadraticCurveTo(4, 72, 0, 8); c.fill(); }, { R: 12 }), 0, 0],
      [ball('bd1', 7, CREAM), 26, 30], [ball('bd2', 7, CREAM), 56, 40], [ball('bd3', 7, CREAM), 86, 30],
    ]),
    worktop: () => compose('worktop', 176, 98, [
      [partB('cab', 156, 76, '#a8673c', rr(0, 0, 156, 76, 6), { R: 8, marks: [[78, 6, 78, 70, 2], [20, 70, 136, 70, 1]] }), 10, 22],
      [ball('knob1', 6, '#f2c14e'), 60, 40], [ball('knob1', 6, '#f2c14e'), 84, 40],
      [partB('wtop', 176, 24, '#e8e1d2', rr(0, 0, 176, 24, 6), { R: 7, nfp: 2, marks: [[10, 8, 60, 8, 0.8], [90, 15, 160, 15, 0.8]] }), 0, 0],
    ]),
    glue: () => compose('glue', 160, 82, [
      [partB('tube1', 120, 30, '#f2c14e', rr(0, 0, 120, 30, 15), { R: 9 }), 0, 0],
      [partB('noz', 26, 14, '#3a2a24', rr(0, 0, 26, 14, 6), { R: 5, fps: [] }), 116, 8],
      [partB('tube2', 120, 30, '#5fb6e0', rr(0, 0, 120, 30, 15), { R: 9 }), 14, 46],
      [partB('noz', 26, 14, '#3a2a24', rr(0, 0, 26, 14, 6), { R: 5, fps: [] }), 130, 54],
    ]),
    pcb: () => compose('pcb', 140, 86, [
      [partB('board', 140, 86, '#3f8f4a', rr(0, 0, 140, 86, 8), { R: 6, dome: 0.6 }), 0, 0],
      [(() => { const q = CL.coil('track1', [[14, 70], [40, 70], [56, 52], [100, 52], [120, 30]], '#e8c25a', 6); return q; })(), -16, 0],
      [partB('chip1', 44, 28, '#2b2b30', rr(0, 0, 44, 28, 4), { R: 5, spec: 0.5, fps: [] }), 18, 14],
      [partB('chip2', 30, 22, '#2b2b30', rr(0, 0, 30, 22, 4), { R: 5, spec: 0.5, fps: [] }), 92, 58],
    ]),
    ball: () => compose('ball', 104, 98, [
      [partB('felt', 104, 30, '#3f8f4a', rr(0, 0, 104, 30, 10), { R: 8, lump: 1.5 }), 0, 68],
      [ball('snooker', 34, RED, 0.8), 18, 0],
    ]),
    car: () => compose('car', 172, 82, [
      [partB('carbody', 172, 64, '#f07b5a', (c) => { c.beginPath(); c.moveTo(0, 62); c.lineTo(0, 38); c.quadraticCurveTo(4, 28, 22, 26); c.lineTo(48, 24); c.lineTo(72, 4); c.lineTo(120, 4); c.lineTo(142, 26); c.quadraticCurveTo(172, 28, 172, 44); c.lineTo(172, 62); c.closePath(); c.fill(); }, { R: 11, marks: [[96, 30, 96, 58, 1.3]] }), 0, 0],
      [partB('carwin', 66, 18, '#bfe3ea', (c) => { c.beginPath(); c.moveTo(14, 0); c.lineTo(52, 0); c.lineTo(66, 18); c.lineTo(0, 18); c.closePath(); c.fill(); }, { R: 5, spec: 0.7, fps: [] }), 64, 9],
      [ball('wheel', 17, '#2b2b30', 0.4), 22, 48], [ball('wheel', 17, '#2b2b30', 0.4), 118, 48],
    ]),
    paperweight: () => compose('pw', 112, 86, [
      [partB('pwbase', 112, 14, '#c9c5bd', rr(0, 0, 112, 14, 7), { R: 5, fps: [] }), 0, 72],
      [partB('dome', 104, 70, '#bfe3ea', (c) => { c.beginPath(); c.ellipse(52, 70, 52, 68, 0, Math.PI, 0); c.closePath(); c.fill(); }, { R: 16, spec: 0.9, sss: [1, 1, 1.05] }), 4, 4],
      ...[0, 1, 2, 3, 4].map((i) => [ball('petal', 9, '#ef8fb0', 0.4), 47 + Math.cos(i * 1.256) * 14, 34 + Math.sin(i * 1.256) * 14]),
      [ball('fc', 7, '#f2c14e', 0.5), 49, 36],
    ]),
    mdf: () => compose('mdf', 160, 56, [
      [partB('mdf', 160, 56, '#b98a5a', rr(0, 0, 160, 56, 6), { R: 7, nfp: 2, marks: CL.marksIn(51, 160, 56, 9, 22, 0.7) }), 0, 0],
    ]),
  };
  const product = (k) => PRODUCTS[k]();

  const BLK = { pillar: [26, 90], plank: [164, 24], cube: [52, 52], post: [26, 56] };
  const BCOL = ['#e3b37a', '#c9c5bd', '#efe6d6'];
  const block = (kind, ci) => {
    const [w, h] = BLK[kind], key = 'b' + kind + ci;
    return CL.bake(key, w, h, { R: 9, lump: 1.0, seed: hash(key), color: BCOL[ci], draw: rr(0, 0, w, h, 6), fps: CL.prn(hash(key) + 3, w, h, w > 100 ? 2 : 1, 14), marks: CL.marksIn(hash(key) + 7, w, h, w > 100 ? 2 : 1, Math.min(w, h) * 0.8, 1.0) });
  };
  // ammo blobs: 3 "boil" variants each (re-sculpted on twos), code pressed into the clay
  const ammo = (i, boil, big) => {
    const key = 'am' + i + '_' + boil + (big ? 'B' : '');
    if (SP[key]) return SP[key];
    const p = POLY[i], s = big ? 92 : 54, R = big ? 22 : 14;
    const b = CL.bake(key, s, s, { R, lump: 1.4, seed: 30 + i * 5 + boil * 0.3, boil, color: p.col, spec: 0.35, draw: (c) => CL.lumpy(c, s / 2, s / 2, s / 2, s / 2 * 0.94, i * 3 + 1 + boil * 0.02, 0.07), fps: CL.prn(60 + i, s, s, 1, s * 0.3) });
    const C = H.layer(b.width, b.height), c = C.getContext('2d'); c.drawImage(b, 0, 0);
    const px = big ? 36 : 24, tw = CL.textW(p.id, px); let x = b.pad + s / 2 - tw / 2;
    for (const ch of p.id) { const g = CL.glyph(ch, px, p.ink); c.drawImage(g, x - g.pad, b.pad + s / 2 - px * 0.5 - g.pad); x += CL.charW(ch, px); }
    C.pad = b.pad; C.w = s; C.h = s;
    return (SP[key] = C);
  };
  const splatS = (i) => CL.bake('splat' + i, 74, 20, { R: 7, dome: 0.9, lump: 0.8, seed: 90 + i, color: POLY[i].col, draw: (c) => CL.lumpy(c, 37, 12, 37, 9, i * 2 + 5, 0.15), fps: CL.prn(91 + i, 74, 20, 1, 9) });
  const crumbS = (col, v) => CL.bake('cr' + col + v, 12, 10, { R: 4, dome: 1.4, lump: 0.3, seed: 5 + v, color: col, spec: 0.35, draw: (c) => CL.lumpy(c, 6, 5, 6, 5, v * 3, 0.2), fps: [] });
  const dotS = (r) => ball('dot' + r, r, CREAM, 0.5);
  const xMark = () => CL.bake('xmark', 110, 110, { R: 10, lump: 0.6, seed: 73, color: RED, draw: (c) => { c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(16, 16); c.lineTo(94, 94); c.moveTo(94, 16); c.lineTo(16, 94); c.stroke(); } });
  const tick = () => CL.bake('check', 120, 100, { R: 10, lump: 0.6, seed: 74, color: GREEN, draw: (c) => { c.lineWidth = 26; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(14, 54); c.lineTo(44, 84); c.lineTo(106, 16); c.stroke(); } });
  const star = () => CL.bake('star', 110, 110, { R: 12, lump: 0.6, seed: 75, color: '#f2c14e', spec: 0.5, draw: (c) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 22 : 54; c.lineTo(55 + Math.cos(a) * r, 57 + Math.sin(a) * r); } c.closePath(); c.fill(); } });

  // catapult: forked stick, origin of local coords = (150, 400) on screen
  const SL = { ox: 150, oy: 398, back: [185, 424], front: [218, 430], rest: [202, 442] };
  const fork = (front) => CL.bake(front ? 'forkF' : 'forkB', 110, 180, { R: 11, lump: 1.2, seed: front ? 22 : 21, color: '#a8673c', draw: (c) => {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 22;
    if (!front) { c.beginPath(); c.roundRect(38, 72, 28, 106, 10); c.fill(); c.beginPath(); c.moveTo(52, 88); c.quadraticCurveTo(40, 60, 35, 28); c.stroke(); }
    c.beginPath(); c.moveTo(54, 88); c.quadraticCurveTo(64, 62, 68, 34); c.stroke();
  }, marks: front ? [] : [[52, 110, 52, 160, 1.4]], fps: front ? [] : CL.prn(23, 110, 180, 1, 12) });

  const plaque = () => CL.slab(214, 64, CREAM, 7);

  // ---------------- set: wall, backdrop and table, baked once ----------------
  let BG = null;
  function bakeBG() {
    const C = H.layer(W, HH), c = C.getContext('2d'), nz = CL.nz;
    c.fillStyle = '#3f8593'; c.fillRect(0, 0, W, HH);
    const wall = CL.bake('wall', W, 560, { R: 4, dome: 0, lump: 3.2, seed: 3, color: '#4f9fae', spec: 0.12, draw: (x) => x.fillRect(-30, -30, W + 60, 620), fps: CL.prn(11, W, 470, 12, 30), marks: CL.marksIn(12, W, 480, 10, 90), markW: 14 });
    c.save(); c.filter = 'blur(1.6px)'; c.drawImage(wall, -wall.pad, -wall.pad); c.restore();
    // backdrop pieces stuck to the far wall (out of focus): sun, clouds, rolling hills
    const far = (spr, x, y, b) => { c.save(); c.filter = `blur(${b}px)`; c.globalAlpha = 0.35; c.drawImage(CL.sil(spr, 14), x + 8 - CL.sil(spr, 14).pad, y + 10 - CL.sil(spr, 14).pad); c.globalAlpha = 1; c.drawImage(spr, x - spr.pad, y - spr.pad); c.restore(); };
    far(CL.bake('sun', 120, 120, { R: 18, lump: 1.2, seed: 41, color: '#f2c14e', spec: 0.2, draw: (x) => CL.lumpy(x, 60, 60, 58, 56, 4, 0.05), fps: CL.prn(42, 120, 120, 2, 20) }), 560, 230, 2.2);
    [[60, 300, 190, 70, 1], [780, 250, 230, 80, 2], [1090, 330, 160, 60, 3]].forEach(([x, y, w, h, s]) => far(CL.bake('cloud' + s, w, h, { R: 16, lump: 1.4, seed: 50 + s, color: '#eef3f0', sss: [1.03, 1, 1.02], spec: 0.15, draw: (q) => { CL.lumpy(q, w * 0.3, h * 0.62, w * 0.3, h * 0.38, s, 0.1); CL.lumpy(q, w * 0.55, h * 0.45, w * 0.3, h * 0.45, s + 2, 0.1); CL.lumpy(q, w * 0.78, h * 0.65, w * 0.22, h * 0.33, s + 4, 0.1); }, fps: CL.prn(55 + s, w, h, 2, 18) }), x, y, 2.4));
    far(CL.bake('hills', W + 60, 170, { R: 24, lump: 2.4, seed: 61, color: '#6bb865', draw: (q) => { q.beginPath(); q.moveTo(0, 170); for (let X = 0; X <= W + 60; X += 10) q.lineTo(X, 70 + Math.sin(X * 0.006 + 1) * 40 + Math.sin(X * 0.017) * 18); q.lineTo(W + 60, 200); q.lineTo(0, 200); q.closePath(); q.fill(); }, fps: CL.prn(62, W, 150, 8, 26), marks: CL.marksIn(63, W, 140, 6, 90), markW: 12 }), -30, 400, 2.0);
    const g = c.createRadialGradient(620, 220, 30, 640, 300, 760); g.addColorStop(0, 'rgba(255,240,200,0.22)'); g.addColorStop(1, 'rgba(10,20,30,0.35)');
    c.fillStyle = g; c.fillRect(0, 0, W, HH);
    const tab = CL.bake('table', W + 80, 200, { R: 22, dome: 1.0, lump: 2.4, seed: 80, color: '#d0703f', draw: (x) => { x.beginPath(); x.moveTo(0, 14); for (let X = 0; X <= W + 80; X += 20) x.lineTo(X, 6 + nz.n2(X * 0.01, 3) * 8); x.lineTo(W + 80, 260); x.lineTo(0, 260); x.closePath(); x.fill(); }, fps: CL.prn(81, W, 170, 7, 30), marks: (() => { const r = H.rng(82); return Array.from({ length: 6 }, () => { const x = r.range(40, W), y = r.range(40, 170), a = r() * TAU, l = r.range(50, 110); return [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 1.2]; }); })(), markW: 16 });
    c.save(); c.shadowColor = 'rgba(40,20,10,0.35)'; c.shadowBlur = 30; c.shadowOffsetY = -10; c.drawImage(tab, -40 - tab.pad, 540 - tab.pad); c.restore();
    const g2 = c.createLinearGradient(0, 620, 0, HH); g2.addColorStop(0, 'rgba(60,20,10,0)'); g2.addColorStop(1, 'rgba(60,20,10,0.4)');
    c.fillStyle = g2; c.fillRect(0, 620, W, 100);
    // stray clay crumbs on the table
    const r = H.rng(160);
    [[470, 600, '#f2b84b'], [640, 690, '#ef8fb0'], [700, 598, '#4f9fae'], [1240, 600, '#a8dd8a'], [560, 640, CREAM]].forEach(([x, y, col], i) => c.drawImage(crumbS(col, i), x - 6, y - 5));
    // out-of-focus foreground lump (shallow depth of field)
    const fg = CL.bake('fglump', 150, 110, { R: 22, lump: 2, seed: 150, color: '#e86f7f', draw: (q) => CL.lumpy(q, 75, 60, 72, 50, 2, 0.1), fps: CL.prn(151, 150, 110, 2, 24) });
    c.save(); c.filter = 'blur(4px)'; c.drawImage(fg, 1190 - fg.pad, 650 - fg.pad); c.restore();
    BG = C;
  }

  // ---------------- state ----------------
  const S = {};
  function resetAll(mode) {
    Object.assign(S, {
      mode, clock: 0, scores: [0, 0], scoreT: [-9, -9], bodies: [], splats: [], parts: [], floats: [], proj: null, product: null,
      turn: null, banner: null, mark: null, wobble: 0, learnStep: -1, stepT: 0, ready: [false, false], readyT: 0,
      playT0: GS.t, nextP: 1, bag: [], lastK: null, poseK: -1, tier: 0, turnNo: 0, notice: null, lastAmmo: [0, 2, 2], selT: -9, thudT: 0, sweep: null, rng: H.rng(1234 + Math.floor(Math.random() * 1e6)),
    });
    GS.score(0, 0);
  }
  const startAttract = () => resetAll('attract');
  function startLearn() { resetAll('learn'); S.learnRound = true; }
  function startTest() {
    const keep = S.scores ? S.scores.slice() : [0, 0];
    resetAll('test'); S.scores = keep; GS.score(S.scores[0], S.scores[1]);
    S.playT0 = GS.t; S.nextP = 1;
    newTestTurn();
  }

  // ---------------- structures ----------------
  function mkBody(spr, x, y, w, h, popT, isProd) { return { spr, x, y, w, h, a: 0, vx: 0, vy: 0, va: 0, dyn: false, popT, prod: isProd, px: x, py: y, pa: 0, ground: false }; }
  function genStructure(cx, tier, order) {
    const r = S.rng, B = [], ci = r.int(0, 2);
    let t0 = S.clock + 0.05, k = 0;
    const add = (kind, x, yb, c) => { const [w, h] = BLK[kind]; B.push(mkBody(block(kind, c ?? ci), x, yb - h / 2, w, h, t0 + k++ * 0.09)); return yb - h; };
    const pats = tier === 0 ? ['hut', 'pyr2'] : tier === 1 ? ['hut2', 'pyr3', 'tower'] : ['hut2', 'tower', 'tower2'];
    const pat = r.pick(pats);
    let top = GY;
    const hut = (yb) => { add('pillar', cx - 62, yb); add('pillar', cx + 62, yb); return add('plank', cx, yb - 90, (ci + 1) % 3); };
    if (pat === 'hut') top = hut(GY);
    else if (pat === 'hut2') { const y1 = hut(GY); add('post', cx - 56, y1); add('post', cx + 56, y1); top = add('plank', cx, y1 - 56, (ci + 2) % 3); }
    else if (pat === 'pyr2') { add('cube', cx - 28, GY); add('cube', cx + 28, GY); top = add('cube', cx, GY - 52, (ci + 1) % 3); }
    else if (pat === 'pyr3') { [-56, 0, 56].forEach((d) => add('cube', cx + d, GY)); [-28, 28].forEach((d) => add('cube', cx + d, GY - 52, (ci + 1) % 3)); top = add('plank', cx, GY - 104, (ci + 2) % 3); }
    else if (pat === 'tower') { add('cube', cx - 40, GY); add('cube', cx + 40, GY); const y1 = add('plank', cx, GY - 52, (ci + 1) % 3); add('pillar', cx - 56, y1); add('pillar', cx + 56, y1); top = add('plank', cx, y1 - 90, (ci + 2) % 3); }
    else { const y1 = hut(GY); add('cube', cx, y1, (ci + 2) % 3); top = add('plank', cx, y1 - 52, (ci + 1) % 3); }
    const ps = product(order.k);
    const pb = mkBody(ps, cx, top - ps.h / 2, ps.w, ps.h, t0 + k * 0.09 + 0.08, true);
    B.push(pb);
    S.bodies = B; S.product = pb;
    sfx('pop', { f: 240, gain: 0.5 });
  }
  const tierOf = () => { const pt = GS.t - S.playT0; return pt < 55 ? 0 : pt < 120 ? 1 : 2; };
  const TIER = [{ x: [790, 870], prev: 0.8, time: 12 }, { x: [890, 980], prev: 0.55, time: 12 }, { x: [980, 1080], prev: 0.38, time: 11 }];
  const double = () => S.mode === 'test' && GS.timeLeft() < 40;

  function pickOrder() {
    if (!S.bag.length) {
      const pool = S.mode === 'test' && tierOf() === 0 && S.turnNo < 6 ? ORD.filter((o) => o.core) : ORD.slice();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(S.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      S.bag = pool;
    }
    let o = S.bag.pop();
    if (o.k === S.lastK && S.bag.length) { const o2 = S.bag.pop(); S.bag.unshift(o); o = o2; }
    S.lastK = o.k; return o;
  }

  function newTurn(player, order, o) {
    S.bodies = []; S.product = null; S.proj = null; S.mark = null; S.banner = null; S.wobble = 0; S.sweep = null;
    const cx = o.cx ?? Math.round(H.lerp(o.tierDef.x[0], o.tierDef.x[1], S.rng()));
    genStructure(cx, o.tier, order);
    S.turn = { player, order, ammo: o.ammo ?? S.lastAmmo[player], angle: 0.68, power: 0.62, state: 'build', t: 0, timer: o.time || 0, timeMax: o.time || 0, practice: !!o.practice, demo: !!o.demo, preview: o.preview, cx, lock: o.lock || 0 };
    S.selT = S.clock;
  }
  function newTestTurn() {
    const tier = tierOf();
    if (tier > S.tier) { S.tier = tier; S.notice = { t0: S.clock, txt: tier === 1 ? 'LEVEL 2: further away!' : 'LEVEL 3: shorter aim line!' }; sfx('ding', { f: 'E5', gain: 0.5 }); }
    S.turnNo = (S.turnNo || 0) + 1;
    const p = S.nextP; S.nextP = 3 - p;
    newTurn(p, pickOrder(), { tier, tierDef: TIER[tier], preview: TIER[tier].prev, time: TIER[tier].time });
  }
  function newLearnTurn(k) {
    newTurn((k % 2) + 1, LEARN_ORD[k], { tier: 0, cx: 900, preview: 1, ammo: k, practice: true, lock: 2.6 });
    S.stepT = 0;
  }
  function newDemoTurn() {
    const o = ORD[Math.floor(S.rng() * ORD.length)], tier = S.rng.int(0, 2);
    newTurn(S.rng.int(1, 2), o, { tier, tierDef: TIER[tier], preview: 0.7, demo: true, ammo: S.rng() < 0.75 ? o.p : S.rng.int(0, 4) });
  }
  function advance() {
    if (S.mode === 'attract') newDemoTurn();
    else if (S.mode === 'learn') { S.learnStep++; if (S.learnStep < 5) newLearnTurn(S.learnStep); else { S.turn = null; S.bodies = []; S.product = null; S.readyT = S.clock; } }
    else newTestTurn();
  }

  // ---------------- aiming ----------------
  const speed = (p) => 420 + p * 700;
  function pouch(t) { const d = [Math.cos(t.angle), -Math.sin(t.angle)], pull = 14 + t.power * 46; return [SL.rest[0] - d[0] * pull, SL.rest[1] - d[1] * pull]; }
  function launchVel(t) { const v = speed(t.power); return [Math.cos(t.angle) * v, -Math.sin(t.angle) * v]; }
  function hitStatic(x, y, r) {
    for (const b of S.bodies) {
      if (b.dyn || S.clock < b.popT) continue;
      const qx = H.clamp(x, b.x - b.w / 2, b.x + b.w / 2), qy = H.clamp(y, b.y - b.h / 2, b.y + b.h / 2), dx = x - qx, dy = y - qy;
      if (dx * dx + dy * dy < r * r) { const d = Math.hypot(dx, dy) || 1; return { b, qx, qy, nx: dx / d || -1, ny: dy / d }; }
    }
    return null;
  }
  function arc(t) {
    let [x, y] = pouch(t), [vx, vy] = launchVel(t); const pts = [];
    for (let i = 0; i < 160; i++) {
      for (let s = 0; s < 2; s++) { vy += G / 60; x += vx / 60; y += vy / 60; }
      pts.push([x, y]);
      if (y + 20 > GY || x > W + 20 || hitStatic(x, y, 22)) break;
    }
    return pts;
  }
  // computer aim (attract demo + LEARN auto-shot): low arc onto the product
  function solveAim(t) {
    const tx = S.product.x - 10, ty = S.product.y;
    for (const p of [0.55, 0.65, 0.75, 0.85, 0.95, 1]) {
      const v = speed(p); let ang = 0.7;
      for (let it = 0; it < 3; it++) {
        const P = pouch({ angle: ang, power: p }), dx = tx - P[0], dy = P[1] - ty, disc = v ** 4 - G * (G * dx * dx + 2 * dy * v * v);
        if (disc < 0) { ang = -1; break; }
        ang = Math.atan((v * v - Math.sqrt(disc)) / (G * dx));
      }
      if (ang > 0.12 && ang < 1.35) { t.angle = ang; t.power = p; return; }
    }
    t.angle = 0.7; t.power = 0.9;
  }
  function fire(t) {
    const [x, y] = pouch(t), [vx, vy] = launchVel(t);
    S.proj = { x, y, vx, vy, r: 24, ammo: t.ammo, state: 'fly', t: 0, a: 0, px: x, py: y, pa: 0, nx: -1, ny: 0 };
    t.state = 'flight'; t.t = 0; S.lastAmmo[t.player] = t.ammo;
    sfx('slap', { gain: 0.5 }); sfx('whoosh', { dur: 0.4, gain: 0.5 });
  }

  // ---------------- results ----------------
  function resultCard(key, main, mcol, l2, l3) {
    const fit = (t, px) => { while (px > 26 && CL.textW(t, px) > 620) px -= 2; return px; };
    const lines = [{ t: main, px: 48, col: mcol }, { t: l2, px: fit(l2, 36), col: INK }];
    if (l3) lines.push({ t: l3, px: fit(l3, 30), col: RUST });
    return CL.card('res:' + key + main, lines, { padX: 24, padY: 14, col: '#fff7e6', seed: 12 });
  }
  function resolve(kind, hx, hy) {
    const t = S.turn, o = t.order, P = POLY[o.p];
    t.state = 'result'; t.t = 0; t.kind = kind;
    let pts = 0;
    if (kind === 'right') {
      pts = t.practice || t.demo ? 0 : (10 + Math.min(4, Math.floor(t.timer / 3))) * (double() ? 2 : 1);
      S.banner = { t0: S.clock, card: resultCard('r' + o.k, pts ? 'MADE IT!  +' + pts : 'MADE IT!', GREEN, o.name + ' = ' + P.name, o.why) };
      S.mark = { spr: tick(), x: S.product.x - 60, y: S.product.y - 130, t0: S.clock };
      sfx('impact', { gain: 0.7 }); sfx('success', { f: 'G5', gain: 0.55 });
    } else if (kind === 'wrong') {
      pts = t.practice || t.demo ? 0 : -3;
      S.banner = { t0: S.clock, card: resultCard('w' + o.k, pts ? 'WRONG CLAY!  -3' : 'WRONG CLAY!', RED, 'Needed: ' + P.name, o.why) };
      S.mark = { spr: xMark(), x: S.product.x - 55, y: S.product.y - 55, t0: S.clock, shake: true };
      S.wobble = 0.6;
      sfx('slap', { gain: 0.8 }); sfx('error', { gain: 0.6 });
    } else {
      const right = t.ammo === o.p && kind === 'miss';
      const m = kind === 'slow' ? 'TOO SLOW!' : 'MISSED!';
      S.banner = { t0: S.clock, card: right ? resultCard('ok' + o.k, m, RUST, 'Right clay (' + P.name + ')', 'just aim better!') : resultCard('n' + o.k, m, RUST, 'Needed: ' + P.name, o.why) };
      sfx(kind === 'slow' ? 'buzz' : 'thud', { gain: 0.4, f: 100 });
    }
    if (pts && S.mode === 'test') {
      const i = t.player - 1; S.scores[i] = Math.max(0, S.scores[i] + pts); S.scoreT[i] = S.clock; GS.score(S.scores[0], S.scores[1]);
      if (0) S.floats.push({ txt: (pts > 0 ? '+' : '') + pts, x: S.product.x, y: S.product.y - 70, t0: S.clock, col: pts > 0 ? GREEN : RED });
    }
  }
  function topple(hx, hy, pvx) {
    const r = S.rng;
    for (const b of S.bodies) {
      const dx = b.x - hx, dy = b.y - hy, d = Math.hypot(dx, dy) || 1, f = Math.max(0.15, 1 - d / 380);
      b.dyn = true; b.vx = pvx * 0.35 * f + (dx / d) * 360 * f + r.range(40, 200); b.vy = -r.range(80, 320) * f + (dy / d) * 160 * f; b.va = r.range(-5, 5) * f + b.vx / 260;
      if (b.prod) { b.vx = r.range(120, 260); b.vy = -680; b.va = r.range(3, 6); }
    }
    burst(hx, hy, POLY[S.turn.ammo].col, 16);
  }
  function burst(x, y, col, n) {
    const r = S.rng;
    for (let i = 0; i < n && S.parts.length < 80; i++) { const a = r.range(-Math.PI, 0.2), v = r.range(120, 420); S.parts.push({ spr: crumbS(col, i % 4), x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, px: x, py: y, a: 0, pa: 0 }); }
  }

  // ---------------- update ----------------
  function control(t, dt) {
    const p = t.player;
    if (!t.practice) {
      if (GS.hit(p, 'b')) { t.ammo = (t.ammo + 1) % 5; S.selT = S.clock; sfx('pop', { f: 300, gain: 0.45 }); }
    }
    const da = (GS.held(p, 'up') ? 1 : 0) - (GS.held(p, 'down') ? 1 : 0), dp = (GS.held(p, 'right') ? 1 : 0) - (GS.held(p, 'left') ? 1 : 0);
    const a0 = t.angle, p0 = t.power;
    t.angle = H.clamp(t.angle + da * 0.8 * dt, 0.09, 1.38); t.power = H.clamp(t.power + dp * 0.5 * dt, 0, 1);
    t.tickAcc = (t.tickAcc || 0) + Math.abs(t.angle - a0) * 3 + Math.abs(t.power - p0) * 4;
    if (t.tickAcc > 0.25) { t.tickAcc = 0; sfx('tick', { gain: 0.3, f: 3000 + t.power * 2000 }); }
    if (GS.hit(p, 'a') && t.t >= t.lock) fire(t);
  }
  function update(dt) {
    S.wobble = Math.max(0, S.wobble - dt);
    if (S.mode === 'learn') {
      S.stepT += dt;
      // the tutorial can run ahead when players are quick, but never falls behind the lesson clock
      const LS = GS.t + GS.learnLeft(), per = Math.max(4, (LS - 12) / 5);
      const due = GS.t < 6 ? -1 : Math.min(5, Math.floor((GS.t - 6) / per));
      if (S.learnStep === -1 && S.stepT > 6 && due < 0) { S.learnStep = 0; newLearnTurn(0); }
      else if (due > S.learnStep) { S.learnStep = due; S.proj = null; S.splats = []; if (due < 5) newLearnTurn(due); else { S.turn = null; S.bodies = []; S.product = null; S.readyT = S.clock; S.banner = null; } }
      if (S.learnStep >= 5) {
        [1, 2].forEach((p) => { if (GS.hit(p, 'a') && !S.ready[p - 1] && S.clock - S.readyT > 0.6) { S.ready[p - 1] = true; (S.readyAt = S.readyAt || {})[p] = S.clock; sfx('pop', { f: 220, gain: 0.6 }); } });
        if (S.ready[0] && S.ready[1]) { S.ready = [false, false]; GS.skipLearn(); return; }
      }
    }
    const t = S.turn;
    if (t) {
      t.t += dt;
      if (t.state === 'build' && t.t > 0.8) { t.state = 'aim'; t.t = 0; if (t.demo) { solveAim(t); t.angle += S.rng.range(-0.05, 0.05); } }
      else if (t.state === 'aim') {
        if (t.demo) { if (t.t > 1.4) fire(t); }
        else {
          control(t, dt);
          if (t.state === 'aim' && t.timeMax) {
            const before = Math.ceil(t.timer); t.timer -= dt; const now = Math.ceil(t.timer);
            if (now !== before && now <= 3 && now > 0) sfx('tock', { f: 600, gain: 0.45 });
            if (t.timer <= 0) { t.timer = 0; resolve('slow'); }
          }
          if (t.state === 'aim' && t.practice && t.t > 9) { solveAim(t); fire(t); t.auto = true; }
        }
      } else if (t.state === 'result') {
        if (t.t > (S.mode === 'learn' || t.kind !== 'right' ? 3.6 : 3.0) && !S.proj) { t.state = 'clear'; t.t = 0; S.sweep = S.clock; sfx('whoosh', { dur: 0.35, gain: 0.35 }); }
      } else if (t.state === 'clear' && t.t > 0.45) { S.splats = []; advance(); }
    }
    physics(dt);
  }
  function physics(dt) {
    const pr = S.proj, t = S.turn;
    if (pr) {
      pr.t += dt;
      if (pr.state === 'fly') {
        for (let s = 0; s < 2 && pr.state === 'fly'; s++) {
          const h = dt / 2; pr.vy += G * h; pr.x += pr.vx * h; pr.y += pr.vy * h; pr.a += h * 3;
          const hit = hitStatic(pr.x, pr.y, pr.r);
          if (hit) {
            pr.state = 'stuck'; pr.t = 0; pr.nx = hit.nx; pr.ny = hit.ny; pr.x = hit.qx + hit.nx * pr.r * 0.6; pr.y = hit.qy + hit.ny * pr.r * 0.6;
            sfx('slap', { gain: 0.6 }); sfx('thud', { f: 120, gain: 0.6 });
            if (t.ammo === t.order.p) { topple(pr.x, pr.y, pr.vx); resolve('right'); } else { burst(pr.x, pr.y, POLY[pr.ammo].col, 6); resolve('wrong'); }
          } else if (pr.y + pr.r * 0.6 >= GY) { pr.y = GY - 10; landSplat(pr); resolve('miss'); }
          else if (pr.x > W + 80 || pr.x < -80) { S.proj = null; resolve('miss'); }
        }
      } else if (pr.state === 'stuck') { if (pr.t > 0.25) { pr.state = 'drop'; pr.vx = pr.nx * 30; pr.vy = 0; } }
      else if (pr.state === 'drop') { pr.vy += G * dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt; if (pr.y + 8 >= GY) { pr.y = GY - 8; landSplat(pr); } }
    }
    for (const b of S.bodies) {
      if (!b.dyn) continue;
      b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt;
      const ey = Math.abs((b.w / 2) * Math.sin(b.a)) + Math.abs((b.h / 2) * Math.cos(b.a)), bottom = b.y + ey;
      if (bottom > GY) {
        b.y -= bottom - GY;
        if (b.vy > 160 && S.clock - S.thudT > 0.07) { S.thudT = S.clock; sfx('thud', { f: 90 + S.rng() * 60, gain: Math.min(0.5, b.vy / 1400) }); }
        if (b.vy > 0) b.vy = -b.vy * 0.22;
        b.vx *= Math.pow(0.06, dt); const tgt = Math.round(b.a / (Math.PI / 2)) * (Math.PI / 2);
        b.va += (tgt - b.a) * 40 * dt; b.va *= Math.pow(0.02, dt);
      }
    }
    for (let i = S.parts.length - 1; i >= 0; i--) { const q = S.parts[i]; q.t += dt; q.vy += G * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.y > GY + 4) { q.y = GY + 4; q.vy *= -0.3; q.vx *= 0.6; } if (q.t > 1.6) S.parts.splice(i, 1); }
    for (let i = S.floats.length - 1; i >= 0; i--) if (S.clock - S.floats[i].t0 > 1.6) S.floats.splice(i, 1);
  }
  function landSplat(pr) {
    S.splats.push({ x: pr.x, ammo: pr.ammo, t0: S.clock }); if (S.splats.length > 6) S.splats.shift();
    burst(pr.x, GY - 6, POLY[pr.ammo].col, 5); sfx('press', { gain: 0.45 }); S.proj = null;
  }

  // ---------------- drawing ----------------
  const fr12 = () => Math.floor(S.clock * 12);
  function snapPoses() {
    const k = Math.floor(S.clock * 20); // moving pieces are re-posed 20x a second, like stop-motion exposures
    if (k === S.poseK) return; S.poseK = k;
    for (const b of S.bodies) { b.px = b.x; b.py = b.y; b.pa = b.a; }
    for (const q of S.parts) { q.px = q.x; q.py = q.y; }
    if (S.proj) { S.proj.px = S.proj.x; S.proj.py = S.proj.y; S.proj.pa = S.proj.a; }
  }
  const sweepDx = () => (S.sweep == null ? 0 : 2600 * (S.clock - S.sweep + 1 / 12) ** 2);

  function drawSet() {
    ctx.drawImage(BG, 0, 0);
    const sd = sweepDx();
    for (const s of S.splats) { const e = CL.pop(S.clock - s.t0, 'squish') || [1, 1], sp = splatS(s.ammo); CL.place(ctx, sp, s.x - 37 + sd, GY - 14, { sx: e[0], sy: e[1], shadow: { blur: 5, dx: 3, dy: 3, a: 0.4 } }); }
    // bodies
    const wob = S.wobble > 0 ? ((fr12() % 2) * 2 - 1) * 5 : 0;
    for (const b of S.bodies) {
      if (S.clock < b.popT) continue;
      const e = CL.pop(S.clock - b.popT) || [1, 1], x = b.px + sd + (b.dyn ? 0 : wob);
      const ey = Math.abs((b.w / 2) * Math.sin(b.pa)) + Math.abs((b.h / 2) * Math.cos(b.pa)), gap = GY - (b.py + ey);
      if (gap < 40) CL.contact(ctx, x, GY + 2, b.w * 0.55, 9, 0.42 * (1 - gap / 40));
    }
    for (const b of S.bodies) {
      if (S.clock < b.popT) continue;
      const e = CL.pop(S.clock - b.popT) || [1, 1], x = b.px + sd + (b.dyn ? 0 : wob);
      if (b.dyn) CL.place(ctx, b.spr, x - b.w / 2, b.py - b.h / 2, { ax: b.w / 2, ay: b.h / 2, rot: b.pa, shadow: { blur: 12, dx: 8, dy: 8, a: 0.4 } });
      else CL.place(ctx, b.spr, x - b.w / 2, b.py - b.h / 2, { sx: e[0], sy: e[1], shadow: { blur: 12, dx: 8, dy: 8, a: 0.4 } });
    }
    // marks (tick / X) on the target
    if (S.mark && S.sweep == null) {
      const m = S.mark, e = CL.pop(S.clock - m.t0); const sh = m.shake && S.clock - m.t0 < 0.5 ? ((fr12() % 2) * 2 - 1) * 7 : 0;
      if (e) CL.place(ctx, m.spr, m.x + sh, m.y, { sx: e[0], sy: e[1], rot: 0.08, shadow: { blur: 10, dx: 6, dy: 8, a: 0.45 } });
    }
  }
  function band(x0, y0, x1, y1) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#5a2424'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(220,120,110,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 1, y0 - 3); ctx.lineTo(x1 - 1, y1 - 3); ctx.stroke();
    ctx.restore();
  }
  function drawSling() {
    const t = S.turn, boil = fr12() % 3;
    const loaded = t && (t.state === 'build' || t.state === 'aim');
    const P = loaded ? pouch(t) : SL.rest;
    CL.contact(ctx, 202, GY + 2, 40, 9, 0.5);
    band(SL.back[0], SL.back[1], P[0] - 14, P[1]);
    CL.place(ctx, fork(false), SL.ox, SL.oy, { shadow: { blur: 14, dx: 8, dy: 8, a: 0.4 } });
    if (loaded) {
      const e = CL.pop(S.clock - S.selT) || [1, 1];
      CL.place(ctx, ammo(t.ammo, boil), P[0] - 27, P[1] - 27, { sx: e[0], sy: e[1], ax: 27, ay: 54, shadow: { blur: 8, dx: 5, dy: 6, a: 0.4 } });
    }
    band(SL.front[0], SL.front[1], P[0] + (loaded ? 6 : 14), P[1] + 4);
    CL.place(ctx, fork(true), SL.ox, SL.oy, { shadow: false });
  }
  function drawArc() {
    const t = S.turn;
    if (!t || t.state !== 'aim' || !t.preview) return;
    const pts = arc(t), n = Math.max(2, Math.floor(pts.length * t.preview)), ph = fr12() % 2;
    for (let i = 1 + ph; i < n; i += 2) {
      const u = i / pts.length, r = Math.max(4, Math.round(8 - u * 4)), d = dotS(r);
      ctx.drawImage(CL.sil(d, 4), pts[i][0] - r + 3 - CL.sil(d, 4).pad, pts[i][1] - r + 4 - CL.sil(d, 4).pad);
      ctx.drawImage(d, pts[i][0] - r - d.pad, pts[i][1] - r - d.pad);
    }
  }
  function drawProj() {
    const pr = S.proj; if (!pr) return;
    const spr = ammo(pr.ammo, fr12() % 3);
    if (pr.state === 'fly') {
      const sp = Math.hypot(pr.vx, pr.vy), st = Math.min(0.22, sp / 5000), ang = Math.atan2(pr.vy, pr.vx);
      ctx.save(); ctx.translate(pr.px, pr.py); ctx.rotate(ang); ctx.scale(1 + st, 1 - st * 0.7); ctx.rotate(-ang + pr.pa * 0.4);
      CL.place(ctx, spr, -27, -27, { ax: 27, ay: 27, shadow: { blur: 8, dx: 6, dy: 8, a: 0.35 } }); ctx.restore();
    } else {
      const k = pr.state === 'stuck' ? CL.pop(pr.t, 'squish') : [0.85, 1.12], ang = Math.atan2(pr.ny, pr.nx);
      ctx.save(); ctx.translate(pr.px, pr.py); ctx.rotate(ang); ctx.scale(pr.state === 'stuck' ? 0.55 + 0.45 * (1 - k[0] + 0.25) * 0.8 : 0.85, pr.state === 'stuck' ? 1.3 : 1.12); ctx.rotate(-ang);
      CL.place(ctx, spr, -27, -27, { ax: 27, ay: 27, shadow: { blur: 6, dx: 4, dy: 6, a: 0.35 } }); ctx.restore();
    }
  }
  function drawParts() {
    for (const q of S.parts) { const s = q.spr; ctx.globalAlpha = H.clamp(2 - q.t * 1.2); ctx.drawImage(s, q.px - 6 - s.pad, q.py - 5 - s.pad); }
    ctx.globalAlpha = 1;
    for (const f of S.floats) { const a = S.clock - f.t0; CL.text(ctx, f.txt, f.x, f.y - Math.floor(a * 12) * 4, 64, f.col, { align: 'center', pop: a, step: 1 / 24 }); }
  }

  // ---------------- HUD ----------------
  const lineAt = (str, px, col, x, y, align, o = {}) => { const s = CL.line(str, px, col); const xx = align === 'center' ? x - s.w / 2 : align === 'right' ? x - s.w : x; const e = o.pop != null ? CL.pop(o.pop) : [1, 1]; if (!e) return s; CL.place(ctx, s, xx, y - px * 0.82 - 0, { sx: e[0], sy: e[1], shadow: false }); return s; };
  const cardAt = (spr, x, y, o = {}) => { const e = o.pop != null ? CL.pop(o.pop) : [1, 1]; if (!e) return; CL.place(ctx, spr, x, y, { sx: e[0], sy: e[1], shadow: { blur: 16, dx: 9, dy: 10, a: 0.4 } }); };
  const tagCard = (key, str, px, col, o) => CL.card('tag:' + key, [{ t: str, px, col }], Object.assign({ padX: 16, padY: 8, col: '#fff7e6', seed: 9 }, o));
  function drawPlaques() {
    if (S.mode === 'attract') return;
    [1, 2].forEach((p, i) => {
      const x = 18 + i * 232, y = 12, act = S.mode === 'test' && S.turn && S.turn.player === p;
      const pl = plaque();
      CL.place(ctx, pl, x, y, { sx: act ? 1.06 : 1, sy: act ? 1.06 : 1, ax: 107, ay: 32, alpha: S.mode === 'test' && !act ? 0.8 : 1, shadow: { blur: 14, dx: 7, dy: 8, a: 0.4 } });
      lineAt('P' + p, 36, PCOL[p], x + 18, y + 46);
      const e = S.clock - S.scoreT[i];
      CL.text(ctx, String(S.scores[i]), x + 196, y + 49, 44, INK, { align: 'right', pop: e < 1 ? e : null, step: 1 / 24 });
      if (act) { const u = CL.coil('ul' + p, [[x + 20, y + 76], [x + 194, y + 76]], PCOL[p], 10); CL.place(ctx, u, u.ox, u.oy, { shadow: { blur: 4, dx: 3, dy: 4, a: 0.4 } }); }
    });
  }
  function drawTray(lockedTo) {
    const t = S.turn, sel = t ? t.ammo : -1, boil = fr12() % 3;
    for (let i = 0; i < 5; i++) {
      const x = 34 + i * 84, y = 598, on = i === sel, dim = lockedTo != null && i !== lockedTo;
      CL.contact(ctx, x + 27, y + 60, 30, 7, 0.5);
      CL.place(ctx, ammo(i, on ? boil : 0), x, y - (on ? 14 : 0), { alpha: dim ? 0.45 : 1, shadow: { blur: 8, dx: 5, dy: 6, a: 0.4 } });
      if (on) { const u = CL.coil('selring' + i + t.player, [[x - 4, y + 52], [x + 58, y + 52]], PCOL[t.player], 8); CL.place(ctx, u, u.ox, u.oy, { shadow: false }); }
    }
    if (sel >= 0) cardAt(nameCard(sel), 462, 596, { pop: S.clock - S.selT });
  }
  const CTRL = {
    1: { short: 'P1:  W/S aim   A/D power   G change clay   F fire', learn: 'P1:  W/S aim   A/D power   F fire' },
    2: { short: 'P2:  ↑/↓ aim   ←/→ power   R-Shift change clay   Enter fire', learn: 'P2:  ↑/↓ aim   ←/→ power   Enter fire' },
  };
  function drawControls(both) {
    if (both) { lineAt(CTRL[1].learn, 26, TBL, 1250, 681, 'right'); lineAt(CTRL[2].learn, 26, TBL, 1250, 710, 'right'); }
    else if (S.turn) lineAt(CTRL[S.turn.player].short, 26, TBL, 1250, 704, 'right');
  }
  function drawTimer(t) {
    const n = Math.ceil(t.timer);
    for (let i = 0; i < t.timeMax; i++) {
      if (i >= n) continue;
      const warn = n <= 3, s = ball('tb' + (warn ? 'r' : t.player), 10, warn ? RED : PCOL[t.player], 0.4);
      const bob = warn && fr12() % 2 ? -3 : 0;
      CL.place(ctx, s, 24 + i * 28, 168 + bob, { shadow: { blur: 4, dx: 2, dy: 3, a: 0.4 } });
    }
  }
  const nameCard = (i) => CL.card('nm' + i, [{ t: POLY[i].name + ' (' + POLY[i].id + ')', px: 32, col: INK }], { padX: 18, padY: 8, col: '#fff7e6', seed: 9 });
  function selCard(i) { return CL.card('sel' + i, [{ t: POLY[i].name + ' (' + POLY[i].id + ')', px: 32, col: INK }], { icon: { spr: ammo(i, 0), w: 54, h: 54 }, padX: 16, padY: 10 }); }
  function drawBanner() {
    const b = S.banner; if (!b || (S.turn && S.turn.state === 'clear')) return;
    const a = S.clock - b.t0;
    if (S.mode === 'learn') cardAt(b.card, H.clamp(970 - b.card.w / 2, 690, 1262 - b.card.w), 80, { pop: a });
    else cardAt(b.card, 22, 166, { pop: a });
  }
  function drawHUD() {
    const t = S.turn;
    drawPlaques();
    if (S.mode === 'learn') {
      drawControls(true);
      drawTray(t ? t.ammo : null);
      if (S.learnStep === -1) {
        const a = S.stepT;
        CL.text(ctx, 'Clay Catapult', 640, 250, 96, CL.PAL, { align: 'center', pop: a, step: 1 / 12 });
        const c = CL.card('intro', [{ t: '5 thermosetting polymers', px: 40, col: INK }, { t: 'Learn which clay makes which product', px: 30, col: RUST }]);
        cardAt(c, 640 - c.w / 2, 300, { pop: a - 1.2 });
        return;
      }
      if (S.learnStep >= 5) {
        const a = S.clock - S.readyT;
        const c = CL.card('ready', [{ t: 'Practice done!', px: 44, col: INK }, { t: 'Ready for the TEST?', px: 36, col: RUST }, { t: 'Both players press fire (F / Enter)', px: 30, col: INK }]);
        cardAt(c, 640 - c.w / 2, 170, { pop: a });
        [1, 2].forEach((p) => { const r = S.ready[p - 1], c2 = tagCard('rd' + p + r, r ? 'P' + p + ' READY!' : 'P' + p + ': press ' + (p === 1 ? 'F' : 'Enter'), 36, r ? PINK[p] : INK, { col: r ? '#f2c14e' : '#fff7e6' }); cardAt(c2, 640 + (p === 1 ? -180 : 180) - c2.w / 2, 380, { pop: r ? S.clock - (S.readyAt?.[p] ?? 0) : null }); });
        return;
      }
      const k = S.learnStep, P = POLY[k];
      const card = CL.card('learn' + k, [{ t: P.name + ' (' + P.id + ')', px: 34, col: INK }, { t: P.lines[0], px: 28, col: INK }, { t: P.lines[1], px: 28, col: INK }, { t: P.uses, px: 28, col: RUST }], { icon: { spr: ammo(k, 0, true), w: 92, h: 92 }, padX: 18, padY: 14 });
      cardAt(card, 22, 96, { pop: S.stepT });
      if (t) {
        const pr = S.product;
        if (pr && (t.state === 'build' || t.state === 'aim' || t.state === 'flight')) {
          const tag = CL.card('tag' + k, [{ t: t.order.name, px: 32, col: INK }, { t: 'needs ' + P.name, px: 28, col: RUST }], { padX: 18, padY: 10, col: '#fff7e6', seed: 9 });
          cardAt(tag, H.clamp(pr.x - tag.w / 2, 700, W - tag.w - 10), pr.y - pr.h / 2 - tag.h - 24, { pop: S.clock - pr.popT - 0.3 });
        }
        if ((t.state === 'aim' || t.state === 'build') && !t.auto) {
          const pc = CL.card('prac' + t.player, [{ t: 'PLAYER ' + t.player + ': PRACTICE SHOT', px: 32, col: PINK[t.player] }, { t: t.player === 1 ? 'Aim with W/S + A/D, fire with F' : 'Aim with arrows, fire with Enter', px: 28, col: INK }], { padX: 18, padY: 10, col: '#fff7e6', seed: 9 });
          cardAt(pc, 1000 - pc.w / 2, 80, { pop: S.stepT - 0.6 });
        }
        if (t.auto && t.state === 'flight') { const d = tagCard('demo', 'Demo shot: watch!', 30, INK); cardAt(d, 1000 - d.w / 2, 80); }
      }
    } else if (S.mode === 'test' && t) {
      drawControls(false);
      drawTray(null);
      cardAt(tagCard('turn' + t.player, 'PLAYER ' + t.player + "'S TURN", 34, PINK[t.player]), 22, 96);
      const busy = t.state === 'result' || t.state === 'clear';
      if (t.state === 'aim' || t.state === 'build') drawTimer(t);
      const oc = CL.card('ord' + t.order.k, [{ t: 'ORDER: MAKE A...', px: 28, col: RUST }, { t: t.order.name, px: 42, col: INK }].concat(t.order.sub ? [{ t: '(' + t.order.sub + ')', px: 28, col: INK }] : []), { minW: 380, padY: 12 });
      cardAt(oc, H.clamp(750 - oc.w / 2, 500, 1010 - oc.w), 12, { pop: S.clock - (S.bodies[0] ? S.bodies[0].popT : 0) });
      if (double() && !busy) { const d = tagCard('dbl', 'DOUBLE POINTS!', 32, RUST, { col: '#f2c14e' }); cardAt(d, 760 - d.w / 2, 176); }
      if (S.notice && S.clock - S.notice.t0 < 3.5) { const n = tagCard('n' + S.notice.txt, S.notice.txt, 36, INK, { col: '#f2c14e' }); cardAt(n, 680 - n.w / 2, 250, { pop: S.clock - S.notice.t0 }); }
    }
    drawBanner();
  }

  function draw() {
    snapPoses();
    drawSet();
    drawArc();
    drawSling();
    drawProj();
    drawParts();
    drawHUD();
    CL.finish(ctx, W, HH, fr12());
  }

  // ---------------- boot + loop ----------------
  if (/debug=1/.test(location.search)) window.FLING = { S, solveAim, fire, POLY };
  let READY = false;
  const warm = [];
  function queueWarm() {
    POLY.forEach((p, i) => { [0, 1, 2].forEach((b) => warm.push(() => ammo(i, b))); warm.push(() => ammo(i, 0, true)); warm.push(() => splatS(i)); warm.push(() => nameCard(i)); });
    Object.keys(PRODUCTS).forEach((k) => warm.push(() => product(k)));
    Object.keys(BLK).forEach((k) => [0, 1, 2].forEach((c) => warm.push(() => block(k, c))));
    POLY.forEach((p, k) => warm.push(() => CL.card('learn' + k, [{ t: p.name + ' (' + p.id + ')', px: 34, col: INK }, { t: p.lines[0], px: 28, col: INK }, { t: p.lines[1], px: 28, col: INK }, { t: p.uses, px: 28, col: RUST }], { icon: { spr: ammo(k, 0, true), w: 92, h: 92 }, padX: 18, padY: 14 })));
    ORD.forEach((o) => warm.push(() => CL.card('ord' + o.k, [{ t: 'ORDER: MAKE A...', px: 28, col: RUST }, { t: o.name, px: 42, col: INK }].concat(o.sub ? [{ t: '(' + o.sub + ')', px: 28, col: INK }] : []), { minW: 380, padY: 12 })));
    [1, 2].forEach((p) => { warm.push(() => CL.line(CTRL[p].short, 26, TBL)); warm.push(() => CL.line(CTRL[p].learn, 26, TBL)); warm.push(() => CL.line('PLAYER ' + p + "'S TURN", 40, PCOL[p])); });
    warm.push(() => xMark()); warm.push(() => tick()); warm.push(() => star());
    '0123456789+-'.split('').forEach((ch) => warm.push(() => { CL.glyph(ch, 44, INK); CL.glyph(ch, 64, GREEN); CL.glyph(ch, 64, RED); }));
  }
  function bakeSome(ms) { const t0 = performance.now(); while (warm.length && performance.now() - t0 < ms) warm.shift()(); }

  GS.init({
    id: 4, title: 'Clay Catapult', mode: 'vs', learnSeconds: 90,
    controls: { p1: 'W/S aim · A/D power · G change clay · F fire', p2: '↑/↓ aim · ←/→ power · Right Shift change clay · Enter fire' },
    onRound() { startLearn(); },
    onPhase(ph, prev) {
      if (ph === 'learn' && S.mode !== 'learn') startLearn();
      else if (ph === 'play') startTest();
      else if (ph === 'idle') startAttract();
    },
  });
  resetAll('attract');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
    if (READY) {
      if (GS.phase === 'idle' && S.mode !== 'attract') startAttract();
      const live = GS.running || GS.phase === 'idle';
      if (live) {
        S.clock += dt;
        if (!S.turn && S.mode === 'attract') newDemoTurn();
        update(dt);
      }
      draw();
      bakeSome(4);
    } else {
      ctx.fillStyle = '#3f8593'; ctx.fillRect(0, 0, W, HH);
    }
    GS.endFrame();
    requestAnimationFrame(frame);
  }
  const fontsReady = Promise.race([document.fonts ? document.fonts.load(CL.FR(44), 'AaZz09').catch(() => {}) : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  fontsReady.then(() => { bakeBG(); queueWarm(); READY = true; });
  requestAnimationFrame(frame);
})();
