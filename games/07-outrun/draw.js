// Recycle Run — synthwave-outrun drawing kit. Techniques, palette and finishing passes copied from the style's
// reference-explainer.js (sky + stars, striped sun, wireframe mountains, neon grid floor, neon tubes, chrome
// lettering, bloom, scanlines, grain, vignette) and adapted for real time: every static thing is cached once.
window.D = (function () {
  'use strict';
  const W = 1280, HH = 720;
  const HZ = 410, VPX = 640, FOC = 420, CAMH = 1.25;
  const SUNX = 640, SUNY = 332, SUNR = 168;
  const RW = 4;               // road half-width (world units)
  const proj = (x, h, z) => [VPX + (x / z) * FOC, HZ + ((CAMH - h) / z) * FOC];
  const ORB = '"Orbitron","Arial Black","Segoe UI",sans-serif';
  const SCRIPT = '"Caveat","Segoe Script","Brush Script MT",cursive';
  const F = (px, w = 800) => `${w} ${px}px ${ORB}`;
  const cl = H.clamp;
  const mctx = H.layer(8, 8).getContext('2d');

  // ---------------------------------------------------------------- neon primitives (from the reference)
  function neonStroke(c, col, w, draw) {
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalCompositeOperation = 'lighter';
    const a0 = c.globalAlpha;
    c.strokeStyle = col; c.globalAlpha = 0.18 * a0; c.lineWidth = w * 5; c.beginPath(); draw(); c.stroke();
    c.globalAlpha = 0.45 * a0; c.lineWidth = w * 2.2; c.beginPath(); draw(); c.stroke();
    c.globalAlpha = a0; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, w * 0.7); c.beginPath(); draw(); c.stroke();
    c.restore();
  }
  function neonText(c, txt, x, y, font, col, on = 1, align = 'center') {
    if (on <= 0) return;
    c.save(); c.font = font; c.textAlign = align; c.textBaseline = 'middle';
    c.globalAlpha = on * 0.55; c.shadowColor = 'rgba(14,0,34,0.9)'; c.shadowBlur = 12; c.fillStyle = 'rgba(20,0,44,0.6)'; c.fillText(txt, x, y);
    c.globalAlpha = on; c.shadowColor = col; c.shadowBlur = 22; c.fillStyle = col; c.fillText(txt, x, y);
    c.shadowBlur = 8; c.fillText(txt, x, y);
    c.shadowBlur = 0; const fs = parseFloat((/(\d+(?:\.\d+)?)px/.exec(font) || [0, 24])[1]);
    c.strokeStyle = H.rgba(H.mix(col, '#ffffff', 0.62), 0.9); c.lineWidth = Math.max(0.8, fs * 0.04); c.lineJoin = 'round'; c.strokeText(txt, x, y);
    c.fillStyle = H.rgba(H.mix(col, '#ffffff', 0.45), 1); c.globalAlpha = on * 0.22; c.fillText(txt, x, y);
    c.restore();
  }
  function deadTube(c, txt, x, y, font, col) {
    c.save(); c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(255,120,220,0.08)'; c.fillText(txt, x, y);
    c.strokeStyle = col; c.globalAlpha = 0.6; c.lineWidth = 1.8; c.strokeText(txt, x, y);
    c.globalAlpha = 0.35; c.strokeStyle = 'rgba(230,220,255,1)'; c.lineWidth = 0.7; c.strokeText(txt, x - 0.6, y - 0.8);
    c.restore();
  }
  const flick = (t, t0) => { if (t < t0) return 0; const d = t - t0; if (d > 0.32) return 1; return [1, 0, 1, 0.3, 0, 1, 1, 0.5, 1, 1][Math.floor(d / 0.032)] ?? 1; };
  function neonArrow(c, pts, prog, col, w = 2.5) {
    let total = 0; const L = []; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); L.push(l); total += l; }
    let rem = total * cl(prog); const out = [pts[0]]; let dir = [1, 0];
    for (let i = 0; i < L.length && rem > 0; i++) { const u = Math.min(1, rem / L[i]); const p = [H.lerp(pts[i][0], pts[i + 1][0], u), H.lerp(pts[i][1], pts[i + 1][1], u)]; out.push(p); dir = [(pts[i + 1][0] - pts[i][0]) / L[i], (pts[i + 1][1] - pts[i][1]) / L[i]]; rem -= L[i]; }
    neonStroke(c, col, w, () => {
      c.moveTo(...out[0]); for (const p of out) c.lineTo(...p);
      if (prog >= 1) { const [ex, ey] = out[out.length - 1], a = Math.atan2(dir[1], dir[0]); c.moveTo(ex - Math.cos(a - 0.5) * 16, ey - Math.sin(a - 0.5) * 16); c.lineTo(ex, ey); c.lineTo(ex - Math.cos(a + 0.5) * 16, ey - Math.sin(a + 0.5) * 16); }
    });
  }
  function glint(c, x, y, s, a) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const rg = c.createRadialGradient(x, y, 0, x, y, s * 0.5);
    rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,200,255,0)');
    c.fillStyle = rg; c.fillRect(x - s, y - s, s * 2, s * 2);
    c.fillStyle = `rgba(255,255,255,${a})`;
    c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - 1.6); c.lineTo(x + s, y); c.lineTo(x, y + 1.6); c.fill();
    c.beginPath(); c.moveTo(x, y - s * 0.7); c.lineTo(x - 1.4, y); c.lineTo(x, y + s * 0.7); c.lineTo(x + 1.4, y); c.fill();
    c.restore();
  }
  function chromeTitle(c, text, cx, by, size) {
    c.save();
    c.font = `800 ${size}px ${ORB}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.letterSpacing = '4px';
    const top = by - size * 0.74, bot = by + 2;
    c.translate(cx, by); c.transform(1, 0, -0.22, 1, 0, 0); c.translate(-cx, -by);
    for (let i = 14; i >= 1; i--) {
      const k = i / 14;
      c.fillStyle = H.rgba(H.mix('#ff2fb0', '#1a0533', 0.35 + k * 0.6), 1);
      c.fillText(text, cx + i * 0.55 * size / 100, by + i * 0.9 * size / 100);
    }
    c.lineJoin = 'round';
    c.strokeStyle = '#12032a'; c.lineWidth = Math.max(5, size * 0.09); c.strokeText(text, cx, by);
    const g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, '#0e2a6b'); g.addColorStop(0.18, '#3d7fd6'); g.addColorStop(0.42, '#d9f2ff'); g.addColorStop(0.5, '#ffffff');
    g.addColorStop(0.505, '#2a0a2e'); g.addColorStop(0.58, '#5a1d3a'); g.addColorStop(0.75, '#d0602a'); g.addColorStop(0.9, '#ffc06a'); g.addColorStop(1, '#fff1c8');
    c.fillStyle = g; c.fillText(text, cx, by);
    c.restore();
    const L = H.layer(c.canvas.width, c.canvas.height), lc = L.getContext('2d');
    lc.font = `800 ${size}px ${ORB}`; lc.textAlign = 'center'; lc.letterSpacing = '4px';
    lc.translate(cx, by); lc.transform(1, 0, -0.22, 1, 0, 0); lc.translate(-cx, -by);
    lc.fillStyle = '#000'; lc.fillText(text, cx, by);
    lc.globalCompositeOperation = 'source-atop';
    lc.strokeStyle = 'rgba(255,255,255,0.95)'; lc.lineWidth = 3; lc.strokeText(text, cx - 1.5, by - 2);
    lc.strokeStyle = 'rgba(40,0,60,0.55)'; lc.lineWidth = 3; lc.strokeText(text, cx + 1.5, by + 2.5);
    lc.globalCompositeOperation = 'destination-out';
    lc.fillStyle = '#000'; lc.fillText(text, cx + 0.5, by + 0.5);
    c.drawImage(L, 0, 0);
    c.save();
    c.font = `800 ${size}px ${ORB}`; c.textAlign = 'center'; c.letterSpacing = '4px';
    c.translate(cx, by); c.transform(1, 0, -0.22, 1, 0, 0); c.translate(-cx, -by);
    c.strokeStyle = 'rgba(255,170,240,0.55)'; c.lineWidth = 1.2; c.strokeText(text, cx, by);
    c.restore();
  }
  // hot-pink neon script (Caveat), the reference's subtitle tube
  function scriptTube(c, txt, x, y, px, on, col = '#ff1aa8', rot = -0.06) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.font = `700 ${px}px ${SCRIPT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.shadowColor = 'rgba(16,0,40,0.95)'; c.shadowBlur = 22; c.fillStyle = 'rgba(30,0,50,0.6)'; c.fillText(txt, 0, 0);
    c.shadowBlur = 0; c.strokeStyle = 'rgba(255,150,210,0.3)'; c.lineWidth = 1.6; c.strokeText(txt, 0, 0);
    if (on > 0) {
      c.globalAlpha = on;
      c.shadowColor = col; c.shadowBlur = 28; c.fillStyle = col; c.fillText(txt, 0, 0);
      c.shadowBlur = 12; c.fillText(txt, 0, 0);
      c.shadowBlur = 0; c.strokeStyle = 'rgba(255,215,245,0.9)'; c.lineWidth = 1.5; c.strokeText(txt, 0, 0);
      c.fillStyle = 'rgba(255,190,235,0.9)'; c.globalAlpha = 0.12 * on; c.fillText(txt, 0, 0);
    }
    c.restore();
  }

  // ---------------------------------------------------------------- sprite cache (text glows are baked once)
  const SPR = new Map();
  function clearSprites() { SPR.clear(); }
  function fitSize(txt, px, maxW, family = ORB, weight = 800) {
    mctx.font = `${weight} ${px}px ${family}`; const w = mctx.measureText(txt).width;
    return maxW && w > maxW ? Math.max(12, Math.floor(px * maxW / w)) : px;
  }
  function textW(txt, font) { mctx.font = font; return mctx.measureText(txt).width; }
  function neonSpr(txt, px, col, maxW = 0, family = ORB, weight = 800) {
    const key = 'n|' + txt + '|' + px + '|' + col + '|' + maxW + '|' + family;
    let s = SPR.get(key); if (s) return s;
    const size = fitSize(txt, px, maxW, family, weight), font = `${weight} ${size}px ${family}`;
    const w = textW(txt, font), pad = Math.ceil(size * 0.8);
    const c = H.layer(Math.ceil(w + pad * 2), Math.ceil(size * 1.5 + pad * 2));
    neonText(c.getContext('2d'), txt, c.width / 2, c.height / 2, font, col, 1);
    s = { c, w: c.width, h: c.height, tw: w }; SPR.set(key, s); return s;
  }
  function deadSpr(txt, px, col) {
    const key = 'd|' + txt + '|' + px + '|' + col;
    let s = SPR.get(key); if (s) return s;
    const font = F(px), w = textW(txt, font), pad = 10;
    const c = H.layer(Math.ceil(w + pad * 2), Math.ceil(px * 1.5 + pad * 2));
    deadTube(c.getContext('2d'), txt, c.width / 2, c.height / 2, font, col);
    s = { c, w: c.width, h: c.height }; SPR.set(key, s); return s;
  }
  function chromeSpr(txt, px, maxW = 1180) {
    const key = 'c|' + txt + '|' + px + '|' + maxW;
    let s = SPR.get(key); if (s) return s;
    const size = fitSize(txt, px, maxW - px * 0.5);
    const w = textW(txt, F(size)) + txt.length * 4 + size * 0.8;
    const c = H.layer(Math.ceil(w + 40), Math.ceil(size * 1.45));
    chromeTitle(c.getContext('2d'), txt, c.width / 2, Math.round(size * 1.02), size);
    s = { c, w: c.width, h: c.height }; SPR.set(key, s); return s;
  }
  function scriptSpr(txt, px, col = '#ff1aa8') {
    const key = 's|' + txt + '|' + px + '|' + col;
    let s = SPR.get(key); if (s) return s;
    const w = textW(txt, `700 ${px}px ${SCRIPT}`);
    const c = H.layer(Math.ceil(w + px * 1.6), Math.ceil(px * 2.2));
    scriptTube(c.getContext('2d'), txt, c.width / 2, c.height / 2, px, 1, col);
    s = { c, w: c.width, h: c.height }; SPR.set(key, s); return s;
  }
  function drawSpr(ctx, s, x, y, a = 1, sc = 1) {
    if (a <= 0.003 || !s) return;
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * Math.min(1, a);
    ctx.drawImage(s.c, x - s.w * sc / 2, y - s.h * sc / 2, s.w * sc, s.h * sc); ctx.globalAlpha = ga;
  }

  // ---------------------------------------------------------------- neon line icons (unit box -1..1)
  function iconPath(g, kind, x, y, s) {
    const M = (a, b) => g.moveTo(x + a * s, y + b * s), L = (a, b) => g.lineTo(x + a * s, y + b * s);
    const Q = (a, b, c2, d) => g.quadraticCurveTo(x + a * s, y + b * s, x + c2 * s, y + d * s);
    const C = (a, b, c2, d, e, f) => g.bezierCurveTo(x + a * s, y + b * s, x + c2 * s, y + d * s, x + e * s, y + f * s);
    const R = (a, b, w, h, r = 0.05) => { g.moveTo(x + (a + r) * s, y + b * s); g.roundRect(x + a * s, y + b * s, w * s, h * s, r * s); };
    const EL = (a, b, rx, ry) => { g.moveTo(x + (a + rx) * s, y + b * s); g.ellipse(x + a * s, y + b * s, rx * s, ry * s, 0, 0, Math.PI * 2); };
    const Z = () => g.closePath();
    switch (kind) {
      case 'bottle': R(-0.36, -0.3, 0.72, 1.22, 0.16); M(-0.15, -0.3); L(-0.15, -0.66); L(0.15, -0.66); L(0.15, -0.3); R(-0.19, -0.86, 0.38, 0.2, 0.04); M(-0.36, 0.22); L(0.36, 0.22); break;
      case 'jug': R(-0.48, -0.32, 0.9, 1.24, 0.2); M(-0.18, -0.32); L(-0.14, -0.72); L(0.1, -0.72); L(0.14, -0.32); R(0.42, -0.18, 0.32, 0.56, 0.14); break;
      case 'pipe': EL(-0.6, 0, 0.18, 0.42); M(-0.6, -0.42); L(0.7, -0.42); M(-0.6, 0.42); L(0.7, 0.42); EL(0.7, 0, 0.18, 0.42); EL(0.7, 0, 0.08, 0.22); break;
      case 'frame': R(-0.7, -0.8, 1.4, 1.6, 0.05); R(-0.55, -0.65, 1.1, 1.3, 0.03); M(0, -0.65); L(0, 0.65); M(-0.55, 0); L(0.55, 0); break;
      case 'bag': M(-0.62, -0.2); L(0.62, -0.2); L(0.5, 0.86); L(-0.5, 0.86); Z(); M(-0.42, -0.2); Q(-0.27, -0.85, -0.1, -0.2); M(0.1, -0.2); Q(0.27, -0.85, 0.42, -0.2); break;
      case 'roll': EL(-0.55, -0.1, 0.22, 0.42); M(-0.55, -0.52); L(0.6, -0.52); M(-0.55, 0.32); L(0.6, 0.32); EL(0.6, -0.1, 0.22, 0.42); M(-0.1, 0.32); L(0.0, 0.9); L(0.75, 0.9); L(0.6, 0.32); break;
      case 'squeezy': M(-0.4, -0.28); L(0.4, -0.28); L(0.46, 0.9); L(-0.46, 0.9); Z(); M(-0.4, -0.28); L(-0.12, -0.55); L(0.12, -0.55); L(0.4, -0.28); M(-0.06, -0.55); L(0, -0.95); L(0.06, -0.55); break;
      case 'pot': M(-0.62, -0.38); L(0.62, -0.38); L(0.44, 0.82); L(-0.44, 0.82); Z(); M(-0.74, -0.56); L(0.74, -0.56); L(0.74, -0.38); L(-0.74, -0.38); Z(); break;
      case 'cap': M(-0.62, -0.28); L(0.62, -0.28); L(0.62, 0.45); L(-0.62, 0.45); Z(); for (let i = -2; i <= 2; i++) { M(i * 0.22, -0.28); L(i * 0.22, 0.45); } M(-0.5, -0.28); L(-0.4, -0.5); L(0.4, -0.5); L(0.5, -0.28); break;
      case 'cup': M(-0.6, -0.72); L(0.6, -0.72); L(0.4, 0.86); L(-0.4, 0.86); Z(); M(-0.7, -0.72); L(0.7, -0.72); M(-0.52, -0.12); L(0.52, -0.12); break;
      case 'box': R(-0.75, -0.2, 1.05, 0.95, 0.02); M(-0.75, -0.2); L(-0.42, -0.62); L(0.62, -0.62); L(0.3, -0.2); M(0.3, 0.75); L(0.62, 0.32); L(0.62, -0.62); break;
      case 'sign': R(-0.88, -0.66, 1.76, 1.04, 0.1); M(-0.5, -0.3); L(0.5, -0.3); M(-0.34, 0.02); L(0.34, 0.02); M(0, 0.38); L(-0.32, 0.92); M(0, 0.38); L(0.32, 0.92); break;
      case 'tray': M(-0.92, -0.25); L(0.92, -0.25); L(0.72, 0.42); L(-0.72, 0.42); Z(); M(-0.64, -0.12); L(-0.08, -0.12); L(-0.12, 0.28); L(-0.56, 0.28); Z(); M(0.08, -0.12); L(0.64, -0.12); L(0.56, 0.28); L(0.12, 0.28); Z(); break;
      case 'plate': EL(0, 0.05, 0.92, 0.42); EL(0, 0.05, 0.56, 0.24); break;
      case 'socket': R(-0.78, -0.78, 1.56, 1.56, 0.16); R(-0.42, -0.4, 0.16, 0.32, 0.03); R(0.26, -0.4, 0.16, 0.32, 0.03); R(-0.08, 0.14, 0.16, 0.36, 0.03); break;
      case 'handle': EL(-0.38, 0, 0.5, 0.32); M(0.1, -0.08); L(0.95, -0.2); L(0.95, 0.06); L(0.1, 0.1); break;
      case 'pcb': R(-0.82, -0.62, 1.64, 1.24, 0.05); M(-0.62, -0.32); L(-0.12, -0.32); L(0.08, -0.12); L(0.62, -0.12); M(-0.62, 0.34); L(0.32, 0.34); R(0.3, 0.12, 0.32, 0.36, 0.02); EL(-0.62, -0.32, 0.06, 0.06); EL(-0.62, 0.34, 0.06, 0.06); break;
      case 'hull': M(-0.92, 0.0); L(0.92, 0.0); L(0.6, 0.55); L(-0.6, 0.55); Z(); M(0, 0); L(0, -0.92); M(0.04, -0.86); L(0.55, -0.12); L(0.04, -0.12); break;
      case 'drop': M(0, -0.92); C(0.25, -0.45, 0.65, -0.05, 0.62, 0.35); C(0.6, 0.88, -0.6, 0.88, -0.62, 0.35); C(-0.65, -0.05, -0.25, -0.45, 0, -0.92); M(0.32, 0.2); Q(0.3, 0.5, 0.05, 0.58); break;
      case 'hourglass': M(-0.6, -0.9); L(0.6, -0.9); M(-0.6, 0.9); L(0.6, 0.9); M(-0.48, -0.9); L(0.06, 0); L(-0.48, 0.9); M(0.48, -0.9); L(-0.06, 0); L(0.48, 0.9); M(-0.25, 0.75); L(0.25, 0.75); break;
      case 'fish': M(-0.75, 0); Q(-0.1, -0.62, 0.45, 0); Q(-0.1, 0.62, -0.75, 0); M(0.45, 0); L(0.9, -0.36); L(0.9, 0.36); Z(); EL(-0.42, -0.08, 0.06, 0.06); break;
      case 'flame': M(0, -0.95); C(0.5, -0.4, 0.78, 0.0, 0.56, 0.5); C(0.4, 0.95, -0.4, 0.95, -0.56, 0.5); C(-0.72, 0.05, -0.3, -0.2, 0, -0.95); M(0, 0.1); C(0.25, 0.3, 0.25, 0.7, 0, 0.72); C(-0.25, 0.7, -0.25, 0.3, 0, 0.1); break;
      case 'leaf': M(-0.72, 0.72); C(-0.72, -0.3, 0.2, -0.82, 0.86, -0.82); C(0.82, 0.0, 0.2, 0.72, -0.72, 0.72); M(-0.72, 0.72); L(0.5, -0.46); break;
      case 'noleaf': iconPath(g, 'leaf', x, y, s * 0.8); EL(0, 0, 0.98, 0.98); M(-0.7, 0.7); L(0.7, -0.7); break;
      case 'fire': iconPath(g, 'flame', x, y, s); break;
      default: R(-0.7, -0.7, 1.4, 1.4, 0.2);
    }
  }
  function triPath(g, x, y, s) { // recycling triangle: three chasing arrows
    const V = [[0, -0.95], [0.98, 0.72], [-0.98, 0.72]];
    for (let i = 0; i < 3; i++) {
      const P = V[i], Q = V[(i + 1) % 3];
      const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, nx = -uy, ny = ux;
      const sx = P[0] + dx * 0.16, sy = P[1] + dy * 0.16, ex = P[0] + dx * 0.8, ey = P[1] + dy * 0.8;
      g.moveTo(x + sx * s, y + sy * s); g.lineTo(x + ex * s, y + ey * s);
      g.moveTo(x + (ex - ux * 0.24 + nx * 0.17) * s, y + (ey - uy * 0.24 + ny * 0.17) * s);
      g.lineTo(x + ex * s, y + ey * s);
      g.lineTo(x + (ex - ux * 0.24 - nx * 0.17) * s, y + (ey - uy * 0.24 - ny * 0.17) * s);
    }
  }
  function iconSpr(kind, size, col) {
    const key = 'i|' + kind + '|' + size + '|' + col;
    let s = SPR.get(key); if (s) return s;
    const pad = size * 0.25, c = H.layer(Math.ceil(size * 2 + pad * 2), Math.ceil(size * 2 + pad * 2)), g = c.getContext('2d');
    neonStroke(g, col, Math.max(1.4, size * 0.05), () => (kind === 'recycle' ? triPath(g, c.width / 2, c.height / 2, size) : iconPath(g, kind, c.width / 2, c.height / 2, size)));
    s = { c, w: c.width, h: c.height }; SPR.set(key, s); return s;
  }

  // ---------------------------------------------------------------- gate signs (also used on the junction board)
  // opt: { id, type:'code'|'text', code, lines:[...], icon, sub }
  const SW = 320, SH = 232;
  function wrap(txt, px, maxW) {
    const words = txt.split(' '); let lines = [txt];
    if (textW(txt, F(px)) > maxW && words.length > 1) {
      let best = null;
      for (let k = 1; k < words.length; k++) { const a = words.slice(0, k).join(' '), b = words.slice(k).join(' '); const m = Math.max(textW(a, F(px)), textW(b, F(px))); if (!best || m < best[0]) best = [m, [a, b]]; }
      lines = best[1];
    }
    let size = px; for (const l of lines) size = Math.min(size, fitSize(l, px, maxW));
    return { lines, size };
  }
  function signSpr(opt, learn) {
    const key = 'g|' + opt.id + '|' + (learn ? 1 : 0);
    let s = SPR.get(key); if (s) return s;
    const c = H.layer(SW, SH), g = c.getContext('2d');
    const panel = () => g.roundRect(10, 10, SW - 20, SH - 20, 20);
    const bg = g.createLinearGradient(0, 10, 0, SH - 10); bg.addColorStop(0, 'rgba(26,6,58,0.82)'); bg.addColorStop(1, 'rgba(8,1,22,0.86)');
    g.fillStyle = bg; g.beginPath(); panel(); g.fill();
    // scanline glass on the panel
    g.save(); g.beginPath(); panel(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.025)'; for (let y = 12; y < SH; y += 4) g.fillRect(0, y, SW, 1); g.restore();
    neonStroke(g, '#4ff3ff', 1.6, panel);
    if (opt.type === 'code') {
      const cd = RR.CODES[opt.code];
      const ty = learn ? 72 : 82, ts = learn ? 54 : 64;
      neonStroke(g, '#5cffb0', 3.2, () => triPath(g, SW / 2, ty, ts));
      neonText(g, String(opt.code), SW / 2, ty + 14, F(learn ? 48 : 58), '#ffe066');
      neonText(g, cd.ab, SW / 2, learn ? 152 : 180, F(learn ? 44 : 50), '#ffffff', 1);
      if (learn) neonText(g, cd.ex, SW / 2, 194, F(fitSize(cd.ex, 25, 280)), '#4ff3ff');
    } else {
      const hasIcon = !!opt.icon, hasSub = learn && opt.sub;
      let top = 26;
      if (hasIcon) { const is = iconSpr(opt.icon, 30, '#ff7ad9'); g.drawImage(is.c, SW / 2 - is.w / 2, 58 - is.h / 2); top = 98; }
      const wr = wrap(opt.label, hasIcon ? 38 : 44, 282);
      const bottom = hasSub ? 168 : SH - 22, lh = wr.size * 1.12;
      const mid = (top + bottom) / 2;
      wr.lines.forEach((l, i) => neonText(g, l, SW / 2, mid + (i - (wr.lines.length - 1) / 2) * lh, F(wr.size), opt.col || '#ffe066'));
      if (hasSub) neonText(g, opt.sub, SW / 2, 192, F(fitSize(opt.sub, 25, 280)), '#4ff3ff');
    }
    s = { c, w: SW, h: SH }; SPR.set(key, s); return s;
  }

  // ---------------------------------------------------------------- cars (rear view, cached per player)
  function carSpr(p) {
    const key = 'car|' + p;
    let s = SPR.get(key); if (s) return s;
    const cw = 420, ch = 220, c = H.layer(cw, ch), g = c.getContext('2d');
    const body = p === 1 ? ['#ff4fd8', '#7a0e5e', '#2a0322'] : ['#4ff3ff', '#0e5470', '#03182a'];
    // tyres
    g.fillStyle = '#05010c'; g.beginPath(); g.roundRect(34, 142, 74, 72, 10); g.roundRect(312, 142, 74, 72, 10); g.fill();
    g.fillStyle = 'rgba(120,110,160,0.25)'; g.fillRect(40, 150, 62, 4); g.fillRect(318, 150, 62, 4);
    // lower body
    const bg = g.createLinearGradient(0, 92, 0, 186); bg.addColorStop(0, body[0]); bg.addColorStop(0.18, body[1]); bg.addColorStop(1, body[2]);
    g.fillStyle = bg; g.beginPath(); g.moveTo(22, 108); g.lineTo(60, 88); g.lineTo(360, 88); g.lineTo(398, 108); g.lineTo(404, 168); g.quadraticCurveTo(404, 186, 384, 186); g.lineTo(36, 186); g.quadraticCurveTo(16, 186, 16, 168); g.closePath(); g.fill();
    // chrome bevel on the deck lid
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 2; g.beginPath(); g.moveTo(26, 107); g.lineTo(61, 90); g.lineTo(359, 90); g.lineTo(394, 107); g.stroke();
    // cabin + rear glass with the sunset reflected in it
    g.fillStyle = body[2]; g.beginPath(); g.moveTo(88, 90); g.lineTo(128, 30); g.lineTo(292, 30); g.lineTo(332, 90); g.closePath(); g.fill();
    const gg = g.createLinearGradient(0, 38, 0, 86); gg.addColorStop(0, '#12052c'); gg.addColorStop(0.55, '#5a0f6e'); gg.addColorStop(0.8, '#ff4fa0'); gg.addColorStop(1, '#ffc06a');
    g.fillStyle = gg; g.beginPath(); g.moveTo(104, 86); g.lineTo(136, 40); g.lineTo(284, 40); g.lineTo(316, 86); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(150, 40); g.lineTo(178, 40); g.lineTo(140, 86); g.lineTo(112, 86); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(128, 31); g.lineTo(292, 31); g.stroke();
    // tail-light bar with louvres (Testarossa)
    g.fillStyle = '#200008'; g.beginPath(); g.roundRect(34, 112, 352, 40, 6); g.fill();
    const tl = g.createLinearGradient(0, 114, 0, 150); tl.addColorStop(0, '#ff8aa0'); tl.addColorStop(0.4, '#ff1f4f'); tl.addColorStop(1, '#8a0024');
    g.fillStyle = tl; g.beginPath(); g.roundRect(40, 116, 116, 32, 4); g.roundRect(264, 116, 116, 32, 4); g.fill();
    g.fillStyle = 'rgba(20,0,8,0.85)'; for (let y = 121; y < 148; y += 6) { g.fillRect(40, y, 116, 2); g.fillRect(264, y, 116, 2); }
    // plate
    g.fillStyle = '#0a0418'; g.beginPath(); g.roundRect(164, 114, 92, 38, 5); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1.5; g.stroke();
    neonText(g, 'P' + p, 210, 134, F(26), p === 1 ? '#ff4fd8' : '#4ff3ff');
    // exhausts
    g.fillStyle = '#9aa6d8'; g.beginPath(); g.ellipse(150, 176, 12, 7, 0, 0, 7); g.ellipse(270, 176, 12, 7, 0, 0, 7); g.fill();
    g.fillStyle = '#05010c'; g.beginPath(); g.ellipse(150, 176, 8, 4.5, 0, 0, 7); g.ellipse(270, 176, 8, 4.5, 0, 0, 7); g.fill();
    // spoiler
    g.fillStyle = body[1]; g.fillRect(48, 78, 324, 8); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.strokeRect(48, 78, 324, 8);
    s = { c, w: cw, h: ch }; SPR.set(key, s); return s;
  }

  // ---------------------------------------------------------------- palm silhouette sprite
  function palmSpr(flip) {
    const key = 'palm|' + flip;
    let s = SPR.get(key); if (s) return s;
    const c = H.layer(300, 420), g = c.getContext('2d');
    if (flip) { g.translate(300, 0); g.scale(-1, 1); }
    g.lineCap = 'round';
    const trunk = () => { g.moveTo(150, 420); g.quadraticCurveTo(140, 250, 190, 110); };
    g.strokeStyle = '#0a0216'; g.lineWidth = 16; g.beginPath(); trunk(); g.stroke();
    g.strokeStyle = 'rgba(255,79,216,0.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(158, 420); g.quadraticCurveTo(148, 250, 197, 112); g.stroke();
    const fr = [[-2.6, 120], [-2.1, 135], [-1.4, 120], [-0.7, 125], [-0.1, 115], [0.5, 100], [-3.0, 100]];
    for (const [a, l] of fr) {
      const ex = 190 + Math.cos(a) * l, ey = 110 + Math.sin(a) * l * 0.55 + 40;
      const mx = 190 + Math.cos(a) * l * 0.5, my = 110 + Math.sin(a) * l * 0.4 - 22;
      g.fillStyle = '#0a0216'; g.beginPath(); g.moveTo(190, 108); g.quadraticCurveTo(mx, my - 10, ex, ey); g.quadraticCurveTo(mx, my + 16, 190, 114); g.fill();
      g.strokeStyle = 'rgba(255,120,220,0.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(190, 108); g.quadraticCurveTo(mx, my - 10, ex, ey); g.stroke();
    }
    s = { c, w: 300, h: 420 }; SPR.set(key, s); return s;
  }

  // ---------------------------------------------------------------- static layers
  let skyL, mountL, floorL, vigL, scanP, grainC = [], sunF = [], bloomL, bctx, twinkle = [];
  function buildStatic() {
    // sky + stars + sun halo
    skyL = H.layer(W, HZ + 4); let c = skyL.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, '#05021a'); g.addColorStop(0.45, '#1c0640'); g.addColorStop(0.78, '#5a0f6e'); g.addColorStop(0.94, '#c41a7e'); g.addColorStop(1, '#ff4fa0');
    c.fillStyle = g; c.fillRect(0, 0, W, HZ + 4);
    const r = H.rng(404);
    for (let i = 0; i < 240; i++) {
      const x = r.range(0, W), y = Math.pow(r(), 1.6) * HZ * 0.8, s = r.range(0.6, 1.8);
      c.fillStyle = `rgba(255,${r.int(200, 255)},255,${0.3 + r() * 0.55})`; c.fillRect(x, y, s, s);
      if (s > 1.6 && y < HZ * 0.5) twinkle.push([x, y, s, r.range(1, 4), r() * 6]);
    }
    const bgr = c.createRadialGradient(SUNX, SUNY, SUNR * 0.6, SUNX, SUNY, SUNR * 2.1);
    bgr.addColorStop(0, 'rgba(255,90,150,0.55)'); bgr.addColorStop(0.5, 'rgba(255,40,140,0.15)'); bgr.addColorStop(1, 'rgba(255,40,140,0)');
    c.fillStyle = bgr; c.fillRect(SUNX - SUNR * 2.2, SUNY - SUNR * 2.2, SUNR * 4.4, SUNR * 4.4);
    // striped sun: 11 frames of the scrolling stripes (period 22 px)
    for (let k = 0; k < 11; k++) {
      const L = H.layer(SUNR * 2 + 4, SUNR * 2 + 4), lc = L.getContext('2d'), cx = SUNR + 2, cy = SUNR + 2;
      lc.beginPath(); lc.arc(cx, cy, SUNR, 0, Math.PI * 2);
      const sg = lc.createLinearGradient(0, cy - SUNR, 0, cy + SUNR * 0.6);
      sg.addColorStop(0, '#fff6a0'); sg.addColorStop(0.3, '#ffd23f'); sg.addColorStop(0.55, '#ff8a3d'); sg.addColorStop(0.8, '#ff3d7f'); sg.addColorStop(1, '#d4147f');
      lc.fillStyle = sg; lc.fill();
      lc.globalCompositeOperation = 'destination-out';
      for (let j = -1; j < 14; j++) {
        const y = cy - SUNR * 0.18 + j * 22 + k * 2;
        const f = cl((y - (cy - SUNR * 0.22)) / SUNR);
        lc.fillRect(0, y, SUNR * 2 + 4, 2 + f * 11);
      }
      sunF.push(L);
    }
    // wireframe mountains
    mountL = H.layer(W, HZ + 60); c = mountL.getContext('2d');
    const nz = H.makeNoise(19), xs = [], zs = [];
    for (let x = -70; x <= 70; x += 2.6) xs.push(x);
    for (let z = 80; z >= 26; z -= 2.4) zs.push(z);
    const hAt = (x, z) => {
      const ax = Math.abs(x), ridge = H.smooth(5.5, 16, ax);
      const n = nz.fbm2(x * 0.075 + 3, z * 0.09, 4) * 0.5 + 0.5;
      return ridge * (Math.pow(n, 1.6) * 36 + 2) * (H.smooth(30, 60, z) * 0.5 + 0.5) * H.smooth(26, 40, z);
    };
    const P = zs.map((z) => xs.map((x) => { const h = hAt(x, z); return [...proj(x, h, z), h]; }));
    c.lineJoin = 'round';
    for (let j = 0; j < zs.length - 1; j++) {
      const depth = 1 - j / (zs.length - 1);
      for (let i = 0; i < xs.length - 1; i++) {
        const a = P[j][i], b = P[j][i + 1], cc = P[j + 1][i + 1], d = P[j + 1][i];
        const hh = (a[2] + b[2] + cc[2] + d[2]) / 4; if (hh < 0.01) continue;
        const shade = cl(hh / 26);
        c.fillStyle = H.rgba(H.mix('#120531', '#3a0f63', shade * 0.8), 1);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill();
        const lc = H.mix('#b02cff', '#4ff3ff', H.smooth(0.55, 1, shade));
        const qh = Math.max(Math.abs(d[1] - a[1]), Math.abs(cc[1] - b[1])), dens = cl((qh - 1) / 7);
        c.strokeStyle = H.rgba(lc, (0.3 + 0.6 * (1 - depth)) * dens); c.lineWidth = 1.1; c.stroke();
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(cc[0], cc[1]); c.strokeStyle = H.rgba(lc, (0.15 + 0.3 * (1 - depth)) * dens); c.stroke();
      }
    }
    // floor, static grid rails, road, edges, horizon flare
    floorL = H.layer(W, HH); c = floorL.getContext('2d');
    const fg = c.createLinearGradient(0, HZ + 1, 0, HH); fg.addColorStop(0, '#2a0838'); fg.addColorStop(0.15, '#12041f'); fg.addColorStop(1, '#07010f');
    c.fillStyle = fg; c.fillRect(0, HZ + 1, W, HH - HZ);
    c.save(); c.beginPath(); c.rect(0, HZ, W, HH - HZ); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (const [lw, col] of [[6, 'rgba(255,30,170,0.12)'], [2.6, 'rgba(255,50,190,0.35)'], [1.1, 'rgba(255,150,230,0.9)']]) {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      for (let x = RW + 0.6; x <= 120; x += 2.6) for (const s of [-1, 1]) { const [x0, y0] = proj(s * x, 0, 0.4), [x1, y1] = proj(s * x, 0, 120); c.moveTo(x0, y0); c.lineTo(x1, y1); }
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    const [l0x, l0y] = proj(-RW, 0, 0.4), [r0x] = proj(RW, 0, 0.4), [l1x, l1y] = proj(-RW, 0, 120), [r1x] = proj(RW, 0, 120);
    const rg = c.createLinearGradient(0, HZ, 0, HH); rg.addColorStop(0, '#1a0830'); rg.addColorStop(1, '#0b0418');
    c.fillStyle = rg; c.beginPath(); c.moveTo(l0x, l0y); c.lineTo(l1x, l1y); c.lineTo(r1x, l1y); c.lineTo(r0x, l0y); c.closePath(); c.fill();
    const sgr = c.createLinearGradient(0, HZ, 0, HH);
    sgr.addColorStop(0, 'rgba(255,120,120,0.55)'); sgr.addColorStop(0.35, 'rgba(255,60,160,0.15)'); sgr.addColorStop(1, 'rgba(255,60,160,0)');
    c.fillStyle = sgr; c.beginPath(); c.moveTo(VPX - 3, HZ); c.lineTo(VPX + 3, HZ); c.lineTo(VPX + 190, HH); c.lineTo(VPX - 190, HH); c.fill();
    c.globalCompositeOperation = 'lighter';
    for (const [lw, a] of [[10, 0.12], [4, 0.35], [1.6, 1]]) {
      c.strokeStyle = `rgba(80,240,255,${a})`; c.lineWidth = lw;
      c.beginPath(); c.moveTo(l0x, l0y); c.lineTo(l1x, l1y); c.moveTo(r0x, l0y); c.lineTo(r1x, l1y); c.stroke();
    }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    const hl = c.createLinearGradient(0, 0, W, 0);
    hl.addColorStop(0, 'rgba(255,80,180,0)'); hl.addColorStop(0.5, 'rgba(255,200,230,0.95)'); hl.addColorStop(1, 'rgba(255,80,180,0)');
    c.fillStyle = hl; c.fillRect(0, HZ - 1, W, 2.5);
    const hg = c.createLinearGradient(0, HZ - 10, 0, HZ + 30);
    hg.addColorStop(0, 'rgba(255,60,160,0)'); hg.addColorStop(0.3, 'rgba(255,60,160,0.35)'); hg.addColorStop(1, 'rgba(255,60,160,0)');
    c.fillStyle = hg; c.fillRect(0, HZ - 10, W, 40);
    c.restore();
    // finishing passes: vignette, scanlines, grain tiles, bloom buffer
    vigL = H.layer(W, HH); H.vignette(vigL.getContext('2d'), W, HH, 0.5, '6,0,20');
    const sp = H.layer(4, 3), spc = sp.getContext('2d'); spc.fillStyle = 'rgba(0,0,0,0.12)'; spc.fillRect(0, 0, 4, 1);
    scanP = sp;
    for (let k = 0; k < 4; k++) {
      const gc = H.layer(256, 256), gx = gc.getContext('2d'), img = gx.createImageData(256, 256), d = img.data, rr = H.rng(900 + k);
      for (let i = 0; i < d.length; i += 4) { const n = rr() - 0.5; const v = n > 0 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.abs(n) * 2 * 26; }
      gx.putImageData(img, 0, 0); grainC.push(gc);
    }
    bloomL = H.layer(W / 4, HH / 4); bctx = bloomL.getContext('2d');
  }

  let pats = null;
  function drawSky(ctx, t) {
    ctx.drawImage(skyL, 0, 0);
    ctx.fillStyle = 'rgba(220,240,255,1)';
    for (const [x, y, s, sp, ph] of twinkle) {
      const tw = 0.5 + 0.5 * Math.sin(t * sp + ph); ctx.globalAlpha = 0.6 * tw;
      ctx.fillRect(x - 6, y + s / 2 - 0.5, 12 + s, 1); ctx.fillRect(x + s / 2 - 0.5, y - 6, 1, 12 + s);
    }
    ctx.globalAlpha = 1;
    const k = Math.floor(((t * 10) % 22) / 2) % 11;
    ctx.drawImage(sunF[k], SUNX - SUNR - 2, SUNY - SUNR - 2);
    ctx.drawImage(mountL, 0, 0);
  }
  function drawFloor(ctx, dist) {
    ctx.drawImage(floorL, 0, 0);
    // lateral grid lines race toward the camera
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const off = dist % 2.6;
    const path = new Path2D();
    for (let z = 2.6 - off; z < 110; z += 2.6) {
      if (z < 0.4) continue;
      const [, y] = proj(0, 0, z), [xl] = proj(-RW, 0, z), [xr] = proj(RW, 0, z);
      path.moveTo(0, y); path.lineTo(xl, y); path.moveTo(xr, y); path.lineTo(W, y);
    }
    for (const [lw, col] of [[6, 'rgba(255,30,170,0.12)'], [2.6, 'rgba(255,50,190,0.35)'], [1.1, 'rgba(255,150,230,0.9)']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke(path); }
    ctx.restore();
  }
  function finish(ctx, t, bloomAmt = 0.3) {
    // bloom (reference: quarter-res blur, screen)
    bctx.filter = 'blur(4px)'; bctx.clearRect(0, 0, bloomL.width, bloomL.height);
    bctx.drawImage(ctx.canvas, 0, 0, bloomL.width, bloomL.height); bctx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = bloomAmt; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bloomL, 0, 0, W, HH); ctx.restore();
    if (!pats) pats = { scan: ctx.createPattern(scanP, 'repeat'), grain: grainC.map((g) => ctx.createPattern(g, 'repeat')) };
    // CRT scanlines
    ctx.save(); ctx.translate(0, Math.floor(t * 20) % 3); ctx.fillStyle = pats.scan; ctx.fillRect(0, -3, W, HH + 3); ctx.restore();
    // grain
    const fr = Math.floor(t * 12), gr = H.rng(fr + 12);
    ctx.save(); ctx.translate(-gr() * 256, -gr() * 256); ctx.fillStyle = pats.grain[fr % 4]; ctx.fillRect(0, 0, W + 256, HH + 256); ctx.restore();
    ctx.drawImage(vigL, 0, 0);
  }

  return {
    W, HH, HZ, VPX, FOC, CAMH, RW, SUNX, SUNY, SUNR, proj, ORB, SCRIPT, F,
    neonStroke, neonText, deadTube, flick, neonArrow, glint, chromeTitle, scriptTube,
    SPR, clearSprites, fitSize, textW, neonSpr, deadSpr, chromeSpr, scriptSpr, drawSpr, iconPath, triPath, iconSpr,
    signSpr, SW, SH, carSpr, palmSpr, buildStatic, drawSky, drawFloor, finish,
  };
})();
