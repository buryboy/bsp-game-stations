// neon.js — real-time port of the "Neon Sign at Night" style (papercraft-explainer-kit/styles/neon-sign-at-night).
// Same recipe as the reference: tubes are drawn into a colour layer + a white-hot core layer + an unlit-glass layer,
// then composed over a brick wall that is lit by a blurred light map, with halos, brick-arris rim light, contact
// shadows, clips/electrodes, wet-pavement reflection, vignette and grain. Static textures (bricks, edge masks,
// pavement, puddles, grain, vignette, text sprites) are baked once; every per-frame buffer is pre-allocated.
(function () {
  'use strict';
  const W = 1280, HH = 720, WB = 600;
  const N = (window.NEON = {});
  N.W = W; N.H = HH; N.WB = WB;
  N.C = {
    pink: [255, 70, 165], cyan: [70, 228, 255], warm: [255, 190, 70], red: [255, 48, 36], green: [90, 255, 120],
    violet: [175, 110, 255], hot: [255, 128, 34], white: [214, 222, 255],
  };
  N.GLO = '"Gloria Hallelujah","Comic Sans MS","Segoe Print","Bradley Hand",cursive';
  N.POI = '"Poiret One","Century Gothic","Futura","Avenir Next","Trebuchet MS",sans-serif';
  const hs = (n) => { const v = Math.sin(n * 91.731 + 7.13) * 43758.5453; return v - Math.floor(v); };
  N.hs = hs;
  // ignition: a tube buzzes on/off for a moment, then latches on (same hash as the reference)
  N.ign = (t, t0, len = 0.3) => (t < t0 ? 0 : t - t0 > len ? 1 : hs(Math.floor(t * 40) + t0 * 977) > 0.42 ? 1 : 0);

  // ---------------- baked textures (copied from the reference) ----------------
  function getBrickTile() {
    const TW = 92 * 14, TH = 600, rowH = 30, brW = 92, mort = 5;
    const c = H.layer(TW, TH), x = c.getContext('2d'), img = x.createImageData(TW, TH), d = img.data;
    const R = H.rng(4401), nz = H.makeNoise(4402);
    const cols = [[230, 106, 76], [200, 90, 66], [245, 130, 92], [180, 96, 78], [220, 120, 90], [140, 76, 62]];
    const bh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    for (let y = 0; y < TH; y++) {
      const row = Math.floor(y / rowH), ly = y - row * rowH, off = (row % 2) * (brW / 2);
      for (let xx = 0; xx < TW; xx++) {
        const col = Math.floor((xx + off) / brW) % 14, lxp = (xx + off) % brW;
        const h1 = bh(row, col), h2 = bh(col + 9, row + 3), g = R() - 0.5;
        const ang = xx / TW * Math.PI * 2, st = nz.n3(Math.cos(ang) * 3, Math.sin(ang) * 3, y * 0.012) * 0.3;
        const ej = (bh(xx >> 2, row) - 0.5) * 2.2;
        let r, gg, b;
        if (ly < mort + ej * 0.5 || lxp < mort + ej * 0.6) { const m = 0.5 + g * 0.3; r = 190 * m; gg = 182 * m; b = 172 * m; }
        else {
          const c0 = cols[Math.floor(h1 * cols.length)];
          const k = (0.85 + h2 * 0.3 + st) * (1 + g * 0.3) * (bh(xx * 0.37 | 0, y * 0.41 | 0) > 0.985 ? 0.55 : 1) * (ly - mort < 3 ? 1.15 : rowH - ly < 3 ? 0.75 : 1);
          r = c0[0] * k; gg = c0[1] * k; b = c0[2] * k;
        }
        // soot: the lower wall is a little darker
        const soot = 1 - H.smooth(380, 600, y) * 0.25;
        const i = (y * TW + xx) * 4; d[i] = r * soot; d[i + 1] = gg * soot; d[i + 2] = b * soot; d[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  function getEdgeTile() {
    const TW = 92 * 14, TH = 600, rowH = 30, brW = 92, mort = 5;
    const bh = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const mk = () => { const c = H.layer(TW, TH), x = c.getContext('2d'); return [c, x, x.createImageData(TW, TH)]; };
    const [tc, tcx, ti] = mk(), [bc, bcx, bi] = mk(), td = ti.data, bd = bi.data;
    for (let y = 0; y < TH; y++) {
      const row = Math.floor(y / rowH), ly = y - row * rowH, off = (row % 2) * (brW / 2);
      for (let xx = 0; xx < TW; xx++) {
        const lxp = (xx + off) % brW, ej = (bh(xx >> 2, row) - 0.5) * 2.2;
        if (ly < mort + ej * 0.5 || lxp < mort + ej * 0.6) continue;
        const top = ly - (mort + ej * 0.5), bot = rowH - ly, i = (y * TW + xx) * 4;
        if (top < 3.5) { td[i] = td[i + 1] = td[i + 2] = 255; td[i + 3] = 255 * (1 - top / 3.5) * (lxp - mort < 2 ? 0.5 : 1); }
        if (bot < 3) { bd[i] = bd[i + 1] = bd[i + 2] = 255; bd[i + 3] = 255 * (1 - bot / 3); }
      }
    }
    tcx.putImageData(ti, 0, 0); bcx.putImageData(bi, 0, 0);
    tcx.globalAlpha = 0.55; tcx.drawImage(bc, 0, 0);
    return tc;
  }
  function getPaveTile() {
    const PW = W * 2, PH = 120, nz = H.makeNoise(4410), R = H.rng(4411);
    const c = H.layer(PW, PH), x = c.getContext('2d'), img = x.createImageData(PW, PH), d = img.data;
    const p = H.layer(PW, PH), px = p.getContext('2d'), pimg = px.createImageData(PW, PH), pd = pimg.data;
    for (let y = 0; y < PH; y++) for (let xx = 0; xx < PW; xx++) {
      const a = xx / PW * Math.PI * 2, cx0 = Math.cos(a), sx0 = Math.sin(a);
      const g = R() - 0.5, st = nz.n3(cx0 * 9, sx0 * 9, y * 0.06) * 0.5 + nz.n3(cx0 * 40, sx0 * 40, y * 0.25) * 0.3;
      let base = 22 + g * 12 + st * 9;
      if (y < 4) base = 54 + g * 14 - y * 3; else if (y < 12) base = 40 + g * 14 - (y - 4) * 1.6; // curb lip
      base *= 1 - y / PH * 0.35;
      const i = (y * PW + xx) * 4; d[i] = base * 0.92; d[i + 1] = base * 0.95; d[i + 2] = base * 1.1; d[i + 3] = 255;
      const v = nz.n3(cx0 * 4.5, sx0 * 4.5, y * 0.03 + 20) + 0.4 * nz.n3(cx0 * 12, sx0 * 12, y * 0.08);
      pd[i] = pd[i + 1] = pd[i + 2] = 255; pd[i + 3] = 255 * H.smooth(-0.12, 0.08, v) * H.smooth(6, 16, y);
    }
    x.putImageData(img, 0, 0); px.putImageData(pimg, 0, 0);
    for (let k = 0; k < 1400; k++) { x.fillStyle = `rgba(200,200,220,${R() * 0.16})`; x.fillRect(R() * PW, 12 + Math.pow(R(), 0.8) * (PH - 12), 1 + R(), 1); }
    // expansion joints
    x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 2;
    for (const jx of [150, 1210, 1430, 2490]) { x.beginPath(); x.moveTo(jx, PH); x.lineTo(jx + (jx % 1280 < 640 ? 55 : -90), 12); x.stroke(); }
    return { c, p, PW };
  }
  function getGrain(seed) {
    const S = 512, c = H.layer(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = H.rng(seed);
    for (let i = 0; i < d.length; i += 4) { d[i] = r() * 13; d[i + 1] = r() * 13; d[i + 2] = r() * 13; d[i + 3] = 255; }
    x.putImageData(img, 0, 0); return c;
  }
  function getGrainDark(seed) {
    const S = 512, c = H.layer(S, S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, r = H.rng(seed);
    for (let i = 0; i < d.length; i += 4) { d[i] = 255 - r() * 22; d[i + 1] = 255 - r() * 22; d[i + 2] = 255 - r() * 22; d[i + 3] = 255; }
    x.putImageData(img, 0, 0); return c;
  }

  // ---------------- per-frame buffers (allocated once) ----------------
  const mk = (w, h) => { const c = H.layer(w, h); return [c, c.getContext('2d')]; };
  const [col, cx] = mk(W, HH), [core, kx] = mk(W, HH), [off, ox] = mk(W, HH);
  const [Lr, lrx] = mk(160, 90), [L, lx] = mk(160, 90);
  const [s8, s8x] = mk(160, 90), [s4, s4x] = mk(320, 180), [s2, s2x] = mk(640, 360), [c2, c2x] = mk(640, 360);
  const [r4, r4x] = mk(320, 180), [sh, shx] = mk(320, 180), [rim, rimx] = mk(W, WB);
  const GH = HH - WB; const [refl, rfx] = mk(W, GH), [smear, smx] = mk(W, 10), [rm, rmx] = mk(W, GH);
  let T = null; // baked textures
  N.prepare = function () {
    if (T) return;
    const vig = H.layer(W, HH); H.vignette(vig.getContext('2d'), W, HH, 0.55, '4,2,10');
    T = { brick: getBrickTile(), edge: getEdgeTile(), pave: getPaveTile(), grain: [getGrain(31), getGrain(32), getGrain(33)], grainD: [getGrainDark(41), getGrainDark(42)], vig };
  };

  // ---------------- drawing API (world coords, offset by N.at) ----------------
  let cam = 0, offX = 0;
  const HW = { clips: [], elec: [] };
  N.begin = function (c) {
    cam = c; HW.clips.length = 0; HW.elec.length = 0;
    for (const g of [cx, kx, ox]) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
      g.clearRect(0, 0, W, HH); g.lineCap = 'round'; g.lineJoin = 'round';
    }
    cx.globalCompositeOperation = 'lighter'; kx.globalCompositeOperation = 'lighter';
    N.at(0);
  };
  N.at = function (x) { offX = x; for (const g of [cx, kx, ox]) g.setTransform(1, 0, 0, 1, x - cam, 0); };
  N.seen = (x) => Math.abs(x - cam) < 1300;
  N.cam = () => cam;
  N.tube = function (pathFn, c, k, w = 7) {
    ox.strokeStyle = 'rgb(44,36,48)'; ox.lineWidth = w; pathFn(ox); ox.stroke();
    ox.strokeStyle = 'rgba(170,160,180,0.2)'; ox.lineWidth = w * 0.3; ox.save(); ox.translate(-1, -1.5); pathFn(ox); ox.stroke(); ox.restore();
    if (k <= 0) return;
    cx.strokeStyle = H.rgba(c, Math.min(1, k)); cx.lineWidth = w; pathFn(cx); cx.stroke();
    kx.strokeStyle = H.rgba(H.mix(c, [255, 255, 255], 0.82), Math.min(1, k)); kx.lineWidth = w * 0.36; pathFn(kx); kx.stroke();
  };
  // light only (sparks, heat shimmer): no glass
  N.glow = function (pathFn, c, k, w = 4, coreK = 1) {
    if (k <= 0) return;
    cx.strokeStyle = H.rgba(c, Math.min(1, k)); cx.lineWidth = w; pathFn(cx); cx.stroke();
    if (coreK > 0) { kx.strokeStyle = H.rgba(H.mix(c, [255, 255, 255], 0.8), Math.min(1, k * coreK)); kx.lineWidth = w * 0.36; pathFn(kx); kx.stroke(); }
  };
  N.blockout = function (pathFn, w = 7) {
    ox.save(); ox.strokeStyle = 'rgb(13,11,14)'; ox.lineWidth = w; pathFn(ox); ox.stroke();
    ox.strokeStyle = 'rgba(150,110,130,0.28)'; ox.lineWidth = w * 0.28; ox.translate(-1, -1.5); pathFn(ox); ox.stroke(); ox.restore();
  };
  N.clip = (x, y, a = 0) => HW.clips.push([x + offX - cam, y, a]);
  N.elec = (x, y, a = 0) => HW.elec.push([x + offX - cam, y, a]);
  // dark painted box (e.g. a sign backer) drawn into the glass layer
  N.backer = function (x, y, w, h, a = 0.55) {
    ox.save(); ox.fillStyle = `rgba(8,6,10,${a})`; ox.beginPath(); ox.roundRect(x, y, w, h, 16); ox.fill(); ox.restore();
  };

  // ---------------- neon lettering: baked sprites (colour, eroded hot core, unlit glass) ----------------
  const cache = new Map();
  const mctx = H.layer(8, 8).getContext('2d');
  const fontOf = (size, fam) => `400 ${size}px ${fam === 'G' ? N.GLO : N.POI}`;
  N.measure = (s, size, fam) => { mctx.font = fontOf(size, fam); return mctx.measureText(s).width; };
  function sprite(s, size, fam, c, lw) {
    const key = s + '|' + size + fam + '|' + c[0] + ',' + c[1] + ',' + c[2] + '|' + lw;
    let sp = cache.get(key); if (sp) return sp;
    const fat = fam === 'G', font = fontOf(size, fam);
    mctx.font = font; const tw = Math.max(1, mctx.measureText(s).width);
    const pad = Math.ceil(lw + 10), w = Math.ceil(tw + pad * 2), h = Math.ceil(size * 1.75 + pad * 2), base = Math.round(pad + size * 1.2);
    const draw = (g, color, lwid) => {
      g.font = font; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round'; g.lineCap = 'round';
      g.lineWidth = lwid; g.fillStyle = g.strokeStyle = color; g.fillText(s, pad, base); g.strokeText(s, pad, base);
    };
    const [cc, ccx] = mk(w, h); draw(ccx, H.rgba(c), fat ? lw + 3 : lw);
    const [ws, wsx] = mk(w, h); draw(wsx, H.rgba(H.mix(c, [255, 255, 255], 0.85)), lw);
    const r = fat ? Math.max(2, Math.min(5, Math.round(size / 30))) : size >= 44 ? 2 : 1;
    const [kc, kcx] = mk(w, h); kcx.drawImage(ws, 0, 0); kcx.globalCompositeOperation = 'destination-in';
    for (let a = 0; a < 8; a++) kcx.drawImage(ws, Math.round(Math.cos(a * Math.PI / 4) * r), Math.round(Math.sin(a * Math.PI / 4) * r));
    const [oc, ocx] = mk(w, h); draw(ocx, 'rgb(44,36,48)', lw);
    ocx.globalAlpha = 0.22; ocx.translate(-1, -1.5); draw(ocx, 'rgb(170,150,170)', lw * 0.4);
    sp = { col: cc, core: kc, off: oc, tw, pad, base, w, h };
    if (cache.size > 600) cache.clear();
    cache.set(key, sp); return sp;
  }
  N.clearText = () => cache.clear();
  // N.text(s, x, y, size, 'G'|'P', colour, k, {align, lw, ghost, maxW}) -> drawn width
  N.text = function (s, x, y, size, fam, c, k, o) {
    o = o || {};
    if (!s) return 0;
    const lw = o.lw != null ? o.lw : fam === 'G' ? Math.max(1.6, size / 55) : Math.max(1.5, size / 16);
    const sp = sprite(s, size, fam, c, lw);
    const sc = o.maxW && sp.tw > o.maxW ? o.maxW / sp.tw : 1;
    const align = o.align || 'center';
    const x0 = align === 'center' ? x - sp.tw * sc / 2 : align === 'right' ? x - sp.tw * sc : x;
    const dx = x0 - sp.pad * sc, dy = y - sp.base * sc, dw = sp.w * sc, dh = sp.h * sc;
    if (o.ghost !== false) ox.drawImage(sp.off, dx, dy, dw, dh);
    if (k > 0) {
      cx.globalAlpha = Math.min(1, k); cx.drawImage(sp.col, dx, dy, dw, dh);
      kx.globalAlpha = Math.min(1, k * k * 1.1); kx.drawImage(sp.core, dx, dy, dw, dh);
      cx.globalAlpha = 1; kx.globalAlpha = 1;
    }
    return sp.tw * sc;
  };
  // letter-by-letter ignition; kf(i) returns the brightness of letter i
  N.word = function (s, x, y, size, fam, c, kf, align = 'center') {
    const wd = N.measure(s, size, fam); const x0 = align === 'center' ? x - wd / 2 : align === 'right' ? x - wd : x;
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') N.text(s[i], x0 + N.measure(s.slice(0, i), size, fam), y, size, fam, c, kf(i), { align: 'left' });
    return [x0, x0 + wd];
  };
  // segmented chase-light arrow along a quadratic (reference recipe)
  N.arrow = function (x0, y0, qx, qy, x1, y1, c, prog, t, n = 10, w = 6) {
    const P = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * qx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * qy + u * u * y1];
    for (let i = 0; i < n; i++) {
      const a = P(i / n + 0.012), b = P((i + 1) / n - 0.012);
      const lit = prog * n > i + 0.5 ? 0.45 + 0.55 * ((((i - t * 14) % 4) + 4) % 4 < 1.4 ? 1 : 0) : 0;
      N.tube((g) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }, c, lit, w);
    }
    const e = P(1), pe = P(0.94), ang = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
    N.tube((g) => { g.beginPath(); g.moveTo(e[0] + Math.cos(ang + 2.5) * 20, e[1] + Math.sin(ang + 2.5) * 20); g.lineTo(e[0], e[1]); g.lineTo(e[0] + Math.cos(ang - 2.5) * 20, e[1] + Math.sin(ang - 2.5) * 20); }, c, prog >= 1 ? 1 : 0, w);
  };

  // ---------------- compose the frame ----------------
  // t: animation seconds (puddle shiver, rain rings); post(ctx): extra pass before vignette/grain (smoke etc.)
  N.compose = function (ctx, t, post, frameNo) {
    const B = T.brick, tw = B.width, tx0 = -(((cam % tw) + tw) % tw);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, HH);
    for (let x = tx0; x < W; x += tw) ctx.drawImage(B, x, 0);
    // light map: neon light spilling over the brick
    lrx.globalCompositeOperation = 'source-over'; lrx.globalAlpha = 1; lrx.filter = 'none'; lrx.clearRect(0, 0, 160, 90);
    lrx.globalCompositeOperation = 'lighter';
    lrx.filter = 'blur(10px)'; lrx.drawImage(col, 0, 0, 160, 90); lrx.drawImage(col, 0, 0, 160, 90);
    lrx.filter = 'blur(3px)'; lrx.globalAlpha = 0.9; lrx.drawImage(col, 0, 0, 160, 90);
    lrx.filter = 'none'; lrx.globalAlpha = 1;
    lx.globalCompositeOperation = 'source-over'; lx.fillStyle = 'rgb(30,34,52)'; lx.fillRect(0, 0, 160, 90);
    lx.globalCompositeOperation = 'lighter'; lx.drawImage(Lr, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(L, 0, 0, W, HH);
    // brick arrises catch the sign light
    rimx.globalCompositeOperation = 'source-over'; rimx.clearRect(0, 0, W, WB);
    for (let x = tx0; x < W; x += tw) rimx.drawImage(T.edge, x, 0);
    rimx.globalCompositeOperation = 'source-in'; rimx.drawImage(Lr, 0, 0, 160, 75, 0, 0, W, WB);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.85; ctx.drawImage(rim, 0, 0); ctx.globalAlpha = 1;
    // tubes stand ~4 cm off the wall: soft contact shadow, then the glass itself
    shx.clearRect(0, 0, 320, 180); shx.filter = 'blur(1px)'; shx.drawImage(off, 0, 0, 320, 180); shx.filter = 'none';
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.6; ctx.drawImage(sh, 5, 9, W, HH);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(off, 0, 0);
    for (const [x, y, a] of HW.elec) {
      if (x < -40 || x > W + 40) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = '#0d0c0f'; ctx.beginPath(); ctx.roundRect(-7, -6, 22, 12, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-4, -5, 15, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(13, -4, 4, 8);
      ctx.restore();
    }
    // wet sidewalk
    const P = T.pave, px0 = -(((cam % P.PW) + P.PW) % P.PW);
    for (let x = px0; x < W; x += P.PW) ctx.drawImage(P.c, x, WB);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(0, WB, W, 3);
    // halos: blurred at low res with extra saturation, so the glass rim stays deep colour around a thin hot core
    s8x.clearRect(0, 0, 160, 90); s8x.filter = 'blur(7.5px) saturate(1.6)'; s8x.drawImage(col, 0, 0, 160, 90); s8x.filter = 'none';
    s4x.clearRect(0, 0, 320, 180); s4x.filter = 'blur(4.5px) saturate(1.8)'; s4x.drawImage(col, 0, 0, 320, 180); s4x.filter = 'none';
    s2x.clearRect(0, 0, 640, 360); s2x.filter = 'blur(2.5px) saturate(2.2)'; s2x.drawImage(col, 0, 0, 640, 360); s2x.filter = 'none';
    c2x.clearRect(0, 0, 640, 360); c2x.filter = 'blur(1.25px)'; c2x.drawImage(core, 0, 0, 640, 360); c2x.filter = 'none';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55; ctx.drawImage(s8, 0, 0, W, HH);
    ctx.globalAlpha = 0.75; ctx.drawImage(s4, 0, 0, W, HH);
    ctx.globalAlpha = 0.6; ctx.drawImage(s2, 0, 0, W, HH);
    ctx.globalAlpha = 1; ctx.drawImage(col, 0, 0); ctx.drawImage(core, 0, 0);
    ctx.globalAlpha = 0.5; ctx.drawImage(c2, 0, 0, W, HH);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // mounting clips over the glass
    for (const [x, y, a] of HW.clips) {
      if (x < -20 || x > W + 20) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = 'rgba(30,28,34,0.92)'; ctx.beginPath(); ctx.roundRect(-2.5, -8, 5, 16, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-1.5, -7, 1, 14);
      ctx.restore();
    }
    // reflection in the wet pavement: rippled mirror rows, vertical streak smear, full mirror only inside puddles
    r4x.clearRect(0, 0, 320, 180); r4x.filter = 'blur(1.5px)'; r4x.drawImage(col, 0, 0, 320, 180); r4x.filter = 'none';
    rfx.clearRect(0, 0, W, GH);
    for (let y = WB + 4; y < HH; y += 2) {
      const gy = y - WB, sy = WB - gy / 0.3;
      if (sy < 0) break;
      const offx = Math.sin(y * 0.35 + t * 6) * (1.5 + gy * 0.035) + Math.sin(y * 0.11 - t * 2.3 + 1.7) * (1 + gy * 0.03);
      rfx.drawImage(r4, 0, sy * 0.25, 320, (2 / 0.3) * 0.25, offx, gy, W, 2);
    }
    smx.clearRect(0, 0, W, 10); smx.filter = 'blur(1.5px)'; smx.drawImage(refl, 0, 4, W, GH - 4, 0, 0, W, 10); smx.filter = 'none';
    rmx.globalCompositeOperation = 'source-over'; rmx.clearRect(0, 0, W, GH);
    for (let x = px0; x < W; x += P.PW) rmx.drawImage(P.p, x, 0);
    rmx.globalCompositeOperation = 'source-in'; rmx.drawImage(refl, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45; ctx.drawImage(smear, 0, 0, W, 10, 0, WB + 4, W, GH - 4);
    ctx.globalAlpha = 0.22; ctx.drawImage(refl, 0, WB);
    ctx.globalAlpha = 0.6; ctx.drawImage(rm, 0, WB);
    // rain rings in the puddles
    ctx.lineWidth = 1;
    for (let k = 0; k < 9; k++) {
      const ph0 = t * 0.8 + hs(k * 7.3), cyc = Math.floor(ph0), ph = ph0 - cyc;
      const x = 80 + hs(k * 13.1 + cyc * 3.7) * 1120, y = WB + 30 + hs(k * 5.9 + cyc * 1.3) * (GH - 40);
      ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(${k % 3 ? '255,140,200' : '120,220,255'},${0.18 * (1 - ph)})`;
      ctx.beginPath(); ctx.ellipse(x, y, 4 + ph * 26, (4 + ph * 26) * 0.22, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (post) post(ctx);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(T.vig, 0, 0);
    // film grain (baked tiles, jittered each frame)
    const f = frameNo | 0, gx = -Math.floor(hs(f) * 512), gy = -Math.floor(hs(f + 0.5) * 512);
    ctx.globalCompositeOperation = 'lighter'; const g1 = T.grain[f % 3];
    for (let y = gy; y < HH; y += 512) for (let x = gx; x < W; x += 512) ctx.drawImage(g1, x, y);
    ctx.globalCompositeOperation = 'multiply'; const g2 = T.grainD[f % 2];
    for (let y = gy; y < HH; y += 512) for (let x = gx; x < W; x += 512) ctx.drawImage(g2, x, y);
    ctx.restore();
  };
})();
