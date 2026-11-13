// machines.js — the nine process machines. Local frame: x along the road, front face at z = 0 facing the road (+z),
// body in z < 0, y up. Each builder returns { w, d, h, update(t) } and adds meshes to root. Animated parts sit in dyn groups.
import * as THREE from '../../lib/three.module.min.js';
import { PAL, M, B, G, bx, cy, cyX, cyZ, sp, grp, mesh, ease, clamp, lerp, worker } from './style.js';

const ph = (t, a, b) => clamp((t - a) / (b - a));
const glassMat = () => B('#e9eeff', 0.38);

// granule colours (pellets)
const GRAN = [PAL.coralSoft, PAL.mintMid, PAL.peri, PAL.yellow, '#ffffff'];

// shared screw geometry: shaft + helical flight
let screwGeo = null;
function screwGeometry(len) {
  class Helix extends THREE.Curve { getPoint(t, out = new THREE.Vector3()) { const a = t * len * 2.6 * Math.PI * 2; return out.set(t * len, Math.cos(a) * 0.2, Math.sin(a) * 0.2); } }
  return new THREE.TubeGeometry(new Helix(), Math.round(len * 40), 0.055, 5, false);
}
function screw(parent, x0, len, y, z) {
  const g = grp(parent, x0, y, z, true);
  cyX(g, PAL.grey, 0, len, 0, 0, 0.13, 10);
  mesh(g, screwGeo || (screwGeo = screwGeometry(len)), M(PAL.ice), 0, 0, 0);
  return g;
}
// square hopper (funnel) with a heap of coloured granules on top
function hopper(parent, x, yb, z, col = PAL.peach) {
  const hg = mesh(parent, G('cyl', 0.82, 0.2, 1.2, 4), M(col), x, yb + 0.6, z); hg.rotation.y = Math.PI / 4;
  const heap = grp(parent, x, yb + 1.2, z, true);
  for (let i = 0; i < 16; i++) { const a = i * 2.39, r = 0.12 + (i % 5) * 0.09; sp(heap, GRAN[i % 5], Math.cos(a) * r, 0.02 + (0.5 - r) * 0.18, Math.sin(a) * r, 0.085, { ws: 6, hs: 4 }); }
  return heap;
}
function heaterBand(parent, x, y, z, r) { const m = cyX(parent, PAL.coralSoft, x - 0.09, x + 0.09, y, z, r, 14, { mat: M(PAL.coralSoft, { unique: true }) }); return m; }
function controlPanel(parent, x, y, z, rot = 0) {
  const g = grp(parent, x, y, z); g.rotation.y = rot;
  bx(g, PAL.navy, 0, 0, 0, 0.7, 0.45, 0.06);
  bx(g, '#9fe6c8', -0.12, 0.1, 0.04, 0.3, 0.22, 0.02, { cast: false });
  sp(g, PAL.coral, 0.2, 0.3, 0.05, 0.05, { ws: 6, hs: 4, cast: false }); sp(g, PAL.mint, 0.2, 0.15, 0.05, 0.05, { ws: 6, hs: 4, cast: false });
  return g;
}

// ============ 1 · INJECTION MOULDING ============
function injection(root) {
  const by = 1.75, bz = -1.3;
  bx(root, PAL.peri, -0.7, 0, bz, 5.4, 1.15, 1.9);
  controlPanel(root, -2.2, 0.35, bz + 0.98);
  cyX(root, PAL.sky, -3.2, -2.2, by, bz, 0.42);
  bx(root, PAL.navy2, -3.55, 1.1, bz, 0.7, 1.3, 1.1);         // drive motor
  mesh(root, G('cyl', 0.42, 0.42, 2.7, 14, 1), glassMat(), -0.85, by, bz, false).rotation.z = Math.PI / 2;
  const bands = [-1.7, -1.0, -0.3].map((x) => heaterBand(root, x, by, bz, 0.47));
  const nz = mesh(root, G('cyl', 0.16, 0.42, 0.45, 14), M(PAL.sky), 0.72, by, bz); nz.rotation.z = -Math.PI / 2;
  const scr = screw(root, -2.2, 2.6, by, bz);
  const melt = grp(root, 0.5, by, bz, true); cyX(melt, PAL.coralSoft, -1, 0, 0, 0, 0.3, 12, { mat: B(PAL.coralSoft) });
  const heap = hopper(root, -2.7, by + 0.38, bz);
  // clamp unit
  bx(root, PAL.peri, 2.0, 0, bz, 2.7, 0.9, 1.9);
  bx(root, PAL.navy2, 1.0, 0.9, bz, 0.28, 1.75, 1.75);
  bx(root, PAL.navy2, 3.25, 0.9, bz, 0.28, 1.75, 1.75);
  for (const [dy, dz] of [[0.65, 0.65], [0.65, -0.65], [1.55, 0.65], [1.55, -0.65]]) cyX(root, PAL.ice, 1.0, 3.25, 0.9 + dy, bz + dz, 0.06, 6);
  bx(root, PAL.coralPale, 1.25, 1.35, bz, 0.22, 0.85, 0.85);
  const mov = grp(root, 2.3, 0.9, bz, true);
  bx(mov, PAL.navy2, 0, 0, 0, 0.28, 1.75, 1.6); bx(mov, PAL.coralPale, -0.25, 0.45, 0, 0.22, 0.85, 0.85);
  const ram = cyX(mov, PAL.ice, 0, 1, 0.87, 0, 0.13, 8);
  // output bin + ejected cap
  bx(root, PAL.mintSoft, 2.1, 0, -0.2, 1.2, 0.4, 0.55);
  for (let i = 0; i < 3; i++) { cy(root, PAL.coral, 1.75 + i * 0.32, 0.4, -0.2, 0.13, 0.1, 10); }
  const cap = grp(root, 1.6, 0, bz, true); cy(cap, PAL.coral, 0, 0, 0, 0.2, 0.16, 12); cy(cap, '#ffffff', 0, 0.16, 0, 0.17, 0.02, 12, { cast: false });
  const mouldGlow = mesh(root, G('box', 0.5, 0.7, 0.9), B(PAL.coral, 0.85, { unique: true }), 1.6, 1.75, bz, false);
  return {
    w: 7.4, d: 2.9, h: 3.4,
    update(t) {
      const c = t % 4.2;
      const plast = ph(c, 0, 1.3), close = ph(c, 1.3, 1.6) * (1 - ph(c, 3.0, 3.3)), inj = ph(c, 1.6, 2.2);
      scr.rotation.x = c < 1.3 ? t * 9 : scr.rotation.x;
      scr.position.x = -2.2 + 0.35 * (c < 1.3 ? -plast : -1 + inj);
      melt.scale.x = Math.max(0.01, c < 1.6 ? plast * 1.2 : 1.2 * (1 - inj));
      mov.position.x = lerp(2.3, 1.62, ease.inOut(close));
      ram.scale.x = 1 + (2.3 - mov.position.x) * 1.4; ram.position.x = 0.5 * ram.scale.x;
      mouldGlow.visible = c > 1.7 && c < 3.0; mouldGlow.material.opacity = 0.85 * (1 - ph(c, 2.2, 3.0));
      const hot = c < 2.2 ? 0.55 + 0.25 * Math.sin(t * 6) : 0.3;
      for (const b of bands) b.material.uniforms.uGlowK.value = hot;
      heap.position.y = by + 0.38 + 1.2 - plast * 0.06;
      // cap: ejected 3.3–4.2, pops up and drops into the bin
      const e = ph(c, 3.3, 4.1); cap.visible = c > 3.3;
      cap.position.set(lerp(1.6, 2.6, e), lerp(1.4, 0.45, e) + Math.sin(e * Math.PI) * 1.2, lerp(bz, -0.2, e));
      cap.rotation.z = e * 6;
    },
  };
}

// ============ 2 · EXTRUSION ============
function extrusion(root) {
  const by = 1.55, bz = -1.4;
  bx(root, PAL.mintSoft, -1.3, 0, bz, 4.2, 1.0, 1.7);
  bx(root, PAL.navy2, -3.45, 0, bz, 0.6, 2.0, 1.2);
  controlPanel(root, -1.6, 0.3, bz + 0.88);
  mesh(root, G('cyl', 0.4, 0.4, 3.4, 14, 1), glassMat(), -1.4, by, bz, false).rotation.z = Math.PI / 2;
  const bands = [-2.3, -1.4, -0.5].map((x) => heaterBand(root, x, by, bz, 0.45));
  const scr = screw(root, -3.05, 3.2, by, bz);
  const heap = hopper(root, -2.65, by + 0.36, bz, PAL.peach);
  // die plate with a ring opening
  bx(root, PAL.belt, 0.5, 0.95, bz, 0.35, 1.2, 1.2);
  mesh(root, G('torus', 0.27, 0.07, 6, 16), M(PAL.navy), 0.69, by, bz).rotation.y = Math.PI / 2;
  // cooling trough + rollers
  bx(root, PAL.sky, 2.25, 0.3, bz, 3.2, 0.5, 0.9);
  for (const x of [1.2, 2.2, 3.2]) { bx(root, PAL.lav, x, 0, bz, 0.12, 0.3, 0.12); }
  for (const x of [1.4, 2.4, 3.4]) cyZ(root, PAL.ice, x, 1.1, bz - 0.4, bz + 0.4, 0.07, 8);
  // pipe: continuous length growing out of the die; a cut piece rolls into the rack
  const pipeMat = M('#ffffff');
  const pipe = grp(root, 0.7, by, bz, true);
  const pm = cyX(pipe, '#ffffff', 0, 1, 0, 0, 0.27, 14, { mat: pipeMat });
  const end = mesh(pipe, G('ring', 0.13, 0.27, 16), B(PAL.navy), 1, 0, 0, false); end.rotation.y = Math.PI / 2;
  const cut = grp(root, 0, 0, 0, true);
  cyX(cut, '#ffffff', 0, 2.2, 0, 0, 0.27, 14, { mat: pipeMat });
  const ce = mesh(cut, G('ring', 0.13, 0.27, 16), B(PAL.navy), 2.21, 0, 0, false); ce.rotation.y = Math.PI / 2;
  const saw = grp(root, 3.0, 2.5, bz, true);
  const blade = mesh(saw, G('cyl', 0.38, 0.38, 0.05, 16), M(PAL.ice), 0, 0, 0); blade.rotation.x = Math.PI / 2;
  bx(root, PAL.lav, 3.0, 0, bz - 0.85, 0.15, 2.9, 0.15); bx(root, PAL.lav, 3.0, 2.75, bz - 0.4, 0.15, 0.15, 1.0);
  // finished pipe rack (behind)
  for (let i = 0; i < 3; i++) cyX(root, '#ffffff', 0.9, 3.1, 0.3 + (i === 2 ? 0.45 : 0), bz - 1.15 + (i === 2 ? 0.25 : i * 0.5), 0.22, 12, { mat: pipeMat });
  bx(root, PAL.trunk, 1.0, 0, bz - 0.9, 0.1, 0.3, 1.0); bx(root, PAL.trunk, 3.0, 0, bz - 0.9, 0.1, 0.3, 1.0);
  return {
    w: 7.6, d: 2.9, h: 3.2,
    update(t) {
      const c = t % 5;
      scr.rotation.x = t * 8;
      for (const b of bands) b.material.uniforms.uGlowK.value = 0.5 + 0.2 * Math.sin(t * 5);
      heap.position.y = by + 0.36 + 1.2 + Math.sin(t * 2) * 0.02;
      const L = 0.3 + 2.3 * (c / 5) * 1.0;
      pm.scale.y = L; pm.position.x = L / 2; end.position.x = L + 0.01;
      // saw drops at c 4.4..4.9, then cut piece slides to the rack
      saw.position.y = 2.5 - 0.95 * Math.sin(ph(c, 4.3, 4.9) * Math.PI);
      blade.rotation.y = t * 20;
      const k = ph(c, 0, 1.4);
      cut.visible = c < 1.4;
      cut.position.set(lerp(1.05, 1.05, k), lerp(by, 0.75, ease.in ? k : k) , lerp(bz, bz - 1.0, ease.out(k)));
    },
  };
}

// ============ 3 · BLOW MOULDING ============
function bottleGeo() {
  const pts = [[0, 0], [0.34, 0], [0.38, 0.06], [0.38, 0.85], [0.3, 1.05], [0.14, 1.25], [0.12, 1.42], [0.14, 1.44], [0.14, 1.5], [0, 1.5]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 14);
}
let BOTTLE = null;
function blowMoulding(root) {
  BOTTLE = BOTTLE || bottleGeo();
  const bz = -1.4;
  bx(root, PAL.sky, 0, 0, bz, 5.0, 0.95, 2.1);
  controlPanel(root, -1.8, 0.25, bz + 1.08);
  // die head tower
  bx(root, PAL.navy2, -2.05, 0.95, bz, 0.5, 2.9, 0.6);
  bx(root, PAL.navy2, -1.0, 3.25, bz, 2.6, 0.4, 0.6);
  cy(root, PAL.ice, 0, 2.75, bz, 0.22, 0.55, 12);
  mesh(root, G('cyl', 0.09, 0.22, 0.25, 12), M(PAL.ice), 0, 2.62, bz);
  // parison (soft tube) + bottle
  const parison = grp(root, 0, 2.6, bz, true); const pm = cy(parison, '#f6f2ff', 0, -1, 0, 0.12, 1, 10, { mat: M('#f6f2ff', { opacity: 0.92 }) });
  const bottle = grp(root, 0, 1.05, bz, true); mesh(bottle, BOTTLE, M('#c9e6f7'), 0, 0, 0);
  // mould halves slide along x; inner faces coral
  const L = grp(root, -1.2, 0.95, bz, true), R = grp(root, 1.2, 0.95, bz, true);
  for (const [g, s] of [[L, -1], [R, 1]]) { bx(g, PAL.peri, s * 0.38, 0, 0, 0.76, 1.85, 1.3); bx(g, PAL.coralPale, s * 0.02, 0.15, 0, 0.04, 1.55, 1.0, { cast: false }); }
  // air arrows (cones) blowing into the mould
  const air = grp(root, 0, 2.95, bz + 0.0, true);
  const cones = []; for (let i = 0; i < 3; i++) { const c = mesh(air, G('cyl', 0, 0.11, 0.22, 8), B(PAL.navy), 0, 0, 0, false); c.rotation.x = Math.PI; cones.push(c); }
  // output conveyor + finished bottles
  bx(root, PAL.belt, 2.5, 0, -0.3, 2.0, 0.35, 0.5);
  const out = grp(root, 0, 0, 0, true); mesh(out, BOTTLE, M('#c9e6f7'), 0, 0, 0).scale.setScalar(0.7);
  for (let i = 0; i < 2; i++) mesh(root, BOTTLE, M('#c9e6f7'), 2.0 + i * 0.6, 0.35, -0.3).scale.setScalar(0.7);
  return {
    w: 6.2, d: 2.8, h: 3.7,
    update(t) {
      const c = t % 4.4;
      const drop = ph(c, 0, 1.0), close = ph(c, 1.0, 1.35) * (1 - ph(c, 2.5, 2.85)), blow = ph(c, 1.4, 2.4);
      pm.scale.y = Math.max(0.01, drop * 1.6); pm.position.y = -pm.scale.y / 2;
      parison.visible = c < 1.6;
      L.position.x = lerp(-1.25, -0.02, ease.inOut(close)); R.position.x = -L.position.x;
      bottle.visible = c > 1.5 && c < 3.5;
      bottle.scale.set(lerp(0.32, 1, ease.out(blow)), 1, lerp(0.32, 1, ease.out(blow)));
      const lift = ph(c, 2.85, 3.5); bottle.position.set(lerp(0, 1.7, lift), 1.05 + Math.sin(lift * Math.PI) * 0.9 - lift * 0.7, lerp(bz, -0.3, lift));
      air.visible = c > 1.35 && c < 2.45;
      cones.forEach((m, i) => { m.position.y = -((t * 1.6 + i / 3) % 1) * 0.6; });
      out.visible = c > 3.5; const o = ph(c, 3.5, 4.4); out.position.set(1.7 + o * 1.4, 0.35, -0.3);
    },
  };
}

// ============ 4 · VACUUM FORMING ============
function vacuumForming(root) {
  const bz = -1.45, top = 1.35, N = 18, S = 2.3;
  bx(root, PAL.peach, 0, 0, bz, 3.4, top, 2.5);
  // pump + hose + gauge
  bx(root, PAL.navy2, 2.35, 0, bz + 0.3, 0.9, 0.9, 1.0);
  cyZ(root, PAL.ink2, 2.35, 0.55, bz + 0.8, bz + 1.0, 0.12, 8);
  const gauge = grp(root, -1.0, 0.75, bz + 1.27); cyZ(gauge, '#ffffff', 0, 0, 0, 0.04, 0.24, 16);
  const needle = grp(gauge, 0, 0, 0.06, true); bx(needle, PAL.coral, 0, 0, 0, 0.03, 0.2, 0.02, { cast: false });
  // clamp frame
  for (const [x, z, w, d] of [[0, -S / 2 - 0.08, S + 0.3, 0.16], [0, S / 2 + 0.08, S + 0.3, 0.16], [-S / 2 - 0.08, 0, 0.16, S], [S / 2 + 0.08, 0, 0.16, S]]) bx(root, PAL.ink2, x, top, bz + z, w, 0.12, d);
  // heater on rails (slides in from the back)
  bx(root, PAL.lav, -1.35, top, bz - 1.3, 0.12, 1.4, 0.12); bx(root, PAL.lav, 1.35, top, bz - 1.3, 0.12, 1.4, 0.12);
  bx(root, PAL.lav, 0, top + 1.4, bz - 1.3, 2.8, 0.12, 0.12);
  const heater = grp(root, 0, top + 0.95, bz, true);
  bx(heater, PAL.ice, 0, 0.08, 0, 2.5, 0.25, 2.4);
  const glow = bx(heater, PAL.coral, 0, 0, 0, 2.3, 0.08, 2.2, { mat: B(PAL.coral, 1, { unique: true }), cast: false });
  // mould (former): square frustum = draft angles
  const mould = grp(root, 0, 0, bz, true);
  const mf = mesh(mould, G('cyl', 0.55, 0.82, 0.55, 4), M(PAL.ink2), 0, 0.275, 0); mf.rotation.y = Math.PI / 4;
  // sheet: a deformable grid
  const geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  const sheet = mesh(root, geo, M('#fdfcff'), 0, top + 0.13, bz); sheet.userData.dyn = true;
  const pos = geo.attributes.position, base = Float32Array.from(pos.array);
  const mh = (x, z, e) => { const m = Math.max(Math.abs(x), Math.abs(z)); const a = 0.39, b = 0.58; if (m < a) return e + 0.55; if (m < b) return e + 0.55 * (1 - (m - a) / (b - a)); return -9; };
  const tray = grp(root, 0, 0, 0, true); // popped finished tray
  const tf = mesh(tray, G('cyl', 0.45, 0.62, 0.35, 4), M('#fdfcff'), 0, 0.17, 0); tf.rotation.y = Math.PI / 4;
  bx(tray, '#fdfcff', 0, 0, 0, 1.2, 0.03, 1.2);
  // stack of finished trays at the side
  for (let i = 0; i < 3; i++) { const m = mesh(root, G('cyl', 0.36, 0.5, 0.28, 4), M('#fdfcff'), -2.25, 0.14 + i * 0.12, -0.35); m.rotation.y = Math.PI / 4; }
  bx(root, PAL.lav, -2.25, 0, -0.35, 1.0, 0.04, 1.0);
  return {
    w: 5.6, d: 3.0, h: 3.0,
    update(t) {
      const c = t % 5.2;
      const heat = c < 1.8 ? 1 : 1 - ph(c, 1.8, 2.1);
      heater.position.z = bz - 2.3 * ph(c, 1.8, 2.2) + 2.3 * ph(c, 4.9, 5.2) * 0 ;
      heater.position.z = c < 1.8 ? bz : c < 4.8 ? bz - 2.3 * ease.inOut(ph(c, 1.8, 2.2)) : bz - 2.3 * (1 - ease.inOut(ph(c, 4.8, 5.2)));
      glow.material.opacity = 1; glow.material.color.set(c < 1.9 ? (Math.sin(t * 8) > 0 ? '#ff6b5b' : '#ff8a7a') : PAL.lav);
      const rise = ease.inOut(ph(c, 2.2, 2.6)) * (1 - ease.inOut(ph(c, 3.9, 4.3)));
      const e = lerp(top - 0.45, top + 0.12, rise); mould.position.y = e - 0.0;
      const vac = ph(c, 2.55, 2.85), sag = 0.2 * ph(c, 0.2, 1.8) * (1 - ph(c, 2.2, 2.5));
      const eRel = c > 2.85 ? 0.54 : e + 0.55 - (top + 0.13);
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2], m = Math.max(Math.abs(x), Math.abs(z)), r = m / (S / 2);
        let y = -sag * (1 - r * r);
        if (c > 2.2) {
          const tent = Math.max(0, eRel - Math.max(0, m - 0.39) * 0.9);
          const tight = m < 0.39 ? eRel : m < 0.58 ? eRel * (1 - (m - 0.39) / 0.19) : 0;
          y = Math.max(0, lerp(tent, tight, vac));
        }
        pos.array[i * 3 + 1] = y;
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
      sheet.visible = c < 4.55;
      needle.rotation.z = -2.2 * vac * (1 - ph(c, 3.8, 4.2)) + 1.0;
      const p = ph(c, 4.5, 5.2); tray.visible = c > 4.5;
      tray.position.set(lerp(0, -2.25, ease.out(p)), top + 0.15 + Math.sin(p * Math.PI) * 1.2 - p * 0.9, lerp(bz, -0.35, p)); tray.rotation.y = p * 3;
      void heat;
    },
  };
}

// ============ 5 · LINE BENDING (strip heater) ============
function lineBending(root) {
  const bz = -1.3, ty = 1.0;
  bx(root, PAL.cream, 0, ty - 0.12, bz, 4.8, 0.12, 2.2);
  for (const [x, z] of [[-2.2, -0.9], [2.2, -0.9], [-2.2, 0.9], [2.2, 0.9]]) bx(root, PAL.trunk, x, 0, bz + z, 0.14, ty - 0.12, 0.14);
  // strip heater body + glowing element along the bend line (z = bz)
  bx(root, PAL.navy2, -0.3, ty, bz, 3.4, 0.16, 0.42);
  const el = bx(root, PAL.coral, -0.3, ty + 0.16, bz, 3.2, 0.03, 0.09, { mat: B(PAL.coral, 1, { unique: true }), cast: false });
  bx(root, PAL.ink2, 1.75, ty, bz, 0.5, 0.35, 0.5); // control box
  const shimmer = grp(root, -0.3, ty + 0.3, bz, true);
  for (let i = 0; i < 4; i++) bx(shimmer, PAL.coralSoft, -1.2 + i * 0.8, 0, 0, 0.04, 0.25, 0.04, { mat: B(PAL.coralSoft, 0.7), cast: false });
  // acrylic sheet: fixed half (behind line) + hinged half (front) that folds up into a stand
  const acr = '#bde0f0';
  bx(root, acr, -0.3, ty + 0.2, bz - 0.55, 2.4, 0.05, 1.1, { mat: M(acr) });
  const hinge = grp(root, -0.3, ty + 0.2, bz, true);
  bx(hinge, acr, 0, 0, 0.5, 2.4, 0.05, 1.0, { mat: M(acr) });
  // bending jig (angled block)
  const jig = mesh(root, G('box', 0.6, 0.6, 0.6), M(PAL.peri), -2.6 + 0.2, ty + 0.0, bz + 0.6); jig.rotation.x = Math.PI / 4; jig.position.y = ty + 0.25; jig.scale.set(1, 0.8, 0.8);
  // finished phone stand with phone, on the bench end
  const st = grp(root, 1.9, ty, bz + 0.55);
  const a = mesh(st, G('box', 0.7, 0.04, 0.7), M(acr), 0, 0.02, 0); const b2 = mesh(st, G('box', 0.7, 0.04, 0.7), M(acr), 0, 0.3, -0.33); b2.rotation.x = 1.1;
  const phn = mesh(st, G('box', 0.42, 0.04, 0.78), M(PAL.ink), 0, 0.42, -0.2); phn.rotation.x = 1.1;
  void a;
  const pop = grp(root, 0, 0, 0, true); // stand flying off after bending
  mesh(pop, G('box', 2.4, 0.05, 1.0), M(acr), 0, 0, 0);
  return {
    w: 5.4, d: 2.8, h: 2.3,
    update(t) {
      const c = t % 4.8;
      const hot = c < 2.2 ? 0.75 + 0.25 * Math.sin(t * 10) : 0.2;
      el.material.color.set(hot > 0.5 ? (Math.sin(t * 10) > 0 ? '#ff6b5b' : '#ff8a7a') : '#8e97c9');
      shimmer.visible = c < 2.2; shimmer.children.forEach((m, i) => { m.position.y = ((t * 0.8 + i * 0.27) % 1) * 0.4; m.scale.y = 1 - ((t * 0.8 + i * 0.27) % 1); });
      const bend = ease.inOut(ph(c, 2.2, 3.1));
      hinge.rotation.x = -bend * 1.15;
      hinge.visible = c < 3.9; pop.visible = c > 3.9;
      const p = ph(c, 3.9, 4.8); pop.position.set(-0.3 + p * 2.2, ty + 0.3 + Math.sin(p * Math.PI) * 1.4 - p * 0.2, bz + 0.4 + p * 0.2); pop.rotation.x = -1.15; pop.scale.setScalar(1 - p * 0.9);
    },
  };
}

// ============ 6 · ROTATIONAL MOULDING ============
function rotational(root) {
  const bz = -1.6;
  // open oven cage: glowing heater back wall + corner posts (no roof, so the spinning mould stays visible)
  bx(root, PAL.slab, 0, 0, bz - 1.25, 3.6, 2.6, 0.25);
  const glow = bx(root, PAL.coral, 0, 0.35, bz - 1.1, 3.0, 1.9, 0.04, { mat: B(PAL.coralSoft, 1, { unique: true }), cast: false });
  for (const [x, z] of [[-1.7, -1.2], [1.7, -1.2], [-1.7, 1.1], [1.7, 1.1]]) bx(root, PAL.slab, x, 0, bz + z, 0.22, 2.9, 0.22);
  bx(root, PAL.slab, 0, 2.9, bz - 1.2, 3.6, 0.2, 0.22); bx(root, PAL.slab, 0, 2.9, bz + 1.1, 3.6, 0.2, 0.22);
  bx(root, PAL.lav, 0, 0, bz, 3.2, 0.12, 2.4);
  // drive: motor box outside the left wall + arm axle along x
  bx(root, PAL.navy2, -2.15, 0, bz, 0.8, 1.9, 0.9);
  cyX(root, PAL.ice, -1.8, -1.2, 1.6, bz, 0.09, 8);
  const outer = grp(root, 0, 1.6, bz, true);            // rotates about x
  for (const y of [0.95, -0.95]) bx(outer, PAL.ink2, 0, y - 0.05, 0, 2.5, 0.1, 0.1);
  bx(outer, PAL.ink2, -1.2, -0.95, 0, 0.1, 1.9, 0.1); bx(outer, PAL.ink2, 1.2, -0.95, 0, 0.1, 1.9, 0.1);
  cyX(outer, PAL.ink2, -1.25, -0.9, 0, 0, 0.09, 6);
  const inner = grp(outer, 0, 0, 0, true);               // rotates about the frame's y axis
  const mould = sp(inner, PAL.peri, 0, 0, 0, 0.5, { ws: 14, hs: 10 }); mould.scale.set(2.1, 0.7, 0.8);
  const fl = mesh(inner, G('box', 2.0, 0.05, 0.95), M(PAL.coralSoft), 0, 0, 0);
  void fl;
  // finished kayak + traffic cones by the front
  const kay = sp(root, PAL.yellow, 0, 0.4, 0.45, 0.5, { ws: 14, hs: 8 }); kay.scale.set(2.2, 0.32, 0.55); kay.position.set(0.3, 0.3, -0.35);
  bx(root, PAL.trunk, -0.5, 0, -0.35, 0.12, 0.2, 0.5); bx(root, PAL.trunk, 1.1, 0, -0.35, 0.12, 0.2, 0.5);
  for (const [x, z] of [[2.25, -0.4], [2.6, -1.1], [2.2, -1.8]]) { cy(root, PAL.coral, x, 0.08, z, 0.26, 0.85, 12, { rt: 0.06 }); cy(root, '#ffffff', x, 0.42, z, 0.18, 0.13, 12, { rt: 0.15 }); bx(root, PAL.coral, x, 0, z, 0.6, 0.08, 0.6); }
  return {
    w: 6.0, d: 3.2, h: 3.3,
    update(t) {
      outer.rotation.x = t * 1.3;
      inner.rotation.y = t * 1.9;
      glow.material.color.set(Math.sin(t * 3) > 0 ? '#ff8a7a' : '#ff9d8f');
    },
  };
}

// ============ 7 · COMPRESSION MOULDING (press) ============
const plateGeo = () => new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.5, 0.06], [0.62, 0.12], [0.62, 0.15], [0.55, 0.13], [0, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
let PLATE = null;
function compression(root) {
  PLATE = PLATE || plateGeo();
  const bz = -1.4;
  bx(root, PAL.belt, 0, 0, bz, 3.4, 0.95, 2.3);
  controlPanel(root, -1.1, 0.25, bz + 1.18);
  for (const [x, z] of [[-1.35, -0.8], [1.35, -0.8], [-1.35, 0.8], [1.35, 0.8]]) cy(root, PAL.ice, x, 0.95, bz + z, 0.12, 2.3, 10);
  bx(root, PAL.belt, 0, 3.25, bz, 3.4, 0.55, 2.3);
  cy(root, PAL.navy2, 0, 3.8, bz, 0.5, 0.65, 14);
  // heated lower mould
  bx(root, PAL.navy2, 0, 0.95, bz, 2.0, 0.35, 1.6);
  const lowGlow = bx(root, PAL.coral, 0, 1.0, bz + 0.81, 1.8, 0.08, 0.02, { mat: B(PAL.coral, 1, { unique: true }), cast: false });
  // upper platen on a ram
  const up = grp(root, 0, 2.6, bz, true);
  bx(up, PAL.navy2, 0, 0, 0, 2.0, 0.32, 1.6); cy(up, PAL.ice, 0, 0.32, 0, 0.22, 0.4, 10);
  const ram = cy(up, PAL.ice, 0, 0.32, 0, 0.22, 1, 10);
  const charge = grp(root, 0, 1.3, bz, true); const mound = mesh(charge, G('cyl', 0.05, 0.42, 0.25, 12), M('#f7efe8'), 0, 0.12, 0);
  const plate = grp(root, 0, 1.3, bz, true); mesh(plate, PLATE, M(PAL.mintSoft), 0, 0, 0);
  // plate stack + steam pool
  for (let i = 0; i < 3; i++) mesh(root, PLATE, M(PAL.mintSoft), 2.4, 0.04 + i * 0.09, -0.4);
  bx(root, PAL.lav, 2.4, 0, -0.4, 1.4, 0.04, 1.4);
  const steam = []; for (let i = 0; i < 4; i++) steam.push(sp(root, '#ffffff', 0, 0, 0, 0.18, { ws: 8, hs: 6, cast: false }));
  return {
    w: 5.2, d: 2.8, h: 4.4,
    update(t) {
      const c = t % 4.6;
      const down = ease.inOut(ph(c, 0.7, 1.2)) * (1 - ease.inOut(ph(c, 2.5, 3.0)));
      up.position.y = lerp(2.6, 1.33, down) + (c > 1.2 && c < 2.5 ? Math.sin(t * 40) * 0.01 : 0);
      ram.scale.y = 3.25 - up.position.y - 0.32; ram.position.y = 0.32 + ram.scale.y / 2;
      const pressing = c > 1.2 && c < 2.6;
      lowGlow.material.color.set(pressing ? (Math.sin(t * 9) > 0 ? '#ff6b5b' : '#ff8a7a') : '#ff9d8f');
      charge.visible = c < 1.25; mound.scale.setScalar(ease.back(ph(c, 0, 0.5)) + 0.001);
      charge.position.y = 1.3 + (1 - ease.out(ph(c, 0, 0.5))) * 0.8;
      const pp = ph(c, 3.6, 4.4);
      plate.visible = c > 2.9; plate.scale.setScalar(c < 3.3 ? 0.9 + 0.1 * ease.back(ph(c, 2.9, 3.3)) : 1);
      plate.position.set(lerp(0, 2.4, pp), 1.3 + Math.sin(pp * Math.PI) * 1.3 - pp * 1.0, lerp(bz, -0.4, pp));
      plate.rotation.x = pp * Math.PI * 2;
      steam.forEach((s, i) => { const u = ((c - 1.3) / 1.5 + i / 4) % 1; const on = c > 1.3 && c < 3.1; s.visible = on; s.position.set(-0.8 + i * 0.55, 1.6 + u * 1.6, bz + 0.85); s.scale.setScalar(0.4 + u * 1.2 - Math.max(0, u - 0.7) * 3); });
    },
  };
}

// ============ 8 · LASER CUTTER ============
function laser(root) {
  const bz = -1.4, ty = 1.1;
  bx(root, PAL.ice, 0, 0, bz, 4.4, ty, 2.6);
  bx(root, PAL.navy, 0, 0.75, bz + 1.31, 4.0, 0.22, 0.04, { cast: false });
  const sheetCol = PAL.coralPale;
  bx(root, sheetCol, 0, ty, bz, 3.4, 0.04, 1.9);
  // gantry: bar along x moving in z, head moving in x
  const gz = grp(root, 0, ty + 0.5, bz, true);
  bx(gz, PAL.ink2, 0, 0, 0, 3.8, 0.1, 0.14);
  const head = grp(gz, 0, 0, 0, true);
  bx(head, PAL.navy, 0, -0.12, 0, 0.3, 0.3, 0.3);
  const beam = cy(head, PAL.coral, 0, -0.5, 0, 0.025, 0.42, 6, { mat: B('#ff3b2b'), cast: false });
  const spark = sp(head, PAL.yellow, 0, -0.48, 0, 0.07, { mat: B(PAL.yellow), cast: false, ws: 6, hs: 4 });
  // tinted glass lid
  mesh(root, G('box', 4.0, 0.7, 2.3), B('#b9c6f0', 0.22), 0, ty + 0.38, bz, false);
  bx(root, PAL.ink2, 0, ty + 0.72, bz + 1.15, 4.0, 0.06, 0.06);
  // cut path (keyring circle + sign rectangle), revealed as a dark ribbon on the sheet
  const path = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; path.push([-1.0 + Math.cos(a) * 0.42, Math.sin(a) * 0.42]); }
  const rx0 = -0.2, rx1 = 1.3, rz0 = -0.5, rz1 = 0.5;
  for (const [x, z] of [[rx0, rz0], [rx1, rz0], [rx1, rz1], [rx0, rz1], [rx0, rz0]]) path.push([x, z]);
  // densify
  const P = []; for (let i = 0; i < path.length - 1; i++) { const [x0, z0] = path[i], [x1, z1] = path[i + 1]; const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.05)); for (let k = 0; k < n; k++) P.push([x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n]); }
  const v = [], idx = [];
  for (let i = 0; i < P.length; i++) { const [x, z] = P[i]; v.push(x - 0.03, 0, z - 0.03, x + 0.03, 0, z + 0.03); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); rg.setIndex(idx);
  const ribbon = mesh(root, rg, B(PAL.navy, 1, { side: THREE.DoubleSide }), 0, ty + 0.045, bz, false); ribbon.userData.dyn = true;
  const piece = grp(root, 0, 0, 0, true); bx(piece, sheetCol, 0.55, 0, 0, 1.5, 0.05, 1.0, { mat: M('#ff9d8f') }); cy(piece, '#ff9d8f', -1.0 + 0.0, 0, 0, 0.42, 0.05, 18);
  // CAD monitor beside
  const mon = grp(root, -2.7, 0, -0.5);
  bx(mon, PAL.lav, 0, 0, 0, 0.12, 1.4, 0.12); bx(mon, PAL.navy, 0, 1.4, 0, 0.1, 0.65, 0.95);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 88; const c2 = cv.getContext('2d');
  c2.fillStyle = '#4a5488'; c2.fillRect(0, 0, 128, 88); c2.strokeStyle = '#ffffff'; c2.lineWidth = 3; c2.strokeRect(54, 24, 52, 38); c2.beginPath(); c2.arc(30, 43, 15, 0, 7); c2.stroke();
  c2.fillStyle = '#9fe6c8'; c2.font = 'bold 16px sans-serif'; c2.fillText('CAD', 8, 18);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = mesh(mon, G('plane', 0.85, 0.58), new THREE.MeshBasicMaterial({ map: tex }), 0.06, 1.725, 0, false); scr.rotation.y = Math.PI / 2;
  return {
    w: 6.0, d: 2.9, h: 2.4,
    update(t) {
      const c = t % 6.5, cutT = clamp(c / 5.0), n = Math.floor(cutT * (P.length - 1));
      rg.setDrawRange(0, Math.max(0, n - 1) * 6);
      const [hx, hz] = c < 5.0 ? P[n] : [lerp(P[P.length - 1][0], 0, ph(c, 5, 6.5)), lerp(P[P.length - 1][1], 0.9, ph(c, 5, 6.5))];
      gz.position.z = bz + hz; head.position.x = hx;
      beam.visible = spark.visible = c < 5.0;
      spark.scale.setScalar(0.6 + Math.random() * 0.9);
      const pp = ph(c, 5.0, 6.5); piece.visible = c > 5.0 && c < 6.4; ribbon.visible = c < 6.3;
      piece.position.set(0, ty + 0.06 + ease.back(ph(c, 5.0, 5.5)) * 0.6 + pp * 0.1, bz);
    },
  };
}

// ============ 9 · 3D PRINTER (FDM) ============
function printer(root) {
  const bz = -1.4, by = 0.55, NL = 26;
  bx(root, PAL.mintSoft, 0, 0, bz, 2.8, by, 2.6);
  for (const [x, z] of [[-1.3, -1.2], [1.3, -1.2], [-1.3, 1.2], [1.3, 1.2]]) bx(root, PAL.ink2, x, by, bz + z, 0.12, 2.5, 0.12);
  for (const [x, z, w, d] of [[0, -1.2, 2.72, 0.12], [0, 1.2, 2.72, 0.12], [-1.3, 0, 0.12, 2.4], [1.3, 0, 0.12, 2.4]]) bx(root, PAL.ink2, x, by + 2.5, bz + z, w, 0.12, d);
  bx(root, PAL.navy, 0, by, bz, 2.0, 0.08, 2.0);
  // printed prototype: stack of layers (instanced slices) from a pawn-like profile
  const prof = (u) => 0.55 - 0.32 * Math.sin(Math.min(1, u * 1.25) * Math.PI * 0.9) + (u > 0.82 ? 0.22 * Math.sin((u - 0.82) / 0.18 * Math.PI) : 0);
  const lh = 0.055, layers = new THREE.InstancedMesh(G('cyl', 1, 1, 1, 14), M(PAL.mintMid), NL); layers.castShadow = true; layers.userData.dyn = true;
  const mm = new THREE.Matrix4();
  for (let i = 0; i < NL; i++) { const r = prof(i / NL) * 0.8; mm.makeScale(r, lh, r).setPosition(0, by + 0.08 + lh * (i + 0.5), bz); layers.setMatrixAt(i, mm); }
  root.add(layers);
  // gantry + head
  const gx = grp(root, 0, 0, bz, true); bx(gx, PAL.ice, 0, 0, 0, 2.5, 0.08, 0.1);
  const head = grp(gx, 0, 0, 0, true); bx(head, PAL.coral, 0, 0.0, 0, 0.32, 0.28, 0.32); const noz = mesh(head, G('cyl', 0.07, 0.01, 0.14, 8), M(PAL.ink2), 0, -0.07, 0);
  void noz;
  // spool on the side + filament line to the head
  const spool = grp(root, 1.85, 2.2, bz - 0.5, true);
  const sd = mesh(spool, G('cyl', 0.45, 0.45, 0.32, 18), M(PAL.mintMid), 0, 0, 0); sd.rotation.x = Math.PI / 2;
  const hub = mesh(spool, G('cyl', 0.16, 0.16, 0.34, 10), M(PAL.ice), 0, 0, 0); hub.rotation.x = Math.PI / 2;
  bx(root, PAL.lav, 1.85, 0, bz - 0.5, 0.12, 2.2, 0.12);
  const fil = mesh(root, G('cyl', 0.02, 0.02, 1, 4), B(PAL.mintMid), 0, 0, 0, false); fil.userData.dyn = true;
  // finished prototypes on a shelf
  bx(root, PAL.cream, -2.15, 0, -0.5, 1.0, 0.75, 1.1);
  for (const [x, z] of [[-2.35, -0.75], [-1.95, -0.25]]) { cy(root, PAL.mintMid, x, 0.75, z, 0.2, 0.18, 12); cy(root, PAL.mintMid, x, 0.93, z, 0.1, 0.3, 10); sp(root, PAL.mintMid, x, 1.28, z, 0.13, { ws: 10, hs: 7 }); }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  return {
    w: 5.0, d: 2.9, h: 3.2,
    update(t) {
      const c = t % 8, n = Math.min(NL, Math.floor(c / 6 * NL));
      const done = c >= 6;
      layers.count = c < 7.4 ? Math.max(1, done ? NL : n + 1) : 0;
      const layerY = by + 0.08 + lh * (done ? NL : n + 1) + 0.18;
      const r = prof(Math.min(NL - 1, n) / NL) * 0.8, ang = t * 9;
      const hx = done ? lerp(Math.cos(ang) * r, 0.9, ph(c, 6, 6.6)) : Math.cos(ang) * r, hz = done ? 0.9 * ph(c, 6, 6.6) : Math.sin(ang) * r;
      gx.position.set(0, done ? lerp(layerY, by + 2.2, ph(c, 6, 6.6)) : layerY, bz + hz); head.position.x = hx;
      spool.rotation.z = t * 0.6;
      a.set(1.85, 2.2, bz - 0.5).add(root.position); // local -> rotated below via root matrix
      a.set(1.85, 2.6, bz - 0.5); b.set(hx, gx.position.y + 0.28, bz + hz);
      const d = b.clone().sub(a), L = d.length(); fil.position.copy(a).addScaledVector(d, 0.5); fil.scale.set(1, L, 1); fil.quaternion.setFromUnitVectors(up, d.normalize());
      layers.position.y = c > 7.4 ? 0 : 0;
    },
  };
}

export const BUILDERS = { inj: injection, ext: extrusion, blow: blowMoulding, vac: vacuumForming, line: lineBending, roto: rotational, comp: compression, laser, print: printer };

// gate gantry: post just in front of the machine, arm over the gate lane (local z 0.6 .. 3.8), hanging sign
export function gantry(root, col) {
  const g = grp(root, 0, 0, 0);
  bx(g, PAL.ink2, 0, 0, 0.32, 0.26, 3.05, 0.26);
  bx(g, PAL.ink2, 0, 2.85, 2.0, 0.2, 0.2, 3.6);
  bx(g, col, 0, 2.2, 2.35, 0.12, 0.62, 2.7);
  bx(g, '#ffffff', 0.065, 2.36, 2.35, 0.02, 0.3, 2.3, { cast: false });
  for (const z of [1.3, 3.4]) bx(g, PAL.ink2, 0, 2.82, z, 0.05, 0.05, 0.05);
  return g;
}
export { worker };
