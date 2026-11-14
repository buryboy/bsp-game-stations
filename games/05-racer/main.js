// main.js — Factory Floor Racer (station 05 · manufacturing processes)
import * as THREE from '../../lib/three.module.min.js';
import { PAL, M, B, G, bx, cy, sp, grp, mesh, bake, tree, worker, animWorker, tag, numberTag, arrow, pill, wrap, f, ease, clamp, lerp, mixHex } from './style.js';
import { BUILDERS, gantry } from './machines.js';
import { MACHINES, PRODUCTS, CLUES } from './data.js';

const GS = window.GS;
const TW = 64, TD = 52, RH = 3.2; // tile size, road half-width
const W = 1280, H = 720;

// ================= renderer, canvases =================
const glc = document.getElementById('gl'), hud = document.getElementById('hud'), ctx = hud.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: !/[?&]aa=0/.test(location.search), alpha: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = !/[?&]sh=0/.test(location.search); renderer.shadowMap.type = THREE.PCFShadowMap;
let bufW = W, bufH = H;
function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H), pr = Math.min(devicePixelRatio || 1, 1.5);
  bufW = Math.min(2200, Math.round(W * s * pr)); bufH = Math.round(bufW * H / W);
  renderer.setPixelRatio(1); renderer.setSize(bufW, bufH, false);
  hud.width = bufW; hud.height = bufH;
}
GS.fit(glc, W, H); GS.fit(hud, W, H); addEventListener('resize', resize); resize();

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-16, 16, 9, -9, 1, 400);
const VIEW = new THREE.Vector3(1, 1, 1).normalize();
const RV = new THREE.Vector3(1, 0, -1).normalize(), UV = new THREE.Vector3(-1, 2, -1).normalize();
const cam = { x: 32, z: 26, h: 25, tx: 32, tz: 26, th: 25 };
function placeCamera() {
  const asp = W / H;
  camera.left = -cam.h * asp; camera.right = cam.h * asp; camera.top = cam.h; camera.bottom = -cam.h;
  camera.updateProjectionMatrix();
  camera.position.set(cam.x, 0, cam.z).addScaledVector(VIEW, 150); camera.lookAt(cam.x, 0, cam.z); camera.updateMatrixWorld();
}
const _v = new THREE.Vector3();
function scr(x, y, z) { _v.set(x, y, z).project(camera); return [(_v.x + 1) * W / 2, (1 - _v.y) * H / 2]; }

// sun: long soft shadows toward +x (screen lower-right), as the reference's shadow vector (1.15, 0.12)
const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
const SUN = new THREE.Vector3(-1.15, 1, -0.12).normalize();
scene.add(sun, sun.target);
function placeSun() {
  sun.target.position.set(cam.x, 0, cam.z); sun.position.copy(sun.target.position).addScaledVector(SUN, 60);
  const e = cam.h * 1.9 + 8, sc = sun.shadow.camera;
  if (Math.abs(sc.right - e) > 0.5) { sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix(); }
}

// ================= track: a rounded rectangle, sampled every 0.2 =================
const TRK = [];
{
  let x = 16.5, z = 10, a = 0, s = 0; const step = 0.2;
  const push = (arc) => TRK.push({ x, z, tx: Math.cos(a), tz: Math.sin(a), s, arc });
  const line = (L) => { const n = Math.round(L / step); for (let i = 0; i < n; i++) { push(false); x += Math.cos(a) * step; z += Math.sin(a) * step; s += step; } };
  const turn = (R, ang) => { const n = Math.round(R * ang / step), da = ang / n; const cx = x - R * Math.sin(a), cz = z + R * Math.cos(a); for (let i = 0; i < n; i++) { push(true); a += da; x = cx + R * Math.sin(a); z = cz - R * Math.cos(a); s += R * da; } };
  for (let k = 0; k < 2; k++) { line(31); turn(6.5, Math.PI / 2); line(19); turn(6.5, Math.PI / 2); }
  TRK.L = s;
}
const NT = TRK.length;
const at = (s) => { s = ((s % TRK.L) + TRK.L) % TRK.L; return TRK[Math.min(NT - 1, Math.round(s / TRK.L * NT))]; };
function nearest(x, z, hint) {
  let best = -1, bd = 1e9;
  const scan = (i0, i1) => { for (let i = i0; i <= i1; i++) { const p = TRK[(i + NT) % NT], d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < bd) { bd = d; best = (i + NT) % NT; } } };
  if (hint >= 0) scan(hint - 40, hint + 40);
  if (hint < 0 || bd > 30) scan(0, NT - 1);
  return best;
}
const sDiff = (a, b) => { let d = a - b; if (d > TRK.L / 2) d -= TRK.L; if (d < -TRK.L / 2) d += TRK.L; return d; };
const START_S = 85.9;

// ================= floor texture (painted) =================
const PX = 32;
function floorTexture() {
  const c = document.createElement('canvas'); c.width = TW * PX; c.height = TD * PX; const g = c.getContext('2d');
  g.fillStyle = PAL.floor; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(170,160,205,0.22)'; g.lineWidth = 2; g.beginPath();
  for (let i = 2; i < TW; i += 2) { g.moveTo(i * PX, 0); g.lineTo(i * PX, c.height); }
  for (let i = 2; i < TD; i += 2) { g.moveTo(0, i * PX); g.lineTo(c.width, i * PX); }
  g.stroke();
  const P = (x, z) => [x * PX, z * PX];
  // machine zone tints
  for (const m of MACHINES) {
    const mw = m.w + 0.8, md = m.d + 0.8;
    g.save(); g.translate(m.x * PX, m.z * PX); g.rotate(-m.rot); g.fillStyle = mixHex(m.col, '#ffffff', 0.15) + '88';
    g.beginPath(); g.roundRect(-mw / 2 * PX, (-md + 0.4) * PX, mw * PX, md * PX, 14); g.fill(); g.restore();
  }
  // infield walkway stripes
  g.strokeStyle = 'rgba(255,200,120,0.9)'; g.lineWidth = 4; g.setLineDash([14, 14]);
  g.beginPath(); g.rect(17 * PX, 17 * PX, 25 * PX, 14 * PX); g.stroke(); g.setLineDash([]);
  // road
  const road = (w, col, dash) => { g.strokeStyle = col; g.lineWidth = w * PX; g.lineJoin = 'round'; g.setLineDash(dash || []); g.beginPath(); TRK.forEach((p, i) => (i ? g.lineTo(...P(p.x, p.z)) : g.moveTo(...P(p.x, p.z)))); g.closePath(); g.stroke(); g.setLineDash([]); };
  road(RH * 2 + 0.5, '#ffffff'); road(RH * 2, '#e2def0');
  // kerbs on corners (outer + inner edges), coral & white
  for (const side of [-1, 1]) for (let i = 0; i < NT; i++) {
    const p = TRK[i]; if (!p.arc) continue;
    const n = [-p.tz * side, p.tx * side], o = RH - 0.05;
    g.strokeStyle = Math.floor(p.s / 0.8) % 2 ? PAL.coral : '#ffffff'; g.lineWidth = 0.45 * PX;
    g.beginPath(); g.moveTo(...P(p.x + n[0] * o, p.z + n[1] * o)); g.lineTo(...P(p.x + n[0] * o + p.tx * 0.22, p.z + n[1] * o + p.tz * 0.22)); g.stroke();
  }
  road(0.14, 'rgba(255,255,255,0.95)', [1.2 * PX, 1.0 * PX]);
  // gate lanes: tint, solid divider, chevrons, painted number
  MACHINES.forEach((m, k) => {
    const s0 = m.s - m.w / 2 + 0.3, s1 = m.s + m.w / 2 - 0.3, sd = m.side;
    const pt = (s, lat) => { const p = at(s); return P(p.x - p.tz * lat, p.z + p.tx * lat); };
    g.fillStyle = mixHex(m.col, '#ff6b5b', m.col === '#eef1fa' ? 0.12 : 0.05) + 'dd';
    g.beginPath(); g.moveTo(...pt(s0, sd * 0.12)); g.lineTo(...pt(s1, sd * 0.12)); g.lineTo(...pt(s1, sd * RH)); g.lineTo(...pt(s0, sd * RH)); g.closePath(); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.22 * PX; g.beginPath(); g.moveTo(...pt(s0 - 1, 0)); g.lineTo(...pt(s1 + 1, 0)); g.stroke();
    g.strokeStyle = 'rgba(74,84,136,0.35)'; g.lineWidth = 0.18 * PX;
    for (let s = s0 + 0.8; s < s1 - 0.4; s += 1.3) { const q = at(s); const lat = sd * 1.7; const cx = q.x - q.tz * lat, cz = q.z + q.tx * lat; const b = [cx - q.tx * 0.45, cz - q.tz * 0.45]; g.beginPath(); g.moveTo(...P(b[0] - q.tz * 0.8, b[1] + q.tx * 0.8)); g.lineTo(...P(cx + q.tx * 0.2, cz + q.tz * 0.2)); g.lineTo(...P(b[0] + q.tz * 0.8, b[1] - q.tx * 0.8)); g.stroke(); }
    // painted number on the bypass half
    const q = at(m.s), lat = -sd * 1.7; g.save(); g.translate(...P(q.x - q.tz * lat, q.z + q.tx * lat)); { let an = Math.atan2(q.tz, q.tx); if (Math.cos(an) < -0.1 || Math.sin(an) > 0.9) an += Math.PI; g.rotate(an); }
    g.font = `800 ${1.3 * PX}px Inter, sans-serif`; g.fillStyle = 'rgba(150,140,200,0.35)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0' + (k + 1), 0, 0); g.restore();
  });
  // start line: checkers
  { const q = at(START_S); for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) { const lat = -RH + i * 0.4 + 0.2, al = r * 0.4 - 0.2; g.fillStyle = (i + r) % 2 ? PAL.ink : '#ffffff'; const cx = q.x - q.tz * lat + q.tx * al, cz = q.z + q.tx * lat + q.tz * al; g.fillRect((cx - 0.2) * PX, (cz - 0.2) * PX, 0.4 * PX, 0.4 * PX); } }
  // painted floor lettering
  const ft = (x, z, str, size, al = 0.5) => { g.save(); g.font = `800 ${size * PX}px Inter, sans-serif`; g.fillStyle = `rgba(150,140,200,${al})`; g.fillText(str, x * PX, z * PX); g.restore(); };
  ft(17.4, 21.6, 'FACTORY FLOOR', 1.5, 0.42); ft(17.4, 33.6, 'DISPATCH  →  DELIVER', 0.9, 0.42);
  ft(36.5, 49.6, 'STATION 05', 1.3, 0.4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.generateMipmaps = true;
  return t;
}

// ================= world =================
const world = grp(scene);
// machine placement (needs track)
MACHINES.forEach((m, i) => {
  m.i = i;
  const q = at(m.s), nIn = [-q.tz, q.tx], o = RH + 0.6;
  m.x = q.x + nIn[0] * m.side * o; m.z = q.z + nIn[1] * m.side * o;
  const fz = [-m.side * nIn[0], -m.side * nIn[1]]; m.rot = Math.atan2(fz[0], fz[1]);
  m.root = grp(world, m.x, 0, m.z); m.root.rotation.y = m.rot;
  m.api = BUILDERS[m.id](m.root);
  m.w = m.api.w; m.d = m.api.d; m.h = m.api.h;
  gantry(m.root, m.col);
  m.pad = mesh(m.root, G('plane', m.w - 0.6, RH - 0.15), B('#ffffff', 0.0, { unique: true }), 0, 0.03, 0.6 + (RH - 0.15) / 2, false); m.pad.rotation.x = -Math.PI / 2;
  bake(m.root);
  m.cos = Math.cos(m.rot); m.sin = Math.sin(m.rot);
  m.toW = (lx, ly, lz) => [m.x + lx * m.cos + lz * m.sin, ly, m.z - lx * m.sin + lz * m.cos];
  m.learnUntil = -1; m.learnAt = -99; m.flash = 0; m.flashCol = PAL.mint; m.deliverAt = -99;
});
const MBY = Object.fromEntries(MACHINES.map((m) => [m.id, m]));

// tile slab + floor + shadow catcher
{
  bx(world, PAL.slab2, TW / 2, -2.6, TD / 2, TW - 1.6, 1.2, TD - 1.6);
  bx(world, PAL.slab, TW / 2, -1.42, TD / 2, TW, 1.4, TD);
  const fl = mesh(world, G('plane', TW, TD), new THREE.MeshBasicMaterial({ map: floorTexture() }), TW / 2, 0, TD / 2, false); fl.rotation.x = -Math.PI / 2;
  const sh = mesh(world, G('plane', TW, TD), new THREE.ShadowMaterial({ color: 0x6e60aa, opacity: 0.2, depthWrite: false }), TW / 2, 0.02, TD / 2, false); sh.rotation.x = -Math.PI / 2; sh.receiveShadow = true;
  const edge = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.01, TD), new THREE.Vector3(TW, 0.01, TD), new THREE.Vector3(TW, 0.01, 0)]), new THREE.LineBasicMaterial({ color: 0xffffff }));
  world.add(edge);
  // long soft shadow of the floating tile, far below (pre-blurred texture)
  const c = document.createElement('canvas'); c.width = 256; c.height = 210; const g = c.getContext('2d');
  g.filter = 'blur(14px)'; g.fillStyle = 'rgb(90,80,150)'; g.fillRect(28, 28, 200, 154);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const ss = mesh(scene, G('plane', TW * 1.25, TD * 1.25), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.16, depthWrite: false }), TW / 2 + 14, -22, TD / 2 + 4, false); ss.rotation.x = -Math.PI / 2;
}
// static decor (baked into one group)
const decor = grp(world);
const DEC = []; // collision boxes: [x, z, hw, hd]
{
  // dispatch office with windows, coral sign strip
  const ox = 30, oz = 25.5;
  bx(decor, PAL.sky, ox, 0, oz, 8, 2.6, 4.6); DEC.push([ox, oz, 4.2, 2.5]);
  for (let i = 0; i < 6; i++) bx(decor, PAL.glass, ox - 3.3 + i * 1.3, 1.0, oz + 2.31, 0.75, 1.1, 0.04, { cast: false });
  bx(decor, PAL.coral, ox - 2.4, 2.2, oz + 2.32, 3.0, 0.25, 0.04, { cast: false });
  bx(decor, PAL.grey, ox + 3.2, 0, oz + 2.31, 0.6, 1.0, 0.04, { cast: false });
  for (let i = 0; i < 3; i++) bx(decor, PAL.ice, ox - 2.6 + i * 2.6, 2.6, oz - 0.6, 1.3, 0.4, 1.3);
  // cooling tanks
  for (const [x, z, r, h] of [[19.5, 29.5, 0.95, 2.5], [22, 30.6, 0.75, 1.9]]) { cy(decor, PAL.mintSoft, x, 0, z, r, h, 16); cy(decor, mixHex(PAL.mintSoft, '#5a8f86', 0.35), x, h, z, r * 0.45, 0.08, 12); DEC.push([x, z, r, r]); }
  // pallets with crates + granule sacks
  for (const [x, z] of [[38.5, 20], [40, 22.2], [21, 19.5]]) { bx(decor, PAL.trunk, x, 0, z, 1.4, 0.18, 1.2); bx(decor, PAL.cream, x - 0.2, 0.18, z, 0.9, 0.8, 0.9); bx(decor, PAL.coralPale, x + 0.35, 0.18, z + 0.1, 0.5, 0.5, 0.5); DEC.push([x, z, 0.8, 0.7]); }
  for (let i = 0; i < 4; i++) { const m = sp(decor, i % 2 ? PAL.peach : PAL.ice, 24.5 + (i % 2) * 0.7, 0.3 + Math.floor(i / 2) * 0.45, 19 + (i % 2) * 0.2, 0.42, { ws: 10, hs: 7 }); m.scale.set(1, 0.55, 0.8); }
  DEC.push([24.8, 19.1, 0.9, 0.6]);
  // trees
  for (const [x, z, s] of [[15.5, 16, 1.1], [44, 16.5, 1], [16.5, 31.5, 0.9], [36.5, 30.5, 1], [61.5, 47.5, 1.1], [58.5, 50, 0.9], [2.8, 48.5, 1.2], [5.5, 50, 0.8], [61, 3, 1.1], [2.5, 2.5, 1.0], [61.8, 20, 0.95], [61.8, 34, 1.05], [29, 50, 0.9], [12.5, 49.6, 1]]) { tree(decor, x, z, s); DEC.push([x, z, 0.35, 0.35]); }
  // benches & cone stacks on the near margins (low)
  bx(decor, PAL.cream, 45, 0, 49.5, 2.2, 0.4, 0.6); bx(decor, PAL.cream, 61, 0, 41, 0.6, 0.4, 2.2);
  bake(decor);
}
// spinning roof fans on the office (dyn)
const fans = [];
for (let i = 0; i < 3; i++) { const fg = grp(world, 30 - 2.6 + i * 2.6, 3.02, 24.9); for (let b = 0; b < 3; b++) { const bl = bx(fg, PAL.grey, 0, 0, 0, 0.9, 0.04, 0.22, { cast: false }); bl.rotation.y = b * Math.PI * 2 / 3; bl.geometry = G('box', 0.9, 0.04, 0.22); } fans.push(fg); }
// floating debris cubes under the island
const debris = [[8, -6, 56, 1.4], [70, -7, 40, 1.0], [52, -9, 58, 1.2], [-4, -5, 30, 0.9]].map(([x, y, z, s]) => { const m = bx(scene, PAL.slab, x, y, z, s, s, s, { cast: false }); m.userData.y = y + s / 2; return m; });

// workers (by machines + walkers)
const WORKERS = [];
const shirts = [PAL.coral, PAL.blue, PAL.mintMid, '#f5b78f', PAL.peri, PAL.yellow];
MACHINES.forEach((m, i) => { const sx = (i % 2 ? -1 : 1) * (m.w / 2 + 0.45); const [x, , z] = m.toW(sx, 0, -0.9); const wk = worker(world, x, z, shirts[i % 6]); wk.rotation.y = m.rot + (i % 2 ? Math.PI / 2 : -Math.PI / 2) + Math.PI; WORKERS.push({ g: wk, m, walk: false }); });
for (const [x0, z0, x1, z1] of [[18, 17, 41, 17], [41, 31, 18, 31]]) { const wk = worker(world, x0, z0, shirts[WORKERS.length % 6]); WORKERS.push({ g: wk, walk: true, x0, z0, x1, z1 }); }

// boost pads (scrolling chevrons)
const padTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,107,91,0.85)'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(14, 12); g.lineTo(40, 32); g.lineTo(14, 52); g.stroke(); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const PADS = [11, 50.7, 101.5 + 4.6, 121.1].map((s) => {
  const q = at(s), m = MACHINES.reduce((b, mm) => (Math.abs(sDiff(mm.s, s)) < Math.abs(sDiff(b.s, s)) ? mm : b));
  const lat = -m.side * 1.6, x = q.x - q.tz * lat, z = q.z + q.tx * lat;
  const t = padTex.clone(); t.repeat.set(3, 1); t.needsUpdate = true;
  const pm = mesh(world, G('plane', 3.0, 1.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), x, 0.035, z, false);
  pm.rotation.x = -Math.PI / 2; pm.rotation.z = -Math.atan2(q.tz, q.tx);
  return { s, x, z, lat, tex: t };
});

// forklift hazards (level 2+): cross road A and road D between machines
function forklift() {
  const g = grp(world, 0, 0, 0, true);
  bx(g, PAL.yellow, 0, 0.25, 0, 1.4, 0.55, 0.9); bx(g, PAL.ink2, -0.35, 0.8, 0, 0.6, 0.55, 0.8); bx(g, PAL.glass, -0.35, 1.35, 0, 0.62, 0.05, 0.82);
  bx(g, PAL.ink2, 0.75, 0.1, 0, 0.1, 1.6, 0.8); bx(g, PAL.trunk, 1.15, 0.15, 0, 0.7, 0.12, 0.9); bx(g, PAL.cream, 1.15, 0.27, 0, 0.6, 0.5, 0.6);
  for (const [x, z] of [[-0.45, 0.48], [0.45, 0.48], [-0.45, -0.48], [0.45, -0.48]]) { const w = mesh(g, G('cyl', 0.22, 0.22, 0.16, 10), M(PAL.ink2), x, 0.22, z); w.rotation.x = Math.PI / 2; }
  const beacon = sp(g, PAL.coral, -0.35, 1.45, 0, 0.11, { mat: B(PAL.coral, 1, { unique: true }), cast: false, ws: 8, hs: 6 });
  g.visible = false;
  return { g, beacon };
}
const FORKS = [{ ...forklift(), ax: 27.3, az: 2.4, bx: 27.3, bz: 17.6, ph: 0 }, { ...forklift(), ax: 61.4, az: 25.6, bx: 44.2, bz: 25.6, ph: 4 }];
// spilled granule patches (level 3)
const SPILL_N = 3, SPILL_K = 14;
const spillMeshes = [PAL.coralSoft, PAL.mintMid, PAL.peri].map((c) => { const im = new THREE.InstancedMesh(G('sph', 0.13, 6, 4), M(c), SPILL_N * SPILL_K); im.count = 0; world.add(im); return im; });
const SPILLS = [];

// pooled effects: puffs (white balls) and celebration cubes
const puffs = Array.from({ length: 26 }, () => { const m = sp(world, '#ffffff', 0, -5, 0, 0.3, { cast: false, ws: 8, hs: 6 }); m.visible = false; return { m, t: 0, life: 0, vx: 0, vz: 0, vy: 0 }; });
const cubes = Array.from({ length: 28 }, (_, i) => { const m = bx(world, i % 2 ? PAL.coralSoft : PAL.coralPale, 0, -5, 0, 0.3, 0.3, 0.3); m.geometry = G('box', 0.3, 0.3, 0.3); m.position.y = -5; m.visible = false; return { m, t: 0, life: 0, vx: 0, vy: 0, vz: 0 }; });
function puff(x, y, z, vx, vz, s = 1) { const p = puffs.find((q) => q.t >= q.life); if (!p) return; Object.assign(p, { t: 0, life: 0.55, vx, vz, vy: 0.6, s }); p.m.position.set(x, y, z); p.m.visible = true; }
function burst(x, y, z, n = 12) { let k = 0; for (const c of cubes) { if (c.t < c.life) continue; Object.assign(c, { t: 0, life: 1.1 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 3, vz: (Math.random() - 0.5) * 3, vy: 3 + Math.random() * 2.5 }); c.m.position.set(x + (Math.random() - 0.5), y, z + (Math.random() - 0.5)); c.m.visible = true; if (++k >= n) break; } }
// floor rings that mark the correct machine after a wrong gate
const rings = [0, 1].map(() => { const m = mesh(world, G('ring', 0.85, 1, 48), B(PAL.coral, 0.9, { unique: true, side: THREE.DoubleSide }), 0, 0.05, 0, false); m.rotation.x = -Math.PI / 2; m.visible = false; return m; });

// ================= cars =================
function makeCar(col, num) {
  const g = grp(world, 0, 0, 0, true);
  const body = grp(g, 0, 0, 0, true);
  bx(body, col, 0, 0.2, 0, 1.9, 0.34, 1.1);
  bx(body, col, 0.86, 0.14, 0, 0.32, 0.22, 1.2);                   // front bumper
  bx(body, mixHex(col, '#2d3058', 0.25), -0.75, 0.54, 0, 0.42, 0.34, 0.9); // engine box
  bx(body, '#ffffff', -0.55, 0.54, 0, 0.1, 0.42, 0.9);               // seat back
  bx(body, PAL.ink2, -0.98, 0.85, 0, 0.18, 0.06, 1.3);               // spoiler
  bx(body, PAL.ink2, -0.98, 0.54, 0.4, 0.06, 0.32, 0.06); bx(body, PAL.ink2, -0.98, 0.54, -0.4, 0.06, 0.32, 0.06);
  bx(body, '#ffffff', 0.35, 0.54, 0, 0.5, 0.02, 0.5, { cast: false });  // number roundel base
  sp(body, PAL.skin, -0.25, 0.85, 0, 0.2, { ws: 10, hs: 7 });
  const helm = sp(body, '#ffffff', -0.25, 0.92, 0, 0.23, { ws: 12, hs: 8 }); helm.scale.set(1, 0.85, 1);
  bx(body, col, -0.25, 0.98, 0, 0.47, 0.07, 0.12, { cast: false });
  bx(body, '#ffffff', -0.25, 0.54, 0, 0.3, 0.26, 0.6);              // driver body
  bx(body, PAL.yellow, 0.98, 0.26, 0.38, 0.06, 0.12, 0.2, { cast: false }); bx(body, PAL.yellow, 0.98, 0.26, -0.38, 0.06, 0.12, 0.2, { cast: false });
  const crate = bx(body, PAL.cream, 0.32, 0.54, 0, 0.55, 0.42, 0.62); bx(body, PAL.coral, 0.32, 0.75, 0, 0.57, 0.06, 0.64, { cast: false });
  const wheels = [];
  for (const [x, z] of [[0.62, 0.6], [0.62, -0.6], [-0.62, 0.62], [-0.62, -0.62]]) { const wg = grp(g, x, 0.25, z, true); const w = mesh(wg, G('cyl', 0.25, 0.25, 0.24, 12), M(PAL.ink2), 0, 0, 0); w.rotation.x = Math.PI / 2; mesh(wg, G('cyl', 0.1, 0.1, 0.26, 8), M(PAL.ice), 0, 0, 0, false).rotation.x = Math.PI / 2; wheels.push(wg); }
  const flame = mesh(g, G('cyl', 0, 0.22, 0.7, 8), B(PAL.coral), -1.3, 0.55, 0, false); flame.rotation.z = Math.PI / 2; flame.visible = false;
  return { g, body, wheels, flame, crate, col, num, x: 0, z: 0, vx: 0, vz: 0, a: 0, vF: 0, spin: 0, spinRate: 0, boostT: 0, idx: -1, s: 0, prevS: 0, lat: 0, steerV: 0, slip: 0, wob: 0, idleT: 99, roll: 0 };
}
const CARS = [makeCar(PAL.coral, 1), makeCar(PAL.blue, 2)];

// ================= game state =================
const P = [0, 1].map((i) => ({ i, car: CARS[i], score: 0, ticket: null, failed: false, streak: 0, boost: 0, visited: new Set(), practice: null, ready: false, startPressed: false, msg: null, cardPop: -9, hornT: -9, lastGate: {}, flashM: null, flashUntil: 0 }));
let wt = 0;            // world animation clock (advances while running or idle)
let roundT = 0;        // time since round start (running only)
let playT = -1;        // time since TEST started
let introBanner = false, introT = 0, popups = [], banners = [], lastPhase = 'idle', bothReadyAt = -1;
const LEVEL = () => (playT < 60 ? 1 : playT < 130 ? 2 : 3);

function gridCars() {
  CARS.forEach((c, i) => {
    const q = at(START_S - 1.2 - i * 0), lat = i ? -1.5 : 1.5;
    c.x = q.x - q.tz * lat; c.z = q.z + q.tx * lat; c.a = Math.atan2(q.tz, q.tx);
    c.vx = c.vz = c.vF = 0; c.spin = 0; c.boostT = 0; c.slip = 0; c.idx = -1; c.wob = 0; c.idleT = 0;
    c.idx = nearest(c.x, c.z, -1); c.s = c.prevS = TRK[c.idx].s;
  });
}
function resetRound() {
  for (const b of BOT) Object.assign(b, { steerAt: 0, decideAt: 0, px: null, spunAt: -9, misses: 0, ticket: null, target: null, failed: false, stuck: 0, reverseT: 0, readyAt: -1, boostCD: 2 });
  for (const p of P) Object.assign(p, { misses: 0, score: 0, ticket: null, failed: false, streak: 0, boost: 0, visited: new Set(), practice: null, ready: false, startPressed: false, msg: null, cardPop: -9, lastGate: {}, flashM: null, flashUntil: 0 });
  introBanner = false; CARS.forEach((c) => (c.learnM = null)); gridCars(); roundT = 0; introT = 0; playT = -1; popups = []; banners = []; bothReadyAt = -1;
  for (const m of MACHINES) { m.learnUntil = -1; m.learnAt = -99; m.flash = 0; m.deliverAt = -99; }
  SPILLS.length = 0; FORKS.forEach((fk) => (fk.g.visible = false));
  for (const r of rings) r.visible = false;
  GS.score(0, 0);
}
function startTest() {
  playT = 0; banners = [];
  for (const p of P) { p.boost = 1; p.ticket = newTicket(p); p.cardPop = roundT; p.practice = null; p.msg = null; }
  banner('Deliver each job ticket to the right machine!', PAL.ink);
}
function newTicket(p) {
  const lv = LEVEL(), prev = p.ticket && p.ticket.m;
  let pool = lv === 3 && Math.random() < 0.55 ? CLUES : PRODUCTS.filter((q) => q.lv <= lv);
  pool = pool.filter((q) => q.m !== prev && (!P[1 - p.i].ticket || q !== P[1 - p.i].ticket));
  p.failed = false;
  return pool[Math.floor(Math.random() * pool.length)];
}
function banner(text, col = PAL.ink, dur = 3) { banners.push({ text, col, t0: roundT, dur }); if (banners.length > 2) banners.shift(); }
function popup(x, y, z, text, o = {}) { popups.push({ x, y, z, text, t0: roundT, dur: o.dur || 1.6, bg: o.bg || '#fff', col: o.col || PAL.ink, big: o.big }); }
const pan = (x, z) => clamp(scr(x, 0, z)[0] / 640 - 1, -1, 1) * 0.6;
const sfx = (n, o = {}) => GS.sfx(n, o);

// ================= physics =================
function obbPush(c, cx, cz, cs, sn, hx, z0, z1, r) {
  // box in local coords x∈[-hx,hx], z∈[z0,z1]; local→world: (lx cos + lz sin, -lx sin + lz cos)
  const dx = c.x - cx, dz = c.z - cz, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
  const qx = clamp(lx, -hx, hx), qz = clamp(lz, z0, z1);
  let nx = lx - qx, nz = lz - qz, d = Math.hypot(nx, nz);
  if (d >= r) return false;
  if (d < 1e-4) { const opts = [[lx + hx, -1, 0], [hx - lx, 1, 0], [lz - z0, 0, -1], [z1 - lz, 0, 1]].sort((a, b) => a[0] - b[0]); nx = opts[0][1]; nz = opts[0][2]; d = -opts[0][0]; } else { nx /= d; nz /= d; }
  const push = r - d, wx = nx * cs + nz * sn, wz = -nx * sn + nz * cs;
  c.x += wx * push; c.z += wz * push;
  const vn = c.vx * wx + c.vz * wz; if (vn < 0) { c.vx -= 1.4 * vn * wx; c.vz -= 1.4 * vn * wz; }
  return -vn;
}
function stepCar(c, inp, dt, maxSpd, canDrive) {
  const fx = Math.cos(c.a), fz = Math.sin(c.a);
  let vF = c.vx * fx + c.vz * fz, vL = -c.vx * fz + c.vz * fx;
  if (c.spin > 0) {
    c.spin -= dt; c.a += c.spinRate * dt * clamp(c.spin * 1.2); vF *= Math.exp(-dt * 2.2); vL *= Math.exp(-dt * 2.2);
  } else if (canDrive) {
    const boost = c.boostT > 0 ? 1.55 : 1, mx = maxSpd * boost;
    if (inp.up) { if (vF < mx) vF = Math.min(mx, vF + (vF < 0 ? 24 : 15 * (c.boostT > 0 ? 1.8 : 1)) * dt); }
    else if (inp.down) vF -= (vF > 0 ? 24 : 9) * dt;
    else vF -= Math.sign(vF) * Math.min(Math.abs(vF), 4 * dt);
    if (vF > mx) vF -= (vF - mx) * Math.min(1, 3.5 * dt);
    if (vF < -4) vF = -4;
    const st = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    c.steerV = lerp(c.steerV, st, Math.min(1, dt * 10));
    c.a += c.steerV * 2.7 * dt * clamp(Math.abs(vF) / 3.5) * Math.sign(vF || 1);
  } else { vF *= Math.exp(-dt * 4); }
  const grip = c.slip > 0 ? 1.0 : 9;
  vL *= Math.exp(-dt * grip);
  const nfx = Math.cos(c.a), nfz = Math.sin(c.a);
  // keep the velocity frame from the old heading but re-project onto the new one (arcade grip)
  const vx = fx * vF - fz * vL, vz = fz * vF + fx * vL;
  const f2 = vx * nfx + vz * nfz, l2 = -vx * nfz + vz * nfx;
  c.vx = nfx * f2 - nfz * l2 * 0.92; c.vz = nfz * f2 + nfx * l2 * 0.92;
  c.vF = f2;
  c.x += c.vx * dt; c.z += c.vz * dt;
  c.boostT -= dt; c.slip -= dt;
  // collisions: tile edges, machines + gantry posts, decor
  if (c.x < 0.9) { c.x = 0.9; c.vx = Math.abs(c.vx) * 0.4; } if (c.x > TW - 0.9) { c.x = TW - 0.9; c.vx = -Math.abs(c.vx) * 0.4; }
  if (c.z < 0.9) { c.z = 0.9; c.vz = Math.abs(c.vz) * 0.4; } if (c.z > TD - 0.9) { c.z = TD - 0.9; c.vz = -Math.abs(c.vz) * 0.4; }
  let hit = 0;
  for (const m of MACHINES) {
    if (Math.abs(c.x - m.x) > 8 || Math.abs(c.z - m.z) > 8) continue;
    hit = Math.max(hit, obbPush(c, m.x, m.z, m.cos, m.sin, m.w / 2, -m.d - 0.2, 0.05, 0.75) || 0);
    hit = Math.max(hit, obbPush(c, m.x, m.z, m.cos, m.sin, 0.15, 0.17, 0.47, 0.75) || 0);
  }
  for (const [x, z, hw, hd] of DEC) { if (Math.abs(c.x - x) < hw + 2 && Math.abs(c.z - z) < hd + 2) hit = Math.max(hit, obbPush(c, x, z, 1, 0, hw, -hd, hd, 0.75) || 0); }
  for (const fk of FORKS) if (fk.g.visible) { const d = Math.hypot(c.x - fk.g.position.x, c.z - fk.g.position.z); if (d < 1.7) { const nx = (c.x - fk.g.position.x) / d, nz = (c.z - fk.g.position.z) / d; c.x += nx * (1.7 - d); c.z += nz * (1.7 - d); c.vx = nx * 6; c.vz = nz * 6; if (c.spin <= 0) { c.spin = 0.6; c.spinRate = 9; sfx('thud', { gain: 0.6, pan: pan(c.x, c.z) }); popup(c.x, 1.5, c.z, 'Forklift!', { dur: 1 }); } } }
  if (hit > 3) sfx('tock', { f: 260, gain: Math.min(0.8, hit / 12), pan: pan(c.x, c.z) });
  // track coordinates
  c.prevS = c.s; c.idx = nearest(c.x, c.z, c.idx); const q = TRK[c.idx];
  c.s = q.s; c.lat = -(c.x - q.x) * q.tz + (c.z - q.z) * q.tx;
}
function carBump(dt) {
  const a = CARS[0], b = CARS[1], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  if (d > 1.55 || d < 1e-4) return;
  const nx = dx / d, nz = dz / d, push = (1.55 - d) / 2;
  a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
  const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
  if (rv < 0) {
    const j = -rv * 0.95 + 1.2;
    a.vx -= nx * j; a.vz -= nz * j; b.vx += nx * j; b.vz += nz * j;
    if (-rv > 2.5) { sfx('thud', { f: 160, gain: Math.min(0.9, -rv / 10), pan: pan(a.x, a.z) }); sfx('tock', { f: 420, gain: 0.5 }); puff((a.x + b.x) / 2, 0.6, (a.z + b.z) / 2, 0, 0, 1.4); }
    if (-rv > 7) { const victim = Math.hypot(a.vx, a.vz) < Math.hypot(b.vx, b.vz) ? a : b; if (victim.spin <= 0) { victim.spin = 0.45; victim.spinRate = 10; } popup((a.x + b.x) / 2, 1.8, (a.z + b.z) / 2, 'BUMP!', { dur: 0.8 }); }
  }
}
function autopilot(c, p, mode) {
  const look = TRK[(c.idx + 20) % NT];
  let lat = 0;
  for (const m of MACHINES) {
    const d = sDiff(m.s, look.s); if (Math.abs(d) > m.w / 2 + 2.5) continue;
    let want;
    if (mode === 'tour') want = true;
    else if (mode === 'practice') want = p.practice && p.practice.m === m.id;
    else want = (m.i + c.num + Math.floor(wt / 40)) % 3 === 0;
    lat = want ? m.side * 1.7 : -m.side * 1.5;
  }
  if (!lat) lat = c.num === 1 ? 1.3 : -1.3;
  const tx = look.x - look.tz * lat, tz = look.z + look.tx * lat;
  let da = Math.atan2(tz - c.z, tx - c.x) - c.a; da = Math.atan2(Math.sin(da), Math.cos(da));
  return { up: true, down: false, left: da < -0.06, right: da > 0.06 };
}


// ================= CPU player (also used as a scripted P1 in headless tests) =================
// Reads only what a player can see (its own ticket card + the road ahead). Skill sets reaction time, steering
// error, cruising speed, boost use and how often it picks the right machine (p = 0.35 + 0.6·skill).
const BOT = [0, 1].map(() => ({ ticket: null, target: null, decideAt: 0, failed: false, stuck: 0, reverseT: 0, wob: Math.random() * 6, steer: 0, steerAt: 0, readyAt: -1, boostCD: 2 }));
function botInput(i, dt, skill) {
  const p = P[i], c = p.car, b = BOT[i], ph = GS.phase, learn = ph === 'learn';
  const react = lerp(1.4, 0.35, (skill - 0.1) / 0.85);
  // --- choose a machine for the current ticket (after a human-like reading delay) ---
  if (ph === 'play' && p.ticket) {
    if (b.ticket !== p.ticket || b.misses !== p.misses) {
      const relearn = b.ticket === p.ticket; // just shown the answer: usually takes it in
      b.ticket = p.ticket; b.misses = p.misses; b.target = null; b.decideAt = roundT + react * (0.8 + Math.random() * 0.6);
      b.pRight = relearn ? 0.8 + 0.2 * skill : 0.35 + 0.6 * skill;
    }
    if (!b.target && roundT >= b.decideAt) {
      if (Math.random() < b.pRight) b.target = p.ticket.m;
      else { const wrong = MACHINES.filter((m) => m.id !== p.ticket.m); b.target = wrong[Math.floor(Math.random() * wrong.length)].id; }
    }
  } else b.target = null;
  const want = (m) => (learn ? (p.practice ? p.practice.m === m.id : !p.ready) : m.id === b.target);
  // --- lane choice from the road ahead ---
  const sp_ = Math.hypot(c.vx, c.vz);
  const look = TRK[(c.idx + 11 + Math.round(sp_ * 0.5)) % NT];
  let lat = 0;
  // the next machine on the road (or the one being passed): get into its gate lane or the bypass well before it
  let next = null, nd = 1e9;
  for (const m of MACHINES) { const d = sDiff(m.s, c.s); if (d > 0.4 && d < 9 + sp_ * 0.9 && d < nd) { nd = d; next = m; } }
  if (next) lat = want(next) ? next.side * 1.8 : -next.side * 1.6;
  if (!lat) lat = (i ? -1 : 1) * 0.8;
  lat += Math.sin(roundT * 0.9 + b.wob) * (1 - skill) * 0.7;   // wobbly line at low skill
  const tx = look.x - look.tz * lat, tz = look.z + look.tx * lat;
  let da = Math.atan2(tz - c.z, tx - c.x) - c.a; da = Math.atan2(Math.sin(da), Math.cos(da));
  // steering decisions refresh at a human rate, not every frame
  if (roundT >= b.steerAt || b.steerAt - roundT > 1) { b.steer = Math.abs(da) < 0.05 + (1 - skill) * 0.08 ? 0 : Math.sign(da); b.steerAt = roundT + lerp(0.22, 0.05, skill); }
  // --- speed: cruise at 0.78–1.0 of top speed ---
  const top = learn ? 7 : [0, 11, 12.5, 13.5][LEVEL()];
  const sp = Math.hypot(c.vx, c.vz), cruise = top * lerp(0.78, 1.0, (skill - 0.1) / 0.85) * (Math.abs(da) > 0.6 ? 0.7 : 1);
  const inp = { up: sp < cruise, down: false, left: b.steer < 0, right: b.steer > 0, a: false };
  // --- recover when stuck against something ---
  // stuck = trying to drive but hardly moved for 1.2 s (never right after a spin-out)
  if (c.spin > 0) b.spunAt = roundT;
  if (b.px == null || roundT - b.pAt > 1.2 || roundT < b.pAt) { const moved = b.px == null ? 9 : Math.hypot(c.x - b.px, c.z - b.pz); b.px = c.x; b.pz = c.z; b.pAt = roundT;
    if (moved < 0.8 && roundT - (b.spunAt || -9) > 1.5 && (!learn || introT > 6.5) && b.reverseT <= 0) b.reverseT = 0.7; }
  if (b.reverseT > 0) { b.reverseT -= dt; inp.up = false; inp.down = true; inp.left = da > 0; inp.right = da < 0; }
  // --- boost on clear straights now and then ---
  b.boostCD -= dt;
  if (ph === 'play' && p.boost > 0 && b.boostCD <= 0 && c.spin <= 0 && !look.arc && Math.abs(da) < 0.15) {
    const gateAhead = MACHINES.some((m) => m.id === b.target && sDiff(m.s, c.s) > 0 && sDiff(m.s, c.s) < 10);
    if (!gateAhead && Math.random() < dt * lerp(0.15, 0.6, skill)) { inp.a = true; b.boostCD = 4; }
  }
  // --- LEARN: ready shortly after the other player ---
  if (learn && p.ready && P[1 - i].ready && !p.startPressed) { if (b.readyAt < 0) b.readyAt = roundT + 1; if (roundT >= b.readyAt && (P[1 - i].startPressed || i === 0)) inp.a = true; }
  return inp;
}
function cpuBrain(dt, skill) {
  const inp = botInput(1, dt, skill);
  for (const k of ['up', 'down', 'left', 'right']) GS.cpu.hold(k, inp[k]);
  if (inp.a) GS.cpu.press('a');
}
let cpuWasOn = false;
const cpuOn = () => !!(GS.cpu && GS.cpu.on);

// ================= gate logic =================
function checkGates(p, phase) {
  const c = p.car;
  if (Math.abs(c.s - c.prevS) > 6) return;
  for (const m of MACHINES) {
    const d0 = sDiff(c.prevS, m.s), d1 = sDiff(c.s, m.s);
    if (Math.abs(d0) > 5 || Math.abs(d1) > 5 || !((d0 < 0 && d1 >= 0) || (d0 > 0 && d1 <= 0))) continue;
    if (Math.abs(c.lat) > RH + 2) continue;
    const inGate = c.lat * m.side > 0.2;
    if (window.__racer && window.__racer.log) window.__racer.log.push([p.i, m.id, c.lat.toFixed(1), inGate, phase, p.ticket && p.ticket.m, BOT[p.i].target]);
    if (phase === 'learn') {
      if (!p.visited.has(m.id)) { p.visited.add(m.id); sfx('ding', { f: p.visited.size === 9 ? 'C6' : 'G5', gain: 0.4, pan: pan(m.x, m.z) }); }
      if (inGate) { m.flash = 1; m.flashCol = PAL.mint; }
      if (p.visited.size === 9 && !p.practice && !p.ready) givePractice(p);
      if (inGate && p.practice && p.practice.m === m.id) { p.ready = true; p.practice = null; m.deliverAt = wt; burst(...gateWorld(m), 10); sfx('success', { gain: 0.7 }); popup(...gateWorld(m), '✓ Practice done!', { bg: PAL.mint, col: '#fff', dur: 2 }); }
      continue;
    }
    if (phase !== 'play' || !inGate || !p.ticket) continue;
    if ((p.lastGate[m.id] || -9) > roundT - 2) continue;
    p.lastGate[m.id] = roundT;
    if (p.ticket.m === m.id) deliver(p, m); else wrongGate(p, m);
  }
}
const gateWorld = (m) => m.toW(0, 2.2, 2.2);
function givePractice(p) {
  const order = MACHINES.map((m) => m).sort((a, b) => ((a.s - p.car.s + TRK.L) % TRK.L) - ((b.s - p.car.s + TRK.L) % TRK.L));
  const m = order[2 + p.i];
  const prod = PRODUCTS.find((q) => q.m === m.id && q.lv === 1);
  p.practice = { ...prod }; p.cardPop = roundT; sfx('pop', { gain: 0.7 });
}
const STATS = { right: [0, 0], wrong: [0, 0] };
function deliver(p, m) {
  STATS.right[p.i]++;
  const lv = LEVEL(), base = p.failed ? 5 : lv === 3 ? 15 : 10;
  const bonus = Math.min(8, p.streak * 2), dbl = GS.timeLeft() < 30 ? 2 : 1;
  const pts = (base + (p.failed ? 0 : bonus)) * dbl;
  p.score += pts; p.streak = p.failed ? 0 : p.streak + 1; p.boost = Math.min(3, p.boost + 1);
  const [x, y, z] = gateWorld(m);
  popup(x, y + 1.2, z, '+' + pts, { big: true, bg: p.i ? PAL.blue : PAL.coral, col: '#fff', dur: 1.6 });
  popup(x, y - 0.4, z, '✓ ' + m.name, { bg: PAL.mint, col: '#fff', dur: 2 });
  if (p.streak >= 2) popup(x, y + 2.6, z, p.streak + ' in a row!', { dur: 1.4 });
  m.flash = 1; m.flashCol = PAL.mint; m.deliverAt = wt; burst(x, 1.5, z, 14);
  sfx('success', { gain: 0.8, pan: pan(x, z) }); sfx('coin', { gain: 0.6 });
  p.flashM = null; p.msg = null;
  p.ticket = newTicket(p); p.cardPop = roundT;
  GS.score(P[0].score, P[1].score);
}
function wrongGate(p, m) {
  STATS.wrong[p.i]++; p.misses = (p.misses || 0) + 1;
  const right = MBY[p.ticket.m], c = p.car;
  p.score = Math.max(0, p.score - 5); p.streak = 0; p.failed = true;
  c.spin = 1.25; c.spinRate = 13;
  m.flash = 1; m.flashCol = PAL.coral;
  p.flashM = right; p.flashUntil = roundT + 3.5;
  const what = p.ticket.clue ? p.ticket.clue.toLowerCase() : 'makes ' + p.ticket.pl;
  p.msg = { text: `✗ Not ${m.name}!`, sub: p.ticket.clue ? `${right.name}: ${what}` : `${right.name} ${what}`, until: roundT + 3.5 };
  popup(c.x, 1.6, c.z, '−5', { big: true, bg: PAL.coral, col: '#fff', dur: 1.3 });
  sfx('error', { gain: 0.9, pan: pan(c.x, c.z) }); sfx('thud', { gain: 0.6 });
  GS.score(P[0].score, P[1].score);
}

// ================= hazards =================
function updateHazards(dt) {
  const lv = playT >= 0 ? LEVEL() : 0;
  FORKS.forEach((fk, i) => {
    fk.g.visible = lv >= 2;
    if (!fk.g.visible) return;
    const cyc = (wt + fk.ph) % 12, u = cyc < 3 ? 0 : cyc < 6 ? ease.inOut((cyc - 3) / 3) : cyc < 9 ? 1 : 1 - ease.inOut((cyc - 9) / 3);
    fk.g.position.set(lerp(fk.ax, fk.bx, u), 0, lerp(fk.az, fk.bz, u));
    const dir = cyc < 6 ? 1 : -1; fk.g.rotation.y = -Math.atan2((fk.bz - fk.az) * dir, (fk.bx - fk.ax) * dir);
    fk.beacon.material.color.set(Math.sin(wt * 12 + i) > 0 ? PAL.coral : PAL.yellow);
  });
  if (lv >= 3) {
    while (SPILLS.length < SPILL_N) {
      let s; do { s = Math.random() * TRK.L; } while (MACHINES.some((m) => Math.abs(sDiff(s, m.s)) < m.w / 2 + 2) || Math.abs(sDiff(s, START_S)) < 6);
      const q = at(s), lat = (Math.random() - 0.5) * 3.6; SPILLS.push({ x: q.x - q.tz * lat, z: q.z + q.tx * lat, until: wt + 18 + Math.random() * 8, seed: Math.random() * 100 });
    }
    for (let i = SPILLS.length - 1; i >= 0; i--) if (SPILLS[i].until < wt) SPILLS.splice(i, 1);
  } else SPILLS.length = 0;
  const mm = new THREE.Matrix4();
  spillMeshes.forEach((im, ci) => {
    let n = 0;
    SPILLS.forEach((sp_) => { for (let k = 0; k < SPILL_K; k++) { const a = sp_.seed + k * 2.4 + ci * 0.8, r = 0.2 + ((k * 7 + ci * 3) % 10) / 10 * 1.0; mm.makeTranslation(sp_.x + Math.cos(a) * r, 0.08, sp_.z + Math.sin(a) * r); im.setMatrixAt(n++, mm); } });
    im.count = n; im.instanceMatrix.needsUpdate = true;
  });
  for (const c of CARS) for (const s of SPILLS) if (Math.hypot(c.x - s.x, c.z - s.z) < 1.3 && c.slip <= 0 && c.spin <= 0) { c.slip = 0.9; c.spin = 0.5; c.spinRate = 7; sfx('swish', { gain: 0.5 }); popup(c.x, 1.5, c.z, 'Spilled granules!', { dur: 1.1 }); }
}

// ================= main update =================
function inputFor(i) { const n = i + 1; return { up: GS.held(n, 'up'), down: GS.held(n, 'down'), left: GS.held(n, 'left'), right: GS.held(n, 'right') }; }
function update(dt) {
  const phase = GS.phase, running = GS.running, idle = phase === 'idle';
  if (phase !== lastPhase) {
    if (phase === 'play' && lastPhase === 'learn') startTest();
    lastPhase = phase;
  }
  if (phase === 'play' && playT < 0) startTest();
  if (!running && !idle) return; // paused / over: freeze
  wt += dt;
  if (running) { roundT += dt; introT = phase === 'learn' ? Math.max(introT, GS.t) : 99; if (playT >= 0) playT += dt; }
  const learn = phase === 'learn', play = phase === 'play';
  if (cpuOn() && running) { cpuBrain(dt, GS.cpu.skill); cpuWasOn = true; } else if (cpuWasOn) { cpuWasOn = false; GS.cpu && GS.cpu.releaseAll(); BOT[1].readyAt = -1; }
  const canDrive = idle || (learn ? introT > 5.6 : true);
  CARS.forEach((c, i) => {
    const p = P[i];
    let inp = idle ? { up: false } : inputFor(i);
    const p1bot = i === 0 && window.__racer && window.__racer.p1bot != null && running;
    if (p1bot) { inp = botInput(0, dt, window.__racer.p1bot); if (inp.a) { if (play && p.boost > 0 && c.boostT <= 0 && c.spin <= 0) { p.boost--; c.boostT = 1.3; } if (learn && p.ready) p.startPressed = true; } }
    const any = inp.up || inp.down || inp.left || inp.right;
    c.idleT = any ? 0 : c.idleT + dt;
    if (idle) inp = autopilot(c, p, 'attract');
    else if (learn && c.idleT > 3 && canDrive) inp = autopilot(c, p, p.practice ? 'practice' : 'tour');
    let mx = idle ? 8 : learn ? 7 : [0, 11, 12.5, 13.5][LEVEL()];
    if (learn || idle) for (const m of MACHINES) if (Math.abs(sDiff(c.s, m.s)) < m.w / 2 + 1.5 && Math.abs(c.lat) < RH + 2) mx = learn ? 3.4 : 5;
    if (Math.abs(c.lat) > RH + 0.4) mx *= 0.6;
    if (play && GS.hit(i + 1, 'a') && p.boost > 0 && c.boostT <= 0 && c.spin <= 0) { p.boost--; c.boostT = 1.3; sfx('whoosh', { gain: 0.7, pan: pan(c.x, c.z) }); }
    if (!idle && GS.hit(i + 1, 'b')) { p.hornT = roundT; sfx('blip', { f: i ? 'E5' : 'C5', dur: 0.12, gain: 1.2 }); sfx('blip', { f: i ? 'G5' : 'E5', dur: 0.12, gain: 1.0 }); }
    if (learn && p.ready && GS.hit(i + 1, 'a')) p.startPressed = true;
    stepCar(c, inp, dt, mx, canDrive);
    for (const pd of PADS) if (Math.hypot(c.x - pd.x, c.z - pd.z) < 1.5 && c.boostT < 0.6) { c.boostT = 0.9; sfx('swish', { gain: 0.6, pan: pan(c.x, c.z) }); }
    if (!idle) checkGates(p, phase);
    // effects
    if (c.boostT > 0 && Math.random() < dt * 30) puff(c.x - Math.cos(c.a) * 1.2, 0.5, c.z - Math.sin(c.a) * 1.2, -c.vx * 0.1, -c.vz * 0.1, 0.8);
    if (c.spin > 0 && Math.random() < dt * 20) puff(c.x, 0.3, c.z, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1);
  });
  carBump(dt);
  // LEARN tags: a machine explains itself while a car is in its zone, and for 6 s after
  for (const m of MACHINES) m.flash = Math.max(0, m.flash - dt * 1.2);
  if (learn) for (const c of CARS) {
    const m = MACHINES.find((mm) => { const d = sDiff(c.s, mm.s); return d > -(mm.w / 2 + 4) && d < mm.w / 2 + 1 && Math.abs(c.lat) < RH + 3; });
    if (m) { if (c.learnM !== m) { c.learnM = m; if (m.learnUntil < roundT) m.learnAt = roundT; } m.learnUntil = Math.max(m.learnUntil, roundT + 5); }
  }
  // both ready → start TEST
  if (learn && P[0].ready && P[1].ready) {
    if (bothReadyAt < 0) { bothReadyAt = roundT; banner('Both ready! Press F + Enter to start the TEST', PAL.mint, 30); sfx('success', { gain: 0.6 }); }
    if ((P[0].startPressed && P[1].startPressed) || roundT - bothReadyAt > 10) GS.skipLearn();
  }
  if (learn && introT > 0.2 && !introBanner) introBanner = true, banner('Drive a lap: each machine explains its process', PAL.ink, 5.4);
  if (play) {
    if (playT > 60 && playT - dt <= 60) { banner('LEVEL 2 — more products, forklifts!', PAL.coral); sfx('riser', { gain: 0.5 }); }
    if (playT > 130 && playT - dt <= 130) { banner('LEVEL 3 — process clues, spills! +15 each', PAL.coral); sfx('riser', { gain: 0.5 }); }
    const tl = GS.timeLeft(); if (tl < 30 && tl + dt >= 30) { banner('LAST 30 SECONDS — DOUBLE POINTS!', PAL.coral, 4); sfx('sparkle', { gain: 0.8 }); }
  }
  updateHazards(dt);
}

// ================= visuals per frame =================
function animate(dt, frozen) {
  const k = frozen ? 0 : 1;
  for (const m of MACHINES) {
    m.api.update(wt);
    // springy pop-up at round start, one by one
    let sc = 1; if (GS.phase === 'learn') sc = ease.back(clamp((introT - 0.3 - m.i * 0.2) / 0.5));
    m.root.scale.setScalar(Math.max(0.001, sc));
    m.pad.material.opacity = m.flash * 0.75 * (0.6 + 0.4 * Math.sin(wt * 20));
    m.pad.material.color.set(m.flashCol);
  }
  for (const fg of fans) fg.rotation.y = wt * 6;
  for (const d of debris) d.position.y = d.userData.y + Math.sin(wt + d.position.x) * 0.3;
  for (const pd of PADS) pd.tex.offset.x = -wt * 1.2;
  CARS.forEach((c, i) => {
    const pk = GS.phase === 'learn' ? ease.back(clamp((introT - 2.2 - i * 0.15) / 0.5)) : 1;
    c.g.position.set(c.x, (1 - pk) * 6, c.z); c.g.rotation.y = -c.a;
    const sp_ = Math.hypot(c.vx, c.vz);
    c.roll = lerp(c.roll, -c.steerV * clamp(sp_ / 10) * 0.12, 0.2);
    c.body.rotation.x = c.roll; c.body.position.y = Math.abs(Math.sin(wt * 18 + i)) * 0.03 * clamp(sp_ / 6);
    for (const w of c.wheels) w.children[0].rotation.y += c.vF * dt * k * 4;
    c.wheels[0].rotation.y = c.wheels[1].rotation.y = -c.steerV * 0.4;
    c.flame.visible = c.boostT > 0; c.flame.scale.set(1, 0.8 + Math.random() * 0.6, 1);
    c.crate.visible = GS.phase !== 'play' || !!P[i].ticket;
  });
  for (const w of WORKERS) {
    if (w.walk) { const u = (Math.sin(wt * 0.12 + w.x0) + 1) / 2, dir = Math.cos(wt * 0.12 + w.x0); w.g.position.x = lerp(w.x0, w.x1, u); w.g.position.z = lerp(w.z0, w.z1, u); w.g.rotation.y = -Math.atan2((w.z1 - w.z0) * dir, (w.x1 - w.x0) * dir); animWorker(w.g, wt, true, 0); }
    else animWorker(w.g, wt, false, clamp(1.6 - (wt - w.m.deliverAt)));
  }
  for (const p of puffs) { if (p.t >= p.life) { p.m.visible = false; continue; } p.t += dt * k; const u = p.t / p.life; p.m.position.x += p.vx * dt * k; p.m.position.z += p.vz * dt * k; p.m.position.y += p.vy * dt * k; p.m.scale.setScalar(Math.max(0.01, p.s * (0.5 + u) * (1 - u) * 1.6)); }
  for (const c of cubes) { if (c.t >= c.life) { c.m.visible = false; continue; } c.t += dt * k; c.vy -= 7 * dt * k; c.m.position.x += c.vx * dt * k; c.m.position.y = Math.max(0.15, c.m.position.y + c.vy * dt * k); c.m.position.z += c.vz * dt * k; c.m.rotation.x += dt * 5 * k; c.m.rotation.y += dt * 4 * k; c.m.scale.setScalar(Math.max(0.01, 1 - c.t / c.life)); }
  P.forEach((p, i) => {
    const r = rings[i], on = p.flashM && p.flashUntil > roundT;
    r.visible = !!on;
    if (on) { const m = p.flashM, [x, , z] = m.toW(0, 0, -m.d / 2 + 1.2); r.position.set(x, 0.05, z); const s = (m.w * 0.62) * (1 + 0.08 * Math.sin(wt * 10)); r.scale.set(s, s, 1); }
  });
}
function updateCamera(dt) {
  const ph = GS.phase;
  let tx, tz, th;
  if (ph === 'learn' && introT < 2.8) { tx = TW / 2; tz = TD / 2 - 1; th = 25; }
  else {
    const a = CARS[0], b = CARS[1];
    const look = 0.35;
    const ax = a.x + a.vx * look, az = a.z + a.vz * look, bx_ = b.x + b.vx * look, bz_ = b.z + b.vz * look;
    tx = (ax + bx_) / 2; tz = (az + bz_) / 2;
    const dx = Math.abs((ax - bx_) * RV.x + (az - bz_) * RV.z), dy = Math.abs((ax - bx_) * UV.x + (az - bz_) * UV.z);
    th = clamp(Math.max(dy / 2 + 6, (dx / 2 + 7.5) / (W / H)), ph === 'idle' ? 12 : 10.5, 25);
    // push the view so the cars sit a little above centre (cards live at the bottom)
    tx -= UV.x * th * 0.12; tz -= UV.z * th * 0.12;
  }
  const r = ph === 'learn' && introT < 3.8 ? 2.2 : 3.2;
  cam.x = lerp(cam.x, tx, Math.min(1, dt * r)); cam.z = lerp(cam.z, tz, Math.min(1, dt * r)); cam.h = lerp(cam.h, th, Math.min(1, dt * r * 0.8));
  placeCamera(); placeSun();
}

// ================= HUD (2D overlay) =================
function drawHUD() {
  ctx.setTransform(bufW / W, 0, 0, bufH / H, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const ph = GS.phase, learn = ph === 'learn', play = ph === 'play';
  // ---- machine name tags (on the gantry signs) ----
  const flashFor = new Set(P.filter((p) => p.flashM && p.flashUntil > roundT).map((p) => p.flashM.id));
  for (const m of MACHINES) {
    const [x, y, z] = m.toW(0, m.h + 0.7, -m.d * 0.8), [sx, sy] = scr(x, y, z);
    if (sx < -100 || sx > W + 100 || sy < -60 || sy > H + 60) continue;
    const pop = learn ? ease.back(clamp((introT - 0.5 - m.i * 0.2) / 0.5)) : 1;
    if (flashFor.has(m.id)) continue;
    if (sx > W - 400 && sy < 80) continue;
    if ((sy < 118 && sx < 600) || (sy > H - 205 && (sx < 560 || sx > W - 560))) continue;
    if (learn && CARS.some((c) => c.learnM === m && m.learnUntil > roundT)) continue;
    tag(ctx, sx, sy, m.name, { k: pop * (cam.h > 16 ? 0.8 : 1), font: f(800, 24), icon: true, iconCol: mixHex(m.col, PAL.navy, 0.35) });
  }
  // ---- LEARN: big explanation callouts ----
  if (learn) {
    const act = [...new Set(CARS.map((c) => c.learnM).filter((m) => m && m.learnUntil > roundT))].sort((a, b) => a.learnAt - b.learnAt);
    const taken = [[W - 280, 0, 280, 70], [0, 0, 480, 104]];
    for (const c of CARS) { const [x, y] = scr(c.x, 0.8, c.z); for (let k = 0; k < 6; k++) taken.push([x - 80, y - 100, 160, 150]); }
    for (const m of act) learnCallout(m, taken);
  }
  // ---- wrong-gate answer: coral tag + dashed arrow from the car to the right machine ----
  for (const p of P) {
    if (!(p.flashM && p.flashUntil > roundT)) continue;
    const m = p.flashM, [x, y, z] = m.toW(0, m.h + 0.7, -m.d * 0.8), [sx, sy] = scr(x, y, z), [cx, cy_] = scr(p.car.x, 1.2, p.car.z);
    const k = ease.back(clamp((roundT - (p.flashUntil - 3.5)) / 0.35)), pul = 1 + 0.06 * Math.sin(wt * 10);
    const tsx = clamp(sx, 240, W - 240), tsy = clamp(sy, 150, H - 240);
    arrow(ctx, [cx, cy_ - 30], [(cx + tsx) / 2, Math.min(cy_, tsy) - 120], [tsx, tsy + 26], ease.inOut(clamp((roundT - (p.flashUntil - 3.5)) / 0.6)), PAL.coral, [9, 7], 4, 1.6);
    tag(ctx, tsx, tsy, '✓ ' + m.name, { k: k * pul, font: f(800, 28), bg: PAL.coral, col: '#fff' });
  }
  // ---- popups ----
  popups = popups.filter((q) => roundT - q.t0 < q.dur);
  for (const q of popups) {
    const u = (roundT - q.t0) / q.dur, [sx, sy] = scr(q.x, q.y, q.z), k = ease.back(clamp(u * q.dur / 0.3)) * (u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1);
    if (q.big) numberTag(ctx, sx, sy - u * 40, q.text, null, { k, bg: q.bg, col: q.col, size: 48 });
    else tag(ctx, sx, sy - u * 30, q.text, { k, font: f(800, 24), bg: q.bg, col: q.col });
  }
  if (ph === 'idle') return;
  // ---- car markers ----
  CARS.forEach((c, i) => {
    const [sx, sy] = scr(c.x, 1.6, c.z), col = i ? PAL.blue : PAL.coral;
    const x = clamp(sx, 30, W - 30), y = clamp(sy - 26, 20, H - 30);
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 8, y + 14); ctx.lineTo(x + 8, y + 14); ctx.lineTo(x, y + 24); ctx.fill(); ctx.restore();
    tag(ctx, x, y, i && cpuOn() ? 'CPU' : 'P' + (i + 1), { font: f(800, 24), bg: col, col: '#fff' });
    if (roundT - P[i].hornT < 0.6) tag(ctx, x + 56, y - 22, 'BEEP!', { font: f(800, 24), k: ease.back((roundT - P[i].hornT) / 0.2) });
  });
  // ---- header ----
  {
    pill(ctx, 18, 14, 452, 84, 18, '#ffffff');
    ctx.fillStyle = PAL.coral; ctx.beginPath(); ctx.roundRect(36, 28, 30, 5, 3); ctx.fill();
    ctx.font = f(800, 30); ctx.fillStyle = PAL.ink; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText('Factory Floor Racer', 36, 62);
    ctx.font = f(600, 24); ctx.fillStyle = PAL.sub; ctx.fillText('Manufacturing processes', 36, 89);
  }
  // ---- player cards ----
  P.forEach((p) => drawCard(p));
  // ---- banners ----
  banners = banners.filter((b) => roundT - b.t0 < b.dur);
  banners.forEach((b, i) => {
    const u = roundT - b.t0, k = ease.back(clamp(u / 0.4)) * (u > b.dur - 0.3 ? (b.dur - u) / 0.3 : 1);
    tag(ctx, W / 2, 128 + i * 60, b.text, { k, font: f(800, 28), bg: b.col === PAL.ink ? '#ffffff' : b.col, col: b.col === PAL.ink ? PAL.ink : '#fff', icon: b.col === PAL.ink });
  });
  // ---- countdown at round start ----
  if (learn && introT > 3.4 && introT < 6.4) {
    const n = Math.floor((introT - 3.4) / 0.7), u = ((introT - 3.4) % 0.7) / 0.7;
    const txt = n < 3 ? String(3 - n) : 'GO!';
    numberTag(ctx, W / 2, H / 2 - 40, txt, null, { k: ease.back(clamp(u / 0.4)) * (n >= 3 ? 1 - clamp((introT - 5.5) / 0.9) : 1), size: 84, bg: n >= 3 ? PAL.coral : '#ffffff', col: n >= 3 ? '#fff' : PAL.ink });
  }
}
let lastCount = -1;
function countdownSound() {
  if (GS.phase !== 'learn' || introT < 3.4 || introT > 6.4) return;
  const n = Math.floor((introT - 3.4) / 0.7);
  if (n !== lastCount && n <= 3) { lastCount = n; if (n < 3) sfx('blip', { f: 'A5', dur: 0.12, gain: 1.4 }); else sfx('ding', { f: 'A6', gain: 0.6 }); }
}
const overlap = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
function learnCallout(m, taken) {
  const [ax, ay, az] = m.toW(0, m.h + 0.2, -m.d / 2), [sx, sy] = scr(ax, ay, az);
  const age = roundT - m.learnAt, k = ease.back(clamp(age / 0.4)), fade = clamp((m.learnUntil - roundT) / 0.4);
  ctx.save(); ctx.globalAlpha = fade;
  ctx.font = f(600, 24);
  const lines = m.how, mk = 'Makes: ' + m.makes;
  let wmax = 0; for (const l of lines) wmax = Math.max(wmax, ctx.measureText(l).width);
  ctx.font = f(700, 24); wmax = Math.max(wmax, ctx.measureText(mk).width);
  ctx.font = f(800, 28); const tw = ctx.measureText(m.name).width; ctx.font = f(700, 22);
  const chipW = ctx.measureText(m.form).width + 22;
  wmax = Math.max(wmax, tw + 56 + chipW + 14);
  const bw = wmax + 40, bh = 64 + lines.length * 32 + 40;
  // try spots around the anchor; keep the one that covers least of the cars, other callouts and the HUD
  let best = null, bs = 1e18;
  for (const [ox, oy] of [[30, -bh - 60], [-bw - 30, -bh - 60], [-bw / 2, -bh - 70], [40, 40], [-bw - 40, 40], [-bw / 2, -bh - 150], [60, -bh / 2], [-bw - 60, -bh / 2], [-bw / 2, 60], [140, -bh - 140], [-bw - 140, -bh - 140]]) {
    const r = [clamp(sx + ox, 16, W - bw - 16), clamp(sy + oy, 108, H - 196 - bh), bw, bh];
    let sc = 0; for (const t of taken) sc += overlap(r, t); sc += Math.hypot(r[0] + bw / 2 - sx, r[1] + bh / 2 - sy) * 2;
    if (sc < bs) { bs = sc; best = r; }
  }
  taken.push(best);
  let bx0 = best[0], by0 = best[1];
  // elbow connector (reference GPU CLUSTER callout)
  const lp = ease.out(clamp(age / 0.3));
  ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); const ey = sy > by0 + bh ? by0 + bh : sy < by0 ? by0 : by0 + bh / 2; const ex = clamp(sx, bx0 + 20, bx0 + bw - 20); ctx.lineTo(sx, lerp(sy, ey, lp)); if (lp >= 1) ctx.lineTo(ex, ey); ctx.stroke();
  ctx.fillStyle = PAL.ink2; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, 7); ctx.fill();
  ctx.translate(bx0 + bw / 2, by0 + bh / 2); ctx.scale(k, k); ctx.translate(-(bx0 + bw / 2), -(by0 + bh / 2));
  pill(ctx, bx0, by0, bw, bh, 16, '#ffffff');
  ctx.fillStyle = PAL.coral; ctx.beginPath(); ctx.roundRect(bx0 + 16, by0 + 16, 34, 34, 9); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = f(800, 22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(m.i + 1), bx0 + 33, by0 + 34);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PAL.ink; ctx.font = f(800, 28); ctx.fillText(m.name, bx0 + 62, by0 + 44);
  const cx = bx0 + 62 + tw + 14; ctx.fillStyle = mixHex(m.col, PAL.lav, 0.3); ctx.beginPath(); ctx.roundRect(cx, by0 + 19, chipW, 32, 16); ctx.fill();
  ctx.fillStyle = PAL.navy; ctx.font = f(700, 22); ctx.fillText(m.form, cx + 11, by0 + 42);
  ctx.fillStyle = PAL.ink; ctx.font = f(600, 24);
  lines.forEach((l, i) => ctx.fillText(l, bx0 + 20, by0 + 88 + i * 32));
  ctx.fillStyle = PAL.coral; ctx.font = f(700, 24); ctx.fillText(mk, bx0 + 20, by0 + 88 + lines.length * 32 + 6);
  ctx.restore();
}
function drawCard(p) {
  const cw = 452, chh = 168, x0 = p.i ? W - cw - 18 : 18, y0 = H - chh - 16, col = p.i ? PAL.blue : PAL.coral;
  const ph = GS.phase, k = ease.back(clamp((roundT - p.cardPop) / 0.35));
  pill(ctx, x0, y0, cw, chh, 20, '#ffffff');
  ctx.save();
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x0 + 16, y0 + 14, 62, 36, 18); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = f(800, 24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.i && cpuOn() ? 'CPU' : 'P' + (p.i + 1), x0 + 47, y0 + 33);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const ctrl = p.i ? (cpuOn() ? 'Computer player' : 'Arrows drive · Enter boost') : 'W A S D drive · F boost';
  if (ph === 'play' || ph === 'over') {
    const bl = p.i && cpuOn() ? 'boost' : `boost (${p.i ? 'Enter' : 'F'})`;
    ctx.fillStyle = PAL.sub; ctx.font = f(700, 24); ctx.fillText(bl, x0 + 90, y0 + 42);
    const bw_ = ctx.measureText(bl).width;
    for (let j = 0; j < 3; j++) { ctx.fillStyle = j < p.boost ? col : PAL.lav; ctx.beginPath(); ctx.roundRect(x0 + 100 + bw_ + j * 26, y0 + 23, 20, 20, 6); ctx.fill(); }
    ctx.fillStyle = PAL.ink; ctx.font = f(800, 44); ctx.textAlign = 'right'; ctx.fillText(String(p.score), x0 + cw - 58, y0 + 50);
    ctx.fillStyle = PAL.sub; ctx.font = f(700, 24); ctx.fillText('pts', x0 + cw - 18, y0 + 48); ctx.textAlign = 'left';
    ctx.fillStyle = PAL.sub; ctx.font = f(600, 20);
    if (p.msg && p.msg.until > roundT) {
      ctx.fillStyle = PAL.coral; ctx.font = f(800, 26); ctx.fillText(p.msg.text, x0 + 20, y0 + 96);
      ctx.fillStyle = PAL.ink; ctx.font = f(600, 24); const ls = wrap(ctx, p.msg.sub, cw - 40).slice(0, 2); ls.forEach((l, i) => ctx.fillText(l, x0 + 20, y0 + 128 + i * 28));
    } else if (p.ticket) {
      ctx.save(); ctx.translate(x0 + 20, y0 + 70); ctx.scale(k, k);
      ctx.fillStyle = PAL.peach; ctx.beginPath(); ctx.roundRect(0, 0, cw - 40, 84, 12); ctx.fill();
      ctx.strokeStyle = PAL.coral; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = PAL.coral; ctx.font = f(800, 22); ctx.fillText(p.ticket.clue ? 'CLUE — which machine?' : 'JOB TICKET — make a…', 14, 26);
      ctx.fillStyle = PAL.ink;
      if (p.ticket.clue) { ctx.font = f(700, 24); const ls = wrap(ctx, p.ticket.clue, cw - 70).slice(0, 2); ls.forEach((l, i) => ctx.fillText(l, 14, 52 + i * 26)); }
      else { ctx.font = f(800, 32); ctx.fillText(p.ticket.p, 14, 66); }
      ctx.restore();
    }
  } else {
    // LEARN: tour progress, practice, ready
    ctx.fillStyle = PAL.ink; ctx.font = f(700, 24); ctx.fillText(ctrl, x0 + 92, y0 + 41);
    if (p.ready) {
      ctx.fillStyle = PAL.mint; ctx.font = f(800, 28); ctx.fillText('✓ Ready for the test', x0 + 20, y0 + 100);
      ctx.fillStyle = PAL.ink; ctx.font = f(600, 24); ctx.fillText(p.i && cpuOn() ? 'The computer is ready' : `Press ${p.i ? 'Enter' : 'F'} to start`, x0 + 20, y0 + 136);
    } else if (p.practice) {
      ctx.save(); ctx.translate(x0 + 20, y0 + 64); ctx.scale(k, k);
      ctx.fillStyle = PAL.peach; ctx.beginPath(); ctx.roundRect(0, 0, cw - 40, 88, 12); ctx.fill();
      ctx.fillStyle = PAL.coral; ctx.font = f(800, 22); ctx.fillText('PRACTICE TICKET: ' + p.practice.p, 14, 28);
      ctx.fillStyle = PAL.ink; ctx.font = f(700, 24); ctx.fillText('Drive through the gate of', 14, 56);
      ctx.font = f(800, 24); ctx.fillText('→ ' + MBY[p.practice.m].name, 14, 80);
      ctx.restore();
    } else {
      ctx.fillStyle = PAL.sub; ctx.font = f(700, 24); ctx.fillText(`Factory tour: ${p.visited.size} / 9 machines`, x0 + 20, y0 + 92);
      MACHINES.forEach((m, j) => { const cx = x0 + 34 + j * 44, cy_ = y0 + 128, on = p.visited.has(m.id); ctx.fillStyle = on ? PAL.mint : PAL.lav; ctx.beginPath(); ctx.arc(cx, cy_, 16, 0, 7); ctx.fill(); ctx.fillStyle = on ? '#fff' : PAL.sub; ctx.font = f(800, 18); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(on ? '✓' : String(j + 1), cx, cy_ + 1); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; });
    }
  }
  ctx.restore();
}

// ================= loop =================
GS.init({
  id: 5, title: 'Factory Floor Racer', mode: 'vs', learnSeconds: 90,
  controls: { p1: 'W A S D drive · F boost · G horn', p2: 'Arrows drive · Enter boost · Right Shift horn' },
  onRound() { resetRound(); lastPhase = GS.phase; },
  onPhase(phase, prev) { if (phase === 'play' && prev === 'learn') { /* handled in update */ } },
});
gridCars();
cam.x = TW / 2; cam.z = TD / 2;
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  try {
    const t0 = performance.now();
    const nSub = Math.ceil(dt / 0.034); for (let i = 0; i < nSub; i++) { update(dt / nSub); if (i < nSub - 1) GS.endFrame(); }
    const frozen = !(GS.running || GS.phase === 'idle');
    animate(frozen ? 0 : dt, frozen);
    updateCamera(frozen ? 0 : dt);
    countdownSound();
    const t1 = performance.now();
    renderer.render(scene, camera);
    const t2 = performance.now();
    drawHUD();
    const t3 = performance.now();
    const pf = (window.__prof = window.__prof || { upd: 0, gl: 0, hud: 0, n: 0, calls: 0 });
    pf.upd += t1 - t0; pf.gl += t2 - t1; pf.hud += t3 - t2; pf.n++; pf.calls = renderer.info.render.calls; pf.tris = renderer.info.render.triangles;
  } catch (e) { console.error(e); }
  GS.endFrame();
  requestAnimationFrame(frame);
}
placeCamera(); placeSun();
requestAnimationFrame(frame);
// test hook: run the simulation quickly (no rendering) — used only by headless checks
window.__racer = { P, CARS, MACHINES, cam, sim(sec, keys) { for (let t = 0; t < sec; t += 1 / 30) { update(1 / 30); animate(1 / 30, false); GS.endFrame(); } updateCamera(5); }, stats: () => ({ wrong: STATS.wrong.slice(), right: STATS.right.slice() }), deliver: (i) => deliver(P[i], MBY[P[i].ticket.m]), tp(i, sv, lat) { const c = CARS[i], q = at(sv); c.x = q.x - q.tz * lat; c.z = q.z + q.tx * lat; c.a = Math.atan2(q.tz, q.tx); c.vx = c.vz = 0; c.idx = nearest(c.x, c.z, -1); c.s = c.prevS = TRK[c.idx].s; }, MBY, wrong: (i) => wrongGate(P[i], MACHINES.find((m) => m.id !== P[i].ticket.m)) };
