// sync.js — talks to the Apps Script backend (or runs a local, single-machine session when there is none).
// new Sync({ role: 'station', station: 3, onUpdate }) | new Sync({ role: 'teacher', pin, onUpdate })
(function () {
  'use strict';
  const LS = 'gs.local.session';
  class Sync {
    constructor(o) {
      this.o = o;
      this.url = (new URLSearchParams(location.search).get('api')) || localStorage.getItem('gs.api') || (window.LESSON && LESSON.backend) || '';
      this.offset = 0; this.offsets = [];
      this.session = null; this.stations = {}; this.ok = false; this.lastOk = 0; this.err = '';
      this.status = null;
      this.local = !this.url;
      if (this.local) {
        this.bc = 'BroadcastChannel' in window ? new BroadcastChannel('gs') : null;
        this.session = JSON.parse(localStorage.getItem(LS) || 'null');
        if (this.bc) this.bc.onmessage = (e) => { if (e.data.s !== undefined) { this.session = e.data.s; this.fire(); } };
        addEventListener('storage', (e) => { if (e.key === LS) { this.session = JSON.parse(e.newValue || 'null'); this.fire(); } });
        this.ok = true;
      }
      this.loop();
    }
    now() { return Date.now() + this.offset; }
    fire() { this.o.onUpdate && this.o.onUpdate(this); }
    async api(params) {
      const q = new URLSearchParams(params).toString();
      const t0 = Date.now();
      const r = await fetch(this.url + (this.url.includes('?') ? '&' : '?') + q, { cache: 'no-store', redirect: 'follow' });
      const j = await r.json();
      const t1 = Date.now();
      if (j.now) { // NTP-style clock offset, median of the last 7
        this.offsets.push(j.now - (t0 + t1) / 2); if (this.offsets.length > 7) this.offsets.shift();
        const so = this.offsets.slice().sort((a, b) => a - b); this.offset = so[so.length >> 1];
      }
      if (j.error) throw new Error(j.error);
      return j;
    }
    async poll() {
      if (this.local) { this.fire(); return; }
      try {
        let j;
        if (this.o.role === 'teacher') j = await this.api({ a: 'all', pin: this.o.pin || '' });
        else j = await this.api({ a: 'hb', st: this.o.station, d: JSON.stringify(this.status || {}) });
        this.session = j.s || null; if (j.st) this.stations = j.st;
        this.ok = true; this.lastOk = Date.now(); this.err = '';
      } catch (e) { this.ok = Date.now() - this.lastOk < 8000; this.err = String(e.message || e); }
      this.fire();
    }
    async loop() {
      for (;;) {
        await this.poll();
        await new Promise((r) => setTimeout(r, this.local ? 500 : 1800));
      }
    }
    // teacher commands: start, pause, resume, skip, addmin, end, stpause, banner
    async cmd(c, extra) {
      if (this.local) { this.session = localCmd(this.session, c, extra || {}, Date.now()); localStorage.setItem(LS, JSON.stringify(this.session)); this.bc && this.bc.postMessage({ s: this.session }); this.fire(); return; }
      const j = await this.api(Object.assign({ a: 'cmd', pin: this.o.pin || '', c }, extra || {}));
      this.session = j.s; this.fire();
    }
  }
  // same rules as the backend's cmd() — keep in step with backend/Code.gs
  function localCmd(s, c, p, now) {
    s = s ? JSON.parse(JSON.stringify(s)) : null;
    if (c === 'start') return { id: now, running: true, startAt: now, pausedAt: null, pausedTotal: 0, R: +p.R || 300, M: +p.M || 30, rounds: +p.rounds || 8, banner: '', stPause: {} };
    if (!s) return s;
    if (c === 'pause' && !s.pausedAt) { s.pausedAt = now; s.banner = p.msg || ''; }
    if (c === 'banner') s.banner = p.msg || '';
    if (c === 'resume' && s.pausedAt) { s.pausedTotal += now - s.pausedAt; s.pausedAt = null; s.banner = ''; }
    if (c === 'skip') { const k = lessonClock(s, now); if (k.state === 'play' || k.state === 'move') s.startAt -= k.left * 1000; }
    if (c === 'addmin') s.startAt += 60000;
    if (c === 'end') s.running = false;
    if (c === 'stpause') { s.stPause = s.stPause || {}; s.stPause[p.n] = !s.stPause[p.n]; }
    return s;
  }
  window.Sync = Sync;
})();
