/**
 * Game Stations sync server (Google Apps Script web app).
 * Holds ONE lesson session and the latest heartbeat from each station. No student data, no sign-in.
 *
 * Set-up (5 minutes):
 *  1. script.google.com → New project → paste this file over Code.gs.
 *  2. Project Settings (cog) → Script properties → add  PIN = a teacher PIN of your choice.
 *  3. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 *  4. Copy the Web app URL (ends in /exec) and give it to Claude (or paste it into the hub's "Sync link…" button).
 * After editing this code later: Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy
 * (keeps the same URL).
 */
const PROPS = PropertiesService.getScriptProperties();
const N_STATIONS = 7;

function doGet(e) {
  let out;
  try { out = route(e.parameter || {}); } catch (err) { out = { error: String(err.message || err) }; }
  out.now = Date.now();
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function getS() { return JSON.parse(PROPS.getProperty('S') || 'null'); }

function checkPin(p) {
  const pin = PROPS.getProperty('PIN') || '';
  if (!pin) throw new Error('No PIN set: add a script property called PIN');
  if (String(p.pin || '') !== pin) throw new Error('Wrong PIN');
}

function route(p) {
  const cache = CacheService.getScriptCache();
  if (p.a === 'hb') { // station heartbeat (also returns the session)
    const n = Number(p.st);
    if (n >= 1 && n <= N_STATIONS) {
      let d = {}; try { d = JSON.parse(p.d || '{}'); } catch (e) {}
      cache.put('st' + n, JSON.stringify({ d: d, at: Date.now() }), 120);
    }
    return { s: getS() };
  }
  if (p.a === 'state') return { s: getS() };
  if (p.a === 'all') {
    checkPin(p);
    const keys = []; for (let i = 1; i <= N_STATIONS; i++) keys.push('st' + i);
    const got = cache.getAll(keys), st = {};
    Object.keys(got).forEach(function (k) { st[k.slice(2)] = JSON.parse(got[k]); });
    return { s: getS(), st: st };
  }
  if (p.a === 'cmd') {
    checkPin(p);
    const lock = LockService.getScriptLock(); lock.waitLock(5000);
    try {
      const s = cmd(getS(), p.c, p, Date.now());
      PROPS.setProperty('S', JSON.stringify(s));
      return { s: s };
    } finally { lock.releaseLock(); }
  }
  return { error: 'unknown action' };
}

// Same rules as localCmd() in lib/sync.js — keep the two in step.
function cmd(s, c, p, now) {
  if (c === 'start') return { id: now, running: true, startAt: now, pausedAt: null, pausedTotal: 0, R: +p.R || 300, M: +p.M || 30, rounds: +p.rounds || 8, banner: '', stPause: {} };
  if (!s) return s;
  if (c === 'pause' && !s.pausedAt) { s.pausedAt = now; s.banner = p.msg || ''; }
  if (c === 'banner') s.banner = p.msg || '';
  if (c === 'resume' && s.pausedAt) { s.pausedTotal += now - s.pausedAt; s.pausedAt = null; s.banner = ''; }
  if (c === 'skip') { const k = clock(s, now); if (k.state === 'play' || k.state === 'move') s.startAt -= k.left * 1000; }
  if (c === 'addmin') s.startAt += 60000;
  if (c === 'end') s.running = false;
  if (c === 'stpause') { s.stPause = s.stPause || {}; s.stPause[p.n] = !s.stPause[p.n]; }
  return s;
}

// Same as lessonClock() in lib/stations.js
function clock(s, now) {
  if (!s || !s.running) return { state: 'idle' };
  const pausedFor = s.pausedTotal + (s.pausedAt ? now - s.pausedAt : 0);
  const el = Math.max(0, (now - s.startAt - pausedFor) / 1000);
  const B = s.R + s.M, block = Math.floor(el / B);
  if (block >= s.rounds) return { state: 'done' };
  const tb = el - block * B;
  return { state: tb < s.R ? 'play' : 'move', left: tb < s.R ? s.R - tb : B - tb };
}
