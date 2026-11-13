# BSP Game Stations: Polymers (AQA GCSE D&T)

Seven 2-player browser games for a station-rotation lesson. Each one teaches its part of the topic for about 90 s, then tests it for about 3.5 min. They're all run from one hub page and one teacher dashboard.

**Site:** https://buryboy.github.io/bsp-game-stations/
**Teacher:** https://buryboy.github.io/bsp-game-stations/teacher.html

| # | Game | Topic | Style | Mode |
|---|---|---|---|---|
| 1 | Chain Reaction (Snake) | Sources & polymerisation | 16-bit pixel | 1 v 1 |
| 2 | Heat Pong | Thermoforming vs thermosetting | Neon sign | 1 v 1 |
| 3 | Plastic Fantastic (whodunit) | Thermoforming polymers | Film noir | co-op |
| 4 | Clay Catapult | Thermosetting polymers | Claymation | 1 v 1 |
| 5 | Factory Floor Racer (3D) | Manufacturing processes | Isometric pastel | 1 v 1 |
| 6 | POW! Polymer Blocks | Stock forms, additives, finishes | Pop-art comic | 1 v 1 |
| 7 | Recycle Run | Sustainability & recycling | Synthwave | co-op |

Controls everywhere: **P1 = W A S D + F (+ G)**, **P2 = arrow keys + Enter (+ Right Shift)**.

## Before the lesson

1. **Sync server (once, 5 min):** follow the steps at the top of `backend/Code.gs` (Google Apps Script → paste → set a `PIN` script property → deploy as a web app, access "Anyone"). Put the `/exec` link into `lib/stations.js` → `backend:`, or click **Sync link…** on the hub on each computer.
2. **Each station computer:** open the site, click the station number. It's remembered. Click once for full screen. Esc leaves full screen (with Chrome's keyboard lock, hold Esc). The teacher dashboard shows a warning if a station leaves full screen.
3. **Your computer:** open `teacher.html` and enter the PIN. Set play/write minutes, move seconds and rounds, then press **Start**. Pause all / Look up! / skip / +1 min / per-station pause are all there. **Projector view** shows a big class timer.
4. Print the question sheets (Docs: "Polymers game stations: question sheets") without the answer key.

## Rotation

Pairs in two groups. Group A starts on the computers, and Group B starts at the table on the starter sheet. Every phase they swap. After writing, a pair goes to the **next station number**. The sheet they answer has the same number as the game they just played. A full circuit is 14 phases (about 77 min at 5 min + 30 s). For one lesson use 8 rounds, so every pair plays 4 games. The teacher dashboard shows who goes where each round.

## No sync server? (offline mode)

Everything still works without the sync server. Each station is started on its own keyboard: **Ctrl+Shift+S** start, **Ctrl+Shift+P** pause/resume, **Ctrl+Shift+N** skip. Start them all at the same moment.

## Testing a game on its own

`games/NN-name/index.html?standalone=1`. Then F2 starts a round, F3 pauses, F4 skips Learn and F6 ends. Add `&R=120&learn=30` for a short round.

## For future topics

`docs/SPEC.md` is the build brief for a station game and `docs/CONTENT.md` holds the facts. Swap both, rebuild the games, and the hub, teacher dashboard and sync stay the same.
