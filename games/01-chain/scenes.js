// scenes.js — the five quest zones, the ready screen and the test arena, painted once into cached layers
// (sky, two wrap-around parallax mountain layers, a static foreground) plus small per-frame animated details.
(function () {
  'use strict';
  const { LW, LH, P, C, put, dput, rect, text, textC, win, bay } = PX;
  const hl = PX.hline, vl = PX.vline;
  const SC = (window.SCENES = {});
  const MW = 640; // parallax layer width (wraps)

  // ---------- shared sprites ----------
  // ethene monomer: two carbon atoms with a double bond, four hydrogens (drawn centred on cx, cy)
  SC.ethene = (cx, cy, glow) => {
    const Cc = C('#8a8ab8'), Cl = C('#e8e8ff'), Cd = C('#4a4a7a'), Hh = P.white, Hs = C('#b8c0e0'), B = C('#e8e8ff'), K = P.K;
    if (glow) { for (let y = cy - 8; y <= cy + 8; y++) for (let x = cx - 13; x <= cx + 13; x++) { const d = ((x - cx) / 13) ** 2 + ((y - cy) / 8) ** 2; if (d < 1 && (d > 0.7 ? 0.6 * glow : 0.22) > bay(x, y)) put(x, y, d > 0.7 ? P.gold : C('#4a2a8a')); } }
    const ball = (x0, y0, r, body, hi, dk) => { for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) { const d = Math.hypot(x, y); if (d <= r + 0.9 && d > r - 0.1) put(x0 + x, y0 + y, K); } for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y); if (d <= r - 0.1) put(x0 + x, y0 + y, x + y < -r * 0.6 ? hi : x + y > r * 0.8 ? dk : body); } };
    // C-H bonds
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { put(cx + sx * 7, cy + sy * 2, B); put(cx + sx * 8, cy + sy * 3, B); }
    // double bond C=C
    rect(cx - 2, cy - 2, 5, 5, K); PX.hline(cx - 2, cx + 2, cy - 1, B); PX.hline(cx - 2, cx + 2, cy + 1, B);
    ball(cx - 5, cy, 2, Cc, Cl, Cd); ball(cx + 5, cy, 2, Cc, Cl, Cd);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ball(cx + sx * 10, cy + sy * 4, 1, Hh, Hh, Hs);
  };
  SC.BARREL = ['.KKKKKKK.', 'KbBBBBBbK', 'KYYYYYYYK', 'KbBBBBBbK', 'KbBWWBBbK', 'KbBBBBBbK', 'KYYYYYYYK', 'KbBBBBBbK', '.KKKKKKK.'];
  SC.PAL_BARREL = { K: '#0a0618', B: '#2a2a4a', b: '#5a5a8a', Y: '#ffd27a', W: '#6a6a9a' };
  SC.FLASK = ['...KKK...', '...KwK...', '...KwK...', '..KwwwK..', '.KYYYYYK.', 'KOOOOOOOK', 'KRRRRRRRK', 'KrrrrrrrK', '.KKKKKKK.'];
  SC.PAL_FLASK = { K: '#0a0618', w: '#c8fcff', Y: '#fff6c2', O: '#ffd27a', R: '#ff9a5c', r: '#a0603a' };
  SC.CORN = ['...KK....', '..KLLK...', '.KLYYK...', 'KLYyYYK..', 'KLYYyYK..', 'KLYyYYLK.', '.KYYyYLK.', '.KLYYYLK.', '..KLYLLK.', '...KLLK..', '....KK...'];
  SC.PAL_CORN = { K: '#0a0618', L: '#5ab85a', Y: '#ffd27a', y: '#e8a030' };
  SC.POLY = ['...KKKKKK...', '..KWWWWWWK..', '.KWWWWWWWWK.', '.KWSSSSSSWK.', 'KKGGGKKGGGKK', 'KGccGKKGccGK', '.KGGGSSGGGK.', '.KSSSSSSSSK.', '..KSSKKSSK..', '...KSSSSK...', '..KLLWWLLK..', '.KLLLWWLLLK.'];
  SC.PAL_POLY = { K: '#0a0618', W: '#e8eef8', S: '#ffc8a0', G: '#3a6ad8', c: '#6ef0ff', L: '#f8f8ff' };

  // a small label window (SNES name tag)
  SC.tag = (label, cx, y, col = P.white) => { const ls = label.split('\n'), w = Math.max(...ls.map((l) => PX.textW(l))) + 8, x = Math.round(cx - w / 2); win(x, y, w, 3 + ls.length * 9); ls.forEach((l, i) => PX.textC(l, cx, y + 3 + i * 9, col, P.K)); };

  const sunLit = (base) => base;
  const mts = (base, amp, freq, seed, col, lit, yMax) => PX.layer(MW, LH, () => PX.mountains(MW, base, amp, freq, seed, col, lit, yMax));

  // ---------- ZONE: OIL RIG (dusk sea) ----------
  function rig() {
    const sky = PX.layer(LW, LH, () => {
      PX.sky(C('#140c34'), C('#e05c72'), 92, 92); PX.stars(50, 3, 50);
      PX.sun(258, 84, 20, 91);
      // sea bands with dither seams + sun reflection column
      PX.skyBands(P.sea.concat([C('#140c34')]), 92, LH);
      for (let y = 92; y < LH; y++) for (let x = 0; x < LW; x++) {
        const k = (y - 92) / 88, hw = 22 + k * 30;
        if (Math.abs(x - 258) < hw && ((y + (x >> 3)) % 3 === 0) && (1 - k) * 0.9 > bay(x, y)) put(x, y, y < 120 ? P.sunLo : P.seaLit);
      }
      hl(0, LW, 92, P.cloudLit);
    });
    const far = mts(92, 14, 0.02, 3.3, P.mtFar, P.mtFarLit, 92);
    const near = mts(94, 6, 0.04, 8.1, P.mtNear, P.mtNearLit, 93);
    const fg = PX.layer(LW, LH, () => {
      const S = P.steelDk, L = P.steelLit, M = P.steel, K = P.K;
      // legs into the sea (lattice)
      [196, 214, 276, 294].forEach((lx) => { rect(lx, 74, 4, 70, S); vl(lx + 3, 74, 143, M); for (let y = 80; y < 140; y += 10) { for (let k = 0; k < 10; k++) put(lx + 4 + k * 1.8, y + k, S); } });
      for (let x = 196; x < 298; x++) { put(x, 110, S); put(x, 111, M); }
      // deck
      rect(186, 64, 120, 10, C('#3a2a5a')); hl(186, 305, 64, L); hl(186, 305, 73, K); for (let x = 188; x < 304; x += 6) rect(x, 67, 3, 4, C('#2a1a44'));
      // living quarters with lit windows
      rect(270, 46, 34, 18, C('#4a2a6a')); hl(270, 303, 46, C('#8a5a9a')); for (let x = 273; x < 300; x += 5) rect(x, 51, 3, 3, P.winY); for (let x = 273; x < 300; x += 5) rect(x, 57, 3, 3, (x % 2) ? P.winC : P.winY);
      // helipad
      rect(272, 42, 32, 3, C('#2a1a44')); hl(272, 303, 42, L);
      // derrick tower (lattice triangle)
      for (let y = 14; y < 64; y++) { const k = (y - 14) / 50, hw = Math.round(3 + k * 14); put(232 - hw, y, M); put(232 + hw, y, L); if (y % 6 === 0) hl(232 - hw, 232 + hw, y, S); if (y % 6 < 6) { const t = (y % 6) / 6; put(Math.round(232 - hw + t * hw * 2), y, S); } }
      rect(229, 10, 7, 4, M); hl(229, 235, 10, L);
      // drill pipe going down into the sea bed
      for (let y = 64; y < 178; y++) { put(232, y, C('#8a8ab8')); put(233, y, S); }
      // crane arm
      for (let k = 0; k < 34; k++) { put(206 - k, 44 + k * 0.5, M); put(206 - k, 45 + k * 0.5, S); } vl(206, 44, 63, M);
      // flare stack
      for (let y = 30; y < 64; y++) { put(198 + (64 - y) * 0.25, y, M); put(199 + (64 - y) * 0.25, y, S); }
      // sea foam at legs
      [196, 214, 276, 294, 232].forEach((lx) => { hl(lx - 2, lx + 5, 112, P.white); hl(lx - 1, lx + 4, 113, P.grey); });
    });
    const anim = (tt) => {
      // flare flame (2-frame flicker)
      const f = Math.floor(tt * 8) % 2, fx = 207, fy = 28;
      for (let j = 0; j < 8; j++) for (let i = -3; i <= 3; i++) { const w = 3 - j * 0.35 + (f ? 0.6 : 0); if (Math.abs(i) <= w) put(fx + i + ((j + f) % 2), fy - j, j < 2 ? P.fireHi : j < 5 ? P.fire : P.red); }
      // wave glints sliding
      for (let k = 0; k < 18; k++) { const y = 96 + (k * 11) % 80, x = ((k * 53 + Math.floor(tt * (6 + k % 4))) % 340) - 10; hl(x, x + 4 + (k % 3), y, k % 2 ? P.seaLit : P.grey); }
      // blinking beacon
      if (Math.sin(tt * 4) > 0) put(232, 9, P.red);
    };
    return { sky, far, near, fg, anim, clouds: [[40, 34, 30, 2], [170, 22, 22, 2], [110, 62, 34, 2]], tags: [['OIL RIG', 246, 28]] };
  }

  // ---------- ZONE: REFINERY (night) ----------
  function refinery() {
    const sky = PX.layer(LW, LH, () => { PX.sky(C('#0c0a2a'), C('#632a78'), 120); PX.stars(60, 8, 60); });
    const far = mts(100, 22, 0.02, 3.3, P.mtFar, P.mtFarLit, 120);
    const near = PX.layer(MW, LH, () => { PX.skyline(77, 122, 6, 28, P.bldBack, P.bldBackLit, [P.winY, P.winY, P.winC, P.winP], 0.25, MW); });
    const fg = PX.layer(LW, LH, () => {
      // yard ground
      for (let y = 120; y < LH; y++) for (let x = 0; x < LW; x++) dput(x, y, C('#1c1244'), C('#120a30'), (y - 120) / 60 + ((x % 32) < 1 ? 0.5 : 0));
      hl(0, LW, 120, C('#5a3a9a'));
      // storage tanks
      [[20, 100, 26], [52, 106, 18]].forEach(([x, y, w]) => { rect(x, y, w, 120 - y, C('#2e1e5e')); vl(x + w - 1, y, 119, C('#6a4aa8')); hl(x, x + w - 1, y, C('#6a4aa8')); for (let yy = y + 4; yy < 120; yy += 5) hl(x, x + w - 1, yy, C('#24184e')); });
      // distillation column: tall cylinder with trays, lit on the right
      const x0 = 228, x1 = 252;
      for (let y = 22; y < 120; y++) for (let x = x0; x <= x1; x++) { const k = (x - x0) / (x1 - x0); put(x, y, k > 0.82 ? C('#9a8ac8') : k > 0.6 ? C('#5a4a8a') : k > 0.3 ? C('#3e2e6e') : C('#2a1a54')); }
      for (let x = x0 + 2; x <= x1 - 2; x++) { put(x, 20, C('#5a4a8a')); put(x, 19, C('#9a8ac8')); }
      for (let y = 30; y < 118; y += 12) { hl(x0, x1, y, P.K); hl(x0, x1, y + 1, C('#6a5a9a')); }
      vl(x0 - 1, 20, 119, P.K); vl(x1 + 1, 20, 119, P.K);
      // fraction pipes out of the side at different heights (hot heavy at bottom, light at top)
      const FR = [[32, C('#fff6c2')], [50, C('#ffd27a')], [68, C('#ff9a5c')], [86, C('#d0607a')], [104, C('#8a4a30')]];
      FR.forEach(([y, c]) => { rect(x1 + 2, y, 44, 4, C('#3a2a5a')); hl(x1 + 2, x1 + 45, y, C('#8a7ab8')); hl(x1 + 2, x1 + 45, y + 3, P.K); rect(x1 + 46, y - 2, 6, 8, c); rect(x1 + 47, y - 1, 4, 6, c); vl(x1 + 52, y - 2, y + 5, P.K); });
      // crude oil inlet pipe from the left, low down
      rect(150, 108, 78, 4, C('#2a2a4a')); hl(150, 227, 108, C('#8a8ab8')); hl(150, 227, 111, P.K);
      // furnace box under the inlet
      rect(196, 112, 26, 8, C('#3a1a2a')); hl(196, 221, 112, C('#a0603a'));
    });
    const anim = (tt) => {
      const f = Math.floor(tt * 8) % 2; for (let i = 0; i < 6; i++) { const x = 199 + i * 4, h = 2 + ((i + f) % 3); for (let j = 0; j < h; j++) put(x, 118 - j, j ? P.fire : P.fireHi); }
      // little drops moving along the fraction pipes
      [32, 50, 68, 86, 104].forEach((y, i) => { const x = 254 + ((Math.floor(tt * 12) + i * 7) % 44); put(x, y + 1, P.gold); put(x, y + 2, P.gold); });
      // oil blobs along the inlet
      for (let k = 0; k < 4; k++) { const x = 150 + ((Math.floor(tt * 14) + k * 20) % 78); rect(x, 109, 2, 2, C('#0a0618')); }
    };
    return { sky, far, near, fg, anim, clouds: [[60, 40, 30, 2], [230, 56, 36, 2]], tags: [['FRACTIONAL\nDISTILLATION', 182, 70], ['LIGHT', 286, 22], ['HEAVY', 286, 112]] };
  }

  // ---------- ZONE: CRACKER ----------
  function cracker() {
    const sky = PX.layer(LW, LH, () => { PX.sky(C('#1a0c3a'), C('#b8457a'), 110); PX.stars(30, 5, 40); });
    const far = mts(98, 26, 0.016, 5.7, P.mtFar, P.mtFarLit, 124);
    const near = mts(110, 14, 0.028, 2.2, P.mtNear, P.mtNearLit, 124);
    const fg = PX.layer(LW, LH, () => {
      for (let y = 120; y < LH; y++) { const dz = 30 / (y - 106), band = Math.floor(dz) & 1; for (let x = 0; x < LW; x++) put(x, y, band ? C('#3e1f5e') : C('#4c2468')); }
      hl(0, LW, 120, C('#24103e'));
      // furnace (the cracker) with a window of fire, catalyst chamber on top, chimney
      rect(200, 62, 70, 58, C('#2e1650')); hl(200, 269, 62, C('#9a4a86')); vl(269, 62, 119, C('#9a4a86')); vl(199, 62, 119, P.K);
      for (let y = 66; y < 118; y += 6) for (let x = 204; x < 266; x += 8) put(x + ((y / 6) % 2) * 4, y, C('#24103e'));
      rect(210, 88, 40, 22, P.K); // firebox
      // catalyst chamber (cyan pellet grid)
      rect(214, 42, 32, 20, C('#22358e')); hl(214, 245, 42, C('#6ef0ff')); vl(245, 42, 61, C('#4ad8ff')); vl(213, 42, 61, P.K);
      for (let y = 46; y < 60; y += 3) for (let x = 217; x < 243; x += 3) put(x, y, (x + y) % 2 ? P.coreMid : P.core);
      // chimney
      rect(256, 24, 8, 38, C('#3a1a4a')); vl(263, 24, 61, C('#7a3670')); hl(255, 264, 24, C('#9a4a86'));
      // input pipe (heavy fraction) from the left
      rect(120, 96, 80, 5, C('#2a2a4a')); hl(120, 199, 96, C('#8a8ab8')); hl(120, 199, 100, P.K);
      // output pipe (small molecules) from the top to the right
      rect(246, 48, 50, 4, C('#2a2a4a')); hl(246, 295, 48, C('#8a8ab8')); hl(246, 295, 51, P.K); rect(296, 48, 4, 72, C('#2a2a4a')); vl(299, 48, 119, C('#8a8ab8'));
    });
    const anim = (tt) => {
      const f = Math.floor(tt * 10);
      for (let i = 0; i < 9; i++) { const x = 212 + i * 4, h = 6 + ((i * 3 + f) % 5) * 2; for (let j = 0; j < h; j++) put(x + ((j + f + i) % 2), 108 - j, j < 3 ? P.fireHi : j < h - 3 ? P.fire : P.red); }
      // smoke puffs rising from the chimney (whole-pixel steps)
      for (let k = 0; k < 4; k++) { const ph = ((tt * 0.6 + k * 0.25) % 1), y = 22 - Math.floor(ph * 20), x = 259 + Math.floor(ph * 8), r = 2 + Math.floor(ph * 3); for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r && (1 - ph) > bay(x + xx, y + yy)) put(x + xx, y + yy, P.grey); }
      // heavy blobs in, tiny molecules out
      for (let k = 0; k < 4; k++) { const x = 120 + ((Math.floor(tt * 16) + k * 20) % 80); rect(x, 97, 3, 3, C('#8a4a30')); }
      for (let k = 0; k < 5; k++) { const x = 246 + ((Math.floor(tt * 20) + k * 10) % 50); put(x, 49, P.white); put(x + 1, 50, P.white); }
    };
    return { sky, far, near, fg, anim, clouds: [[20, 30, 34, 2], [200, 20, 28, 2], [120, 74, 40, 2]], tags: [['CRACKER', 235, 126 - 14], ['HEAT', 230, 74], ['CATALYST', 230, 30]] };
  }

  // ---------- ZONE: MONOMER FIELD (night meadow) ----------
  function field() {
    const sky = PX.layer(LW, LH, () => { PX.sky(C('#0c0a2a'), C('#e05c72'), 150); PX.stars(70, 11, 70); });
    const far = mts(92, 24, 0.018, 3.3, P.mtFar, P.mtFarLit, 132);
    const near = mts(104, 12, 0.03, 8.1, P.mtNear, P.mtNearLit, 132);
    const fg = PX.layer(LW, LH, () => {
      const hillA = C('#2e1650'), hillB = C('#43206a'), hillLit = C('#9a4a86');
      for (let x = 0; x < LW; x++) { const top = Math.round(110 + 5 * PX.nz.n2(x * 0.025, 4.4) + 2 * Math.sin(x * 0.07)); for (let y = top; y < LH; y++) { const d = y - top; put(x, y, d < 1 ? hillLit : d < 3 ? (0.5 > bay(x, y) ? hillLit : hillB) : (((y + 1) >> 1) % 3 === 0 && 0.5 > bay(x, y)) ? hillB : hillA); } }
      // grass tufts
      const r = H.rng(5); for (let k = 0; k < 60; k++) { const x = r.int(0, LW), y = r.int(118, 178); put(x, y, C('#6a3a8a')); put(x + 1, y - 1, C('#9a4a86')); put(x + 2, y, C('#6a3a8a')); }
    });
    const anim = (tt) => { // fireflies
      for (let k = 0; k < 10; k++) { const x = (k * 37 + Math.round(Math.sin(tt * 0.7 + k) * 10)) % LW, y = 60 + (k * 23) % 60 + Math.round(Math.sin(tt * 1.3 + k * 2) * 3); if (Math.sin(tt * 3 + k) > 0) put(x, y, P.gold); }
    };
    return { sky, far, near, fg, anim, clouds: [[80, 136, 40, 2], [260, 128, 30, 2], [180, 40, 30, 2]], tags: [['MONOMER FIELD', 270, 112]] };
  }

  // ---------- ZONE: BIOPOLYMER FARM (sunrise) ----------
  function farm() {
    const sky = PX.layer(LW, LH, () => { PX.skyBands(P.sky.slice(3), 0, 104); rect(0, 104, LW, 76, P.sky[10]); PX.sun(60, 98, 22, 103); });
    const far = mts(104, 20, 0.018, 1.7, C('#8c357c'), C('#f6806a'), 140);
    const near = PX.layer(MW, LH, () => {
      // green rolling hills (renewable land)
      for (let x = 0; x < MW; x++) { const a = (x / MW) * Math.PI * 2, top = Math.round(108 + 6 * PX.nz.n3(Math.cos(a) * 3, Math.sin(a) * 3, 2.2)); for (let y = top; y < 140; y++) { const d = y - top; put(x, y, d < 1 ? P.leafHi : d < 3 ? (0.5 > bay(x, y) ? P.leafHi : P.leafLit) : P.leaf); } }
    });
    const fg = PX.layer(LW, LH, () => {
      for (let y = 124; y < LH; y++) for (let x = 0; x < LW; x++) put(x, y, ((y >> 2) % 2) ? P.soil : P.soilLit);
      hl(0, LW, 124, P.leafDk);
      // corn rows along the back and the right side
      const stalk = (x, base, h) => { vl(x, base - h, base, P.leafDk); vl(x + 1, base - h, base, P.leaf); for (let k = 4; k < h; k += 6) { const s = (k / 6) % 2 ? 1 : -1; for (let i = 1; i < 5; i++) put(x + (s > 0 ? 1 + i : -i), base - k - Math.floor(i / 2), P.leafLit); } rect(x + 2, base - h + 6, 2, 5, P.corn); put(x + 2, base - h + 6, P.cornDk); };
      for (let x = 4; x < LW; x += 9) stalk(x, 124, 18 + (x * 7) % 6);
      for (let x = 250; x < LW; x += 8) stalk(x, 104 + (x % 3), 24);
      // barn
      rect(258, 66, 38, 34, C('#a02838')); for (let y = 68; y < 100; y += 3) hl(258, 295, y, C('#801e2e')); for (let k = 0; k < 20; k++) { hl(258 + k, 295 - k, 66 - k * 0.6, C('#601828')); } rect(270, 82, 14, 18, C('#3a1020')); hl(258, 295, 66, P.white);
    });
    const anim = (tt) => { const f = Math.floor(tt * 3) % 2; for (let x = 4; x < 250; x += 18) put(x + 5 + f, 106 - (x % 4), P.leafHi); };
    return { sky, far, near, fg, anim, clouds: [[120, 30, 34, 2, 1], [230, 48, 26, 2, 1], [40, 60, 30, 2, 1]], tags: [['BIOPOLYMER FARM', 140, 112]] };
  }

  // ---------- TEST ARENA: the polymer plant yard ----------
  function arena() {
    const sky = PX.layer(LW, LH, () => {
      PX.sky(C('#140c34'), C('#e05c72'), 30, 24); PX.stars(30, 4, 14);
      PX.mountains(LW, 22, 8, 0.03, 8.1, P.mtNear, P.mtNearLit, 24);
      // floor tiles (2x2 cells) with checker dither and lit edges
      for (let y = 24; y < 168; y++) for (let x = 0; x < LW; x++) {
        const tx = x >> 4, ty = (y - 24) >> 4, odd = (tx + ty) & 1, ix = x & 15, iy = (y - 24) & 15;
        let c = odd ? C('#1c1244') : C('#22145a');
        if (ix === 0 || iy === 0) c = C('#2e1e5e'); else if (ix === 15 || iy === 15) c = C('#120a30');
        else if (((x + y) & 7) === 0 && (y & 1)) c = C('#2a1a64');
        put(x, y, c);
      }
      // rivets
      for (let y = 24; y < 168; y += 16) for (let x = 0; x < LW; x += 16) put(x + 1, y + 1, C('#5a3a9a'));
      // walls: pipe frame
      for (let x = 0; x < LW; x++) { put(x, 23, P.roofRim); put(x, 22, P.K); }
      // bottom HUD bar
      rect(0, 168, LW, 12, P.roof); hl(0, LW, 168, P.roofRim); hl(0, LW, 169, P.roofTop);
    });
    return { sky, anim: () => {}, clouds: [], tags: [] };
  }

  // ---------- READY: quest complete (dusk city) ----------
  function ready() {
    const sky = PX.layer(LW, LH, () => {
      PX.sky(C('#0c0a2a'), C('#e05c72'), 180); PX.stars(40, 8, 80);
      PX.mountains(LW, 152, 22, 0.018, 3.3, P.mtFar, P.mtFarLit, LH);
      PX.mountains(LW, 162, 14, 0.03, 8.1, P.mtNear, P.mtNearLit, LH);
    });
    return { sky, anim: () => {}, clouds: [[80, 136, 40, 2], [260, 128, 30, 2]], tags: [] };
  }

  const builders = { rig, refinery, cracker, field, farm, arena, ready };
  const cache = {};
  SC.get = (name) => cache[name] || (cache[name] = builders[name]());
  SC.preload = () => Object.keys(builders).forEach(SC.get);

  // draw a scene: rise = 0..1 progress of the rise-in (parallax layers rise into place in whole-pixel steps)
  SC.draw = (name, tt, riseT = 9) => {
    const s = SC.get(name);
    PX.copy(s.sky);
    const rise = (a, b, d) => Math.round((1 - H.ease.out(H.clamp((riseT - a) / (b - a)))) * d);
    s.clouds.forEach(([x, y, w, h, light], i) => {
      const cx = ((x + tt * (2 + i * 0.4)) % 380) - 30;
      if (light) PX.cloud(cx, y, w, h, C('#f6806a'), C('#ffaa6e'), C('#ffd28a')); else PX.cloud(cx, y, w, h);
    });
    if (s.far) PX.blit(s.far, Math.floor(tt * 2), rise(0, 0.5, 40));
    if (s.near) PX.blit(s.near, Math.floor(tt * 4), rise(0.1, 0.6, 50));
    if (s.far && name !== 'farm') PX.haze(name === 'rig' ? 90 : 112, 7, 0.3);
    if (s.fg) PX.blit(s.fg, 0, rise(0.2, 0.75, 70));
    if (riseT > 0.75) { s.anim(tt); s.tags.forEach(([l, x, y]) => SC.tag(l, x, y, P.gold)); }
  };
})();
