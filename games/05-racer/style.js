// style.js — the Isometric Pastel look, ported from styles/isometric-pastel/reference-explainer.js to real-time Three.js.
//  * three-tone flat face shading: top = base→white 42 %, left (+z) face = base→white 8 %, right (+x) face = base→SHADE_DARK 28 %
//  * pastel palette with one coral accent, white label tags with soft lavender shadows, curved dashed connectors
import * as THREE from '../../lib/three.module.min.js';

export const PAL = {
  ink: '#2d3058', ink2: '#4a4f78', sub: '#7b7aa3', coral: '#ff6b5b', coralSoft: '#ff8a7a', coralPale: '#ffc2b4', mint: '#3ccf9a',
  mintSoft: '#bfe7da', mintMid: '#8fd9bd', floor: '#fbf8f3', slab: '#cfc6ea', slab2: '#b9addf', peri: '#aab6e8', blue: '#7f8fd8',
  navy: '#4a5488', navy2: '#5d68a0', lav: '#d8d4ea', lav2: '#d9d6ee', peach: '#ffd9cf', sky: '#dbe3f6', ice: '#eef1fa', cream: '#e7d6c9',
  leaf: '#7fc8a8', leaf2: '#a3dcc0', leaf3: '#c4ecd6', trunk: '#b79a8a', yellow: '#ffe28a', glass: '#a9b8e6', skin: '#f1c6a8',
  hat: '#ffd27a', grey: '#8e9bd0', belt: '#8e97c9', white: '#ffffff',
};
export const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
export const f = (w, px) => `${w} ${px}px ${FONT}`;

// ---------- colour helpers (sRGB, the shader writes straight to the screen) ----------
const hexArr = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const v3 = (h) => { const [r, g, b] = hexArr(h); return new THREE.Vector3(r / 255, g / 255, b / 255); };
const WHITE = new THREE.Vector3(1, 1, 1), DARK = new THREE.Vector3(92 / 255, 88 / 255, 150 / 255);
export const mixHex = (a, b, t) => { const A = hexArr(a), B = hexArr(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

// ---------- the three-tone material ----------
const VS = `
varying vec3 vN; varying float vY;
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  vN = mat3(m) * normal;
  vY = wp.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FS = `
uniform vec3 uTop; uniform vec3 uLeft; uniform vec3 uRight; uniform vec3 uGlow; uniform float uGlowK; uniform float uOpacity;
varying vec3 vN; varying float vY;
void main(){
  vec3 n = normalize(vN);
  float wt = max(n.y, 0.0), wl = max(n.z, 0.0), wr = max(n.x, 0.0);
  float wb = max(-n.y, 0.0) * 0.5 + max(-n.x, 0.0) + max(-n.z, 0.0);
  float sum = max(wt + wl + wr + wb, 1e-4);
  vec3 c = (uTop * wt + uLeft * wl + uRight * wr + uRight * 0.94 * wb) / sum;
  // tonal falloff on side faces: a touch darker toward the floor (as the reference's side-face gradient)
  float side = 1.0 - wt / sum;
  c *= 1.0 - 0.075 * side * (1.0 - smoothstep(0.0, 2.4, vY));
  c = mix(c, uGlow, uGlowK);
  gl_FragColor = vec4(c, uOpacity);
}`;
const matCache = new Map();
export function M(hex, o = {}) {
  const op = o.opacity ?? 1, k = o.k ?? 1;
  const key = hex + '|' + op + '|' + k;
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const base = v3(hex);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: base.clone().lerp(WHITE, 0.42 * k) }, uLeft: { value: base.clone().lerp(WHITE, 0.08) }, uRight: { value: base.clone().lerp(DARK, 0.28 * k) },
      uGlow: { value: v3(o.glow || PAL.coral) }, uGlowK: { value: 0 }, uOpacity: { value: op },
    },
    vertexShader: VS, fragmentShader: FS, transparent: op < 1, depthWrite: op >= 1,
  });
  mat.userData.hex = hex;
  if (!o.unique) matCache.set(key, mat);
  return mat;
}
export function setGlow(mat, k, hex) { mat.uniforms.uGlowK.value = k; if (hex) mat.uniforms.uGlow.value.copy(v3(hex)); }
// flat, unshaded colour (glowing parts, beams, floor overlays)
const basicCache = new Map();
export function B(hex, op = 1, o = {}) {
  const key = hex + '|' + op + '|' + (o.side || 0) + (o.unique ? Math.random() : '');
  if (basicCache.has(key)) return basicCache.get(key);
  const m = new THREE.MeshBasicMaterial({ color: hex, transparent: op < 1, opacity: op, depthWrite: op >= 1 && !o.noDepth, side: o.side || THREE.FrontSide });
  if (!o.unique) basicCache.set(key, m);
  return m;
}

// ---------- geometry cache + builders (y is the BOTTOM of a part, x/z its centre) ----------
const geoCache = new Map();
export function G(kind, ...a) {
  const key = kind + ':' + a.join(',');
  let g = geoCache.get(key);
  if (g) return g;
  if (kind === 'box') g = new THREE.BoxGeometry(a[0], a[1], a[2]);
  else if (kind === 'cyl') g = new THREE.CylinderGeometry(a[0], a[1], a[2], a[3] || 14, 1);
  else if (kind === 'sph') g = new THREE.SphereGeometry(a[0], a[1] || 12, a[2] || 8);
  else if (kind === 'ring') g = new THREE.RingGeometry(a[0], a[1], a[2] || 40);
  else if (kind === 'plane') g = new THREE.PlaneGeometry(a[0], a[1]);
  else if (kind === 'torus') g = new THREE.TorusGeometry(a[0], a[1], a[2] || 6, a[3] || 18);
  geoCache.set(key, g);
  return g;
}
export function mesh(parent, geo, mat, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m;
}
export const bx = (p, col, x, y, z, w, h, d, o = {}) => mesh(p, G('box', w, h, d), o.mat || M(col, o), x, y + h / 2, z, o.cast ?? true);
export const cy = (p, col, x, y, z, r, h, seg = 14, o = {}) => mesh(p, G('cyl', o.rt ?? r, r, h, seg), o.mat || M(col, o), x, y + h / 2, z, o.cast ?? true);
// horizontal cylinder along local x (from x0 to x1)
export function cyX(p, col, x0, x1, y, z, r, seg = 14, o = {}) { const m = mesh(p, G('cyl', o.rt ?? r, r, Math.abs(x1 - x0), seg), o.mat || M(col, o), (x0 + x1) / 2, y, z, o.cast ?? true); m.rotation.z = Math.PI / 2; return m; }
export function cyZ(p, col, x, y, z0, z1, r, seg = 14, o = {}) { const m = mesh(p, G('cyl', o.rt ?? r, r, Math.abs(z1 - z0), seg), o.mat || M(col, o), x, y, (z0 + z1) / 2, o.cast ?? true); m.rotation.x = Math.PI / 2; return m; }
export const sp = (p, col, x, y, z, r, o = {}) => mesh(p, G('sph', r, o.ws || 12, o.hs || 8), o.mat || M(col, o), x, y, z, o.cast ?? true);
export function grp(parent, x = 0, y = 0, z = 0, dyn = false) { const g = new THREE.Group(); g.position.set(x, y, z); if (dyn) g.userData.dyn = true; parent.add(g); return g; }

// Merge every static three-tone mesh under root into one mesh per material (draw calls ÷ ~10). Anything inside a
// group flagged userData.dyn (animated parts) is left alone.
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(), remove = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.material.isShaderMaterial || o.material.transparent) return;
    for (let p = o; p && p !== root; p = p.parent) if (p.userData.dyn) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone());
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const key = o.material.uuid + (o.castShadow ? 's' : '');
    if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, list: [] });
    groups.get(key).list.push(g); remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const { mat, cast, list } of groups.values()) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let off = 0;
    for (const g of list) { pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); off += g.attributes.position.count; g.dispose(); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    bg.computeBoundingSphere();
    const m = new THREE.Mesh(bg, mat); m.castShadow = cast; root.add(m);
  }
}

// ---------- tiny worker (reference "people": dark legs, shirt, skin head, hair cap) + a hard hat for the factory ----------
export function worker(parent, x, z, shirt, opts = {}) {
  const g = grp(parent, x, 0, z, true);
  const legL = bx(g, PAL.ink2, 0, 0, -0.09, 0.11, 0.42, 0.11); legL.geometry = G('box', 0.11, 0.42, 0.11);
  const legR = bx(g, PAL.ink2, 0, 0, 0.09, 0.11, 0.42, 0.11);
  const body = bx(g, shirt, 0, 0.4, 0, 0.26, 0.42, 0.36);
  const armL = bx(g, shirt, 0, 0.45, -0.23, 0.09, 0.34, 0.09), armR = bx(g, shirt, 0, 0.45, 0.23, 0.09, 0.34, 0.09);
  sp(g, PAL.skin, 0, 0.98, 0, 0.15, { ws: 10, hs: 7 });
  const hat = sp(g, opts.hat || PAL.hat, 0, 1.04, 0, 0.165, { ws: 10, hs: 6 }); hat.scale.y = 0.62;
  bx(g, opts.hat || PAL.hat, 0.08, 1.02, 0, 0.16, 0.03, 0.3);
  // legs/arms pivot near the hips/shoulders: move geometry origin by offsetting meshes inside pivots
  const piv = (m, py) => { const pv = grp(g, m.position.x, py, m.position.z); g.remove(m); pv.add(m); m.position.set(0, m.position.y - py, 0); return pv; };
  const lL = piv(legL, 0.42), lR = piv(legR, 0.42), aL = piv(armL, 0.78), aR = piv(armR, 0.78);
  g.userData.w = { lL, lR, aL, aR, phase: Math.random() * 6, wave: 0 };
  g.rotation.y = opts.face ?? 0;
  return g;
}
export function animWorker(g, t, walking, wave) {
  const w = g.userData.w, s = Math.sin(t * 9 + w.phase);
  if (walking) { w.lL.rotation.z = s * 0.6; w.lR.rotation.z = -s * 0.6; w.aL.rotation.z = -s * 0.5; w.aR.rotation.z = s * 0.5; }
  else { w.lL.rotation.z = w.lR.rotation.z = 0; w.aL.rotation.z = Math.sin(t * 1.3 + w.phase) * 0.08; w.aR.rotation.z = 0; }
  if (wave > 0) { w.aR.rotation.x = -2.5 - Math.sin(t * 16) * 0.35; w.aL.rotation.x = 2.5 + Math.sin(t * 16 + 1) * 0.35; g.position.y = Math.abs(Math.sin(t * 9)) * 0.25 * wave; }
  else { w.aR.rotation.x = 0; w.aL.rotation.x = 0; g.position.y = 0; }
}
// reference tree: trunk + two/three overlapping canopy balls
export function tree(parent, x, z, sc = 1) {
  const g = grp(parent, x, 0, z);
  cy(g, PAL.trunk, 0, 0, 0, 0.09 * sc, 1.3 * sc, 6);
  sp(g, PAL.leaf, 0, 1.55 * sc, 0, 0.62 * sc, { ws: 12, hs: 9 });
  sp(g, PAL.leaf2, -0.1 * sc, 1.85 * sc, 0.12 * sc, 0.42 * sc, { ws: 10, hs: 7 });
  return g;
}

// ---------- 2D overlay helpers (reference: tag, numberTag, arrow, white cards) ----------
export function pill(ctx, x, y, w, h, r, bg, shadow = true) {
  ctx.save();
  if (shadow) { ctx.shadowColor = 'rgba(80,70,140,0.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5; }
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();
}
// white label tag with optional coral dot icon (reference `tag`), centred at x,y, scaled by k (springy pop)
export function tag(ctx, x, y, text, o = {}) {
  const k = o.k ?? 1; if (k <= 0.02) return 0;
  ctx.save();
  ctx.font = o.font || f(700, 24);
  const fsz = parseInt((ctx.font.match(/(\d+)px/) || [0, 24])[1]);
  const w = ctx.measureText(text).width + (o.icon ? fsz * 2.3 : fsz * 1.3), h = o.h || Math.round(fsz * 1.7);
  ctx.translate(x, y); ctx.scale(k, k);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.shadowColor = 'rgba(80,70,140,0.22)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
  ctx.fillStyle = o.bg || '#ffffff'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (o.ring) { ctx.strokeStyle = o.ring; ctx.lineWidth = 3; ctx.stroke(); }
  if (o.icon) { ctx.fillStyle = o.iconCol || PAL.coral; ctx.beginPath(); ctx.arc(-w / 2 + fsz * 0.85, 0, fsz * 0.3, 0, 7); ctx.fill(); }
  ctx.fillStyle = o.col || PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, o.icon ? fsz * 0.5 : 0, 1);
  ctx.restore();
  return w * k;
}
export function numberTag(ctx, x, y, num, label, o = {}) {
  const k = o.k ?? 1; if (k <= 0.02) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.font = f(800, o.size || 56); const nw = ctx.measureText(num).width;
  ctx.font = f(700, 24); const lw = label ? ctx.measureText(label).width : 0;
  const w = Math.max(nw, lw) + 48, h = label ? (o.size || 56) + 50 : (o.size || 56) + 22;
  ctx.shadowColor = 'rgba(80,70,140,0.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
  ctx.fillStyle = o.bg || '#fff'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (label) { ctx.fillStyle = o.sub || PAL.sub; ctx.font = f(700, 24); ctx.fillText(label, 0, -h / 2 + 32); }
  ctx.font = f(800, o.size || 56); ctx.fillStyle = o.col || PAL.ink; ctx.fillText(num, 0, h / 2 - 16);
  ctx.restore();
}
// quadratic arrow drawn on to prog (reference `arrow`)
export function arrow(ctx, a, c, b, prog, col, dash, w = 3, head = 1.4) {
  if (prog <= 0) return null;
  const q = (u) => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); const n = 30; for (let i = 1; i <= n; i++) { const p = q(prog * i / n); ctx.lineTo(p[0], p[1]); } ctx.stroke();
  ctx.setLineDash([]);
  const e = q(prog), e0 = q(Math.max(0, prog - 0.04)), ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
  ctx.fillStyle = col; ctx.translate(e[0], e[1]); ctx.rotate(ang); ctx.scale(head, head);
  ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-8, -6.5); ctx.lineTo(-8, 6.5); ctx.closePath(); ctx.fill();
  ctx.restore();
  return q;
}
// text wrapper: returns lines no wider than maxW
export function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
