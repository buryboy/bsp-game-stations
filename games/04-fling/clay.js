// clay.js: the "Claymation Set" rendering kit for a real-time game.
// Adapted from papercraft-explainer-kit/styles/claymation-set/reference-explainer.js: the same height-field
// "inflate a 2D mask into a lit plasticine lump" bake (waxy subsurface tint, thumbprints, sculpting-tool marks,
// lumpy silhouettes), the same palette, Fredoka clay letters and the same lens finish (soft-light grade, vignette,
// exposure flicker, grain). Everything expensive is baked once and cached; frames only blit sprites.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const LIGHT = nrm([-0.5, -0.66, 0.58]);
  const HALF = nrm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);
  const CL = (window.CLAY = {});
  const CACHE = {};
  CL.cache = CACHE;
  const nz = H.makeNoise(8);
  CL.nz = nz;
  CL.TAU = TAU;
  CL.PAL = ['#f2c14e', '#f07b5a', '#f6efe3', '#ef8fb0', '#a8dd8a', '#7fd0e0'];
  CL.SEQ = {
    pop: [[0.5, 0.42], [1.16, 0.8], [0.9, 1.14], [1.04, 0.97], [1, 1]],
    lid: [[1, 0.12], [1, 0.38], [1, 0.66], [1, 0.9], [1, 1.05], [1, 1]],
    squish: [[1.25, 0.2], [1.12, 0.55], [0.95, 1.08], [1.03, 0.97], [1, 1]],
  };
  // pop-on squash & stretch, stepped on twos (12 fps): k = seconds since the piece was placed
  CL.pop = (k, seq) => { const s = CL.SEQ[seq || 'pop']; if (k < 0) return null; return s[Math.min(s.length - 1, Math.floor(k * 12 + 1e-6) >> 1)]; };

  CL.FAMILY = '"Fredoka", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  CL.FR = (px, w) => `${w || 700} ${px}px ${CL.FAMILY}`;

  // lumpy closed shape from a centre + radius function (reference: lumpy)
  CL.lumpy = (c, cx, cy, rx, ry, seed, amp = 0.05, rot = 0) => {
    c.beginPath();
    const N = 72, cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * TAU, k = 1 + amp * nz.n2(Math.cos(a) * 1.3 + seed, Math.sin(a) * 1.3 + seed * 0.7);
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      const px = cx + x * cr - y * sr, py = cy + x * sr + y * cr;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.closePath(); c.fill();
  };
  CL.prn = (seed, w, h, n, R) => { const r = H.rng(seed); return Array.from({ length: n }, () => [r.range(w * 0.15, w * 0.85), r.range(h * 0.15, h * 0.85), R * r.range(0.7, 1.2), r() * 50]); };
  CL.marksIn = (seed, w, h, n, len, dep) => { const r = H.rng(seed); return Array.from({ length: n }, () => { const x = r.range(w * 0.1, w * 0.9), y = r.range(h * 0.1, h * 0.9), a = r() * TAU, l = r.range(len * 0.5, len); return [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, dep || r.range(0.8, 1.6)]; }); };

  // ---------- the bake: draw(c) paints the silhouette in local coords [0..w]x[0..h] ----------
  CL.bake = (key, w, h, o) => {
    if (CACHE[key]) return CACHE[key];
    const R = o.R || 14, pad = Math.ceil(R * 2 + 6), ox = o.ox || 0, oy = o.oy || 0;
    const W2 = Math.ceil(w + pad * 2), H2 = Math.ceil(h + pad * 2);
    const M = H.layer(W2, H2), mc = M.getContext('2d', { willReadFrequently: true });
    mc.translate(pad, pad); mc.fillStyle = '#fff'; mc.strokeStyle = '#fff'; o.draw(mc);
    const ds = 3, sw = Math.ceil(W2 / ds), sh = Math.ceil(H2 / ds);
    const Bs = H.layer(sw, sh), bsc = Bs.getContext('2d'); bsc.filter = `blur(${R / ds}px)`; bsc.drawImage(M, 0, 0, sw, sh);
    const B = H.layer(W2, H2), bc = B.getContext('2d', { willReadFrequently: true }); bc.drawImage(Bs, 0, 0, W2, H2);
    const md = mc.getImageData(0, 0, W2, H2).data, bd = bc.getImageData(0, 0, W2, H2).data;
    const Hh = new Float32Array(W2 * H2), A = new Float32Array(W2 * H2), lump = o.lump ?? 1.2, seed = o.seed || 1;
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, a = bd[i * 4 + 3] / 255, ap = H.clamp((a - 0.42) / 0.58);
      A[i] = ap;
      if (!md[i * 4 + 3]) continue;
      const X = x + ox, Y = y + oy;
      Hh[i] = Math.sqrt(1 - (1 - ap) * (1 - ap)) * R * (o.dome ?? 1.1) + nz.n2(X * 0.025 + seed, Y * 0.025) * lump + nz.n2(X * 0.11 + (o.boil || 0) * 1.7, Y * 0.11 + seed) * 0.35;
    }
    // thumbprints: partial warped whorls
    (o.fps || []).forEach((f) => {
      const R2 = f[2], ang = f[3], ca = Math.cos(ang), sa = Math.sin(ang);
      for (let y = Math.max(0, Math.floor(f[1] + pad - R2)); y <= Math.min(H2 - 1, f[1] + pad + R2); y++) for (let x = Math.max(0, Math.floor(f[0] + pad - R2)); x <= Math.min(W2 - 1, f[0] + pad + R2); x++) {
        const dx0 = x - pad - f[0], dy0 = y - pad - f[1], dx = dx0 * ca + dy0 * sa, dy = (-dx0 * sa + dy0 * ca) * 1.45, d = Math.hypot(dx, dy);
        if (d >= R2) continue;
        Hh[y * W2 + x] += Math.sin(d * 1.6 + nz.n2(dx * 0.06 + ang, dy * 0.06) * 2.5) * 0.22 * Math.pow(1 - d / R2, 1.5) * H.smooth(-0.6, 0.4, Math.cos(Math.atan2(dy, dx) - ang * 2));
      }
    });
    // sculpting-tool smears: soft grooves with a raised lip
    (o.marks || []).forEach((m) => {
      const ax = m[0] + pad, ay = m[1] + pad, bx = m[2] + pad, by = m[3] + pad, vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1, dep = m[4] || 1.2;
      for (let y = Math.max(0, Math.floor(Math.min(ay, by) - 9)); y <= Math.min(H2 - 1, Math.max(ay, by) + 9); y++) for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - 9)); x <= Math.min(W2 - 1, Math.max(ax, bx) + 9); x++) {
        const u = H.clamp(((x - ax) * vx + (y - ay) * vy) / L2), d = Math.hypot(x - ax - vx * u, y - ay - vy * u);
        if (d > 8) continue;
        Hh[y * W2 + x] += Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02)) * (-dep * Math.exp((-d * d) / (o.markW || 3.2)) + 0.4 * dep * Math.exp(-((d - 3.4) ** 2) / 2));
      }
    });
    const out = mc.createImageData(W2, H2), od = out.data, base = H.hex(o.color), sss = o.sss || [1.12, 0.92, 0.85];
    for (let y = 1; y < H2 - 1; y++) for (let x = 1; x < W2 - 1; x++) {
      const i = y * W2 + x, ma = md[i * 4 + 3];
      if (!ma) continue;
      const n = nrm([-(Hh[i + 1] - Hh[i - 1]) * 0.5, -(Hh[i + W2] - Hh[i - W2]) * 0.5, 1]);
      const diff = H.clamp((n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2] + 0.42) / 1.42);
      const spec = Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 26) * (o.spec ?? 0.3);
      const k = (0.3 + 0.86 * diff) * (0.72 + 0.28 * Math.min(1, A[i] * 1.4)), sh2 = 1 - diff, k4 = i * 4;
      od[k4] = Math.min(255, base[0] * k * (1 + (sss[0] - 1) * sh2) + spec * 255);
      od[k4 + 1] = Math.min(255, base[1] * k * (1 + (sss[1] - 1) * sh2) + spec * 245);
      od[k4 + 2] = Math.min(255, base[2] * k * (1 + (sss[2] - 1) * sh2) + spec * 230);
      od[k4 + 3] = ma;
    }
    const O = H.layer(W2, H2); O.getContext('2d').putImageData(out, 0, 0); O.pad = pad; O.w = w; O.h = h;
    return (CACHE[key] = O);
  };

  // blurred dark silhouette of a sprite, cached: drawn under it as the cast shadow (no live shadowBlur per frame)
  const SIL = new WeakMap();
  CL.sil = (spr, blur) => {
    let m = SIL.get(spr); if (!m) SIL.set(spr, (m = {}));
    const b = Math.round(blur);
    if (m[b]) return m[b];
    const e = Math.ceil(b * 1.2) + 2, C = H.layer(spr.width + e * 2, spr.height + e * 2), c = C.getContext('2d');
    c.filter = `blur(${b / 2}px)`; c.drawImage(spr, e, e); c.filter = 'none';
    c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgb(40,20,10)'; c.fillRect(0, 0, C.width, C.height);
    C.pad = (spr.pad || 0) + e;
    return (m[b] = C);
  };

  // place a sprite: (x,y) = top-left of its shape box; anchor (ax,ay) in local coords for squash/rotate
  CL.place = (ctx, spr, x, y, o = {}) => {
    if (!spr) return;
    const ax = o.ax ?? spr.w / 2, ay = o.ay ?? spr.h, sx = o.sx ?? 1, sy = o.sy ?? 1, rot = o.rot || 0, al = o.alpha ?? 1;
    if (o.shadow !== false) {
      const s = o.shadow || {}, sl = CL.sil(spr, s.blur ?? 10);
      ctx.save(); ctx.globalAlpha = (s.a ?? 0.4) * al;
      ctx.translate(x + ax + (s.dx ?? 6), y + ay + (s.dy ?? 7)); if (rot) ctx.rotate(rot); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
      ctx.drawImage(sl, -ax - sl.pad, -ay - sl.pad); ctx.restore();
    }
    ctx.save(); if (al !== 1) ctx.globalAlpha = al;
    ctx.translate(x + ax, y + ay); if (rot) ctx.rotate(rot); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.drawImage(spr, -ax - spr.pad, -ay - spr.pad); ctx.restore();
  };

  // ---------- pressed clay letters ----------
  const mctx = () => CACHE.m || (CACHE.m = H.layer(4, 4).getContext('2d'));
  CL.glyph = (ch, px, col) => {
    const key = 'g' + ch + px + col;
    if (CACHE[key]) return CACHE[key];
    const c = mctx(); c.font = CL.FR(px); const w = Math.ceil(c.measureText(ch).width) + 4, h = Math.ceil(px * 1.05);
    return CL.bake(key, w, h, { R: Math.max(4, px * 0.075), dome: 1.3, lump: 0.8, seed: ch.charCodeAt(0), color: col, draw: (x) => { x.font = CL.FR(px); x.fillText(ch, 2, px * 0.82); }, fps: px > 60 ? CL.prn(ch.charCodeAt(0) + px, w, h, 1, px * 0.18) : [] });
  };
  const WCACHE = {};
  CL.charW = (ch, px) => { const k = ch + px; if (WCACHE[k] != null) return WCACHE[k]; const c = mctx(); c.font = CL.FR(px); return (WCACHE[k] = c.measureText(ch).width + px * 0.04); };
  CL.textW = (str, px) => { let w = 0; for (const ch of str) w += CL.charW(ch, px); return w; };
  // draw a clay word; y = baseline. o: align, pop (seconds since it started popping on), step (per-letter stagger),
  // cols (string or array), shadow, seed (wobble), sc (overall scale about the text centre)
  CL.text = (ctx, str, x, y, px, cols, o = {}) => {
    const W = CL.textW(str, px);
    let cx = o.align === 'center' ? x - W / 2 : o.align === 'right' ? x - W : x;
    let i = 0;
    const step = o.step ?? 1 / 24, sh = o.shadow ?? { blur: Math.max(3, px * 0.09), dx: px * 0.05, dy: px * 0.07, a: 0.45 };
    for (const ch of str) {
      const w = CL.charW(ch, px);
      if (ch !== ' ') {
        let sx = 1, sy = 1, ok = true;
        if (o.pop != null) { const e = CL.pop(o.pop - i * step); if (!e) ok = false; else { sx = e[0]; sy = e[1]; } }
        if (ok) {
          const jr = H.rng(ch.charCodeAt(0) * 7 + i + (o.seed || 0));
          const col = typeof cols === 'string' ? cols : cols[(i + (o.colOff || 0)) % cols.length];
          CL.place(ctx, CL.glyph(ch, px, col), cx, y - px * 0.82, { sx, sy, rot: (jr() - 0.5) * (o.wob ?? 0.12), shadow: sh, alpha: o.alpha });
        }
      }
      cx += w; i++;
    }
    return W;
  };

  // a flat clay slab (card), baked per size
  CL.slab = (w, h, col, seed, rad) => CL.bake('slab' + w + 'x' + h + col + (seed || 5), w, h, {
    R: 10, dome: 0.7, lump: 0.9, seed: seed || 5, color: col, sss: [1.04, 1, 1],
    draw: (x) => { x.beginPath(); x.roundRect(0, 0, w, h, rad || 16); x.fill(); },
    fps: CL.prn((seed || 5) + 1, w, h, Math.max(1, Math.round((w * h) / 30000)), 20),
    marks: CL.marksIn((seed || 5) + 2, w, h, Math.max(1, Math.round((w * h) / 60000)), 40, 0.9),
  });

  // compose a card: slab + clay text lines, all baked into one canvas.
  // lines: [{t, px, col, align?, gap?}] ; o: {col (slab), padX, padY, minW, icon:{spr,w,h}}
  CL.card = (key, lines, o = {}) => {
    const ck = 'card:' + key;
    if (CACHE[ck]) return CACHE[ck];
    const padX = o.padX ?? 26, padY = o.padY ?? 18, gapD = 8;
    let tw = 0, th = 0;
    lines.forEach((l) => { tw = Math.max(tw, CL.textW(l.t, l.px)); th += l.px * 1.12 + (l.gap ?? gapD); });
    th -= gapD;
    const iw = o.icon ? o.icon.w + 18 : 0;
    const w = Math.ceil(Math.max(o.minW || 0, tw + padX * 2 + iw)), h = Math.ceil(Math.max(o.minH || 0, th + padY * 2, o.icon ? o.icon.h + padY * 2 : 0));
    const slab = CL.slab(w, h, o.col || '#f6efe3', o.seed || 5);
    const m = 30, C = H.layer(w + m * 2, h + m * 2), c = C.getContext('2d');
    const put = (spr, x, y, s) => { const sl = CL.sil(spr, s.blur); c.globalAlpha = s.a; c.drawImage(sl, x + s.dx - sl.pad, y + s.dy - sl.pad); c.globalAlpha = 1; c.drawImage(spr, x - spr.pad, y - spr.pad); };
    c.drawImage(slab, m - slab.pad, m - slab.pad);
    if (o.icon) put(o.icon.spr, m + padX, m + (h - o.icon.h) / 2, { blur: 6, dx: 3, dy: 4, a: 0.4 });
    let y = m + padY + (h - padY * 2 - th) / 2;
    lines.forEach((l) => {
      const lw = CL.textW(l.t, l.px), area = w - padX * 2 - iw;
      let x = m + padX + iw + (l.align === 'left' ? 0 : (area - lw) / 2);
      const s = { blur: Math.max(3, l.px * 0.08), dx: l.px * 0.04, dy: l.px * 0.06, a: 0.4 };
      let i = 0;
      for (const ch of l.t) {
        if (ch !== ' ') { const jr = H.rng(ch.charCodeAt(0) * 7 + i); const g = CL.glyph(ch, l.px, l.col); c.save(); c.translate(x + g.w / 2, y + g.h); c.rotate((jr() - 0.5) * 0.08); c.translate(-x - g.w / 2, -y - g.h); put(g, x, y, s); c.restore(); }
        x += CL.charW(ch, l.px); i++;
      }
      y += l.px * 1.12 + (l.gap ?? gapD);
    });
    C.pad = m; C.w = w; C.h = h;
    return (CACHE[ck] = C);
  };

  // one line of clay letters (no slab), baked into a single sprite with its shadows: for static labels
  CL.line = (str, px, col) => {
    const ck = 'line:' + str + px + col;
    if (CACHE[ck]) return CACHE[ck];
    const w = Math.ceil(CL.textW(str, px)) + 4, h = Math.ceil(px * 1.1), m = 16;
    const C = H.layer(w + m * 2, h + m * 2), c = C.getContext('2d');
    const s = { blur: Math.max(3, px * 0.09), dx: px * 0.05, dy: px * 0.07, a: 0.45 };
    let x = m, i = 0;
    for (const ch of str) {
      if (ch !== ' ') {
        const g = CL.glyph(ch, px, col), sl = CL.sil(g, s.blur), jr = H.rng(ch.charCodeAt(0) * 7 + i);
        c.save(); c.translate(x + g.w / 2, m + g.h); c.rotate((jr() - 0.5) * 0.1); c.translate(-x - g.w / 2, -m - g.h);
        c.globalAlpha = s.a; c.drawImage(sl, x + s.dx - sl.pad, m + s.dy - sl.pad); c.globalAlpha = 1; c.drawImage(g, x - g.pad, m - g.pad); c.restore();
      }
      x += CL.charW(ch, px); i++;
    }
    C.pad = m; C.w = w; C.h = h;
    return (CACHE[ck] = C);
  };

  // rolled clay coil along a polyline (arrows / bands), baked
  CL.coil = (key, pts, col, wdt, arrow) => {
    const ck = 'coil' + key;
    if (CACHE[ck]) return CACHE[ck];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    x0 -= 30; y0 -= 30; x1 += 30; y1 += 30;
    const spr = CL.bake(ck, x1 - x0, y1 - y0, { R: 7, dome: 1.3, lump: 0.6, seed: key.length * 7, color: col, draw: (c) => {
      c.translate(-x0, -y0); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = wdt || 16;
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      if (arrow) { const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 2], a = Math.atan2(ey - py, ex - px);
        c.beginPath(); c.moveTo(ex + Math.cos(a) * 22, ey + Math.sin(a) * 22); c.lineTo(ex + Math.cos(a + 2.3) * 26, ey + Math.sin(a + 2.3) * 26); c.lineTo(ex + Math.cos(a - 2.3) * 26, ey + Math.sin(a - 2.3) * 26); c.closePath(); c.fill(); }
    } });
    spr.ox = x0; spr.oy = y0;
    return spr;
  };

  // contact AO: one cached blurred ellipse, scaled under anything resting on the table
  CL.contact = (ctx, cx, cy, rx, ry, a = 0.45) => {
    const AO = CACHE.ao || (CACHE.ao = (() => { const C = H.layer(240, 100), c = C.getContext('2d'); c.filter = 'blur(10px)'; c.fillStyle = 'rgb(70,20,5)'; c.beginPath(); c.ellipse(120, 50, 90, 22, 0, 0, TAU); c.fill(); return C; })());
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(AO, cx - (rx * 120) / 90, cy - (ry * 50) / 22, (rx * 240) / 90, (ry * 100) / 22); ctx.restore();
  };

  // ---------- lens finish (same strength as the reference), real-time version ----------
  let FIN = null;
  CL.finish = (ctx, W, Hh, fr) => {
    if (!FIN) {
      FIN = {};
      const gg = ctx.createLinearGradient(0, 0, W, Hh); gg.addColorStop(0, 'rgba(255,220,170,0.5)'); gg.addColorStop(1, 'rgba(40,60,90,0.4)');
      FIN.grade = gg;
      const V = H.layer(W, Hh); H.vignette(V.getContext('2d'), W, Hh, 0.42, '20,12,8'); FIN.vig = V;
      // grain: a few pre-made noise tiles (H.grain reads back the whole frame, far too slow for 60 fps)
      FIN.tiles = [0, 1, 2, 3].map((s) => {
        const T = H.layer(256, 256), c = T.getContext('2d'), img = c.createImageData(256, 256), d = img.data, r = H.rng(40 + s);
        for (let i = 0; i < d.length; i += 4) { const n = r() - 0.5; const v = n > 0 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.abs(n) * 0.06 * 255 * 2; }
        c.putImageData(img, 0, 0); return ctx.createPattern(T, 'repeat');
      });
    }
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = FIN.grade; ctx.fillRect(0, 0, W, Hh); ctx.restore();
    ctx.drawImage(FIN.vig, 0, 0);
    const f = (H.rng(900 + fr)() - 0.5) * 0.06; ctx.fillStyle = f > 0 ? `rgba(255,240,220,${f})` : `rgba(0,0,0,${-f})`; ctx.fillRect(0, 0, W, Hh);
    const r = H.rng(77 + fr);
    ctx.save(); ctx.fillStyle = FIN.tiles[fr % 4]; ctx.translate(-Math.floor(r() * 256), -Math.floor(r() * 256)); ctx.fillRect(0, 0, W + 256, Hh + 256); ctx.restore();
  };
})();
