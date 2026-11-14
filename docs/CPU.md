# CPU Player 2 — add-on brief for every station game

Teachers sometimes have an odd number of students, so every game needs a computer Player 2. The bridge
(`lib/gs-bridge.js`, re-read the "CPU player 2" section) already does the switching:

- If no Player-2 key is touched for 15 s of a round, `GS.cpu.on` becomes true and a toast says so. Any real P2 key press
  turns it off again (P2 takes over instantly). `?cpu=1` forces it on for testing; `?cpu=0` disables it.
- `GS.cpu.skill` (0.1–0.95) starts at 0.5 in `vs` games and adapts every second to keep the score close (human losing →
  lower skill). Co-op games get a fixed 0.75. It resets on `onRound`.
- Virtual input: `GS.cpu.hold(btn, bool)` and `GS.cpu.press(btn)` make `GS.held(2, btn)` / `GS.hit(2, btn)` return true,
  so a brain can "press keys". Or the brain may set Player 2's state directly if that's cleaner. Call
  `GS.cpu.releaseAll()` when the brain stops.
- The bridge shows a "P2 = CPU" badge in the pill and "The computer wins!" on the time's-up card.

## What you add to your game

A `cpuBrain(dt, skill)` called from your update **only when `GS.cpu.on && GS.running`**. It must:

1. **Feel human, never perfect.** Reaction delay, aim error and speed limits that scale with `skill`
   (e.g. reaction 1.4 s at skill 0.1 → 0.35 s at 0.95). No instant snaps. No cheating with information a player couldn't see.
2. **Answer content questions right with probability ≈ `0.35 + 0.6 * skill`** (vs games). When it's wrong, your normal
   wrong-answer feedback must show the correct answer exactly as it does for a human — the student watching still learns.
3. **Play LEARN sensibly** so tutorials that need both players still progress (e.g. if a tutorial waits for both
   players to press ready, the CPU is ready a second after Player 1 is).
4. **Co-op games are a sidekick, not a solver** — the human must make the key decisions (see your station below).
5. Change nothing for two human players. Label P2 as "CPU" in your own HUD when `GS.cpu.on` if your HUD names players.

## Per station

- **01 Chain Reaction (Snake):** steer toward the nearest reachable monomer with a short look-ahead to avoid walls and
  chains (grid BFS or greedy + safety check); mistakes = occasional late turns at low skill. Gates: after a reaction delay,
  head for the right gate with p, else a wrong one.
- **02 Heat Pong:** move the paddle toward the predicted intercept with lag + error scaled by skill and a capped speed;
  choose FORMING/SETTING correctly with p (decide when the ball crosses the half-way line, not at the last frame).
- **03 Noir (co-op):** the CPU detective never pins first. When Player 1 pins a suspect, the CPU pins the same suspect
  after 1–2 s (with a little in-character quip such as "If you say so, partner"), so arrests still need the human's
  decision. While idle it questions a random suspect now and then (adds atmosphere). If P1 has done nothing for 12 s it
  "has a hunch" and questions the right suspect (a hint, never a pin).
- **04 Clay Catapult:** on the CPU's turn wait 1.5–3 s "thinking", choose the right clay with p, then aim by solving the
  trajectory with angle/power noise scaled by (1 − skill), so it sometimes misses.
- **05 Factory Floor Racer:** follow the racing line at 0.78–1.0 of top speed by skill, steer into the right machine's
  gate lane with p (else a plausible wrong machine), boost on straights now and then, recover from spin-outs.
- **06 POW! Polymer Blocks:** standard placement search (score lines cleared, holes, bumpiness, height), executed as key
  presses with a delay per move by skill (slower at low skill); keep/peel the sticker correctly with p.
- **07 Recycle Run (co-op):** the CPU drives its own car and carries its own items; it picks the right gate with
  probability 0.6 + 0.35·skill (~86 % at 0.75); it never steers the human's car. In LEARN it follows the guide glow.

## Test

`python3 tools/shoot.py games/NN-x/index.html /tmp/cpu-NN --q cpu=1 --keys "KeyW,KeyA,KeyS,KeyD,KeyF"` (P1 keys only, so
the CPU stays on), look at the screenshots, and also script a check that at skill 0.1 the CPU loses to a decent
scripted P1 and at 0.95 it competes. Zero console errors. Then reply with: how the brain works (3–5 lines), the
skill → behaviour mapping, best screenshot path, known issues.
