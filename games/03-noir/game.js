// Plastic Fantastic: a polymer whodunit — station 03 (co-op).
// Style: 1940s film noir (cork case board, mugshot placards, venetian-blind light, smoke haze, nitrate grain,
// gate weave, projector flicker, typewriter text, spinning newspaper headlines). Red string/pins/stamps are the
// one hand-tinted accent.
(function () {
  'use strict';
  const W = 1280, Hh = 720, BAR = 54;
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  GS.fit(cv, W, Hh);
  const { SUSPECTS, CASES, TRAINING } = window.NOIR_DATA;
  const N = SUSPECTS.length;
  const gy = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
  const RED = '#9e2b22', RED_D = '#5e1712', RED_L = '#c9483b';
  const sm = H.smooth, E = H.ease, clamp = H.clamp;

  // ---------- fonts (Google Fonts with sensible Windows/Linux fallbacks) ----------
  const F = {
    osw: (s, w = 700) => `${w} ${s}px Oswald, "Arial Narrow", Impact, "DejaVu Sans Condensed", sans-serif`,
    type: (s) => `400 ${s}px "Special Elite", "Courier Prime", "Courier New", Courier, monospace`,
    cour: (s, w = 400) => `${w} ${s}px "Courier Prime", "Courier New", Courier, monospace`,
    lime: (s) => `400 ${s}px Limelight, Georgia, "DejaVu Serif", serif`,
    play: (s) => `italic 400 ${s}px "Playfair Display", Georgia, "DejaVu Serif", serif`,
    frak: (s) => `400 ${s}px UnifrakturMaguntia, "Old English Text MT", Georgia, serif`,
    anton: (s) => `400 ${s}px Anton, Impact, "Arial Narrow", "DejaVu Sans Condensed", sans-serif`,
  };
  function fit(c, text, fontFn, size, maxW, minSize = 18) {
    let s = size; c.font = fontFn(s);
    while (s > minSize && c.measureText(text).width > maxW) { s -= 1; c.font = fontFn(s); }
    return s;
  }
  function wrap(c, text, maxW) {
    const words = text.split(' '), out = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line); return out;
  }
  // newsreel lettering: white bold caps with a black keyline
  function NR(c, s, x, y, size, align = 'center', alpha = 1, fontFn = F.osw) {
    if (alpha <= 0) return; c.save(); c.globalAlpha = Math.min(1, alpha); c.font = fontFn(size); c.textAlign = align; c.lineJoin = 'round';
    c.lineWidth = size * 0.16; c.strokeStyle = gy(0); c.strokeText(s, x, y); c.fillStyle = gy(250); c.fillText(s, x, y); c.restore();
  }

  // ================= cached textures (from the reference, adapted for real time) =================
  let corkTex = null, hazeTex = null, lampTex = null, slatTex = null, vigTex = null, grainTex = [];
  function getCork() {
    if (corkTex) return corkTex;
    const c = H.layer(W, Hh), x = c.getContext('2d'), img = x.createImageData(W, Hh), d = img.data, R = H.rng(1212), nz = H.makeNoise(1213);
    for (let y = 0; y < Hh; y++) for (let xx = 0; xx < W; xx++) {
      const v = 112 + nz.n2(xx * 0.02, y * 0.02) * 16 + (R() - 0.5) * 46 + (R() < 0.04 ? -40 : 0);
      const i = (y * W + xx) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    // dark wooden frame round the board
    const fr = 16, wood = x.createLinearGradient(0, 0, 0, Hh); wood.addColorStop(0, gy(70)); wood.addColorStop(1, gy(30));
    x.fillStyle = wood; x.fillRect(0, BAR - 4, W, fr); x.fillRect(0, Hh - BAR - fr + 4, W, fr); x.fillRect(0, 0, fr, Hh); x.fillRect(W - fr, 0, fr, Hh);
    x.fillStyle = gy(140, 0.6); x.fillRect(fr, BAR - 4 + fr, W - 2 * fr, 2); x.fillStyle = gy(0, 0.5); x.fillRect(fr, Hh - BAR - fr + 2, W - 2 * fr, 3);
    // old pin holes & tape scraps for history
    const R2 = H.rng(77);
    for (let k = 0; k < 70; k++) { x.fillStyle = gy(30, 0.7); x.beginPath(); x.arc(R2() * W, BAR + R2() * (Hh - 2 * BAR), 1.6, 0, 7); x.fill(); }
    return (corkTex = c);
  }
  function getHaze() { // cigarette-smoke strata: white, alpha = density; half-res
    if (hazeTex) return hazeTex;
    const w = W >> 1, h = Hh >> 1, s = H.layer(w, h), x = s.getContext('2d'), img = x.createImageData(w, h), d = img.data, nz = H.makeNoise(1414);
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      const q = nz.n2(xx * 0.004, y * 0.01) * 1.6, v = nz.fbm2(xx * 0.007 + q, y * 0.02, 4);
      const i = (y * w + xx) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = clamp((v + 0.15) * 1.5) * 255;
    }
    x.putImageData(img, 0, 0); return (hazeTex = s);
  }
  function getLamp() { // desk-lamp key light (multiply)
    if (lampTex) return lampTex;
    const c = H.layer(W, Hh), x = c.getContext('2d');
    const g = x.createRadialGradient(640, 220, 60, 640, 330, 800); g.addColorStop(0, gy(255)); g.addColorStop(0.45, gy(232)); g.addColorStop(0.8, gy(180)); g.addColorStop(1, gy(110));
    x.fillStyle = g; x.fillRect(0, 0, W, Hh); return (lampTex = c);
  }
  function getSlats() { // venetian-blind shadows (multiply): 34 px period, 17 px slats, slope 0.5, real penumbra; tall for sway
    if (slatTex) return slatTex;
    const h = Hh + 120, c = H.layer(W >> 1, h >> 1), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, h);
    x.save(); x.filter = 'blur(3px)'; x.scale(0.5, 0.5); x.fillStyle = gy(0, 0.3);
    const x0 = -200, X1 = W + 200, dy = (X1 - x0) * 0.5; x.beginPath();
    for (let k = -4; k < 60; k++) { const y = k * 34; x.moveTo(x0, y); x.lineTo(X1, y - dy); x.lineTo(X1, y - dy + 17); x.lineTo(x0, y + 17); x.closePath(); }
    x.fill();
    x.globalAlpha = 0.4; x.strokeStyle = '#000'; x.lineWidth = 10; x.beginPath(); x.moveTo(820 - 60 * 0.55, -60); x.lineTo(820 + (h + 60) * 0.55, h + 60); x.stroke();
    x.restore(); return (slatTex = c);
  }
  function getVignette() {
    if (vigTex) return vigTex;
    const c = H.layer(W, Hh), x = c.getContext('2d'); // one multiply pass: warm silver tone x desk lamp x projector vignette
    x.fillStyle = 'rgb(255,251,243)'; x.fillRect(0, 0, W, Hh);
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.85; x.drawImage(getLamp(), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    H.vignette(x, W, Hh, 0.72, '0,0,0'); return (vigTex = c);
  }
  function getGrain(k) { // nitrate grain, mid-grey based, used through 'overlay'
    if (grainTex[k]) return grainTex[k];
    const c = H.layer(W, Hh), x = c.getContext('2d'), img = x.createImageData(W, Hh), d = img.data, R = H.rng(900 + k);
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (R() + R() + R() - 1.5) * 95; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0); return (grainTex[k] = c);
  }
  const paperCache = new Map();
  function paper(w, h, base, seed) {
    const key = w + 'x' + h + base + seed; if (paperCache.has(key)) return paperCache.get(key);
    const c = H.layer(w, h), x = c.getContext('2d'); H.paper(x, w, h, base, seed, 0.07);
    // foxing, a coffee ring and darkened edges
    const R = H.rng(seed); for (let k = 0; k < 14; k++) { x.fillStyle = gy(90, 0.05 + R() * 0.05); x.beginPath(); x.arc(R() * w, R() * h, 2 + R() * 8, 0, 7); x.fill(); }
    if (seed % 2) { x.strokeStyle = gy(80, 0.13); x.lineWidth = 5; x.beginPath(); x.arc(w * 0.82, h * 0.25, 36, 0.4, 5.6); x.stroke(); }
    const eg = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.6); eg.addColorStop(0, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(40,30,20,0.28)');
    x.fillStyle = eg; x.fillRect(0, 0, w, h);
    paperCache.set(key, c); return c;
  }
  function card(c, x, y, w, h, rot, base, seed) { // paper card with soft cast shadow, pinned
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 16; c.shadowOffsetX = 8; c.shadowOffsetY = 10; c.fillStyle = base; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
    c.drawImage(paper(w, h, base, seed), -w / 2, -h / 2);
    c.restore();
  }
  function pushPin(c, x, y, r = 6, col = null) {
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(x + 3, y + 4, r * 0.95, 0, 7); c.fill();
    const pn = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.5, x, y, r);
    if (col) { pn.addColorStop(0, '#f2a59b'); pn.addColorStop(0.4, col); pn.addColorStop(1, RED_D); }
    else { pn.addColorStop(0, gy(245)); pn.addColorStop(0.4, gy(120)); pn.addColorStop(1, gy(30)); }
    c.fillStyle = pn; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }

  // ================= the suspects: each drawn as its own product, with a face =================
  function eyes(c, x, y, sp, look, o = {}) {
    for (const s of [-1, 1]) {
      c.fillStyle = gy(246); c.beginPath(); c.ellipse(x + s * sp, y, 6.2, 5.2, 0, 0, 7); c.fill();
      c.strokeStyle = gy(25); c.lineWidth = 1.4; c.stroke();
      c.fillStyle = gy(12); c.beginPath(); c.arc(x + s * sp + look * 2.6, y + 0.6, 2.7, 0, 7); c.fill();
      c.fillStyle = gy(255); c.beginPath(); c.arc(x + s * sp + look * 2.6 - 1, y - 0.6, 0.8, 0, 7); c.fill();
      if (o.lid) { c.fillStyle = o.lid; c.beginPath(); c.ellipse(x + s * sp, y - 2.2, 7, 3.6, 0, Math.PI, 0); c.fill(); c.strokeStyle = gy(25); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + s * sp - 6.6, y - 1.6); c.lineTo(x + s * sp + 6.6, y - 1.6); c.stroke(); }
      if (o.lash) { c.strokeStyle = gy(15); c.lineWidth = 1.3; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + s * sp + k * 3, y - 4.6); c.lineTo(x + s * sp + k * 4.2 + s * 1.2, y - 8); c.stroke(); } }
      c.strokeStyle = gy(15); c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath();
      const b = o.brow || 0; // >0 = angry (down to the centre), <0 = raised
      c.moveTo(x + s * sp - 6, y - 9 - (s < 0 ? -b : b) * 2); c.lineTo(x + s * sp + 6, y - 9 - (s < 0 ? b : -b) * 2);
      if (o.raise && s > 0) { c.moveTo(x + s * sp - 6, y - 12); c.lineTo(x + s * sp + 6, y - 13.5); }
      if (!(o.raise && s > 0)) c.stroke(); else { c.stroke(); }
      c.lineCap = 'butt';
    }
  }
  function mouth(c, x, y, w, kind) {
    c.strokeStyle = gy(15); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
    if (kind === 'smirk') { c.moveTo(x - w, y); c.quadraticCurveTo(x, y + 2, x + w, y - 4); }
    else if (kind === 'flat') { c.moveTo(x - w, y + 1); c.lineTo(x + w, y - 1); }
    else if (kind === 'smile') { c.moveTo(x - w, y - 2); c.quadraticCurveTo(x, y + 5, x + w, y - 2); }
    else if (kind === 'o') { c.ellipse(x, y, w * 0.4, w * 0.5, 0, 0, 7); }
    c.stroke(); c.lineCap = 'butt';
  }
  function fedora(c, x, y, w, tilt, shade = 28) {
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.fillStyle = gy(shade); c.beginPath(); c.ellipse(0, 0, w * 0.62, w * 0.12, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-w * 0.36, 0); c.bezierCurveTo(-w * 0.38, -w * 0.3, -w * 0.3, -w * 0.44, -w * 0.06, -w * 0.4);
    c.quadraticCurveTo(0, -w * 0.33, w * 0.06, -w * 0.4); c.bezierCurveTo(w * 0.3, -w * 0.44, w * 0.38, -w * 0.3, w * 0.36, 0); c.closePath(); c.fill();
    c.fillStyle = gy(shade + 95); c.fillRect(-w * 0.36, -w * 0.11, w * 0.72, w * 0.07);
    c.fillStyle = gy(255, 0.18); c.beginPath(); c.ellipse(-w * 0.15, -w * 0.3, w * 0.12, w * 0.05, -0.4, 0, 7); c.fill();
    c.restore();
  }
  function cyl(c, x0, x1, y0, y1, lo, hi) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, gy(lo)); g.addColorStop(0.35, gy(hi)); g.addColorStop(1, gy(lo * 0.7)); return g; }
  const CHAR = {
    ACRYLIC(c) { // a glossy polished sheet on a display foot
      c.fillStyle = gy(40); c.beginPath(); c.moveTo(-20, 30); c.lineTo(20, 30); c.lineTo(26, 38); c.lineTo(-26, 38); c.fill();
      c.save(); c.rotate(-0.06);
      const g = c.createLinearGradient(-28, -40, 28, 32); g.addColorStop(0, gy(240)); g.addColorStop(1, gy(150));
      c.fillStyle = g; c.beginPath(); c.roundRect(-28, -42, 56, 74, 3); c.fill();
      c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,0.75)';
      c.beginPath(); c.moveTo(-18, -42); c.lineTo(-6, -42); c.lineTo(-28, 0); c.lineTo(-28, -22); c.fill();
      c.beginPath(); c.moveTo(16, -42); c.lineTo(22, -42); c.lineTo(-10, 32); c.lineTo(-16, 32); c.fill(); c.restore();
      c.strokeStyle = gy(255, 0.95); c.lineWidth = 2.6; c.beginPath(); c.roundRect(-28, -42, 56, 74, 3); c.stroke(); // polished edge
      c.strokeStyle = gy(30); c.lineWidth = 1; c.beginPath(); c.roundRect(-29.5, -43.5, 59, 77, 4); c.stroke();
      eyes(c, 0, -10, 10, -1, { lash: true, lid: gy(205) });
      mouth(c, 1, 8, 7, 'smile'); c.fillStyle = gy(20); c.beginPath(); c.arc(11, 4, 1.4, 0, 7); c.fill();
      c.restore();
    },
    HIPS(c) { // a vacuum-formed tray: the cavities are his eyes and grin; flat cap
      const g = c.createLinearGradient(0, -26, 0, 34); g.addColorStop(0, gy(225)); g.addColorStop(1, gy(140));
      c.fillStyle = gy(20, 0.5); c.beginPath(); c.roundRect(-38, -22, 80, 60, 7); c.fill();
      c.fillStyle = g; c.beginPath(); c.roundRect(-40, -24, 80, 58, 7); c.fill();
      c.strokeStyle = gy(250, 0.8); c.lineWidth = 2; c.beginPath(); c.roundRect(-37, -21, 74, 52, 5); c.stroke();
      for (const s of [-1, 1]) { const cg = c.createRadialGradient(s * 16 - 3, -6, 2, s * 16, -4, 13); cg.addColorStop(0, gy(80)); cg.addColorStop(1, gy(170));
        c.fillStyle = cg; c.beginPath(); c.ellipse(s * 16, -4, 13, 10, 0, 0, 7); c.fill(); }
      eyes(c, 0, -4, 16, 1, { brow: 0.6 });
      const mg = c.createLinearGradient(0, 12, 0, 26); mg.addColorStop(0, gy(70)); mg.addColorStop(1, gy(160));
      c.fillStyle = mg; c.beginPath(); c.roundRect(-24, 12, 48, 13, 5); c.fill();
      c.fillStyle = gy(240); for (let k = 0; k < 5; k++) c.fillRect(-19 + k * 8, 13, 6, 5);
      c.fillStyle = gy(48); c.beginPath(); c.ellipse(-2, -28, 30, 9, -0.05, 0, 7); c.fill();
      c.fillStyle = gy(34); c.beginPath(); c.ellipse(18, -23, 18, 5, 0.15, 0, 7); c.fill();
      c.fillStyle = gy(110); c.fillRect(-26, -30, 2, 2); c.fillRect(-14, -34, 2, 2); c.fillRect(0, -35, 2, 2); c.fillRect(12, -33, 2, 2);
    },
    HDPE(c) { // a milk bottle with a handle; grumpy, stubbly
      c.fillStyle = gy(40); c.fillRect(-10, -52, 20, 10); c.fillStyle = gy(90); for (let k = 0; k < 5; k++) c.fillRect(-9 + k * 4, -52, 1.5, 10);
      c.beginPath(); c.moveTo(-8, -42); c.lineTo(-8, -36); c.quadraticCurveTo(-30, -26, -30, -12); c.lineTo(-30, 30); c.quadraticCurveTo(-30, 38, -22, 38);
      c.lineTo(22, 38); c.quadraticCurveTo(30, 38, 30, 30); c.lineTo(30, -12); c.quadraticCurveTo(30, -26, 8, -36); c.lineTo(8, -42); c.closePath();
      c.fillStyle = cyl(c, -30, 30, 0, 0, 150, 240); c.fill(); c.strokeStyle = gy(40); c.lineWidth = 1.2; c.stroke();
      c.fillStyle = gy(110); c.beginPath(); c.ellipse(18, -18, 6, 9, 0.3, 0, 7); c.fill(); // handle hole
      c.strokeStyle = gy(255, 0.6); c.lineWidth = 3; c.beginPath(); c.moveTo(-20, -18); c.lineTo(-20, 28); c.stroke();
      eyes(c, -3, 2, 10, -1, { brow: 1, lid: gy(200) });
      mouth(c, -3, 20, 8, 'flat');
      c.fillStyle = gy(60, 0.7); const R = H.rng(5); for (let k = 0; k < 26; k++) c.fillRect(-14 + R() * 22, 22 + R() * 8, 1.2, 1.2);
    },
    PP(c) { // a flip-top cap, lid thrown back on its living hinge
      c.save(); c.translate(-6, -30); c.rotate(-0.55);
      c.fillStyle = gy(70); c.beginPath(); c.ellipse(0, 0, 26, 8, 0, 0, 7); c.fill();
      c.fillStyle = gy(130); c.beginPath(); c.ellipse(0, -2, 24, 6, 0, 0, 7); c.fill();
      c.fillStyle = gy(60); c.beginPath(); c.arc(4, -2, 4, 0, 7); c.fill(); c.restore();
      c.strokeStyle = gy(60); c.lineWidth = 5; c.beginPath(); c.moveTo(-26, -14); c.quadraticCurveTo(-32, -20, -26, -24); c.stroke(); // hinge
      c.fillStyle = cyl(c, -28, 28, 0, 0, 105, 215); c.fillRect(-28, -12, 56, 46);
      c.fillStyle = gy(185); c.beginPath(); c.ellipse(0, -12, 28, 7, 0, 0, 7); c.fill();
      c.fillStyle = gy(90); c.beginPath(); c.ellipse(0, -13, 7, 3, 0, 0, 7); c.fill();
      c.strokeStyle = gy(60, 0.55); c.lineWidth = 1; for (let k = -24; k <= 24; k += 4) { c.beginPath(); c.moveTo(k, 24); c.lineTo(k, 33); c.stroke(); }
      c.fillStyle = gy(80); c.beginPath(); c.ellipse(0, 34, 28, 6, 0, 0, Math.PI); c.fill();
      eyes(c, 0, 4, 10, 1, { lash: true, raise: true });
      mouth(c, 2, 18, 7, 'smirk');
    },
    PVC(c) { // a length of drain pipe in a fedora, cable trailing with a plug
      c.strokeStyle = gy(25); c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-18, 30); c.bezierCurveTo(-46, 36, -48, 8, -38, -2); c.stroke();
      c.strokeStyle = gy(110); c.lineWidth = 2; c.beginPath(); c.moveTo(-19, 28); c.bezierCurveTo(-44, 33, -45, 9, -37, -1); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = gy(50); c.fillRect(-44, -12, 12, 10); c.fillStyle = gy(200); c.fillRect(-42, -18, 2.5, 6); c.fillRect(-36, -18, 2.5, 6);
      c.fillStyle = cyl(c, -20, 20, 0, 0, 95, 200); c.fillRect(-20, -30, 40, 68);
      c.fillStyle = cyl(c, -23, 23, 0, 0, 110, 215); c.fillRect(-23, -26, 46, 10);
      c.strokeStyle = gy(30, 0.6); c.lineWidth = 1; c.strokeRect(-23, -26, 46, 10);
      eyes(c, 0, 0, 9, -1, { brow: 0.7, lid: gy(150) });
      mouth(c, 0, 16, 6, 'smirk');
      fedora(c, 2, -30, 58, 0.12, 24);
    },
    PET(c) { // a clear fizzy-drinks bottle with petal feet and bubbles
      c.fillStyle = gy(45); c.fillRect(-8, -54, 16, 9); c.fillStyle = gy(110); for (let k = 0; k < 4; k++) c.fillRect(-7 + k * 4, -54, 1.5, 9);
      c.fillStyle = gy(70); c.fillRect(-10, -45, 20, 2.5);
      const body = () => { c.beginPath(); c.moveTo(-7, -42); c.quadraticCurveTo(-7, -32, -20, -22); c.quadraticCurveTo(-24, -14, -20, -2); c.quadraticCurveTo(-17, 4, -21, 12);
        c.lineTo(-22, 30); c.quadraticCurveTo(-22, 38, -14, 38); c.quadraticCurveTo(-8, 34, -3, 38); c.quadraticCurveTo(3, 34, 8, 38); c.quadraticCurveTo(14, 34, 18, 38); c.quadraticCurveTo(22, 36, 22, 30);
        c.lineTo(21, 12); c.quadraticCurveTo(17, 4, 20, -2); c.quadraticCurveTo(24, -14, 20, -22); c.quadraticCurveTo(7, -32, 7, -42); c.closePath(); };
      body(); c.fillStyle = gy(200, 0.32); c.fill();
      c.save(); body(); c.clip(); c.fillStyle = gy(60, 0.45); c.fillRect(-30, -24, 60, 70);
      c.strokeStyle = gy(255, 0.75); c.lineWidth = 1.2; const R = H.rng(9); for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(-16 + R() * 32, -20 + R() * 54, 1 + R() * 2.2, 0, 7); c.stroke(); }
      c.restore();
      body(); c.strokeStyle = gy(250, 0.95); c.lineWidth = 2; c.stroke();
      c.fillStyle = gy(30); c.fillRect(-21, 14, 43, 12); c.fillStyle = gy(235); c.font = F.osw(10); c.textAlign = 'center'; c.fillText('FIZZ', 0, 24);
      c.strokeStyle = gy(255, 0.9); c.lineWidth = 3; c.beginPath(); c.moveTo(-14, -16); c.lineTo(-15, 8); c.stroke();
      eyes(c, 0, -10, 8.5, 1, { brow: -0.5 });
      mouth(c, 0, 5, 3.5, 'o');
    },
  };

  // mugshot booking photo (reference mugshot(), with the polymer characters) — cached per size
  const mugCache = new Map();
  function mug(i, w) {
    const key = i + '_' + w; if (mugCache.has(key)) return mugCache.get(key);
    const h = Math.round(w * 1.25), pad = 30, cnv = H.layer(w + pad * 2, h + pad * 2), c = cnv.getContext('2d'), S = SUSPECTS[i];
    c.translate(pad + w / 2, pad + h / 2);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 14; c.shadowOffsetX = 8; c.shadowOffsetY = 10; c.fillStyle = gy(230); c.fillRect(-w / 2, -h / 2, w, h); c.restore();
    const pg = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); pg.addColorStop(0, gy(248)); pg.addColorStop(1, gy(205));
    c.fillStyle = pg; c.fillRect(-w / 2, -h / 2, w, h);
    const bw = Math.max(6, w * 0.05), bg = c.createLinearGradient(0, -h / 2, 0, h / 2); bg.addColorStop(0, gy(150)); bg.addColorStop(1, gy(82));
    c.fillStyle = bg; c.fillRect(-w / 2 + bw, -h / 2 + bw, w - 2 * bw, h - 2 * bw);
    c.strokeStyle = gy(95, 0.8); c.lineWidth = 1; for (let k = 1; k < 6; k++) { const yy = -h / 2 + bw + k * (h - 2 * bw) / 6; c.beginPath(); c.moveTo(-w / 2 + bw, yy); c.lineTo(w / 2 - bw, yy); c.stroke(); }
    c.fillStyle = gy(185, 0.8); c.font = F.cour(Math.round(w * 0.055)); c.textAlign = 'left'; for (let k = 1; k < 6; k++) c.fillText(String(7 - k) + "'", -w / 2 + bw + 3, -h / 2 + bw + k * (h - 2 * bw) / 6 - 3);
    c.save(); c.beginPath(); c.rect(-w / 2 + bw, -h / 2 + bw, w - 2 * bw, h - 2 * bw); c.clip();
    c.translate(0, -w * 0.15); c.scale(w / 100, w / 100); CHAR[S.id](c); c.restore();
    // booking placard
    const px = -w * 0.41, py = h * 0.17, pw = w * 0.82, ph = h * 0.25;
    c.fillStyle = gy(22); c.fillRect(px, py, pw, ph); c.fillStyle = gy(70); c.fillRect(px, py, pw, 2);
    c.fillStyle = gy(238); c.textAlign = 'center';
    const big = fit(c, S.id, F.osw, Math.round(w * 0.2), pw - 12, 20); c.font = F.osw(big); c.fillText(S.id, 0, py + ph * (w >= 250 ? 0.52 : 0.62));
    c.fillStyle = gy(200); const sm2 = fit(c, w >= 250 ? S.full.toUpperCase() : 'No. 1946-0' + (i + 1), F.cour, Math.round(w * (w >= 250 ? 0.062 : 0.075)), pw - 10, 10);
    c.font = F.cour(sm2); c.fillText(w >= 250 ? S.full.toUpperCase() : 'No. 1946-0' + (i + 1), 0, py + ph * (w >= 250 ? 0.84 : 0.9));
    c.strokeStyle = gy(60, 0.5); c.lineWidth = 1; c.strokeRect(-w / 2 + bw + 0.5, -h / 2 + bw + 0.5, w - 2 * bw - 1, h - 2 * bw - 1);
    // curled corner + push pin
    const cs = w * 0.17, ex = w / 2, ey = h / 2;
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.moveTo(ex - cs, ey); c.lineTo(ex, ey - cs); c.lineTo(ex + 3, ey + 4); c.fill();
    const cg = c.createLinearGradient(ex - cs, ey - cs, ex - cs * 0.4, ey - cs * 0.4); cg.addColorStop(0, gy(255)); cg.addColorStop(1, gy(170));
    c.fillStyle = cg; c.beginPath(); c.moveTo(ex - cs, ey); c.lineTo(ex, ey - cs); c.quadraticCurveTo(ex - cs * 0.55, ey - cs * 0.55, ex - cs * 0.82, ey - cs * 0.82); c.closePath(); c.fill();
    pushPin(c, 0, -h / 2 + 5, 6);
    const m = { cnv, w, h, pad }; mugCache.set(key, m); return m;
  }
  function drawMug(c, i, x, y, w, rot = 0, sc = 1, alpha = 1) {
    const m = mug(i, w); c.save(); c.globalAlpha = alpha; c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.drawImage(m.cnv, -m.pad - w / 2, -m.pad - m.h / 2); c.restore();
  }

  // ---------- newspaper (reference newspaper(), with polymer mugshot in the wire photo) ----------
  let htPat = null;
  function halftone(c) {
    if (htPat) return htPat;
    const p = H.layer(6, 12), x = p.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.18)';
    for (const [px, py] of [[0, 0], [6, 0], [0, 12], [6, 12], [3, 6]]) { x.beginPath(); x.arc(px, py, 1.5, 0, 7); x.fill(); }
    return (htPat = c.createPattern(p, 'repeat'));
  }
  const newsCache = new Map();
  function newspaper(c, cx, cy, sc, rot, head, sub, susIdx, kicker) { // rendered once per headline, then transformed
    const key = head + '|' + sub + '|' + susIdx + '|' + kicker;
    let pc = newsCache.get(key);
    if (!pc) { if (newsCache.size > 10) newsCache.clear(); pc = H.layer(860, 560); const x = pc.getContext('2d'); x.translate(430, 270); newspaperDraw(x, head, sub, susIdx, kicker); newsCache.set(key, pc); }
    c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(sc, sc); c.drawImage(pc, -430, -270); c.restore();
  }
  function newspaperDraw(c, head, sub, susIdx, kicker) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.1)'; for (let k = 8; k >= 0; k--) { const g = k * 2.5; c.fillRect(-400 + 12 - g, -250 + 18 - g, 800 + 2 * g, 500 + 2 * g); }
    const np = c.createLinearGradient(-400, -250, 400, 250); np.addColorStop(0, gy(242)); np.addColorStop(0.5, gy(226)); np.addColorStop(1, gy(198));
    c.fillStyle = np; c.fillRect(-400, -250, 800, 500);
    const fd = c.createLinearGradient(-30, 0, 30, 0); fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(0.45, 'rgba(0,0,0,0.13)'); fd.addColorStop(0.55, 'rgba(255,255,255,0.18)'); fd.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = fd; c.fillRect(-30, -250, 60, 500);
    c.fillStyle = gy(25); c.textAlign = 'center'; c.font = F.frak(56); c.fillText('The Daily Polymer', 0, -190);
    c.fillRect(-375, -174, 750, 3); c.fillRect(-375, -166, 750, 1);
    c.font = F.cour(16); c.fillText(kicker || 'LATE CITY EDITION  ★  THERMOFORMING SPECIAL  ★  FIVE CENTS', 0, -150);
    const hs = fit(c, head, F.anton, 78, 740, 40); c.font = F.anton(hs); c.fillText(head, 0, -78);
    const ss = fit(c, sub, F.play, 32, 740, 22); c.font = F.play(ss); c.fillText(sub, 0, -34);
    const ph = c.createRadialGradient(-250, 60, 20, -210, 110, 230); ph.addColorStop(0, gy(190)); ph.addColorStop(1, gy(80));
    c.fillStyle = ph; c.fillRect(-375, -8, 300, 236);
    if (susIdx === 'all') { for (let k = 0; k < N; k++) drawMug(c, k, -330 + (k % 3) * 105, 50 + Math.floor(k / 3) * 116, 84, 0, 1); }
    else if (susIdx != null) drawMug(c, susIdx, -225, 110, 150, 0, 1);
    c.fillStyle = halftone(c); c.fillRect(-375, -8, 300, 236);
    c.strokeStyle = gy(40); c.lineWidth = 2; c.strokeRect(-375, -8, 300, 236);
    c.fillStyle = gy(115); for (let col = 0; col < 2; col++) for (let k = 0; k < 20; k++) c.fillRect(-50 + col * 215, -4 + k * 11.5, 195 - (k % 7 === 6 ? 80 : 0), 4);
    c.restore();
  }
  // rubber stamp slammed down (red ink, the hand-tinted accent)
  function stamp(c, x, y, word, p, rot = -0.16, size = 54, light = false) {
    if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); const s = 2.2 - 1.2 * E.out(Math.min(1, p)); c.scale(s, s); c.globalAlpha = Math.min(1, p * 1.5) * 0.92;
    c.font = F.osw(size); const tw = c.measureText(word).width + size * 0.7, th = size * 1.35;
    if (light) { c.fillStyle = 'rgba(20,10,10,0.55)'; c.fillRect(-tw / 2 - 4, -th / 2 - 4, tw + 8, th + 8); }
    c.strokeStyle = light ? RED_L : RED; c.lineWidth = size * 0.1; c.strokeRect(-tw / 2, -th / 2, tw, th);
    c.fillStyle = light ? RED_L : RED; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, 0, size * 0.04); c.restore();
  }
  // stopwatch: chrome bezel (from the reference's dials) + a clock-wipe of the time left
  function stopwatch(c, x, y, r, frac, secs, urgent) {
    c.save();
    c.fillStyle = gy(12, 0.8); c.beginPath(); c.arc(x + 3, y + 4, r + 4, 0, 7); c.fill();
    const bz = c.createLinearGradient(x, y - r, x, y + r); bz.addColorStop(0, gy(215)); bz.addColorStop(1, gy(55));
    c.fillStyle = bz; c.beginPath(); c.arc(x, y, r + 4, 0, 7); c.fill();
    c.fillStyle = gy(150); c.fillRect(x - 6, y - r - 14, 12, 10); c.fillStyle = gy(90); c.fillRect(x - 9, y - r - 18, 18, 5);
    const fg = c.createRadialGradient(x - 10, y - 12, 4, x, y, r); fg.addColorStop(0, gy(248)); fg.addColorStop(1, gy(178));
    c.fillStyle = fg; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = urgent ? 'rgba(158,43,34,0.55)' : gy(60, 0.35); c.beginPath(); c.moveTo(x, y); c.arc(x, y, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); c.closePath(); c.fill();
    c.strokeStyle = gy(40); c.lineWidth = 2; for (let k = 0; k < 12; k++) { const b = k * Math.PI / 6; c.beginPath(); c.moveTo(x + Math.cos(b) * (r - 8), y + Math.sin(b) * (r - 8)); c.lineTo(x + Math.cos(b) * (r - 2), y + Math.sin(b) * (r - 2)); c.stroke(); }
    const a = -Math.PI / 2 + Math.PI * 2 * frac; c.strokeStyle = gy(20); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6)); c.stroke();
    c.fillStyle = gy(15); c.font = F.osw(30); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 5; c.strokeStyle = gy(240); c.strokeText(String(secs), x, y + 13); c.fillText(String(secs), x, y + 13);
    c.textBaseline = 'alphabetic';
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, r - 6, -2.7, -1.8); c.stroke(); c.lineCap = 'butt';
    c.restore();
  }
  // odometer for the team score (reference odometer())
  function odometer(c, x, y, value, digits, h) {
    const w = h * 0.62, bw = digits * (w + 4) + 12, bh = h + 12;
    const bz = c.createLinearGradient(0, y - 6, 0, y - 6 + bh); bz.addColorStop(0, gy(92)); bz.addColorStop(0.5, gy(40)); bz.addColorStop(1, gy(18));
    c.fillStyle = bz; c.fillRect(x - 6, y - 6, bw, bh); c.fillStyle = gy(170); c.fillRect(x - 6, y - 6, bw, 2);
    c.fillStyle = gy(8); c.fillRect(x - 2, y - 2, bw - 8, h + 4);
    for (let k = 0; k < digits; k++) {
      const place = Math.pow(10, digits - 1 - k), v = value / place, d = Math.floor(v) % 10;
      const fr = digits - 1 - k === 0 ? v % 1 : (value % place) / place > 0.9 ? ((value % place) / place - 0.9) * 10 : 0;
      const wx = x + k * (w + 4);
      c.save(); c.beginPath(); c.rect(wx, y, w, h); c.clip();
      const g2 = c.createLinearGradient(0, y, 0, y + h); g2.addColorStop(0, gy(120)); g2.addColorStop(0.5, gy(240)); g2.addColorStop(1, gy(120));
      c.fillStyle = g2; c.fillRect(wx, y, w, h);
      c.fillStyle = gy(20); c.font = F.cour(Math.round(h * 0.82), 700); c.textAlign = 'center';
      c.fillText(String(d), wx + w / 2, y + h * 0.8 - fr * h); c.fillText(String((d + 1) % 10), wx + w / 2, y + h * 1.8 - fr * h);
      c.restore();
    }
    const gl = c.createLinearGradient(0, y, 0, y + h); gl.addColorStop(0, 'rgba(0,0,0,0.35)'); gl.addColorStop(0.15, 'rgba(255,255,255,0.22)'); gl.addColorStop(0.35, 'rgba(255,255,255,0.04)'); gl.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = gl; c.fillRect(x, y, digits * (w + 4) - 4, h);
  }

  // ================= game state =================
  let S = null, amb = 0;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const idxOf = (id) => SUSPECTS.findIndex((s) => s.id === id);
  function buildDeck() {
    const pool = CASES.filter((c) => c.title !== 'THE HINGE JOB');
    const l1 = shuffle(pool.filter((c) => c.lvl === 1)), l2 = shuffle(pool.filter((c) => c.lvl === 2));
    let deck = l1.slice(0, 5).concat(shuffle(l1.slice(5).concat(l2)));
    for (let pass = 0; pass < 4; pass++) for (let i = 1; i < deck.length; i++) if (deck[i].ans === deck[i - 1].ans) { const j = (i + 2 + Math.floor(Math.random() * (deck.length - 3))) % deck.length; [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  }
  function reset() {
    S = {
      mode: GS.phase === 'idle' ? 'attract' : 'brief', clock: 0, modeT: 0, score: 0, shown: 0, streak: 0, best: 0, solved: 0,
      fileIdx: 0, fileT: 0, fileGT: 0, filesSeen: new Set([0]), wipe: null,
      cursor: [1, 4], pins: [null, null], talk: null, cleared: new Set(), wrongs: 0, disagree: -9,
      deck: buildDeck(), caseNo: 0, cs: null, caseT: 0, caseDur: 24, left: 24, res: null, news: null, floaters: [], lift: new Array(N).fill(0),
      lastTick: -1, keysShown: 0, lastKey: 0, trainingDone: false, irisT: -9,
    };
    GS.score(0);
  }
  function setMode(m) { S.mode = m; S.modeT = S.clock; }
  function startBrief() { setMode('brief'); }
  const learnLen = () => GS.t + GS.learnLeft();
  const briefLen = () => Math.min(10, learnLen() * 0.11);
  const fileLen = () => clamp((learnLen() - briefLen() - 14) / N, 3, 11);
  function startFiles() { setMode('files'); S.fileIdx = 0; S.fileT = S.clock; S.fileGT = Math.max(GS.t, briefLen()); S.filesSeen = new Set([0]); GS.sfx('paper', { gain: 0.8 }); }
  function startTraining() { setMode('training'); loadCase(TRAINING, 30); GS.sfx('slap', { gain: 0.6 }); }
  function startTest() { setMode('test'); S.caseNo = 0; S.score = 0; S.streak = 0; S.solved = 0; GS.score(0); S.irisT = S.clock; nextCase(); }
  function loadCase(cs, dur) {
    S.cs = cs; S.caseT = S.clock; S.caseDur = dur; S.left = dur; S.pins = [null, null]; S.talk = null; S.cleared = new Set(); S.wrongs = 0; S.res = null; S.news = null; S.lastTick = -1;
  }
  function nextCase() {
    if (!S.deck.length) S.deck = buildDeck();
    const cs = S.deck.shift(); S.caseNo++;
    loadCase(cs, Math.max(13, Math.round(25 - 1.3 * (S.caseNo - 1))));
    GS.sfx('paper', { gain: 0.7 }); GS.sfx('slap', { gain: 0.4 });
  }
  function floater(text, x, y, big) { S.floaters.push({ text, x, y, t0: S.clock, big }); }
  function setScore(v) { S.score = Math.max(0, v); GS.score(S.score); }

  function accuse(j) {
    const cs = S.cs, sus = SUSPECTS[j], training = S.mode === 'training', mx = mugX(j);
    if (sus.id === cs.ans) {
      const speed = training ? 0 : Math.ceil(5 * S.left / S.caseDur), streakB = training ? 0 : Math.min(6, 2 * S.streak);
      const pts = training ? 0 : 10 + speed + streakB;
      if (!training) { S.streak++; S.best = Math.max(S.best, S.streak); S.solved++; setScore(S.score + pts); floater('+' + pts, mx, 390, true); }
      S.res = { kind: 'correct', t0: S.clock, j, pts, speed, streakB };
      S.news = { t0: S.clock + 0.55, head: cs.head, sub: cs.why, j, kicker: training ? 'TRAINING EDITION  ★  NO POINTS AT STAKE' : null };
      GS.sfx('stamp', { gain: 0.9 }); GS.sfx('bell', { f: 'A6', gain: 0.8 });
    } else {
      S.cleared.add(j); S.pins = [null, null]; S.talk = { j, t0: S.clock, real: true };
      S.streak = 0; S.wrongs++;
      if (!training) { setScore(S.score - 3); floater('−3', mx, 390, true); }
      S.lift[j] = 0; S.wrongT = S.clock; S.wrongJ = j;
      GS.sfx('stamp', { gain: 0.7 }); GS.sfx('buzz', { f: 98, dur: 0.28, gain: 0.8 });
      if (!training && S.wrongs >= 2) S.coldAt = S.clock + 2.2;
    }
  }
  function goCold(reason) {
    const cs = S.cs, j = idxOf(cs.ans);
    S.res = { kind: 'cold', t0: S.clock, j, reason }; S.streak = 0; S.pins = [null, null]; S.coldAt = null;
    S.news = { t0: S.clock + 0.3, head: 'COLD CASE: IT WAS ' + cs.ans + '!', sub: cs.why + '.', j, kicker: 'LATE CITY EDITION  ★  THE CULPRIT REVEALED' };
    GS.sfx('impact', { gain: 0.6 });
  }

  // ================= layout =================
  const ROW_Y = 528, MUG_W = 166;
  const mugX = (i) => 118 + i * 209;
  const CASE = { x: 30, y: 72, w: 600, h: 292 }, PANEL = { x: 654, y: 74, w: 598, h: 290 };

  // ================= update =================
  function update(dt) {
    S.clock += dt;
    const anyA = GS.hit(1, 'a') || GS.hit(2, 'a');
    if (S.mode === 'brief') {
      if ((anyA && S.clock - S.modeT > 1.5) || GS.t >= briefLen()) startFiles();
    } else if (S.mode === 'files') {
      let d = 0;
      if (GS.hit(1, 'down') || GS.hit(2, 'down') || GS.hit(1, 'right') || GS.hit(2, 'right') || anyA) d = 1;
      if (GS.hit(1, 'up') || GS.hit(2, 'up') || GS.hit(1, 'left') || GS.hit(2, 'left')) d = -1;
      if (GS.t - S.fileGT >= fileLen()) { d = 1; S.fileGT += fileLen(); } // auto-advance on the lesson clock
      if (d) {
        const n = S.fileIdx + d;
        if (n >= N) { startTraining(); return; }
        if (n >= 0) { S.wipe = { from: S.fileIdx, t0: S.clock, dir: d }; S.fileIdx = n; S.fileT = S.clock; S.filesSeen.add(n); if (d && !(GS.t - S.fileGT < 0.01)) S.fileGT = Math.max(S.fileGT, GS.t); GS.sfx('paper', { gain: 0.8 }); GS.sfx('slap', { gain: 0.35 }); }
      }
    } else if (S.mode === 'training' || S.mode === 'test') {
      updateCase(dt);
    }
    // floaters & lifts
    S.floaters = S.floaters.filter((f) => S.clock - f.t0 < 1.6);
    for (let i = 0; i < N; i++) { const on = S.cursor[0] === i || S.cursor[1] === i; S.lift[i] += ((on ? 1 : 0) - S.lift[i]) * Math.min(1, dt * 12); }
    S.shown += (S.score - S.shown) * Math.min(1, dt * 4); if (Math.abs(S.score - S.shown) < 0.02) S.shown = S.score;
  }
  function updateCase(dt) {
    const training = S.mode === 'training';
    if (S.res) {
      const age = S.clock - S.res.t0;
      if (training && S.res.kind === 'correct' && age > 3.6) { S.trainingDone = true; GS.skipLearn(); if (GS.phase === 'learn') { S.res = null; S.news = null; startTraining(); } return; }
      if (!training && age > 3.6) nextCase();
      return;
    }
    if (S.coldAt && S.clock >= S.coldAt) { goCold('two'); return; }
    if (!training) {
      S.left = Math.max(0, S.caseDur - (S.clock - S.caseT));
      const sec = Math.ceil(S.left);
      if (sec <= 5 && sec !== S.lastTick && sec > 0) { S.lastTick = sec; GS.sfx('tock', { f: 900, gain: 0.5 }); }
      if (S.left <= 0) { goCold('time'); return; }
    }
    if (S.coldAt) return; // revealing after two wrong guesses
    for (const p of [1, 2]) {
      const k = p - 1;
      let mv = 0;
      if (GS.hit(p, 'left') || GS.hit(p, 'up')) mv = -1;
      if (GS.hit(p, 'right') || GS.hit(p, 'down')) mv = 1;
      if (mv) { S.cursor[k] = (S.cursor[k] + mv + N) % N; S.talk = { j: S.cursor[k], t0: S.clock, real: S.cleared.has(S.cursor[k]) }; GS.sfx('tock', { f: p === 1 ? 640 : 760, gain: 0.35, pan: p === 1 ? -0.4 : 0.4 }); }
      if (GS.hit(p, 'a')) {
        const j = S.cursor[k];
        if (S.cleared.has(j)) { GS.sfx('error', { gain: 0.5 }); S.clearedMsg = S.clock; }
        else { S.pins[k] = j; GS.sfx('click', { gain: 0.8, pan: p === 1 ? -0.4 : 0.4 }); GS.sfx('thud', { f: 200, gain: 0.25 }); if (!S.talk || S.talk.j !== j) S.talk = { j, t0: S.clock, real: false }; }
      }
      if (GS.hit(p, 'b') && S.pins[k] != null) { S.pins[k] = null; GS.sfx('swish', { gain: 0.4 }); }
    }
    if (S.pins[0] != null && S.pins[1] != null) {
      if (S.pins[0] === S.pins[1]) accuse(S.pins[0]);
      else if (S.clock - S.disagree > 2.4) { S.disagree = S.clock; GS.sfx('buzz', { f: 140, dur: 0.15, gain: 0.35 }); }
    }
  }

  // ================= typewriter =================
  function typeLines(lines, t0, cps) {
    let n = Math.max(0, (S ? S.clock : 0) - t0) * cps; const out = []; let cur = -1, total = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (n >= l.length) { out.push(l); n -= l.length + 6; total += l.length; }
      else { const k = Math.max(0, Math.floor(n)); out.push(l.slice(0, k)); total += k; if (cur < 0 && n > -6) cur = i; n = -1e9; }
    }
    return { out, cur, total };
  }
  let typedSeen = 0, typedKey = '';
  function typeSound(key, total) { // throttled typebar clicks while text appears
    if (key !== typedKey) { typedKey = key; typedSeen = total; return; }
    if (total > typedSeen && amb - S.lastKey > 0.07) { S.lastKey = amb; GS.sfx(Math.random() < 0.3 ? 'typebar' : 'key', { gain: 0.45 }); }
    typedSeen = total;
  }

  // ================= drawing: scenes =================
  function lighting(c, sway, a = 1) {
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = a;
    c.drawImage(getSlats(), 0, -60 + sway, W, Hh + 120); c.restore();
  }
  function pool(c, x, y, rx, ry, a) {
    c.save(); c.globalCompositeOperation = 'screen'; c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.5, `rgba(255,255,255,${a * 0.45})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
  }
  function haze(c, a) {
    const hz = getHaze(), off = (amb * 9) % W;
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = a; c.drawImage(hz, -off, BAR, W, Hh - 2 * BAR); c.drawImage(hz, W - off, BAR, W, Hh - 2 * BAR); c.restore();
  }
  const steamSpr = [];
  function steamSprite(k) { // pre-blurred smoke wisps, 4 shapes; cross-faded at run time (no per-frame blur filter)
    if (steamSpr[k]) return steamSpr[k];
    const c = H.layer(120, 190), x = c.getContext('2d'); x.filter = 'blur(3px)'; x.lineCap = 'round';
    for (let s = 0; s < 3; s++) { x.strokeStyle = `rgba(255,255,255,${0.22 - s * 0.05})`; x.lineWidth = 6 + s * 8; x.beginPath();
      const wx = 50 + s * 6 + Math.sin(k * 1.6 + s) * 6, y = 180; x.moveTo(wx, y); x.bezierCurveTo(wx - 22, y - 40, wx + 26 + Math.sin(k * 2.1) * 10, y - 80, wx - 4 + Math.cos(k) * 6, y - 130 - s * 10); x.stroke(); }
    return (steamSpr[k] = c);
  }
  function steam(c, x, y, a) {
    const ph = amb * 0.7, k = Math.floor(ph) % 4, f = ph % 1;
    c.save(); c.globalCompositeOperation = 'screen';
    c.globalAlpha = a * (1 - f); c.drawImage(steamSprite(k), x - 50, y - 180);
    c.globalAlpha = a * f; c.drawImage(steamSprite((k + 1) % 4), x - 50, y - 180);
    c.restore();
  }
  function coffee(c, x, y) {
    c.save(); c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(x + 8, y + 30, 40, 12, 0, 0, 7); c.fill();
    c.fillStyle = gy(200); c.beginPath(); c.ellipse(x, y + 28, 44, 12, 0, 0, 7); c.fill();
    c.fillStyle = cyl(c, x - 26, x + 26, 0, 0, 150, 235); c.fillRect(x - 26, y - 14, 52, 40);
    c.beginPath(); c.ellipse(x, y + 26, 26, 7, 0, 0, Math.PI); c.fill();
    c.strokeStyle = gy(190); c.lineWidth = 7; c.beginPath(); c.arc(x + 30, y + 4, 12, -1.3, 1.3); c.stroke();
    c.fillStyle = gy(225); c.beginPath(); c.ellipse(x, y - 14, 26, 7, 0, 0, 7); c.fill(); c.fillStyle = gy(28); c.beginPath(); c.ellipse(x, y - 13, 22, 5, 0, 0, 7); c.fill();
    c.restore(); steam(c, x, y - 18, 1);
  }
  function redString(c, x0, y0, x1, y1, sag = 40, alpha = 1) {
    c.save(); c.globalAlpha = alpha; c.lineCap = 'round';
    const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + sag;
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x0 + 4, y0 + 6); c.quadraticCurveTo(mx + 4, my + 6, x1 + 4, y1 + 6); c.stroke();
    c.strokeStyle = RED; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    c.strokeStyle = 'rgba(255,190,180,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0 - 1); c.quadraticCurveTo(mx, my - 1, x1, y1 - 1); c.stroke();
    c.restore();
  }
  function tag(c, x, y, label, inv) { // player marker: P1 white-on-black, P2 black-on-white
    c.save(); c.font = F.osw(26); const w = c.measureText(label).width + 22, h = 34;
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x - w / 2 + 3, y - h + 4, w, h);
    c.fillStyle = inv ? gy(240) : gy(16); c.fillRect(x - w / 2, y - h, w, h);
    c.strokeStyle = inv ? gy(16) : gy(240); c.lineWidth = 2; c.strokeRect(x - w / 2 + 3, y - h + 3, w - 6, h - 6);
    c.fillStyle = inv ? gy(16) : gy(240); c.textAlign = 'center'; c.fillText(label, x, y - 7);
    c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x, y + 9); c.fillStyle = inv ? gy(240) : gy(16); c.fill();
    c.restore();
  }

  function drawLineup(c, mode) {
    const training = mode === 'training', res = S.res;
    const hintJ = training ? idxOf(TRAINING.ans) : -1;
    for (let i = 0; i < N; i++) {
      const x = mugX(i), lift = S.lift[i], rot = Math.sin(i * 2.7) * 0.045 * (1 - lift);
      const cleared = S.cleared.has(i);
      let sc = 1 + 0.07 * lift, y = ROW_Y - 10 * lift;
      if (res && res.j === i) { const p = E.back(clamp((S.clock - res.t0) / 0.35)); sc = 1 + 0.12 * p; y = ROW_Y - 14 * p; }
      if (lift > 0.05 || (res && res.j === i)) pool(c, x, y, 150, 170, 0.22 * Math.max(lift, res && res.j === i ? 1 : 0));
      drawMug(c, i, x, y, MUG_W, rot, sc, cleared ? 0.55 : 1);
      if (training && i === hintJ && !res) { // guided hint in training
        const pu = 0.5 + 0.5 * Math.sin(amb * 5);
        c.save(); c.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * pu})`; c.lineWidth = 4; c.setLineDash([12, 8]); c.lineDashOffset = -amb * 30;
        c.strokeRect(x - MUG_W / 2 - 10, y - MUG_W * 0.625 - 10, MUG_W + 20, MUG_W * 1.25 + 20); c.restore();
      }
      if (cleared) stamp(c, x, y - 20, 'ALIBI OK', S.wrongJ === i ? clamp((S.clock - S.wrongT) / 0.12) : 1, -0.25, 30, true);
    }
    // red strings from the case card to each pinned suspect
    const anchors = [[CASE.x + CASE.w - 140, CASE.y + CASE.h - 10], [CASE.x + CASE.w - 100, CASE.y + CASE.h - 6]];
    for (let k = 0; k < 2; k++) {
      const j = res && res.kind === 'correct' ? res.j : S.pins[k]; if (j == null) continue;
      const tx = mugX(j) + (k ? 16 : -16), ty = ROW_Y - MUG_W * 0.625 + 8;
      redString(c, anchors[k][0], anchors[k][1], tx, ty, 28);
      pushPin(c, anchors[k][0], anchors[k][1], 7, RED_L);
    }
    for (let k = 0; k < 2; k++) {
      const j = res && res.kind === 'correct' ? res.j : S.pins[k]; if (j == null) continue;
      const tx = mugX(j) + (k ? 16 : -16), ty = ROW_Y - MUG_W * 0.625 + 8;
      pushPin(c, tx, ty, 9, RED_L);
      c.save(); c.font = F.osw(15); c.fillStyle = gy(250); c.textAlign = 'center'; c.fillText(String(k + 1), tx, ty + 5); c.restore();
    }
    // cursors
    if (!res) {
      const same = S.cursor[0] === S.cursor[1];
      for (let k = 0; k < 2; k++) { const x = mugX(S.cursor[k]) + (same ? (k ? 36 : -36) : 0); tag(c, x, ROW_Y - MUG_W * 0.625 - 22, 'P' + (k + 1), k === 1); }
    }
  }

  function drawCaseCard(c, mode) {
    const cs = S.cs, training = mode === 'training', res = S.res;
    const slide = E.out(clamp((S.clock - S.caseT) / 0.4));
    c.save(); c.translate(0, (1 - slide) * -420); c.globalAlpha = 1;
    card(c, CASE.x, CASE.y, CASE.w, CASE.h, -0.012, '#ece6d8', 31 + (S.caseNo % 2));
    pushPin(c, CASE.x + 26, CASE.y + 16, 6); pushPin(c, CASE.x + CASE.w - 26, CASE.y + 14, 6);
    c.save(); c.translate(CASE.x + CASE.w / 2, CASE.y + CASE.h / 2); c.rotate(-0.012); c.translate(-CASE.w / 2, -CASE.h / 2);
    c.fillStyle = gy(30); c.font = F.osw(24); c.textAlign = 'left';
    c.fillText(training ? 'TRAINING CASE' : 'CASE No. ' + String(S.caseNo).padStart(2, '0') + (cs.lvl === 2 ? '  •  HARD CASE' : ''), 24, 42);
    c.fillStyle = gy(30); c.fillRect(24, 52, CASE.w - 48, 2);
    const ttl = cs.title.replace('TRAINING: ', '');
    fit(c, ttl, F.type, 38, CASE.w - 150, 26); c.fillStyle = gy(15); c.fillText(ttl, 24, 94);
    const ty = typeLines(cs.lines, S.caseT + 0.35, 42);
    typeSound('case' + S.caseNo + S.mode, ty.total);
    ty.out.forEach((l, i) => { fit(c, cs.lines[i], F.type, 29, CASE.w - 60, 22); c.fillStyle = gy(25); c.fillText(l, 28, 134 + i * 36);
      if (i === ty.cur && Math.floor(amb * 4) % 2 === 0) c.fillRect(28 + c.measureText(l).width + 2, 134 + i * 36 - 22, 13, 26); });
    const qa = clamp((S.clock - S.caseT - 0.35 - cs.lines.join('').length / 42) / 0.3);
    if (qa > 0) { c.globalAlpha = qa; c.font = F.osw(32); c.fillStyle = RED_D; c.fillText(cs.q.toUpperCase(), 26, 264); c.globalAlpha = 1; }
    c.restore();
    if (!training) {
      const urgent = S.left <= 5 && !res;
      stopwatch(c, CASE.x + CASE.w - 64, CASE.y + CASE.h - 86, 42, S.left / S.caseDur, Math.ceil(S.left), urgent);
    } else coffee(c, CASE.x + CASE.w - 72, CASE.y + CASE.h - 96);
    if (res) {
      const p = clamp((S.clock - res.t0 - 0.05) / 0.14);
      stamp(c, CASE.x + 330, CASE.y + 190, res.kind === 'correct' ? 'CASE CLOSED' : 'COLD CASE', p, -0.14, 56);
    }
    c.restore();
  }

  function drawPanel(c, mode) {
    const P = PANEL, training = mode === 'training';
    c.save();
    c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 18; c.shadowOffsetX = 8; c.shadowOffsetY = 10; c.fillStyle = gy(18); c.fillRect(P.x, P.y, P.w, P.h); c.restore();
    c.save(); c.beginPath(); c.rect(P.x, P.y, P.w, P.h); c.clip();
    // hanging-lamp cone in the interrogation room
    const g = c.createRadialGradient(P.x + P.w / 2, P.y - 20, 10, P.x + P.w / 2, P.y + 120, 420); g.addColorStop(0, gy(120, 0.6)); g.addColorStop(1, gy(30, 0));
    c.fillStyle = g; c.fillRect(P.x, P.y, P.w, P.h);
    c.restore();
    c.strokeStyle = gy(160); c.lineWidth = 2; c.strokeRect(P.x + 7, P.y + 7, P.w - 14, P.h - 14);
    c.fillStyle = gy(175); c.font = F.osw(22); c.textAlign = 'left'; c.fillText('INTERROGATION ROOM', P.x + 24, P.y + 40);
    c.fillStyle = gy(110); c.fillRect(P.x + 24, P.y + 50, P.w - 48, 1.5);
    const tk = S.talk, res = S.res;
    let who = null, lines = null, key = '', t0 = 0, sub = '';
    if (res) {
      const j = res.j, sus = SUSPECTS[j];
      who = sus.id + '  —  ' + sus.nick;
      if (res.kind === 'correct') lines = [training ? 'Alright, alright! It was me. I make living hinges.' : 'Alright, it was me! ' + S.cs.why + '.'];
      else lines = ['THE CULPRIT WAS ' + sus.id + '.', S.cs.why + '.'];
      key = 'res' + S.caseNo + res.kind; t0 = res.t0; sub = res.kind === 'correct' ? (training ? 'Training solved! The test starts next.' : '+' + res.pts + ' (case 10, speed ' + res.speed + ', streak ' + res.streakB + ')') : (res.reason === 'time' ? 'Out of time.' : 'Two wrong arrests.');
    } else if (tk) {
      const sus = SUSPECTS[tk.j];
      who = sus.id + '  —  ' + sus.nick;
      lines = [tk.real ? sus.real : sus.alibis[(S.caseNo + tk.j) % sus.alibis.length]];
      key = 'talk' + tk.j + (tk.real ? 'r' : '') + S.caseNo + S.mode; t0 = tk.t0;
      if (tk.real) sub = S.cleared.has(tk.j) && S.wrongJ === tk.j && S.clock - S.wrongT < 3 ? (training ? 'Wrong suspect: no points lost in training.' : 'Wrong suspect! −3. Try again.') : 'Already cleared: alibi checks out.';
    }
    if (!who) {
      const L = training
        ? ['Move along the line-up:  P1  A / D    P2  ← / →', 'Each suspect you visit makes a statement.', 'Pin the culprit:  P1  F    P2  Enter', 'BOTH pins on ONE suspect = ARREST!']
        : ['Question the suspects: move along the line-up.', 'Read each statement. Check the evidence.', 'Both detectives pin the SAME suspect to arrest.'];
      c.font = F.osw(26, 400); c.fillStyle = gy(235);
      L.forEach((l, i) => { fit(c, l, (s) => F.osw(s, 400), 27, P.w - 48, 20); c.fillText(l, P.x + 24, P.y + 98 + i * 50); });
    } else {
      c.fillStyle = gy(250); fit(c, who, F.osw, 34, P.w - 48, 24); c.fillText(who, P.x + 24, P.y + 94);
      c.font = F.play(29); const wl = []; lines.forEach((l) => wl.push(...wrap(c, '“' === l[0] ? l : l, P.w - 60)));
      const ty = typeLines(wl, t0 + 0.05, 55); typeSound(key, ty.total);
      c.fillStyle = gy(240); ty.out.forEach((l, i) => c.fillText(l, P.x + 28, P.y + 136 + i * 38));
      if (sub) { c.font = F.osw(26); c.fillStyle = res && res.kind === 'correct' ? gy(250) : RED_L; c.fillText(sub, P.x + 24, P.y + P.h - 26); }
    }
    // co-op prompts
    if (!res) {
      let msg = null;
      if (S.pins[0] != null && S.pins[1] != null && S.pins[0] !== S.pins[1]) msg = 'P1 pinned ' + SUSPECTS[S.pins[0]].id + ', P2 pinned ' + SUSPECTS[S.pins[1]].id + ': AGREE on one!';
      else if (S.pins[0] != null && S.pins[1] == null) msg = 'P1 pinned ' + SUSPECTS[S.pins[0]].id + '. P2: pin them too (Enter)?';
      else if (S.pins[1] != null && S.pins[0] == null) msg = 'P2 pinned ' + SUSPECTS[S.pins[1]].id + '. P1: pin them too (F)?';
      else if (S.clearedMsg && S.clock - S.clearedMsg < 1.5) msg = 'That suspect is already cleared.';
      if (msg && !(tk && tk.real && S.clock - S.wrongT < 3)) {
        c.fillStyle = gy(0, 0.6); c.fillRect(P.x + 12, P.y + P.h - 60, P.w - 24, 46);
        fit(c, msg, F.osw, 26, P.w - 48, 18); c.fillStyle = gy(250); c.fillText(msg, P.x + 24, P.y + P.h - 27);
      }
    }
    c.restore();
  }

  function drawCaseScene(c, mode) {
    c.drawImage(getCork(), 0, 0);
    drawCaseCard(c, mode);
    drawPanel(c, mode);
    drawLineup(c, mode);
    lighting(c, Math.sin(amb * 0.9) * 6, 0.85);
    pool(c, 640, 300, 520, 300, 0.12);
    haze(c, 0.1);
    for (const f of S.floaters) { const a = (S.clock - f.t0) / 1.6; NR(c, f.text, f.x, f.y - a * 70, f.big ? 64 : 40, 'center', 1 - sm(0.7, 1, a)); }
    if (S.news) {
      const p = E.out(sm(S.news.t0, S.news.t0 + 0.7, S.clock));
      if (S.clock >= S.news.t0) {
        if (!S.news.landed && p >= 1) { S.news.landed = true; GS.sfx('impact', { gain: 0.6 }); GS.sfx('slap', { gain: 0.5 }); }
        if (!S.news.spun) { S.news.spun = true; GS.sfx('whoosh', { dur: 0.6, top: 1800, gain: 0.5 }); }
        c.save(); c.fillStyle = gy(0, 0.45 * p); c.fillRect(0, 0, W, Hh); c.restore();
        newspaper(c, 640, 362, 0.04 + 0.96 * p, (1 - p) * Math.PI * 5 + 0.03, S.news.head, S.news.sub, S.news.j, S.news.kicker);
      }
    }
  }

  function drawBrief(c) {
    const t = S.clock - S.modeT;
    c.drawImage(getCork(), 0, 0);
    // six mugshots pinned across the top of the board
    for (let i = 0; i < N; i++) drawMug(c, i, 118 + i * 209, 186, 120, Math.sin(i * 2.7) * 0.06);
    for (let i = 0; i < N - 1; i++) redString(c, 118 + i * 209, 116, 118 + (i + 1) * 209, 116, 16, 0.9);
    // the chief's memo
    card(c, 70, 300, 720, 340, -0.01, '#ece6d8', 41);
    pushPin(c, 96, 316, 7, RED_L); pushPin(c, 764, 314, 7, RED_L);
    c.save(); c.translate(430, 470); c.rotate(-0.01); c.translate(-360, -170);
    c.fillStyle = gy(25); c.font = F.osw(26); c.textAlign = 'left'; c.fillText('MEMO FROM THE CHIEF', 26, 44); c.fillRect(26, 54, 668, 2);
    const L = ['Six THERMOFORMING polymers are loose', 'in this city. Each one has a file:', 'its PROPERTIES and its HANGOUTS (uses).', 'Learn them. Then crack the cases.', 'Together. Both pins on one suspect.'];
    const ty = typeLines(L, S.modeT + 3.3, 34); typeSound('brief', ty.total);
    ty.out.forEach((l, i) => { fit(c, L[i], F.type, 30, 668, 22); c.fillStyle = gy(20); c.fillText(l, 26, 100 + i * 44); });
    c.restore();
    coffee(c, 1000, 470);
    NR(c, 'P1:  W / S  flip files   F  next', 1040, 580, 28, 'center');
    NR(c, 'P2:  ↑ / ↓  flip files   Enter  next', 1040, 622, 28, 'center');
    lighting(c, Math.sin(amb * 0.9) * 6, 0.9);
    pool(c, 430, 440, 520, 280, 0.16);
    haze(c, 0.14);
    if (t < 3.3) { // headline spins in
      const p = E.out(sm(0.1, 1.0, t)), out = sm(2.7, 3.3, t);
      if (p > 0) { if (!S.briefSpun) { S.briefSpun = true; GS.sfx('whoosh', { dur: 0.8, top: 1800, gain: 0.6 }); } if (p >= 1 && !S.briefLand) { S.briefLand = true; GS.sfx('impact', { gain: 0.7 }); } }
      c.save(); c.fillStyle = gy(0, 0.6 * (1 - out)); c.fillRect(0, 0, W, Hh); c.restore();
      c.save(); c.globalAlpha = 1 - out; newspaper(c, 640, 360, (0.04 + 0.96 * p) * (1 - out * 0.3), (1 - p) * Math.PI * 5 - 0.03 - out * 0.3, 'PLASTIC CRIME WAVE!', 'Six thermoforming suspects at large', 'all'); c.restore();
    } else if (t > 6) NR(c, 'Press F or Enter to open the files', 430, 290, 30, 'center', 0.6 + 0.4 * Math.sin(amb * 4));
  }

  function drawFile(c, idx, t0) {
    const sus = SUSPECTS[idx];
    c.drawImage(getCork(), 0, 0);
    const slap = E.back(clamp((S.clock - t0) / 0.3));
    drawMug(c, idx, 250, 340, 300, -0.035, 1.25 - 0.25 * slap);
    // manila folder
    const fx = 470, fy = 84, fw = 778, fh = 556;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 16; c.shadowOffsetX = 8; c.shadowOffsetY = 10; c.fillStyle = gy(196); c.beginPath(); c.roundRect(fx + 24, fy - 40, 250, 50, 8); c.fill(); c.restore();
    c.fillStyle = gy(196); c.beginPath(); c.roundRect(fx + 24, fy - 40, 250, 50, 8); c.fill();
    c.fillStyle = gy(30); c.font = F.osw(24); c.textAlign = 'left'; c.fillText('SUSPECT FILE ' + (idx + 1) + ' / ' + N, fx + 40, fy - 10);
    card(c, fx, fy, fw, fh, 0.004, '#d9d2c2', 51 + idx);
    pushPin(c, fx + 380, fy + 14, 7, RED_L);
    c.save(); c.translate(fx, fy);
    c.fillStyle = gy(15); const nm = sus.full.toUpperCase().startsWith(sus.id) ? sus.full.toUpperCase() : sus.id + ' — ' + sus.full.toUpperCase();
    fit(c, nm, F.osw, 44, fw - 60, 26); c.fillText(nm, 30, 70);
    c.fillStyle = gy(40); c.fillRect(30, 86, fw - 60, 2.5);
    const props = sus.props.map((p) => '• ' + p), uses = sus.uses.map((u) => '• ' + u);
    const all = props.concat(uses), ty = typeLines(all, t0 + 0.5, 46);
    typeSound('file' + idx + '_' + t0.toFixed(2), ty.total);
    c.font = F.osw(26); c.fillStyle = RED_D; c.fillText('PROPERTIES', 30, 128);
    const uy = 128 + 40 + props.length * 42 + 14;
    if (ty.out[props.length] !== undefined && (ty.out[props.length].length > 0 || ty.cur >= props.length)) { c.font = F.osw(26); c.fillStyle = RED_D; c.fillText('KNOWN HANGOUTS (USES)', 30, uy); }
    ty.out.forEach((l, i) => {
      const y = i < props.length ? 170 + i * 42 : uy + 42 + (i - props.length) * 42;
      fit(c, all[i], F.type, 31, fw - 70, 22); c.fillStyle = gy(18); c.fillText(l, 36, y);
      if (i === ty.cur && Math.floor(amb * 4) % 2 === 0) c.fillRect(36 + c.measureText(l).width + 2, y - 24, 14, 28);
    });
    c.restore();
    // a "THERMOFORMING" stamp on every file
    stamp(c, fx + fw - 150, fy + fh - 34, 'THERMOFORMING', clamp((S.clock - t0 - 0.25) / 0.12), -0.06, 24);
    lighting(c, Math.sin(amb * 0.9) * 6, 0.85);
    pool(c, 760, 330, 560, 330, 0.12);
    haze(c, 0.1);
    const ak = 'a.k.a. ' + sus.nick; NR(c, ak, 250, 604, fit(c, ak, F.play, 32, 400, 22), 'center', 1, F.play);
  }

  function drawFiles(c) {
    const w = S.wipe, wp = w ? E.inOut(clamp((S.clock - w.t0) / 0.35)) : 1;
    drawFile(c, S.fileIdx, S.fileT);
    if (w && wp < 1) { // hard-edged horizontal wipe, the reference's scene change
      const L = H.layer(W, Hh), lc = L.getContext('2d'); drawFile(lc, w.from, -100);
      const edge = w.dir > 0 ? W * (1 - wp) : W * wp;
      c.save(); c.beginPath(); if (w.dir > 0) c.rect(0, 0, edge, Hh); else c.rect(edge, 0, W - edge, Hh); c.clip(); c.drawImage(L, 0, 0); c.restore();
      c.fillStyle = gy(250); c.fillRect(edge - 2, 0, 4, Hh);
    }
  }

  function drawAttract(c) {
    c.drawImage(getCork(), 0, 0);
    for (let i = 0; i < N; i++) drawMug(c, i, 118 + i * 209, 470, 170, Math.sin(i * 2.7) * 0.06);
    for (let i = 0; i < N - 1; i++) redString(c, 118 + i * 209, 368, 118 + (i + 1) * 209, 368, 20);
    newspaper(c, 640, 190, 0.42, -0.05, 'PLASTIC CRIME WAVE!', 'Six thermoforming suspects at large', 'all');
    lighting(c, Math.sin(amb * 0.9) * 6, 1);
    // a detective's torch beam sweeping the line-up
    const sx = 640 + Math.sin(amb * 0.6) * 520; pool(c, sx, 470, 230, 210, 0.35);
    haze(c, 0.16);
  }

  // ================= film finish (reference finish, adapted to real time) =================
  function finish(c) {
    const fr24 = Math.floor(amb * 24), Rg = H.rng(7000 + fr24), nz = finish.nz || (finish.nz = H.makeNoise(46));
    // (the reference's halation pass needs a read-back of the frame; dropped for real-time speed on school PCs)
    // nitrate grain
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.42; c.drawImage(getGrain(fr24 % 3), 0, 0); c.restore();
    // faint warm silver tone
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(getVignette(), 0, 0); c.restore();
    // projector flicker
    const fl = nz.n2(amb * 9, 4.4); c.fillStyle = fl > 0 ? `rgba(255,255,255,${fl * 0.035})` : `rgba(0,0,0,${-fl * 0.06})`; c.fillRect(0, 0, W, Hh);
    // dust (white = on the negative, black = on the print), hairs, scratches
    for (let k = 0; k < 40; k++) {
      const white = Rg() < 0.6; c.fillStyle = white ? `rgba(255,255,250,${Rg.range(0.35, 0.8)})` : `rgba(0,0,0,${Rg.range(0.4, 0.8)})`;
      const x = Rg() * W, y = Rg() * Hh, r = Rg() < 0.9 ? Rg.range(0.6, 1.8) : Rg.range(2, 3.5); c.beginPath(); c.ellipse(x, y, r, r * Rg.range(0.5, 1), Rg() * 3, 0, 7); c.fill();
    }
    if (Rg() < 0.3) { c.strokeStyle = `rgba(250,250,245,${Rg.range(0.3, 0.55)})`; c.lineWidth = Rg.range(0.6, 1.2); const x = Rg() * W, y = Rg() * Hh; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + Rg.range(-20, 20), y + Rg.range(-20, 20), x + Rg.range(-30, 30), y + Rg.range(-10, 30), x + Rg.range(-30, 30), y + Rg.range(-30, 30)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,250,0.22)'; c.lineWidth = 1.2; c.beginPath(); const sx0 = 312 + Math.sin(amb * 7) * 3; for (let y = 0; y <= Hh; y += 24) c.lineTo(sx0 + nz.n2(3, y * 0.01) * 4, y); c.stroke();
  }

  // ================= HUD in the letterbox bars =================
  function bars(c) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, BAR); c.fillRect(0, Hh - BAR, W, BAR);
    c.textAlign = 'left'; c.fillStyle = gy(238); c.font = F.lime(30); c.fillText('PLASTIC FANTASTIC', 22, 38);
    const tw = c.measureText('PLASTIC FANTASTIC').width; c.font = F.play(24); c.fillStyle = gy(185); c.fillText('a polymer whodunit', 34 + tw, 37);
    const m = S ? S.mode : 'attract', y = Hh - 17;
    c.font = F.osw(24, 400); c.fillStyle = gy(220);
    if (m === 'test' || m === 'training') {
      c.textAlign = 'left'; c.fillStyle = gy(200); c.font = F.osw(22); c.fillText(m === 'training' ? 'TRAINING' : 'TEAM SCORE', 22, y);
      if (m === 'test') odometer(c, 160, Hh - 45, S.shown, 3, 36);
      c.textAlign = 'center'; c.font = F.osw(26); c.fillStyle = gy(240);
      const mid = m === 'training' ? 'No points to lose. Learn the moves!' : 'CASE ' + S.caseNo + '  •  SOLVED ' + S.solved + (S.streak >= 2 ? '  ★ STREAK ×' + S.streak : '');
      c.fillText(mid, 500, y);
      c.textAlign = 'right'; c.font = F.osw(24, 400); c.fillStyle = gy(200); c.fillText('Pin F / Enter    Unpin G / R-Shift', W - 20, y);
    } else if (m === 'files') {
      c.textAlign = 'left'; c.font = F.osw(26, 400); c.fillStyle = gy(230); c.fillText('P1  W / S      P2  ↑ / ↓      flip files', 22, y);
      for (let i = 0; i < N; i++) { const x = 560 + i * 34; c.fillStyle = i === S.fileIdx ? gy(250) : S.filesSeen.has(i) ? gy(130) : gy(60); c.beginPath(); c.arc(x, y - 9, i === S.fileIdx ? 10 : 7, 0, 7); c.fill(); }
      c.textAlign = 'right'; c.fillStyle = gy(230); c.fillText(S.fileIdx === N - 1 ? 'F / Enter: training case ▶' : 'F / Enter: next file ▶', W - 20, y);
    } else if (m === 'brief') {
      c.textAlign = 'center'; c.fillText('Co-op: two detectives, one keyboard. Work it out together.', W / 2, y);
    } else { c.textAlign = 'center'; c.fillStyle = gy(170); c.fillText('Station 3  •  Thermoforming polymers: properties & uses', W / 2, y); }
  }

  // ================= main loop =================
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; amb += dt;
    const t0p = performance.now();
    try {
      if (GS.running) update(dt);
      const nz = frame.nz || (frame.nz = H.makeNoise(46));
      const wx = nz.n2(amb * 3.1, 0.3) * 1.8, wy = nz.n2(0.7, amb * 2.7) * 2.2;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, Hh);
      ctx.save(); ctx.translate(wx, wy);
      const m = GS.phase === 'idle' ? 'attract' : S.mode;
      if (m === 'attract') drawAttract(ctx);
      else if (m === 'brief') drawBrief(ctx);
      else if (m === 'files') drawFiles(ctx);
      else drawCaseScene(ctx, m);
      // iris-in at the start of the test
      if (m === 'test' && S.clock - S.irisT < 0.7) { const r = 900 * E.out(clamp((S.clock - S.irisT) / 0.7)); ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(-20, -20, W + 40, Hh + 40); ctx.arc(640, 360, Math.max(1, r), 0, 7, true); ctx.fill('evenodd'); ctx.restore(); }
      ctx.restore();
      finish(ctx);
      bars(ctx);
    } catch (e) { console.error(e); }
    const pf = window.__prof || (window.__prof = { n: 0, ms: 0 }); pf.n++; pf.ms += performance.now() - t0p;
    GS.endFrame();
    requestAnimationFrame(frame);
  }

  window.__noir = () => S; // test hook (read-only use in headless checks)
  reset();
  GS.init({
    id: 3, title: 'Plastic Fantastic: a polymer whodunit', mode: 'coop', learnSeconds: 90,
    controls: { p1: 'A/D or W/S move · F pin · G unpin', p2: '←/→ or ↑/↓ move · Enter pin · R-Shift unpin' },
    onRound() { reset(); S.mode = 'brief'; S.modeT = 0; },
    onPhase(p, prev) {
      if (p === 'learn' && S.mode === 'attract') startBrief();
      if (p === 'play' && S.mode !== 'test') startTest();
      if (p === 'idle') S.mode = 'attract';
    },
  });
  // warm the caches before the first round so the first frames are smooth
  setTimeout(() => { getCork(); getHaze(); getLamp(); getSlats(); getVignette(); for (let k = 0; k < 3; k++) getGrain(k); for (let i = 0; i < N; i++) { mug(i, MUG_W); mug(i, 120); mug(i, 170); mug(i, 300); mug(i, 84); mug(i, 150); } }, 50);
  requestAnimationFrame(frame);
})();
