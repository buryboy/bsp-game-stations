// blueprint.js — paints the Engineering Blueprint paper (mottled, sun-faded Prussian blue with speckle) behind a page,
// plus a zoned drafting border. Needs lib/harness.js (H). Usage: Blueprint.paper(document.body)
(function () {
  const BP = (window.Blueprint = {});
  BP.paper = function (el) {
    const W = 960, Hh = 540;
    const c = document.createElement('canvas'); c.width = W; c.height = Hh;
    const x = c.getContext('2d'), nz = H.makeNoise(88), id = x.createImageData(W, Hh), d = id.data, base = [22, 58, 112];
    for (let y = 0; y < Hh; y++) for (let i = 0; i < W; i++) {
      const m = nz.fbm2(i * 0.006, y * 0.006, 4) * 0.2 + nz.fbm2(i * 0.04 + 10, y * 0.04, 2) * 0.06 + Math.max(0, nz.fbm2(i * 0.003 + 40, y * 0.003, 3) - 0.15) * 0.5;
      const fade = Math.max(0, 1 - Math.hypot(i - W * 0.2, y - Hh * 0.15) / (W * 0.9)) * 0.16;
      const ex = Math.min(i, W - i) / W, ey = Math.min(y, Hh - y) / Hh;
      const edge = (1 - H.smooth(0, 0.12, Math.min(ex * 1.8, ey))) * 0.3;
      const k = 1 + m + fade - edge, p = (y * W + i) * 4;
      d[p] = base[0] * k + fade * 40; d[p + 1] = base[1] * k + fade * 30; d[p + 2] = base[2] * k + fade * 25; d[p + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    const r = H.rng(4);
    for (let i = 0; i < 1400; i++) {
      x.fillStyle = r.chance(0.7) ? `rgba(160,190,230,${r.range(0.05, 0.25)})` : `rgba(5,20,50,${r.range(0.1, 0.3)})`;
      x.fillRect(r.range(0, W), r.range(0, Hh), r.range(0.5, 1.4), r.range(0.5, 1.4));
    }
    // fold creases
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2 + 4, Hh); x.moveTo(0, Hh / 2); x.lineTo(W, Hh / 2 - 3); x.stroke();
    el.style.background = `url(${c.toDataURL()}) center/cover fixed, #163a70`;
  };
})();
