// POW! Polymer Blocks — station 6 (stock forms, additives & finishes). Halftone Pop Panel style.
(() => {
  'use strict';
  const W = 1280, HH = 720;
  const C = { red: '#e2231a', blue: '#1f5fbf', yellow: '#ffd51f', black: '#141210', white: '#fbf6ea' };
  const FONT = (px) => `400 ${px}px Bangers, Impact, "Arial Narrow", "DejaVu Sans Condensed", sans-serif`;
  const E = H.ease, cl = H.clamp, seg = (t, a, b) => cl((t - a) / (b - a));
  const ST = window.STICKERS, ORD = window.ORDERS, CATS = window.CATS;

  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, W, HH);
  const colL = H.layer(W, HH), c = colL.getContext('2d');
  const keyL = H.layer(W, HH), k = keyL.getContext('2d');

  // ---------------- style helpers (from the reference) ----------------
  const benday = (x, color, s, r, x0, y0, x1, y1, seed, rgain) => {
    const rr = H.rng(seed);
    x.fillStyle = color; x.beginPath();
    for (let j = 0, y = y0; y < y1 + s; j++, y += s * 0.5) {
      const off = (j & 1) ? s * 0.5 : 0;
      for (let xx = x0 + off; xx < x1 + s; xx += s) {
        const g = rgain ? rgain(xx, y) : 1;
        const rad = r * g * (1 + (rr() - 0.5) * 0.08);
        if (rad < 0.4) continue;
        const px = xx + (rr() - 0.5) * 0.6, py = y + (rr() - 0.5) * 0.6;
        x.moveTo(px + rad, py); x.arc(px, py, rad, 0, Math.PI * 2);
      }
    }
    x.fill();
  };
  const burstPath = (x, cx, cy, r, n, seed) => { const rr = H.rng(seed); x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, R = i % 2 ? r * rr.range(0.6, 0.72) : r * rr.range(0.92, 1.12); x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); } x.closePath(); };
  const burst = (cx, cy, r, sc, fill, seed, n = 14) => {
    if (sc <= 0) return;
    c.fillStyle = fill; burstPath(c, cx, cy, r * sc, n, seed); c.fill();
    k.fillStyle = '#fff'; burstPath(k, cx, cy, r * sc, n, seed); k.fill();
    k.lineWidth = 7; k.strokeStyle = C.black; k.lineJoin = 'miter'; burstPath(k, cx, cy, r * sc, n, seed); k.stroke();
    k.save(); k.translate(4, 3); k.lineWidth = 3; burstPath(k, cx, cy, r * sc, n, seed); k.stroke(); k.restore(); k.lineJoin = 'round';
  };
  const say = (txt, size, x, y, sc = 1, align = 'center', rot = 0, color = C.black) => {
    if (sc <= 0) return;
    const x_ = color === '#fff' ? c : k; // white ink can only live on the colour plate (key is multiplied)
    x_.save(); x_.translate(x, y); x_.rotate(rot); x_.scale(sc, sc); x_.fillStyle = color; x_.font = FONT(size); x_.letterSpacing = '1.5px'; x_.textAlign = align; x_.textBaseline = 'middle'; x_.fillText(txt, 0, 0); x_.letterSpacing = '0px'; x_.restore();
  };
  const sayK = (txt, size, x, y, sc = 1, align = 'center', rot = 0, halo = 10, color = C.black) => {
    if (sc <= 0) return;
    const inv = color === '#fff';
    for (const x_ of inv ? [c] : [c, k]) {
      x_.save(); x_.translate(x, y); x_.rotate(rot); x_.scale(sc, sc); x_.font = FONT(size); x_.letterSpacing = '1.5px'; x_.textAlign = align; x_.textBaseline = 'middle';
      x_.lineJoin = 'round'; x_.lineWidth = halo; x_.strokeStyle = inv ? C.black : C.white; x_.strokeText(txt, 0, 0); x_.letterSpacing = '0px'; x_.restore();
    }
    say(txt, size, x, y, sc, align, rot, color);
  };
  const popIn = (t, t0) => (t < t0 ? 0 : 1 + 0.3 * (1 - E.out(seg(t, t0, t0 + 0.16))) * (t - t0 < 0.16 ? 1 : 0));
  const fatArrow = (p0, cp, p1, u, w, fill) => {
    if (u <= 0) return;
    const q = (s) => [(1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * cp[0] + s * s * p1[0], (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * cp[1] + s * s * p1[1]];
    const N = 20, L = [], R = [], end = u * 0.86;
    for (let i = 0; i <= N; i++) { const s = (i / N) * end, a = q(s), b = q(Math.min(1, s + 0.01)); let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const ww = w * (0.6 + 0.4 * (i / N)) / 2; L.push([a[0] - dy * ww, a[1] + dx * ww]); R.push([a[0] + dy * ww, a[1] - dx * ww]); }
    const e = q(end), tip = q(Math.min(1, end + 0.14)); let dx = tip[0] - e[0], dy = tip[1] - e[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const hw = w * 1.1;
    const path = (x) => { x.beginPath(); x.moveTo(L[0][0], L[0][1]); L.forEach((p) => x.lineTo(p[0], p[1])); x.lineTo(e[0] - dy * hw, e[1] + dx * hw); x.lineTo(tip[0], tip[1]); x.lineTo(e[0] + dy * hw, e[1] - dx * hw); for (let i = R.length - 1; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); };
    c.fillStyle = fill; path(c); c.fill(); k.fillStyle = '#fff'; path(k); k.fill(); k.lineWidth = 6; k.strokeStyle = C.black; k.lineJoin = 'round'; path(k); k.stroke();
  };
  const rrect = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
  // comic caption box (flat fill, fat outline), text on key plate
  const box = (X, Y, w, h, fill, txt, size, txtCol = C.black, dx = 0) => {
    c.fillStyle = fill; c.fillRect(X + dx, Y, w, h);
    k.fillStyle = '#fff'; k.fillRect(X + dx, Y, w, h);
    k.lineWidth = 5; k.strokeStyle = C.black; k.strokeRect(X + dx, Y, w, h);
    if (txt) { const s = fitSize(txt, size, w - 20); say(txt, s, X + dx + 10, Y + h / 2 + 2, 1, 'left', 0, txtCol); }
  };
  // speech balloon: rounded body + wedge tail to (tx,ty) from base point (bx,by)
  const balloon = (X, Y, w, h, sc, tail, fill = C.white) => {
    if (sc <= 0) return;
    const cx = X + w / 2, cy = Y + h / 2, r = Math.min(46, h * 0.42);
    for (const x of [c, k]) { x.save(); x.translate(cx, cy); x.scale(sc, sc); x.translate(-cx, -cy); }
    const tailP = (x) => { if (!tail) return false; const [bx, by, tx, ty, hw] = tail; const a = Math.atan2(ty - by, tx - bx) + Math.PI / 2, ww = hw || 16; x.beginPath(); x.moveTo(bx + Math.cos(a) * ww, by + Math.sin(a) * ww); x.lineTo(tx, ty); x.lineTo(bx - Math.cos(a) * ww, by - Math.sin(a) * ww); x.closePath(); return true; };
    c.fillStyle = fill; rrect(c, X, Y, w, h, r); c.fill(); if (tailP(c)) c.fill();
    k.lineWidth = 6; k.strokeStyle = C.black; k.lineJoin = 'round';
    if (tailP(k)) k.stroke();
    k.fillStyle = '#fff'; rrect(k, X, Y, w, h, r); k.fill();
    k.lineWidth = 7; rrect(k, X, Y, w, h, r); k.stroke();
    k.save(); k.translate(3, 3); k.lineWidth = 3; rrect(k, X, Y, w, h, r); k.stroke(); k.restore();
    for (const x of [c, k]) x.restore();
  };
  const fitSize = (txt, size, maxW) => { k.font = FONT(size); k.letterSpacing = '1.5px'; const w = k.measureText(txt).width + txt.length * 1.6; k.letterSpacing = '0px'; return w > maxW ? Math.max(12, Math.floor(size * maxW / w)) : size; };
  const wrapCache = new Map();
  const wrap = (txt, size, maxW) => {
    const key = txt + '|' + size + '|' + maxW + '|' + fontStamp;
    if (wrapCache.has(key)) return wrapCache.get(key);
    k.font = FONT(size); k.letterSpacing = '1.5px';
    const words = txt.split(' '), lines = []; let cur = '';
    for (const wd of words) { const tryL = cur ? cur + ' ' + wd : wd; if (k.measureText(tryL).width + tryL.length * 1.6 > maxW && cur) { lines.push(cur); cur = wd; } else cur = tryL; }
    if (cur) lines.push(cur); k.letterSpacing = '0px';
    wrapCache.set(key, lines); return lines;
  };
  // draw a wrapped block centred at cx, starting at cy (centre of block); shrinks font to fit maxLines
  const block = (txt, size, cx, cy, maxW, maxLines, color = C.black, lh = 1.12, sc = 1) => {
    let s = size, lines = wrap(txt, s, maxW);
    while (lines.length > maxLines && s > 18) { s -= 2; lines = wrap(txt, s, maxW); }
    const n = lines.length, h = s * lh;
    lines.forEach((ln, i) => { const fs = fitSize(ln, s, maxW); say(ln, fs, cx, cy + (i - (n - 1) / 2) * h, sc, 'center', 0, color); });
    return n * h;
  };
  let fontStamp = 0;

  // ---------------- pieces (SRS) ----------------
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]], S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  };
  const KINDS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const BLOCKS = KINDS.map((nm) => {
    const m = SHAPES[nm], n = m.length; let b = [];
    for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (m[r][q]) b.push([q, r]);
    const rots = [b];
    for (let i = 1; i < 4; i++) { b = b.map(([x, y]) => [n - 1 - y, x]); rots.push(b); }
    return rots;
  });
  const STICK_BLOCK = [2, 1, 1, 0, 1, 1, 1]; // which block carries the sticker (a central-ish one)
  const K_JLSTZ = [[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]];
  const K_I = [[[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]];
  const COLS = 10, ROWS = 22, HID = 2, CS = 28;
  const WELL_Y = 128;

  // ---------------- sprites (cached) ----------------
  // fills: I blue, J white+blue dots, L yellow+blue dots, O yellow, S yellow+red dots, T red, Z white+red dots, junk white+black dots
  const KFILL = [[C.blue], [C.white, C.blue], [C.yellow, C.blue], [C.yellow], [C.yellow, C.red], [C.red], [C.white, C.red], [C.white, C.black]];
  const SP = CS + 8;
  const cellCol = [], cellKey = [];
  function makeSprites() {
    KFILL.forEach(([f, d], i) => {
      const a = H.layer(SP, SP), x = a.getContext('2d');
      x.fillStyle = f; x.fillRect(4, 4, CS, CS);
      if (d) { x.save(); x.beginPath(); x.rect(4, 4, CS, CS); x.clip(); benday(x, d, 7, d === C.black ? 1.9 : 2.5, 2, 2, SP, SP, 11 + i); x.restore(); }
      // white glint (colour plate)
      x.fillStyle = C.white; x.beginPath(); x.moveTo(8, 9); x.quadraticCurveTo(9, 7.5, 18, 8); x.lineTo(17, 10.5); x.quadraticCurveTo(11, 10.5, 10.5, 16); x.lineTo(8, 17); x.closePath(); x.fill();
      cellCol.push(a);
      const b = H.layer(SP, SP), y = b.getContext('2d');
      y.fillStyle = C.black; y.strokeStyle = C.black; y.lineJoin = 'round';
      // hard black shadow band, bottom-right (Lichtenstein chrome shading)
      y.beginPath(); y.moveTo(4 + CS, 8); y.lineTo(4 + CS, 4 + CS); y.lineTo(8, 4 + CS); y.lineTo(10, CS - 1); y.quadraticCurveTo(CS - 2, CS, CS - 1, 10); y.closePath(); y.fill();
      y.lineWidth = 3.4; y.beginPath(); y.roundRect(4, 4, CS, CS, 3); y.stroke();
      y.lineWidth = 1.4; y.beginPath(); y.roundRect(5.5, 5.2, CS - 1, CS - 1, 3); y.stroke();
      cellKey.push(b);
    });
  }
  const badgeCol = [], badgeKey = [];
  function makeBadges() {
    badgeCol.length = 0; badgeKey.length = 0;
    ST.forEach((s, i) => {
      const n = 40, a = H.layer(n, n), x = a.getContext('2d'), b = H.layer(n, n), y = b.getContext('2d');
      x.fillStyle = C.white; burstPath(x, 20, 20, 17, 9, 70 + i); x.fill();
      x.fillStyle = CATS[s.cat].col; x.beginPath(); x.arc(20, 20, 10, 0, 7); x.fill();
      y.fillStyle = '#fff'; burstPath(y, 20, 20, 17, 9, 70 + i); y.fill();
      y.lineWidth = 2.6; y.strokeStyle = C.black; y.lineJoin = 'miter'; burstPath(y, 20, 20, 17, 9, 70 + i); y.stroke();
      y.lineWidth = 2; y.beginPath(); y.arc(20, 20, 10, 0, 7); y.stroke();
      y.fillStyle = s.cat === 2 ? C.black : '#fff'; y.font = FONT(13); y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillText(s.code, 20, 21);
      badgeCol.push(a); badgeKey.push(b);
    });
  }

  // ---------------- static backdrop (cached) ----------------
  const PX = [12, 648], PW = 620;
  let bgCol = null, bgKey = null, paperImg = null;
  const wellX = (p) => PX[p.i] + 16, colX = (p) => PX[p.i] + 312;
  function makeBackdrop() {
    bgCol = H.layer(W, HH); bgKey = H.layer(W, HH);
    const a = bgCol.getContext('2d'), b = bgKey.getContext('2d');
    a.fillStyle = C.white; a.fillRect(0, 0, W, HH);
    // top strip: a little Ben-Day under the title
    a.save(); a.beginPath(); a.rect(0, 0, W, 62); a.clip(); benday(a, C.red, 14, 3.2, -10, -10, W, 70, 2, (x, y) => 0.25 + 0.6 * H.smooth(700, 1280, x)); a.restore();
    for (let i = 0; i < 2; i++) {
      const x0 = PX[i], y0 = 66, h = 644;
      a.save(); a.beginPath(); a.rect(x0, y0, PW, h); a.clip();
      if (i === 0) { a.fillStyle = C.white; a.fillRect(x0, y0, PW, h); benday(a, C.blue, 17, 5.2, x0 - 10, y0 - 10, x0 + PW + 10, y0 + h + 10, 3, (x, y) => 0.45 + 0.55 * H.smooth(0, 900, (x - x0) * 0.6 + (y - y0))); }
      else { a.fillStyle = C.yellow; a.fillRect(x0, y0, PW, h); benday(a, C.red, 18, 5.4, x0 - 10, y0 - 10, x0 + PW + 10, y0 + h + 10, 5, (x, y) => 0.35 + 0.65 * H.smooth(200, 900, Math.hypot(x - (x0 + PW), y - (y0 + h)))); }
      a.restore();
      // well
      const wx = x0 + 16, wy = WELL_Y, ww = COLS * CS, wh = (ROWS - HID) * CS;
      a.fillStyle = C.white; a.fillRect(wx, wy, ww, wh);
      a.save(); a.beginPath(); a.rect(wx, wy, ww, wh); a.clip();
      benday(a, i ? C.red : C.blue, 14, 1.5, wx, wy, wx + ww, wy + wh, 9 + i, (x, y) => 0.6 + 0.4 * H.smooth(wy, wy + wh, y)); a.restore();
      // faint column guides on key plate
      b.strokeStyle = 'rgba(20,18,16,0.10)'; b.lineWidth = 1;
      for (let q = 1; q < COLS; q++) { b.beginPath(); b.moveTo(wx + q * CS + 0.5, wy); b.lineTo(wx + q * CS + 0.5, wy + wh); b.stroke(); }
      b.strokeStyle = C.black; b.lineJoin = 'round';
      b.lineWidth = 8; b.strokeRect(wx - 4, wy - 4, ww + 8, wh + 8);
      b.save(); b.translate(3, 3); b.lineWidth = 3; b.strokeRect(wx - 4, wy - 4, ww + 8, wh + 8); b.restore();
      // panel border
      b.lineWidth = 9; b.strokeRect(x0, y0, PW, h);
      // NEXT box
      const cx0 = x0 + 312;
      a.fillStyle = C.white; a.fillRect(cx0, 496, 128, 120);
      b.lineWidth = 5; b.strokeRect(cx0, 496, 128, 120);
    }
    // title caption
    a.fillStyle = C.yellow; a.fillRect(12, 8, 650, 48); b.lineWidth = 5; b.strokeStyle = C.black; b.strokeRect(12, 8, 650, 48);
    b.fillStyle = C.black; b.textBaseline = 'middle'; b.textAlign = 'left'; b.letterSpacing = '2px';
    b.font = FONT(fitSizeOn(b, 'POW! POLYMER BLOCKS  ·  STOCK FORMS, ADDITIVES & FINISHES', 30, 626));
    b.fillText('POW! POLYMER BLOCKS  ·  STOCK FORMS, ADDITIVES & FINISHES', 24, 34); b.letterSpacing = '0px';
    // paper ageing (from reference paperAge), baked into a multiply image
    if (!paperImg) {
      const nz = H.makeNoise(41), LW = 160, LH = 90;
      const lo = H.layer(LW, LH), lx = lo.getContext('2d'), li = lx.createImageData(LW, LH);
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) { const i = (y * LW + x) * 4; li.data[i] = 128 + 127 * nz.fbm2(x * 0.06, y * 0.06, 3); li.data[i + 3] = 255; }
      lx.putImageData(li, 0, 0);
      paperImg = H.layer(W, HH); const px = paperImg.getContext('2d'); px.drawImage(lo, 0, 0, W, HH);
      const id = px.getImageData(0, 0, W, HH), d = id.data, r = H.rng(5);
      for (let y = 0, p = 0; y < HH; y++) for (let x = 0; x < W; x++, p += 4) {
        const n = (d[p] - 128) / 128, g = r() - 0.5, ex = Math.min(x, W - x, y, HH - y);
        const age = 1 - 0.06 * (1 - H.smooth(0, 160, ex)) - 0.025 * n;
        d[p] = 255 * Math.min(1, age * (1 + g * 0.05)); d[p + 1] = 255 * Math.min(1, (age - 0.01) * (1 + g * 0.05)); d[p + 2] = 255 * Math.min(1, (age - 0.045) * (1 + g * 0.06)); d[p + 3] = 255;
      }
      px.putImageData(id, 0, 0);
    }
  }
  function fitSizeOn(x, txt, size, maxW) { x.font = FONT(size); const w = x.measureText(txt).width + txt.length * 2.2; return w > maxW ? Math.floor(size * maxW / w) : size; }

  // ---------------- game state ----------------
  let gt = 0, mode = 'idle', playStartT = 0, learnT = 0;
  const players = [mkPlayer(0), mkPlayer(1)];
  const gfx = []; // cross-panel effects (junk arrows)
  function mkPlayer(i) { return { i, grid: [], piece: null, bag: [], next: 0, score: 0 }; }
  function emptyGrid() { const g = []; for (let r = 0; r < ROWS; r++) g.push(new Array(COLS).fill(null)); return g; }
  function resetPlayer(p, m) {
    p.grid = emptyGrid(); p.piece = null; p.bag = []; p.next = drawBag(p);
    p.fallT = 0; p.lockT = 0; p.lockMoves = 0; p.das = 0; p.dasDir = 0; p.clearing = null; p.spawnDelay = 0.3;
    p.pending = 0; p.score = 0; p.fx = []; p.caption = null; p.shake = 0; p.shakeT0 = -9;
    p.learnIdx = 0; p.card = -1; p.cardT0 = -9; p.cardShown = 0; p.ready = false; p.allLearnt = false;
    p.order = -1; p.orderT0 = gt; p.orderN = 0; p.sinceCorrect = 0; p.pows = 0;
    p.ai = { plan: null, t: 0 };
    p.lastSticker = -1;
    if (m !== 'learn') newOrder(p);
  }
  function drawBag(p) { if (!p.bag.length) { p.bag = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [p.bag[i], p.bag[j]] = [p.bag[j], p.bag[i]]; } } return p.bag.pop(); }
  function newOrder(p) {
    const prevA = p.order >= 0 ? ORD[p.order].a : -1; let o;
    do { o = (Math.random() * ORD.length) | 0; } while (ORD[o].a === prevA);
    p.order = o; p.orderT0 = gt; p.orderN++; p.sinceCorrect = 0;
  }
  const opp = (p) => players[1 - p.i];
  const progress = () => (mode === 'play' ? cl((GS.t - playStartT) / Math.max(30, GS.R - playStartT)) : 0);
  const finalStretch = () => mode === 'play' && GS.timeLeft() <= 45;
  const gravity = () => (mode === 'learn' ? 0.36 : mode === 'idle' ? 0.22 : H.lerp(0.62, 0.12, Math.pow(progress(), 0.85)));
  const speedLevel = () => 1 + Math.floor(progress() * 8.99);
  function pushScore() { GS.score(players[0].score, players[1].score); }
  function addScore(p, n) { if (mode !== 'play') return; p.score = Math.max(0, p.score + n); pushScore(); }

  // ---------------- piece logic ----------------
  const blocksOf = (pc) => BLOCKS[pc.k][pc.rot];
  function fits(p, k_, rot, x, y) {
    for (const [bx, by] of BLOCKS[k_][rot]) { const gx = x + bx, gy = y + by; if (gx < 0 || gx >= COLS || gy >= ROWS) return false; if (gy >= 0 && p.grid[gy][gx]) return false; }
    return true;
  }
  function pickSticker(p) {
    if (mode === 'learn') {
      if (p.learnIdx >= LEARN_SEQ.length) return Math.random() < 0.5 ? LEARN_SEQ[(Math.random() * LEARN_SEQ.length) | 0] : -1;
      if (p.card >= 0 && gt - p.cardT0 < 4.5) return -1; // give the last card time to be read
      return LEARN_SEQ[p.learnIdx++];
    }
    const pr = progress();
    if (Math.random() > 0.45 + 0.15 * pr) return -1;
    const ans = ORD[p.order].a;
    p.sinceCorrect++;
    if (p.sinceCorrect >= 4 || Math.random() < 0.36) { p.sinceCorrect = 0; return ans; }
    let pool = ST.map((s, i) => i).filter((i) => i !== ans);
    if (Math.random() < 0.55) { const same = pool.filter((i) => ST[i].cat === ST[ans].cat); if (same.length) pool = same; }
    let s; do { s = pool[(Math.random() * pool.length) | 0]; } while (s === p.lastSticker && pool.length > 1);
    return s;
  }
  function spawn(p) {
    const kk = p.next; p.next = drawBag(p);
    const pc = { k: kk, rot: 0, x: kk === 3 ? 4 : 3, y: HID - 1, sticker: -1 };
    pc.sticker = pickSticker(p);
    if (pc.sticker >= 0) { p.lastSticker = pc.sticker; p.card = pc.sticker; p.cardT0 = gt; if (mode === 'learn') p.allLearnt = p.learnIdx >= LEARN_SEQ.length; GS.sfx('pop', { f: 520, gain: 0.5 }); }
    p.fallT = 0; p.lockT = 0; p.lockMoves = 0; p.ai.plan = null;
    if (!fits(p, pc.k, pc.rot, pc.x, pc.y)) { topOut(p); return; }
    p.piece = pc;
  }
  function topOut(p) {
    p.grid = emptyGrid(); p.piece = null; p.spawnDelay = 0.6; p.pending = 0;
    addScore(p, -20);
    addFx(p, { kind: 'burst', x: wellX(p) + 140, y: 400, r: 120, fill: C.red, text: 'KA-BOOM!', sub: mode === 'play' ? 'STACK TOPPED OUT  −20' : 'STACK RESET', dur: 1.4, seed: 91 });
    shake(p, 0.5); GS.sfx('impact', { gain: 0.9 });
  }
  function tryMove(p, dx, dy) {
    const pc = p.piece; if (!pc) return false;
    if (fits(p, pc.k, pc.rot, pc.x + dx, pc.y + dy)) { pc.x += dx; pc.y += dy; if (dx && grounded(p)) bumpLock(p); return true; }
    return false;
  }
  const grounded = (p) => !fits(p, p.piece.k, p.piece.rot, p.piece.x, p.piece.y + 1);
  function bumpLock(p) { if (p.lockMoves < 15) { p.lockT = 0; p.lockMoves++; } }
  function rotate(p) {
    const pc = p.piece; if (!pc || pc.k === 3) return;
    const nr = (pc.rot + 1) % 4, kicks = (pc.k === 0 ? K_I : K_JLSTZ)[pc.rot];
    for (const [dx, dy] of kicks) {
      if (fits(p, pc.k, nr, pc.x + dx, pc.y - dy)) { pc.x += dx; pc.y -= dy; pc.rot = nr; if (grounded(p)) bumpLock(p); GS.sfx('click', { f: 1500, gain: 0.6 }); return; }
    }
  }
  function ghostY(p) { const pc = p.piece; let y = pc.y; while (fits(p, pc.k, pc.rot, pc.x, y + 1)) y++; return y; }
  function hardDrop(p) {
    const pc = p.piece; const gy = ghostY(p); const dist = gy - pc.y;
    addFx(p, { kind: 'drop', x0: pc.x, y0: pc.y, y1: gy, k: pc.k, rot: pc.rot, dur: 0.22 });
    pc.y = gy; lock(p, true, dist);
  }
  function peel(p) {
    const pc = p.piece; if (!pc || pc.sticker < 0) return;
    const s = pc.sticker; pc.sticker = -1;
    const [bx, by] = blocksOf(pc)[STICK_BLOCK[pc.k]];
    addFx(p, { kind: 'peel', s, x: wellX(p) + (pc.x + bx) * CS + CS / 2, y: WELL_Y + (pc.y + by - HID) * CS + CS / 2, dur: 0.9 });
    GS.sfx('paper', { dur: 0.25, gain: 0.8 });
    if (mode === 'play') {
      const ans = ORD[p.order].a;
      if (s === ans) {
        addScore(p, -10); shake(p, 0.3); GS.sfx('error', { gain: 0.8 });
        setCaption(p, 'red', ['OOPS! THE ORDER NEEDED', ST[ans].name], 2.8);
        addFx(p, { kind: 'float', text: '−10', x: wellX(p) + 140, y: 300, col: C.red });
      } else {
        addScore(p, 5); GS.sfx('swish', { gain: 0.8 });
        addFx(p, { kind: 'float', text: 'GOOD CALL! +5', x: wellX(p) + 140, y: 300, col: C.blue });
      }
    } else addFx(p, { kind: 'float', text: 'PEELED!', x: wellX(p) + 140, y: 300, col: C.blue });
  }
  function lock(p, hard, dist) {
    const pc = p.piece; p.piece = null;
    const sb = STICK_BLOCK[pc.k];
    blocksOf(pc).forEach(([bx, by], i) => { const gy = pc.y + by, gx = pc.x + bx; if (gy >= 0) p.grid[gy][gx] = { k: pc.k, s: i === sb ? pc.sticker : -1 }; });
    if (blocksOf(pc).every(([, by]) => pc.y + by < HID)) { topOut(p); return; }
    GS.sfx(hard ? 'stamp' : 'thud', { gain: hard ? 0.55 : 0.35, f: 150 });
    if (hard && dist > 2) shake(p, 0.12);
    const rows = [];
    for (let r = 0; r < ROWS; r++) if (p.grid[r].every((x) => x)) rows.push(r);
    if (rows.length) { p.clearing = { rows, t: 0 }; evaluate(p, rows); }
    else { applyJunk(p); p.spawnDelay = 0.04; }
  }
  const CLEAR_T = 0.34;
  function evaluate(p, rows) {
    const n = rows.length, wx = wellX(p), cy = Math.max(WELL_Y + 150, Math.min(WELL_Y + 310, WELL_Y + ((rows[0] + rows[n - 1]) / 2 - HID) * CS + CS / 2));
    const st = []; rows.forEach((r) => p.grid[r].forEach((x) => x && x.s >= 0 && st.push(x.s)));
    const base = [0, 10, 30, 60, 100][n];
    const words = ['', 'POP!', 'BAM!', 'ZAP!', 'KA-POW!'];
    addScore(p, base);
    let junkOut = n === 4 && mode === 'play' ? 1 : 0;
    let match = 0; const wrong = [];
    if (mode === 'play') { const ans = ORD[p.order].a; st.forEach((s) => (s === ans ? match++ : wrong.push(s))); }
    if (match) {
      const pts = 50 * match * (finalStretch() ? 2 : 1);
      addScore(p, pts); p.pows++;
      const ans = ORD[p.order].a;
      addFx(p, { kind: 'burst', x: wx + 140, y: cy, r: 128, fill: C.red, text: 'POW!', sub: '+' + (pts + base), dur: 1.3, seed: 31 + p.pows, big: true });
      addFx(p, { kind: 'tag', text: ST[ans].name + ' ✓', x: wx + 140, y: cy + 104, dur: 1.6 });
      junkOut += 2;
      GS.sfx('impact', { gain: 1 }); GS.sfx('success', { f: 'C5', gain: 0.6 });
      shake(p, 0.35);
      newOrder(p);
    } else {
      addFx(p, { kind: 'burst', x: wx + 140, y: cy, r: 64 + n * 14, fill: n === 4 ? C.red : C.yellow, text: words[n], sub: mode === 'play' ? '+' + base : '', dur: 0.9, seed: 7 + n + (gt * 10 | 0) });
      GS.sfx('thud', { f: 160 + n * 30, gain: 0.7 }); GS.sfx('pop', { f: 300 + n * 80, gain: 0.6 });
    }
    if (junkOut) sendJunk(p, junkOut);
    if (mode === 'learn' && st.length) addFx(p, { kind: 'tag', text: ST[st[0]].name + '!', x: wx + 140, y: cy + 74, dur: 1.4 });
    if (wrong.length) {
      const ans = ORD[p.order].a, pen = 10 * wrong.length; // order unchanged when only wrong ones
      addScore(p, -pen); shake(p, 0.45);
      setCaption(p, 'red', match ? ['ALSO A WRONG STICKER  −' + pen] : ['WRONG STICKER!  −' + pen, 'THE ORDER NEEDED:', ST[ans].name], 3.2);
      addFx(p, { kind: 'burst', x: wx + 210, y: cy - 60, r: 70, fill: C.blue, text: 'WRONG!', sub: '', dur: 1.0, seed: 55, wrong: true });
      GS.sfx('error', { gain: 0.9 }); GS.sfx('buzz', { f: 92, dur: 0.3, gain: 0.7 });
    }
  }
  function finishClear(p) {
    const rows = p.clearing.rows; p.clearing = null;
    p.grid = p.grid.filter((_, r) => !rows.includes(r));
    while (p.grid.length < ROWS) p.grid.unshift(new Array(COLS).fill(null));
    applyJunk(p); p.spawnDelay = 0.05;
  }
  function sendJunk(p, n) {
    const o = opp(p); o.pending = Math.min(8, o.pending + n);
    gfx.push({ kind: 'junkArrow', from: p.i, t0: gt, dur: 0.9, n });
    GS.sfx('whoosh', { dur: 0.4, gain: 0.6, pan: p.i ? -0.5 : 0.5 });
  }
  function applyJunk(p) {
    if (!p.pending) return;
    const n = p.pending; p.pending = 0;
    const hole = (Math.random() * COLS) | 0;
    for (let i = 0; i < n; i++) { p.grid.shift(); const row = new Array(COLS).fill(null).map((_, q) => (q === hole ? null : { k: 7, s: -1 })); p.grid.push(row); }
    addFx(p, { kind: 'burst', x: wellX(p) + 140, y: WELL_Y + 300, r: 62, fill: C.white, text: 'JUNK!', sub: '+' + n + ' LINE' + (n > 1 ? 'S' : ''), dur: 1.0, seed: 3 });
    GS.sfx('press', { gain: 0.8 }); shake(p, 0.25);
    if (p.grid.slice(0, HID).some((r) => r.some((x) => x))) topOut(p);
  }
  function shake(p, d) { p.shake = Math.max(p.shake, d); p.shakeT0 = gt; }
  function addFx(p, f) { f.t0 = gt; f.dur = f.dur || 1.2; p.fx.push(f); if (p.fx.length > 16) p.fx.shift(); }
  function setCaption(p, tone, lines, dur) { p.caption = { tone, lines, t0: gt, dur }; }

  // ---------------- input / update ----------------
  function controls(p) {
    const n = p.i + 1;
    return { left: GS.held(n, 'left'), right: GS.held(n, 'right'), lHit: GS.hit(n, 'left'), rHit: GS.hit(n, 'right'), rot: GS.hit(n, 'up'), soft: GS.held(n, 'down'), hard: GS.hit(n, 'a'), peel: GS.hit(n, 'b') };
  }
  function update(p, dt, ct) {
    if (p.shake > 0) p.shake = Math.max(0, p.shake - dt);
    if (p.caption && gt > p.caption.t0 + p.caption.dur) p.caption = null;
    if (mode === 'learn' && ct.peel && p.allLearnt && !(p.piece && p.piece.sticker >= 0)) { if (!p.ready) { p.ready = true; GS.sfx('ding', { f: 'E5', gain: 0.5 }); } }
    if (p.clearing) { p.clearing.t += dt; if (p.clearing.t >= CLEAR_T) finishClear(p); return; }
    if (!p.piece) { p.spawnDelay -= dt; if (p.spawnDelay <= 0) spawn(p); return; }
    if (ct.peel) peel(p);
    if (ct.rot) rotate(p);
    if (ct.lHit) { if (tryMove(p, -1, 0)) GS.sfx('tick', { gain: 0.4 }); p.dasDir = -1; p.das = 0; }
    if (ct.rHit) { if (tryMove(p, 1, 0)) GS.sfx('tick', { gain: 0.4 }); p.dasDir = 1; p.das = 0; }
    const hd = p.dasDir < 0 ? ct.left : p.dasDir > 0 ? ct.right : false;
    if (hd) { p.das += dt; while (p.das > 0.16) { tryMove(p, p.dasDir, 0); p.das -= 0.045; } }
    else { p.dasDir = ct.left ? -1 : ct.right ? 1 : 0; p.das = 0; }
    if (ct.hard) { hardDrop(p); return; }
    const g = ct.soft ? Math.min(gravity(), 0.035) : gravity();
    if (!grounded(p)) {
      p.fallT += dt;
      while (p.fallT >= g) { p.fallT -= g; if (!tryMove(p, 0, 1)) break; }
      p.lockT = 0;
    } else {
      p.fallT = 0; p.lockT += dt;
      if (p.lockT >= (ct.soft ? 0.25 : 0.5) || p.lockMoves >= 15) lock(p, false, 0);
    }
  }
  // attract-mode bot
  function evalGrid(g) {
    let agg = 0, holes = 0, bump = 0, lines = 0, prevH = -1;
    for (let r = 0; r < ROWS; r++) if (g[r].every((x) => x)) lines++;
    for (let q = 0; q < COLS; q++) {
      let h = 0, seen = false;
      for (let r = 0; r < ROWS; r++) { if (g[r][q]) { if (!seen) { h = ROWS - r; seen = true; } } else if (seen) holes++; }
      agg += h; if (prevH >= 0) bump += Math.abs(h - prevH); prevH = h;
    }
    return -0.51 * agg + 0.76 * lines - 0.36 * holes * 2 - 0.18 * bump;
  }
  function aiPlan(p) {
    const pc = p.piece; let best = null;
    for (let rot = 0; rot < 4; rot++) for (let x = -2; x < COLS; x++) {
      if (!fits(p, pc.k, rot, x, pc.y)) continue;
      let y = pc.y; while (fits(p, pc.k, rot, x, y + 1)) y++;
      const g = p.grid.map((r) => r.slice()); BLOCKS[pc.k][rot].forEach(([bx, by]) => { if (y + by >= 0) g[y + by][x + bx] = 1; });
      const s = evalGrid(g) + Math.random() * 0.3;
      if (!best || s > best.s) best = { s, rot, x };
    }
    return best;
  }
  function aiControls(p, dt) {
    const ct = { left: false, right: false, lHit: false, rHit: false, rot: false, soft: false, hard: false, peel: false };
    const pc = p.piece; if (!pc || p.clearing) return ct;
    if (!p.ai.plan) { p.ai.plan = aiPlan(p); p.ai.t = 0.25; }
    p.ai.t -= dt; if (p.ai.t > 0) return ct; p.ai.t = 0.09;
    const pl = p.ai.plan; if (!pl) return ct;
    if (pc.rot !== pl.rot) ct.rot = true; else if (pc.x > pl.x) ct.lHit = true; else if (pc.x < pl.x) ct.rHit = true; else ct.soft = true;
    return ct;
  }


  // ---------------- CPU player 2 (docs/CPU.md) ----------------
  // Placement search (lines, holes, bumpiness, height) with skill-scaled noise, executed as key presses with a
  // reaction delay and a per-move delay; keep/peel decided after the reaction delay, right with p = 0.35 + 0.6·skill.
  function mkBrain() { return { plan: null, piece: null, wait: 0, peelAt: -1, decided: false, readyAt: -1 }; }
  const brains = [mkBrain(), mkBrain()];
  function brainControls(p, dt, skill) {
    const b = brains[p.i];
    const ct = { left: false, right: false, lHit: false, rHit: false, rot: false, soft: false, hard: false, peel: false };
    if (mode === 'learn') {
      const o = opp(p);
      if (o.ready && !p.ready) { if (b.readyAt < 0) b.readyAt = gt + 1; else if (gt >= b.readyAt) { p.ready = true; GS.sfx('ding', { f: 'E5', gain: 0.5 }); } }
    }
    const pc = p.piece; if (!pc || p.clearing) { b.piece = null; return ct; }
    if (b.piece !== pc) {
      // new piece: think, then plan (noisier evaluation at low skill = worse placements)
      b.piece = pc; b.plan = null; b.decided = false; b.peelAt = -1;
      b.wait = H.lerp(1.4, 0.35, skill) * (0.75 + Math.random() * 0.5);
    }
    if (b.wait > 0) { b.wait -= dt; return ct; }
    if (!b.plan) {
      const noise = (1 - skill) * 2.6;
      let best = null;
      for (let rot = 0; rot < 4; rot++) for (let x = -2; x < COLS; x++) {
        if (!fits(p, pc.k, rot, x, pc.y)) continue;
        let y = pc.y; while (fits(p, pc.k, rot, x, y + 1)) y++;
        const g = p.grid.map((r) => r.slice()); BLOCKS[pc.k][rot].forEach(([bx, by]) => { if (y + by >= 0) g[y + by][x + bx] = 1; });
        const sc = evalGrid(g) + Math.random() * noise;
        if (!best || sc > best.s) best = { s: sc, rot, x };
      }
      b.plan = best || { rot: pc.rot, x: pc.x };
    }
    // sticker: keep or peel (only in the test does it matter; in LEARN it keeps everything)
    if (!b.decided && pc.sticker >= 0) {
      b.decided = true;
      if (mode === 'play') {
        const right = Math.random() < 0.35 + 0.6 * skill;
        const shouldPeel = pc.sticker !== ORD[p.order].a;
        if (right ? shouldPeel : !shouldPeel) b.peelAt = gt + H.lerp(0.9, 0.25, skill) * Math.random();
      }
    }
    if (b.peelAt >= 0 && gt >= b.peelAt && pc.sticker >= 0) { ct.peel = true; b.peelAt = -1; return ct; }
    if (b.peelAt >= 0) return ct; // still "thinking" about the sticker
    b.wait = H.lerp(0.24, 0.05, skill) * (0.7 + Math.random() * 0.6); // per-move delay
    const pl = b.plan;
    if (pc.rot !== pl.rot) ct.rot = true;
    else if (pc.x > pl.x) { if (!fits(p, pc.k, pc.rot, pc.x - 1, pc.y)) pl.x = pc.x; else ct.lHit = true; }
    else if (pc.x < pl.x) { if (!fits(p, pc.k, pc.rot, pc.x + 1, pc.y)) pl.x = pc.x; else ct.rHit = true; }
    else if (Math.random() < skill) ct.hard = true;
    else { ct.soft = true; b.wait = 0; }
    return ct;
  }

  // ---------------- drawing ----------------
  function drawCell(kind, x, y) { c.drawImage(cellCol[kind], x - 4, y - 4); k.drawImage(cellKey[kind], x - 4, y - 4); }
  function drawBadge(s, x, y, sc = 1) {
    if (sc === 1) { c.drawImage(badgeCol[s], x - 20, y - 20); k.drawImage(badgeKey[s], x - 20, y - 20); }
    else { c.drawImage(badgeCol[s], x - 20 * sc, y - 20 * sc, 40 * sc, 40 * sc); k.drawImage(badgeKey[s], x - 20 * sc, y - 20 * sc, 40 * sc, 40 * sc); }
  }
  const cpuNow = () => !!(GS.cpu && GS.cpu.on && mode !== 'idle');
  function drawPlayer(p) {
    const wx = wellX(p), cx0 = colX(p), wy = WELL_Y;
    const sh = p.shake > 0 ? p.shake : 0, sx = sh ? Math.sin(gt * 90) * 7 * Math.min(1, sh * 3) : 0, sy = sh ? Math.cos(gt * 73) * 4 * Math.min(1, sh * 3) : 0;
    // header
    box(wx - 4, 76, 182, 42, p.i ? (cpuNow() ? C.blue : C.white) : C.yellow, p.i && cpuNow() ? 'P2 = CPU' : 'PLAYER ' + (p.i + 1), 30, p.i && cpuNow() ? '#fff' : C.black);
    if (mode === 'play') box(wx + 186, 76, 98, 42, C.white, 'SPEED ' + speedLevel(), 24);
    else if (mode === 'learn') box(wx + 186, 76, 98, 42, C.blue, 'LEARN', 26, '#fff');
    for (const x of [c, k]) { x.save(); x.translate(sx, sy); x.beginPath(); x.rect(wx - 2, wy, COLS * CS + 4, (ROWS - HID) * CS + 2); x.clip(); }
    // stack
    const clr = p.clearing, cu = clr ? clr.t / CLEAR_T : 0;
    for (let r = HID; r < ROWS; r++) {
      const isClr = clr && clr.rows.includes(r), yy = wy + (r - HID) * CS;
      for (let q = 0; q < COLS; q++) {
        const cell = p.grid[r][q]; if (!cell) continue;
        if (isClr) { if (cu < 0.45) { drawCell(cell.k, wx + q * CS, yy); if (cell.s >= 0) drawBadge(cell.s, wx + q * CS + CS / 2, yy + CS / 2); } continue; }
        drawCell(cell.k, wx + q * CS, yy);
        if (cell.s >= 0) drawBadge(cell.s, wx + q * CS + CS / 2, yy + CS / 2);
      }
      if (isClr) {
        // flash: white band with speed lines and a yellow smack
        const a = cu < 0.45 ? 1 : 1 - seg(cu, 0.45, 1);
        c.fillStyle = cu < 0.2 ? C.white : C.yellow; c.globalAlpha = a; c.fillRect(wx, yy, COLS * CS, CS); c.globalAlpha = 1;
        k.strokeStyle = C.black; k.lineWidth = 3; k.lineCap = 'round';
        const rr = H.rng(r * 7 + 1);
        for (let i = 0; i < 4; i++) { const ly = yy + 4 + rr() * (CS - 8), l0 = wx + rr() * 60 + cu * 160, l1 = l0 + 60 + rr() * 90; k.globalAlpha = a; k.beginPath(); k.moveTo(l0, ly); k.lineTo(l1, ly); k.stroke(); }
        k.globalAlpha = 1;
      }
    }
    // ghost + active piece
    const pc = p.piece;
    if (pc) {
      const gy = ghostY(p);
      k.save(); k.strokeStyle = C.black; k.lineWidth = 2.5; k.setLineDash([5, 4]);
      for (const [bx, by] of blocksOf(pc)) { const yy = gy + by; if (yy < HID) continue; k.strokeRect(wx + (pc.x + bx) * CS + 3, wy + (yy - HID) * CS + 3, CS - 6, CS - 6); }
      k.restore();
      c.save(); c.globalAlpha = 0.35; for (const [bx, by] of blocksOf(pc)) { const yy = gy + by; if (yy < HID) continue; c.fillStyle = KFILL[pc.k][0] === C.white ? KFILL[pc.k][1] : KFILL[pc.k][0]; c.fillRect(wx + (pc.x + bx) * CS + 6, wy + (yy - HID) * CS + 6, CS - 12, CS - 12); } c.restore();
      const yoff = Math.min(1, p.fallT / gravity()) * (grounded(p) ? 0 : 0); // grid-snapped, classic feel
      for (const [bx, by] of blocksOf(pc)) drawCell(pc.k, wx + (pc.x + bx) * CS, wy + (pc.y + by - HID) * CS + yoff);
      if (pc.sticker >= 0) {
        const [bx, by] = blocksOf(pc)[STICK_BLOCK[pc.k]];
        const bob = 1 + 0.08 * Math.sin(gt * 8);
        drawBadge(pc.sticker, wx + (pc.x + bx) * CS + CS / 2, wy + (pc.y + by - HID) * CS + CS / 2, bob * 1.1);
      }
    }
    // in-well effects
    for (const f of p.fx) {
      const u = (gt - f.t0) / f.dur; if (u < 0 || u > 1) continue;
      if (f.kind === 'drop') {
        k.strokeStyle = C.black; k.lineWidth = 3; k.lineCap = 'round'; k.globalAlpha = 1 - u;
        for (const [bx, by] of BLOCKS[f.k][f.rot]) { const xx = wx + (f.x0 + bx) * CS + CS / 2, y0 = wy + (f.y0 + by - HID) * CS, y1 = wy + (f.y1 + by - HID) * CS; if (y1 - y0 > 4) { k.beginPath(); k.moveTo(xx - 6, Math.max(wy, y0)); k.lineTo(xx - 6, y1 - 4); k.moveTo(xx + 6, Math.max(wy, y0 + 20)); k.lineTo(xx + 6, y1 - 8); k.stroke(); } }
        k.globalAlpha = 1;
      }
    }
    for (const x of [c, k]) x.restore();
    // learn tips inside the well
    if (mode === 'learn') drawLearnTip(p, wx, wy);
    if (mode === 'learn' && p.ready) { box(wx + 10, wy + 210, 260, 50, C.yellow, p.i ? 'READY! WAITING FOR P1…' : cpuNow() ? 'READY! CPU JOINS IN 1 S' : 'READY! WAITING FOR P2…', 26); }
    // effects over the well
    for (const f of p.fx) {
      const u = (gt - f.t0) / f.dur; if (u < 0 || u > 1) continue;
      const age = gt - f.t0;
      if (f.kind === 'burst') {
        const sc = E.back(seg(age, 0, 0.22)) * (u > 0.8 ? 1 - seg(u, 0.8, 1) : 1);
        const jx = f.wrong && age < 0.4 ? Math.sin(gt * 90) * 6 : 0;
        burst(f.x + sx + jx, f.y + sy, f.r, sc, f.fill, f.seed, f.big ? 16 : 13);
        if (f.big && age > 0.05) { k.save(); k.strokeStyle = C.black; k.lineWidth = 6; k.lineCap = 'round'; for (let a = 0; a < 10; a++) { const an = (a / 10) * Math.PI * 2 + 0.3, r0 = f.r * 1.18, r1 = r0 + 22 + 14 * (Math.floor(gt * 8) % 2); k.beginPath(); k.moveTo(f.x + Math.cos(an) * r0, f.y + Math.sin(an) * r0); k.lineTo(f.x + Math.cos(an) * r1, f.y + Math.sin(an) * r1); k.stroke(); } k.restore(); }
        const ts = f.r > 100 ? 78 : f.r > 70 ? 46 : 36;
        sayK(f.text, fitSize(f.text, ts, f.r * 1.5), f.x + sx + jx, f.y + sy - (f.sub ? ts * 0.22 : 0), sc, 'center', -0.08, 8, f.fill === C.blue ? '#fff' : C.black);
        if (f.sub) sayK(f.sub, fitSize(f.sub, f.r > 100 ? 40 : 26, f.r * 1.7), f.x + sx, f.y + sy + ts * 0.5, sc, 'center', -0.08, 8);
      } else if (f.kind === 'tag') {
        const sc = popIn(gt, f.t0 + 0.12); const s = fitSize(f.text, 30, 270);
        const tw = Math.min(276, s * 0.62 * f.text.length + 24);
        if (sc > 0) { c.save(); k.save(); for (const x of [c, k]) { x.translate(f.x, f.y); x.rotate(-0.05); x.scale(sc, sc); } box(-tw / 2, -22, tw, 44, C.yellow, '', 0); say(f.text, s, 0, 2); c.restore(); k.restore(); }
      } else if (f.kind === 'float') {
        sayK(f.text, 34, f.x, f.y - age * 70, popIn(gt, f.t0), 'center', -0.05, 9, f.col);
      } else if (f.kind === 'peel') {
        const e = E.out(u), x = f.x + e * 120 * (p.i ? -1 : 1), y = f.y - e * 90 + u * u * 160;
        c.save(); k.save(); for (const xx of [c, k]) { xx.translate(x, y); xx.rotate(u * 5); xx.scale(1.2 - u * 0.4, 1.2 - u * 0.4); }
        drawBadge(f.s, 0, 0); c.restore(); k.restore();
      }
    }
    drawColumn(p, cx0);
    if (p.caption) drawCaption(p, wx, wy);
  }
  function drawLearnTip(p, wx, wy) {
    const tips = [
      [0, 6, ['STICKERS RIDE ON SOME BLOCKS', 'ADDITIVES · STOCK FORMS · FINISHES']],
      [6, 12, ['READ EACH STICKER IN', 'THE BALLOON →']],
      [12, 18, ['IN THE TEST: CLEAR A LINE WITH', 'THE STICKER YOUR ORDER NEEDS = POW!']],
      [18, 25, ['WRONG STICKER FOR THE ORDER?', p.i ? 'PEEL IT OFF WITH R-SHIFT' : 'PEEL IT OFF WITH G']],
    ];
    for (const [a, b, lines] of tips) {
      if (learnT < a || learnT >= b) continue;
      const sc = E.back(seg(learnT, a, a + 0.25));
      c.save(); k.save(); for (const x of [c, k]) { x.translate(wx + 140, wy + 330); x.scale(sc, sc); }
      box(-138, -62, 276, 124, C.white, '', 0);
      block(lines.join(' '), 27, 0, 0, 252, 4, C.black, 1.08);
      c.restore(); k.restore();
    }
  }
  function drawCaption(p, wx, wy) {
    const cp = p.caption, age = gt - cp.t0, n = cp.lines.length;
    const dx = (1 - E.back(seg(age, 0, 0.25))) * -320;
    const red = cp.tone === 'red', head = red && n > 1 ? cp.lines.slice(0, n - 1) : cp.lines, ans = red && n > 1 ? cp.lines[n - 1] : null;
    const h = 16 + head.length * 32, y0 = wy + 26;
    c.save(); k.save(); for (const x of [c, k]) { x.beginPath(); x.rect(wx - 6, 60, 300, 660); x.clip(); }
    box(wx + 6, y0, 268, h, red ? C.red : C.yellow, '', 0, C.black, dx);
    head.forEach((ln, i) => say(ln, fitSize(ln, 28, 250), wx + 140 + dx, y0 + 24 + i * 32, 1, 'center', 0, red ? '#fff' : C.black));
    if (ans) { box(wx + 20, y0 + h - 4, 240, 48, C.yellow, '', 0, C.black, dx); say(ans, fitSize(ans, 32, 224), wx + 140 + dx, y0 + h + 21, 1, 'center', -0.02); }
    c.restore(); k.restore();
  }
  function drawColumn(p, x0) {
    const W_ = 292;
    // ---- ORDER balloon
    const learnCard = mode === 'learn' ? p.card : -1;
    let header, otext, oT0;
    if (mode === 'learn') {
      header = 'EXAMPLE ORDER';
      if (learnCard >= 0) { const o = ORD.find((q) => q.a === learnCard && q.learn) || ORD.find((q) => q.a === learnCard); otext = o.t; } else otext = 'Each order says what a product needs';
      oT0 = p.cardT0;
    } else { header = 'ORDER #' + p.orderN; otext = ORD[p.order].t; oT0 = p.orderT0; }
    const osc = E.back(seg(gt, oT0, oT0 + 0.3)) || 0.001;
    balloon(x0, 84, W_, 190, Math.max(0.001, osc), [x0 + 70, 268, x0 + 40, 300, 14]);
    box(x0 - 8, 70, Math.min(W_ - 20, 30 + header.length * 13), 36, mode === 'learn' ? C.yellow : C.red, header, 26, mode === 'learn' ? C.black : '#fff');
    block(otext, 30, x0 + W_ / 2, 190, W_ - 34, 4, C.black, 1.08, osc);
    // ---- STICKER balloon (tail points at the sticker on the falling piece)
    const pc = p.piece, has = pc && pc.sticker >= 0;
    let tail = null;
    if (has) {
      const [bx, by] = blocksOf(pc)[STICK_BLOCK[pc.k]];
      const tx = wellX(p) + (pc.x + bx) * CS + CS / 2 + 14, ty = WELL_Y + (pc.y + by - HID) * CS + CS / 2;
      tail = [x0 + 30, Math.max(330, Math.min(440, ty)), tx, Math.max(WELL_Y + 8, ty), 16];
    }
    const sid = has ? pc.sticker : mode === 'learn' ? p.card : -1;
    const ssc = sid >= 0 ? E.back(seg(gt, p.cardT0, p.cardT0 + 0.3)) : 1;
    const by0 = 300, bh = 182;
    if (sid >= 0) {
      const s = ST[sid];
      balloon(x0, by0, W_, bh, Math.max(0.001, ssc), tail, C.white);
      // category tag
      const cat = CATS[s.cat];
      box(x0 + W_ - 132, by0 - 14, 136, 34, cat.col, cat.name, 22, s.cat === 2 ? C.black : '#fff');
      drawBadge(sid, x0 + 26, by0 + 4, 1.1);
      if (mode === 'learn') {
        block(s.name, 36, x0 + W_ / 2, by0 + 58, W_ - 30, 2, C.red, 1.0, ssc);
        block(s.learn, 25, x0 + W_ / 2, by0 + 136, W_ - 34, 3, C.black, 1.05, ssc);
      } else {
        block(s.name, 40, x0 + W_ / 2, by0 + 74, W_ - 30, 2, C.red, 1.0, ssc);
        if (has) { say('KEEP IT OR PEEL IT?', fitSize('KEEP IT OR PEEL IT?', 26, W_ - 40), x0 + W_ / 2, by0 + 132, ssc); say(p.i ? 'PEEL = R-SHIFT' : 'PEEL = G', 24, x0 + W_ / 2, by0 + 160, ssc, 'center', 0, C.blue); }
      }
    } else {
      balloon(x0 + 10, by0 + 30, W_ - 20, bh - 60, 1, null, C.white);
      const msg = mode === 'learn' && p.allLearnt ? 'ALL 14 STICKERS SEEN!' : 'PLAIN BLOCK: NO STICKER';
      block(msg, 28, x0 + W_ / 2, by0 + bh / 2, W_ - 50, 2);
    }
    if (mode === 'learn' && p.allLearnt && !p.ready) {
      const t = p.i ? 'PRESS R-SHIFT WHEN READY' : 'PRESS G WHEN READY';
      box(x0, 452, W_, 36, C.yellow, t, 24);
    }
    // ---- NEXT
    say('NEXT', 26, x0 + 64, 514);
    const nk = p.next, bl = BLOCKS[nk][0];
    let minx = 9, maxx = -9, miny = 9, maxy = -9; for (const [bx, by] of bl) { minx = Math.min(minx, bx); maxx = Math.max(maxx, bx); miny = Math.min(miny, by); maxy = Math.max(maxy, by); }
    const pw = (maxx - minx + 1) * CS, ph = (maxy - miny + 1) * CS;
    for (const [bx, by] of bl) drawCell(nk, x0 + 64 - pw / 2 + (bx - minx) * CS, 570 - ph / 2 + (by - miny) * CS);
    // junk incoming
    if (p.pending > 0) {
      const fl = Math.floor(gt * 6) % 2;
      box(x0, 628, 128, 40, fl ? C.red : C.yellow, 'JUNK ×' + p.pending, 26, fl ? '#fff' : C.black);
    }
    // ---- SCORE burst (test) or CONTROLS card (learn/idle)
    const sx = x0 + 216, sy = 614;
    if (mode === 'play') {
      const fs = finalStretch();
      burst(sx, sy, 80, 1, p.i ? C.blue : C.red, 12 + p.i, 13);
      sayK(String(p.score), fitSize(String(p.score), 58, 116), sx, sy + 4, 1, 'center', -0.06, 8);
      box(sx - 56, 500, 112, 32, C.yellow, 'P' + (p.i + 1) + ' SCORE', 22);
      if (fs) box(x0 + 150, 676, 142, 30, C.yellow, 'POW = DOUBLE!', 22);
    } else {
      const X = x0 + 144, Y = 496, w = 148, h = 206;
      box(X, Y, w, h, C.white, '', 0);
      c.fillStyle = C.yellow; c.fillRect(X, Y, w, 34); k.lineWidth = 4; k.strokeRect(X, Y, w, 34);
      say('CONTROLS', 24, X + w / 2, Y + 18);
      if (p.i && cpuNow()) { block('COMPUTER IS PLAYING. PRESS ANY P2 KEY TO TAKE OVER', 24, X + w / 2, Y + 118, w - 16, 5); return; }
      const rows = p.i ? [['← →', 'MOVE'], ['↑', 'TURN'], ['↓', 'DOWN'], ['ENTER', 'DROP'], ['R-SHIFT', 'PEEL']] : [['A D', 'MOVE'], ['W', 'TURN'], ['S', 'DOWN'], ['F', 'DROP'], ['G', 'PEEL']];
      rows.forEach(([a, b], i) => { const yy = Y + 56 + i * 33; say(a, fitSize(a, 24, 72), X + 10, yy, 1, 'left', 0, C.red); say(b, 24, X + w - 10, yy, 1, 'right'); });
    }
  }
  function drawGlobal() {
    for (let i = gfx.length - 1; i >= 0; i--) {
      const f = gfx[i], u = (gt - f.t0) / f.dur;
      if (u > 1) { gfx.splice(i, 1); continue; }
      const from = f.from, x0 = from ? 790 : 490, x1 = from ? 300 : 980;
      fatArrow([x0, 420], [640, 250], [x1, 380], E.out(seg(u, 0, 0.5)), 40, C.yellow);
      if (u > 0.2) sayK('JUNK ×' + f.n + '!', 40, 640, 300, popIn(gt, f.t0 + 0.2 * f.dur), 'center', from ? 0.08 : -0.08, 10);
    }
  }
  function composite() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, HH);
    ctx.drawImage(colL, 2.5, -1.5); // press misregistration
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(keyL, 0, 0);
    ctx.drawImage(paperImg, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }
  function render() {
    c.drawImage(bgCol, 0, 0);
    k.clearRect(0, 0, W, HH); k.drawImage(bgKey, 0, 0);
    k.lineJoin = 'round'; k.lineCap = 'round';
    drawPlayer(players[0]); drawPlayer(players[1]);
    drawGlobal();
    if (mode === 'idle') {
      // attract: a big comic title burst in the gutter
      const s = 1 + 0.04 * Math.sin(gt * 3);
      burst(640, 140, 96, s, C.yellow, 17, 14); sayK('POW!', 64, 640, 136, s, 'center', -0.12, 10, C.red);
    }
    composite();
  }

  // ---------------- lifecycle ----------------
  function startMode(m) {
    mode = m; gfx.length = 0; learnT = 0;
    players.forEach((p) => resetPlayer(p, m)); brains.forEach((b, i) => (brains[i] = mkBrain()));
    if (GS.cpu) GS.cpu.releaseAll();
    if (m === 'play') { playStartT = GS.t; }
    pushScore();
  }
  GS.init({
    id: 6, title: 'POW! Polymer Blocks', mode: 'vs', learnSeconds: 90,
    controls: { p1: 'A D move · W turn · S down · F drop · G peel sticker', p2: '← → move · ↑ turn · ↓ down · Enter drop · R-Shift peel' },
    onRound() { startMode('learn'); },
    onPhase(ph, prev) {
      if (ph === 'play') startMode('play');
      else if (ph === 'learn' && mode !== 'learn') startMode('learn');
      else if (ph === 'idle') startMode('idle');
    },
  });

  makeSprites(); makeBadges(); makeBackdrop();
  startMode('idle');
  if (document.fonts && document.fonts.load) {
    document.fonts.load(FONT(30), 'POW').then(() => { if (document.fonts.check(FONT(30), 'POW')) { fontStamp++; wrapCache.clear(); makeBadges(); makeBackdrop(); } }).catch(() => {});
  }

  // tiny hook for headless scenario tests (harmless in class)
  window.__t06 = { players, ORD, ST, BLOCKS, setPiece(i, kk, st, x, rot) { const p = players[i]; p.piece = { k: kk, rot: rot || 0, x, y: HID - 1, sticker: st }; if (st >= 0) { p.card = st; p.cardT0 = gt; } }, fillRows(i, n, gap) { const p = players[i]; for (let r = ROWS - n; r < ROWS; r++) for (let q = 0; q < COLS; q++) p.grid[r][q] = q === gap ? null : { k: (q + r) % 7, s: -1 }; } };
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (GS.phase === 'idle') {
      if (mode !== 'idle') startMode('idle');
      gt += dt;
      for (const p of players) update(p, dt, aiControls(p, dt));
    } else if (GS.running) {
      gt += dt;
      if (mode === 'learn') learnT += dt;
      const cpuOn = GS.cpu && GS.cpu.on;
      const cts = players.map((p) => (p.i === 1 && cpuOn) ? brainControls(p, dt, GS.cpu.skill) : (p.i === 0 && window.__t06.p1bot) ? brainControls(p, dt, window.__t06.p1bot) : controls(p));
      players.forEach((p, i) => update(p, dt, cts[i]));
      if (mode === 'learn' && players[0].ready && players[1].ready) GS.skipLearn();
    }
    render();
    GS.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
