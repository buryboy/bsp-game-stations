// Lesson config shared by the hub, the teacher dashboard and the sheets.
window.LESSON = {
  title: 'Polymers',
  course: 'AQA GCSE Design & Technology',
  // Paste the Apps Script web-app URL here once it's deployed (ends in /exec). Leave '' for offline mode.
  backend: '',
  stations: [
    { n: 1, path: 'games/01-chain/', name: 'Chain Reaction', topic: 'Sources & polymerisation', style: '16-bit pixel', mode: 'vs' },
    { n: 2, path: 'games/02-pong/', name: 'Heat Pong', topic: 'Thermoforming vs thermosetting', style: 'Neon sign', mode: 'vs' },
    { n: 3, path: 'games/03-noir/', name: 'Plastic Fantastic', topic: 'Thermoforming polymers: properties & uses', style: 'Film noir', mode: 'coop' },
    { n: 4, path: 'games/04-fling/', name: 'Clay Catapult', topic: 'Thermosetting polymers', style: 'Claymation', mode: 'vs' },
    { n: 5, path: 'games/05-racer/', name: 'Factory Floor Racer', topic: 'Manufacturing processes', style: 'Isometric pastel 3D', mode: 'vs' },
    { n: 6, path: 'games/06-tetris/', name: 'POW! Polymer Blocks', topic: 'Stock forms, additives & finishes', style: 'Pop-art comic', mode: 'vs' },
    { n: 7, path: 'games/07-outrun/', name: 'Recycle Run', topic: 'Sustainability & recycling', style: 'Synthwave', mode: 'coop' },
  ],
  // default timings (teacher can change them before starting)
  playSeconds: 300,
  moveSeconds: 30,
  rounds: 8,
};

// ---- the shared clock: everyone derives the same phase from the same session object ----
// session = { id, running, startAt, pausedAt, pausedTotal, R, M, rounds, banner, stPause: {n: true} }
window.lessonClock = function (s, now) {
  if (!s || !s.running) return { state: 'idle' };
  const pausedFor = s.pausedTotal + (s.pausedAt ? now - s.pausedAt : 0);
  const el = Math.max(0, (now - s.startAt - pausedFor) / 1000);
  const B = s.R + s.M;
  const block = Math.floor(el / B);
  if (block >= s.rounds) return { state: 'done', el };
  const tb = el - block * B;
  return {
    state: tb < s.R ? 'play' : 'move',
    el, block, round: block + 1, tb,
    left: tb < s.R ? s.R - tb : B - tb,
    paused: !!s.pausedAt,
    roundId: (s.id % 100000) * 100 + block + 1,
  };
};
