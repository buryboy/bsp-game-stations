// pixel.js — 16-Bit Pixel Odyssey toolkit for the game: a 320x180 low-res buffer blown up x4 nearest-neighbour,
// strict palette, Bayer/checker dither, SNES RPG windows, a built-in 5x7 bitmap font (so it stays pure pixels even
// when web fonts are blocked), cached parallax layers and the medium's own transitions (mosaic, battle swirl, fade).
(function () {
  'use strict';
  const LW = 320, LH = 180;
  const PX = (window.PX = { LW, LH });
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bay = (PX.bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)]);

  // colours are packed little-endian RGBA uint32 (0 = transparent in layers)
  const C = (PX.C = (h) => { const [r, g, b] = H.hex(h); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; });
  const unpack = (c) => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
  const pack = (r, g, b) => ((255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
  PX.mix = (a, b, k) => { const A = unpack(a), B = unpack(b); return pack(Math.round(A[0] + (B[0] - A[0]) * k), Math.round(A[1] + (B[1] - A[1]) * k), Math.round(A[2] + (B[2] - A[2]) * k)); };

  // master palette (reference CGRAM rows + a few greens/browns for the farm and the rig)
  const P = (PX.P = {
    sky: ['#140c34', '#1e1146', '#2c1658', '#43206a', '#632a78', '#8c357c', '#b8457a', '#e05c72', '#f6806a', '#ffaa6e', '#ffd28a'].map(C),
    star: C('#fff4d8'), starDim: C('#a88ac8'),
    sunHi: C('#fff6c2'), sunMid: C('#ffd27a'), sunLo: C('#ff9a5c'),
    cloud: C('#7a3478'), cloudLit: C('#e8687a'), cloudHot: C('#ffb08a'),
    mtFar: C('#6a3478'), mtFarLit: C('#b0507e'), mtNear: C('#3e1f5e'), mtNearLit: C('#7a3670'),
    bldBack: C('#2a1850'), bldBackLit: C('#4a2a6a'), bldFront: C('#170d30'), bldFrontLit: C('#38205a'),
    winY: C('#ffd27a'), winC: C('#6ef0ff'), winP: C('#ff6ab0'), winDim: C('#5a3a7a'),
    core: C('#c8fcff'), coreMid: C('#4ad8ff'), coreDeep: C('#1a78c8'),
    red: C('#ff3a4a'), redDk: C('#5a0814'),
    roof: C('#0c0820'), roofTop: C('#2a1a44'), roofRim: C('#d0607a'), roofMid: C('#1a1032'),
    K: C('#0a0618'), white: C('#f8f8ff'), grey: C('#9aa0c8'), gold: C('#ffd27a'), green: C('#6aff8a'), greenDk: C('#0a4a2a'), cyan: C('#6ef0ff'),
    steel: C('#5a5a8a'), steelLit: C('#9a9ac8'), steelDk: C('#2a2a4a'),
    sea: ['#1a1146', '#22175a', '#2c1e6a', '#3a2478'].map(C), seaLit: C('#b8457a'),
    leaf: C('#2e7a4a'), leafLit: C('#5ab85a'), leafHi: C('#a8e070'), leafDk: C('#1e4a3a'), soil: C('#3a2030'), soilLit: C('#5a3040'),
    corn: C('#ffd27a'), cornDk: C('#e8a030'), fire: C('#ff9a5c'), fireHi: C('#fff6c2'),
  });
  PX.WB = ['#4060d0', '#3450bc', '#2a42a6', '#22358e', '#1a2a78', '#142064'].map(C); // SNES window gradient

  // ---------------- target buffer ----------------
  const out = new Uint32Array(LW * LH);
  let T = out, TW = LW, TH = LH; // current draw target
  PX.out = out;
  PX.target = (arr, w, h) => { T = arr; TW = w; TH = h; };
  PX.reset = () => { T = out; TW = LW; TH = LH; };
  const put = (PX.put = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= TW || y >= TH) return; T[y * TW + x] = c; });
  PX.get = (x, y) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= TW || y >= TH) return 0; return T[y * TW + x]; };
  const dput = (PX.dput = (x, y, c1, c2, a) => put(x, y, a > bay(x, y) ? c2 : c1));
  const rect = (PX.rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); });
  PX.hline = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) put(x, y, c); };
  PX.vline = (x, y0, y1, c) => { for (let y = y0; y <= y1; y++) put(x, y, c); };
  // dither-shade an area towards a colour (a = amount)
  PX.tint = (x0, y0, w, h, c, a) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (a > bay(x, y)) put(x, y, c); };
  // sprite from strings
  const palCache = new Map();
  PX.sprite = (rows, pal, ox, oy, flip, scale = 1) => {
    let cp = palCache.get(pal); if (!cp) { cp = {}; for (const k in pal) cp[k] = typeof pal[k] === 'number' ? pal[k] : C(pal[k]); palCache.set(pal, cp); }
    for (let j = 0; j < rows.length; j++) { const row = rows[j]; for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch === '.') continue; const xx = flip ? row.length - 1 - i : i; const c = cp[ch]; if (scale === 1) put(ox + xx, oy + j, c); else for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) put(ox + xx * scale + a, oy + j * scale + b, c); } }
  };

  // ---------------- 5x7 bitmap font (caps, digits, punctuation; '>' is an arrow, '@' a tick) ----------------
  const G = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
    D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '01110 00100 00100 00100 00100 00100 01110',
    J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
    P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
    V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110', 2: '01110 10001 00001 00010 00100 01000 11111',
    3: '11111 00010 00100 00010 00001 10001 01110', 4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000', 8: '01110 10001 10001 01110 10001 10001 01110',
    9: '01110 10001 10001 01111 00001 00010 01100',
    ' ': '00000 00000 00000 00000 00000 00000 00000', '.': '00000 00000 00000 00000 00000 01100 01100', ',': '00000 00000 00000 00000 01100 00100 01000',
    '!': '00100 00100 00100 00100 00100 00000 00100', '?': '01110 10001 00001 00010 00100 00000 00100', ':': '00000 01100 01100 00000 01100 01100 00000',
    "'": '01100 00100 01000 00000 00000 00000 00000', '-': '00000 00000 00000 01110 00000 00000 00000', '+': '00000 00100 00100 11111 00100 00100 00000',
    '=': '00000 00000 11111 00000 11111 00000 00000', '(': '00010 00100 01000 01000 01000 00100 00010', ')': '01000 00100 00010 00010 00010 00100 01000',
    '/': '00001 00010 00010 00100 01000 01000 10000', '>': '00000 00100 00010 11111 00010 00100 00000', '<': '00000 00100 01000 11111 01000 00100 00000',
    '^': '00100 01110 10101 00100 00100 00100 00000', '_': '00000 00100 00100 00100 10101 01110 00100', '%': '11000 11001 00010 00100 01000 10011 00011',
    '*': '00000 00000 01110 01110 01110 00000 00000', '@': '00000 00001 00010 10100 01000 00000 00000', '&': '01100 10010 10100 01000 10101 10010 01101',
    '"': '01010 01010 00000 00000 00000 00000 00000', '#': '01010 11111 01010 01010 11111 01010 00000',
  };
  const GLYPH = {};
  for (const k in G) GLYPH[k] = G[k].split(' ').map((r) => parseInt(r, 2));
  PX.textW = (s, scale = 1) => (s.length ? s.length * 6 * scale - scale : 0);
  // text(str, x, y, col, shadow, scale, outline)
  PX.text = (str, x, y, col, shadow = P.K, scale = 1, outline = 0) => {
    str = String(str).toUpperCase();
    const pass = (dx, dy, c, spread) => {
      for (let n = 0; n < str.length; n++) {
        const g = GLYPH[str[n]] || GLYPH['?'], gx = x + n * 6 * scale;
        for (let j = 0; j < 7; j++) { const row = g[j]; if (!row) continue; for (let i = 0; i < 5; i++) if (row & (16 >> i)) {
          const px = gx + i * scale + dx, py = y + j * scale + dy;
          if (spread) { for (let oy = -1; oy <= scale; oy++) for (let ox = -1; ox <= scale; ox++) put(px + ox, py + oy, c); }
          else if (scale === 1) put(px, py, c); else rect(px, py, scale, scale, c);
        } }
      }
    };
    if (outline) pass(0, 0, outline, true);
    if (shadow) pass(scale > 1 ? 2 : 1, scale > 1 ? 2 : 1, shadow, false);
    pass(0, 0, col, false);
    return PX.textW(str, scale);
  };
  PX.textC = (str, cx, y, col, shadow, scale = 1, outline = 0) => PX.text(str, Math.round(cx - PX.textW(String(str), scale) / 2), y, col, shadow, scale, outline);

  // ---------------- SNES RPG window (gradient + dither seams, white/grey bevel, ink outline) ----------------
  PX.win = (x0, y0, w, h, grad = PX.WB) => {
    const WB = grad;
    for (let y = y0; y < y0 + h; y++) {
      const f = ((y - y0) / h) * (WB.length - 1), i = Math.min(WB.length - 2, Math.floor(f)), a = H.smooth(0.7, 1, f - i);
      for (let x = x0; x < x0 + w; x++) { if ((x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + h - 1)) continue; dput(x, y, WB[i], WB[i + 1], a); }
    }
    const { white, grey, K } = P;
    for (let x = x0 + 1; x < x0 + w - 1; x++) { put(x, y0, white); put(x, y0 + h - 1, white); put(x, y0 + 1, grey); put(x, y0 + h - 2, grey); put(x, y0 - 1, K); put(x, y0 + h, K); }
    for (let y = y0 + 1; y < y0 + h - 1; y++) { put(x0, y, white); put(x0 + w - 1, y, white); put(x0 + 1, y, grey); put(x0 + w - 2, y, grey); put(x0 - 1, y, K); put(x0 + w, y, K); }
    put(x0 + 1, y0 + 1, white); put(x0 + w - 2, y0 + 1, white); put(x0 + 1, y0 + h - 2, white); put(x0 + w - 2, y0 + h - 2, white);
  };
  PX.WGOLD = ['#a0603a', '#8a4a30', '#743a28', '#5e2c20', '#4a2018', '#381810'].map(C);
  PX.WGREEN = ['#2a8a5a', '#227a4e', '#1a6a42', '#145a38', '#0e4a2e', '#0a3a24'].map(C);
  PX.WRED = ['#c03048', '#a82a40', '#902438', '#781e30', '#601828', '#481220'].map(C);
  PX.WGREY = ['#5a5a7a', '#4e4e6c', '#42425e', '#363650', '#2a2a42', '#1e1e34'].map(C);
  // white speech bubble with a tail pointing down at tailX
  PX.bubble = (x0, y0, w, h, tailX) => {
    const { white, K } = P; rect(x0, y0, w, h, white);
    for (let x = x0; x < x0 + w; x++) { put(x, y0 - 1, K); put(x, y0 + h, K); }
    for (let y = y0; y < y0 + h; y++) { put(x0 - 1, y, K); put(x0 + w, y, K); }
    for (let k = 0; k < 4; k++) { for (let i = -k; i <= 0; i++) put(tailX + i + k, y0 + h + k, k === 3 ? K : white); put(tailX + k + 1, y0 + h + k, K); put(tailX - 1, y0 + h + k, K); }
  };
  PX.ARROW_R = ['KK.....', 'KYK....', 'KYYK...', 'KYYYK..', 'KYYYYK.', 'KYYYK..', 'KYYK...', 'KYK....', 'KK.....'];
  PX.ARROW_D = ['KKKKKKK', 'KWWWWWK', '.KWWWK.', '..KWK..', '...K...'];
  PX.PAL_ARROW = { K: '#0a0618', Y: '#ffd27a', W: '#ffd27a' };

  // ---------------- layers (cached, 0 = transparent) ----------------
  PX.layer = (w, h, fn) => { const a = new Uint32Array(w * h); PX.target(a, w, h); fn(w, h); PX.reset(); return { w, h, a }; };
  // blit a layer onto out: dx = horizontal scroll (wraps), dy = vertical offset (rise-in)
  PX.blit = (L, dx = 0, dy = 0) => {
    const a = L.a, w = L.w; dx = ((Math.round(dx) % w) + w) % w; dy = Math.round(dy);
    for (let y = 0; y < LH; y++) {
      const sy = y - dy; if (sy < 0 || sy >= L.h) continue;
      const row = sy * w, orow = y * LW;
      for (let x = 0; x < LW; x++) { let sx = x + dx; if (sx >= w) sx -= w; const c = a[row + sx]; if (c) out[orow + x] = c; }
    }
  };
  PX.copy = (L) => out.set(L.a);

  // ---------------- backdrop kit (from the reference) ----------------
  const nz = (PX.nz = H.makeNoise(77));
  PX.sky = (c0, c1, hz, y1 = LH) => {
    for (let y = 0; y < y1; y++) {
      const f = Math.pow(H.clamp(y / hz), 1.2) * 5, i = Math.min(4, Math.floor(f));
      const cA = PX.mix(c0, c1, i / 5), cB = PX.mix(c0, c1, Math.min(1, (i + 1) / 5));
      for (let x = 0; x < TW; x++) dput(x, y, cA, cB, H.smooth(0.6, 1, f - i));
    }
  };
  PX.skyBands = (bands, y0, y1) => { // reference hero sky: solid bands with narrow checker seams
    for (let y = y0; y < y1; y++) {
      const f = Math.pow(H.clamp((y - y0) / (y1 - y0)), 1.25) * (bands.length - 1), i = Math.min(bands.length - 2, Math.floor(f)), a = H.smooth(0.55, 1, f - i);
      for (let x = 0; x < TW; x++) dput(x, y, bands[i], bands[i + 1], a);
    }
  };
  PX.stars = (n, seed, yMax, tt) => { const r = H.rng(seed); for (let s = 0; s < n; s++) { const x = r.int(0, LW - 1), y = r.int(0, yMax), ph = r() * 6.28; if (tt == null || Math.sin(tt * 3 + ph) > -0.3) put(x, y, y < yMax * 0.45 ? P.star : P.starDim); } };
  // periodic rim-lit fbm mountains drawn into a wrap-around layer of width w
  PX.mountains = (w, base, amp, freq, seed, col, lit, yMax) => {
    const R = (w * freq) / (Math.PI * 2), hgt = [];
    for (let x = 0; x <= w + 1; x++) { const a = (x / w) * Math.PI * 2, u = Math.cos(a) * R, v = Math.sin(a) * R; hgt.push(Math.round(base - amp * (Math.abs(nz.fbm3(u, v, seed, 3)) * 1.6 + 0.35 * nz.n3(u * 3.1, v * 3.1, seed + 9)))); }
    for (let x = 0; x < w; x++) {
      const top = hgt[x], facing = hgt[x + 1] < hgt[x] ? 0 : 1;
      for (let y = Math.max(0, top); y < yMax; y++) { const d = y - top; if (d < 2 && facing) put(x, y, lit); else if (d < 5 && facing) dput(x, y, col, lit, 0.5 - d * 0.1); else put(x, y, col); }
    }
  };
  PX.cloud = (cx, cy, w, h, cDark = P.cloud, cLit = P.cloudLit, cHot = P.cloudHot) => {
    cx = Math.round(cx);
    for (let y = cy - h; y <= cy + h; y++) for (let x = cx - w; x <= cx + w; x++) {
      const dx = (x - cx) / w, dy = (y - cy) / h, lump = 1 + 0.25 * Math.sin(x * 0.35 + cx);
      if (dx * dx + (dy * dy) / lump > 1) continue;
      put(x, y, dy > 0.55 ? cHot : dy > 0.15 ? cLit : cDark);
    }
  };
  PX.sun = (sx, sy, sr, yCut = 999) => {
    for (let y = sy - sr; y <= Math.min(sy + sr, yCut); y++) {
      const ry = (y - (sy - sr)) / (2 * sr);
      if (y > sy - 4) { const k = y - (sy - 4), gap = 1 + Math.floor(k / 9); if ((k % 7) < gap) continue; }
      for (let x = sx - sr; x <= sx + sr; x++) {
        if ((x - sx) ** 2 + (y - sy) ** 2 > sr * sr) continue;
        put(x, y, ry < 0.45 ? (ry < 0.3 ? P.sunHi : (0.3 + 0.15 * bay(x, y) > ry ? P.sunHi : P.sunMid)) : (ry < 0.55 ? P.sunMid : (ry - 0.55) * 3 > bay(x, y) ? P.sunLo : P.sunMid));
      }
    }
  };
  PX.skyline = (seed, base, minH, maxH, col, lit, winA, winOn = 0.3, w = LW) => {
    const r = H.rng(seed); let bx = -6;
    while (bx < w) {
      const bw = r.int(9, 18), h = r.int(minH, maxH), top = base - h, rr = H.rng(seed * 31 + bw * 7 + h);
      rect(bx, top, bw, h, col); rect(bx, top, bw, 1, lit); for (let y = top; y < base; y++) put(bx + bw - 1, y, lit);
      if (rr.chance(0.35)) { const ah = rr.int(2, 6); for (let k = 1; k <= ah; k++) put(bx + (bw >> 1), top - k, col); }
      const wc = rr.pick(winA);
      for (let wy = top + 2; wy < base - 1; wy += 2) for (let wx = bx + 1; wx < bx + bw - 2; wx += 2) if (rr() < winOn) put(wx, wy, wc);
      bx += bw + r.int(0, 3);
    }
  };
  // haze band where far layers meet (atmospheric depth)
  PX.haze = (yc, half, a0, col = P.cloudLit) => {
    for (let y = yc - half; y < yc + half; y++) { const a = a0 * (1 - Math.abs(y - yc) / half); for (let x = 0; x < LW; x++) if (a > bay(x, y)) { const i = y * LW + x, c = out[i], u = unpack(c); if (u[0] + u[1] + u[2] < 260) out[i] = PX.mix(c, col, 0.35); } }
  };

  // ---------------- finishing passes / transitions on the out buffer ----------------
  PX.mosaic = (n) => {
    if (n <= 1) return;
    for (let by = 0; by < LH; by += n) for (let bx = 0; bx < LW; bx += n) {
      const c = out[Math.min(LH - 1, by + (n >> 1)) * LW + Math.min(LW - 1, bx + (n >> 1))];
      for (let y = by; y < Math.min(LH, by + n); y++) for (let x = bx; x < Math.min(LW, bx + n); x++) out[y * LW + x] = c;
    }
  };
  const tmp = new Uint32Array(LW * LH);
  PX.swirl = (k, tt) => { // wavy battle-swirl: rows slide and wash towards white
    tmp.set(out);
    for (let y = 0; y < LH; y++) {
      const off = Math.round(Math.sin(y * 0.25 + tt * 30) * k * 40);
      for (let x = 0; x < LW; x++) { const sx = (((x + off) % LW) + LW) % LW, u = unpack(tmp[y * LW + sx]); out[y * LW + x] = pack(u[0] + (255 - u[0]) * k * 0.6, u[1] + (255 - u[1]) * k * 0.6, u[2] + (255 - u[2]) * k * 0.6); }
    }
  };
  PX.bright = (lvl) => { // SNES master brightness, 16 steps (lvl 0..15)
    if (lvl >= 15) return; const f = lvl / 15;
    for (let i = 0; i < out.length; i++) { const u = unpack(out[i]); out[i] = pack(u[0] * f, u[1] * f, u[2] * f); }
  };
  PX.flash = (r, g, b) => { for (let i = 0; i < out.length; i++) { const u = unpack(out[i]); out[i] = pack(Math.min(255, u[0] + r), Math.min(255, u[1] + g), Math.min(255, u[2] + b)); } };
  PX.iris = (cx, cy, R) => { for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) out[y * LW + x] = P.K; };

  // ---------------- present: low-res buffer -> 1280x720 canvas, x4 nearest neighbour ----------------
  let lc, lx, img;
  PX.present = (ctx) => {
    if (!lc) { lc = document.createElement('canvas'); lc.width = LW; lc.height = LH; lx = lc.getContext('2d'); img = lx.createImageData(LW, LH); }
    new Uint32Array(img.data.buffer).set(out);
    lx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(lc, 0, 0, 1280, 720);
  };
})();
