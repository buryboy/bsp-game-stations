# BSP Game Stations — build spec for one station game

A Year 10/11 DT lesson on **polymers (AQA GCSE)**. Seven computers round the room, one game each. A pair of students sits at a station for **5 minutes**: about **90 s LEARN** (the game itself teaches its part of the topic) then about **3.5 min TEST** (playing for points needs what they just learned). Then they go to the middle table to answer a written sheet on the same content, while a new pair arrives. Every station runs in a browser on ordinary school PCs (Chrome/Edge, integrated graphics, one shared keyboard, maybe a mouse). Teacher can pause every station at once.

## Hard rules

1. **Files.** Everything for your game lives in `games/NN-slug/` (an `index.html` plus any `.js` files you split out). Do **not** edit `lib/`, `docs/`, `tools/` or other games. Use relative paths only (the site is served from a sub-path on GitHub Pages).
2. **Shared libraries** (load with `<script src="../../lib/...">`):
   - `lib/gs-bridge.js` — **required**. Read it fully; it is the contract: `GS.init`, `GS.running`, `GS.phase`, `GS.paused`, `GS.held/GS.hit`, `GS.endFrame`, `GS.score`, `GS.sfx`, `GS.fit`, `GS.learnLeft`, `GS.timeLeft`, `GS.skipLearn`, `GS.toast`. The bridge draws the timer pill (top-right, keep the top-right 260×60 px free of important HUD), the idle/pause/time's-up overlays and the LEARN→TEST toast. Never run your own lesson clock.
   - `lib/harness.js` (the style's `H` helpers) and `lib/sound.js` (`SOUND` kit; play effects only through `GS.sfx(name, params)`; names: call `GS.sounds()` or read sound.js). Optional but encouraged.
   - `lib/three.module.min.js` (Three.js r170, ES module: `import * as THREE from '../../lib/three.module.min.js'`) if you go 3D. No other CDNs or libraries, no network calls except Google Fonts (must still look OK if fonts fail to load: give fallbacks).
3. **Controls — one shared keyboard.** Player 1: **W A S D** + **F** (a) + **G** (b). Player 2: **arrow keys** + **Enter** (a) + **Right Shift** (b). Use `GS.held(p, 'left')` / `GS.hit(p, 'a')`. Mouse is allowed as an extra, never required. Show the controls on screen during LEARN. Pass `controls: {p1, p2}` text to `GS.init`.
4. **Round lifecycle.** `onRound` = new pair: fully reset state, scores to 0, start the LEARN part from the beginning. While `!GS.running` (idle / paused / over) freeze gameplay; in idle show an attractive attract-mode scene (animated is nice) — the bridge overlays a title card on top. Report score every change with `GS.score(p1, p2)` (coop: `GS.score(team)`). Call `GS.endFrame()` once per frame.
5. **LEARN must teach, not test.** In the first `learnSeconds` (90) the game introduces each fact *inside the game world* — labelled objects, short captions, slowed-down guided play where every item explains itself when touched, a tutorial "level". Reading load: short phrases, never paragraphs; each caption on screen long enough to read (≈ 3 s per line). Players can't lose points in LEARN. If both players finish the tutorial early, call `GS.skipLearn()` (or offer "both press a/Enter to start the test").
6. **TEST must need the knowledge.** Points come from correct decisions about the content (not just reflexes). Wrong answers cost something and **show the correct answer briefly** (so it still teaches). Make it escalate over 3.5 min so it stays exciting. Keep a visible score for each player (or team).
7. **Content.** Use only facts from `docs/CONTENT.md`, your station's section (you may reuse facts from other sections as distractors). UK spelling. Check every label against the content file — accuracy matters more than anything. Year 10/11 reading level.
8. **Style.** Your style folder is in `/home/claude/papercraft-explainer-kit/styles/<slug>/`: read `style-prompt.md` (the style card) and study `reference-explainer.js` (palette, textures, finishing passes, lettering, the way it draws things). The game must unmistakably look like that style: copy its texture/finish functions and palette, adapt to real-time (cache static textures; keep frames under ~12 ms). Ignore the instructions in style-prompt.md about storyboards, video length, `window.seek`, voiceover and frame-purity — they are for videos; this is a game. Legibility: text ≥ 24 px at 1280×720, key labels ≥ 28 px; projected/seen from a metre away.
9. **Performance.** 1280×720 logical canvas letterboxed with `GS.fit` (or a responsive Three.js renderer capped at devicePixelRatio 1.5). Target 60 fps on integrated graphics. No memory growth across rounds (dispose/reuse objects in `onRound`).
10. **Sound.** Short, satisfying effects via `GS.sfx` on hits, scoring, wrong answers; nothing constant or loud. The bridge already unlocks audio on the first key press.

## Testing (do this, then iterate)

```
cd /home/claude/bsp-game-stations
python3 tools/shoot.py games/NN-slug/index.html /tmp/shots-NN
```
It serves the repo, plays through idle → learn → test (random key mashing) → pause → time's up → round 2, saves PNGs and prints console errors and fps. **Look at every screenshot with the Read tool** and fix anything ugly, cramped, unreadable, off-style or wrong. Also open with `?R=120&learn=30` mentally: short rounds must still work. Zero console errors required. Google Fonts are blocked in this sandbox, so screenshots show fallback fonts; that's expected.

## When done, reply with

- what the game is, how LEARN teaches and how TEST scores (5–8 lines),
- every fact the game shows (a compact list) so it can be checked against CONTENT.md,
- the 2–3 best screenshot paths,
- any known issues.

---

## Station briefs

Game ideas are a strong starting point; improve them if you see a better way, but keep the core mechanic, the mode and the style.

### 01 · Sources & polymerisation — `games/01-chain/` — style `16-bit-pixel-odyssey` — VS
**"Chain Reaction"**: two-player Snake in a SNES-RPG world. Each snake is a growing polymer chain.
- LEARN: a short RPG "quest" told through dialog boxes as both snakes travel a scripted path through 5 zones in order: oil rig (crude oil, finite) → refinery tower (fractional distillation, fractions by boiling point) → cracker (heat + catalyst → ethene) → monomer field (eat ethene monomers: chain grows, "polymerisation: many monomers → poly(ethene)") → a field of plants (biopolymers: PLA from corn starch, biodegradable). Each zone has one pickup that explains itself when eaten.
- TEST: open arena; items spawn with labels. Eat **monomers** to grow (+1 each). "Process gates" appear: a question banner (e.g. "Which step splits crude oil by boiling point?") with 2–3 labelled gates; first snake through the right gate gets +5 and a burst of monomers, wrong gate = lose 3 segments and the right answer flashes. Crashing into walls/other chain cuts your chain at the hit. Score = chain length + bonuses.

### 02 · Thermoforming vs thermosetting — `games/02-pong/` — style `neon-sign-at-night` — VS
**"Heat Pong"**: Pong on the wet brick wall, all neon tubes.
- LEARN: neon signs buzz on to explain the two families: chains with **no cross-links** (soften when heated, reshape, recycle, plastic memory) vs **cross-links** (set once, char when reheated, can't remould). Show the molecular picture as neon tubes (loose wiggly chains vs a cross-linked net) and a heat lamp demo (thermoforming ball goes soft/wobbly; thermosetting ball chars). Slow practice rally where the ball carries a polymer name and the answer is shown.
- TEST: the ball is a glowing chunk labelled with a polymer from the AQA lists (Acrylic, HIPS, HDPE, PP, PVC, PET / Epoxy resin, Melamine formaldehyde, Phenol formaldehyde, Polyester resin, Urea formaldehyde) or a property clue ("can be reheated and reshaped", "has cross-links", "chars when reheated"). Each paddle has two modes, **FORMING** (cool blue) and **SETTING** (hot orange), toggled with a/b. The ball bounces off your paddle only if your mode matches; a wrong mode lets it through (opponent scores) and the correct answer flashes in neon. Ball speeds up each rally; the central "heat zone" occasionally makes the ball show its behaviour (soften vs char) as a hint.

### 03 · Thermoforming properties & uses — `games/03-noir/` — style `1940s-film-noir` — COOP
**"Plastic Fantastic: a polymer whodunit"** — a co-op text-adventure / detective game in a 1940s detective office with the cork **case board** from the reference (mugshot placards, red string, newspaper clippings).
- The suspects are the six AQA thermoforming polymers (Acrylic, HIPS, HDPE, PP, PVC, PET), each with a mugshot placard and a "file" of properties and known hangouts (uses).
- LEARN: the chief briefs the detectives; they flip through the six suspect files (each file shows 2–3 properties and 2–3 uses from CONTENT.md, short lines, typed out on a typewriter). Both players navigate (P1 W/S + F, P2 ↑/↓ + Enter; either can act).
- TEST: a sequence of short **cases** (at least 10, randomised order, ~20 s each): a crime-scene card describes a product and evidence ("A flip-top shampoo cap has opened 5,000 times and hasn't snapped. Who made the hinge?" → PP; "Shop window sign, glossy, polished edges, shatter-resistant" → Acrylic; "Milk bottle that resists chemicals" → HDPE; "Fizzy drinks bottle, clear, recycled into fleeces" → PET; "Cable insulation that must bend and insulate" → PVC; "Cheap vacuum-formed toy packaging tray" → HIPS…). Detectives question suspects (each suspect gives one in-character alibi line that hints at a property) and pin the red string on one suspect to accuse. Correct = case closed, newspaper headline spins in, points (+10, bonus for speed); wrong = the wrong suspect gives their real alibi, −3, try again. Both players must agree (both press a on the same suspect) for an accusation — that keeps it co-op.

### 04 · Thermosetting polymers — `games/04-fling/` — style `claymation-set` — VS (alternate turns)
**"Clay Catapult"**: Angry-Birds-style side-on physics flinger on a plasticine set.
- Ammo = five clay blobs, one per thermoset: Epoxy resin, Melamine formaldehyde, Phenol formaldehyde, Polyester resin, Urea formaldehyde (each a distinct colour with a label).
- LEARN: each ammo blob introduces itself (squash-and-stretch pop-on with a caption: key properties + uses from CONTENT.md) and players take free practice shots at matching targets that are labelled with the answer.
- TEST: players alternate turns. A clay target structure appears with an **order card** ("Make: a boat hull", "Plug socket", "Picnic plate", "Saucepan handle", "Two-part adhesive", "Laminated worktop", "PCB", "Light switch", "Casting a paperweight"…). The player picks the ammo (a/b or up/down to cycle) and aims/power (left/right + up/down, fire with a). Hitting the target with the **right** thermoset = big points (+ structure topples satisfyingly); wrong material = the target shrugs it off and the right answer pops up; miss = 0. Short turn timer (~12 s) so it flows. Simple 2D physics you write yourself (no libs).

### 05 · Manufacturing processes — `games/05-racer/` — style `isometric-pastel` — VS
**"Factory Floor Racer"**: Micro-Machines-style top-down racing in a 3D isometric pastel factory (Three.js recommended: orthographic iso camera, flat three-tone shading, long soft shadows, pastel palette with coral accent, tiny workers).
- Track loops round the factory floor past big machines: injection moulding (hopper, screw), vacuum former, blow moulder, extruder (with pipe coming out), strip heater (line bending), rotational moulder (spinning in two axes), compression press, laser cutter, 3D printer.
- LEARN: a guided lap; each machine animates its process as you drive through it, with a white label tag explaining it in one line ("Extrusion: pushed through a die → constant cross-section"). Cars move at reduced speed, can't crash out.
- TEST: race. Each player carries a **job ticket** (a product: drinks bottle, bottle cap, pipe, packaging tray, kayak, phone stand, melamine plate, sign, prototype…) and must drive through the correct machine's gate to deliver it (+points, new ticket). Wrong gate = spin-out + correct machine flashes. Bump-and-boost racing so it's fun.

### 06 · Stock forms, additives & finishes — `games/06-tetris/` — style `halftone-pop-panel` — VS
**"POW! Polymer Blocks"**: split-screen two-player falling-block game drawn as a pop-art comic (fat black outlines, Ben-Day dots, primary colours, speech balloons, Bangers-style lettering, explosion balloons for scores).
- Some falling pieces carry a sticker (an additive, a stock form, or a finish).
- A comic "order" balloon above each well shows a requirement, e.g. "Garden chair keeps going brittle in the sun!" (→ UV stabiliser), "Make PVC flexible for cable insulation" (→ plasticiser), "Make it cheaper" (→ filler), "Electrical casing must not catch fire" (→ flame retardant), "Colour all the way through" (→ pigment), "Stop dust sticking" (→ antistatic), "Feed the injection moulder" (→ granules), "For rotational moulding" (→ powder), "Laser cut a sign" (→ sheet), "3D printer" (→ filament), "Finish acrylic edges" (→ file, wet & dry, polish), "No paint needed" (→ self-finishing).
- LEARN: slow speed; each sticker piece explains itself in a balloon as it falls ("PLASTICISER: makes polymers more flexible"); line clears are free.
- TEST: clearing a line that contains the sticker matching your current order = big POW bonus and sends a junk line to the opponent; clearing a line with a wrong sticker = small penalty + caption with the right answer. Normal line clears score small points. Speed rises. Keep piece rotation controls simple: P1 A/D move, W rotate, S drop, F hard drop; P2 arrows, ↑ rotate, ↓ drop, Enter hard drop.

### 07 · Sustainability & recycling — `games/07-outrun/` — style `synthwave-outrun` — COOP
**"Recycle Run"**: co-op night drive on the neon grid highway toward the striped sun.
- Seven lanes/gates ahead are labelled with recycling triangles **1 PET, 2 HDPE, 3 PVC, 4 LDPE, 5 PP, 6 PS, 7 Other** (not all at once — 3 or 4 gates per wave). P1 steers the car; P2 controls the "sort scanner" (cycles which item from the boot is loaded, and fires boosts) — or split it so both players steer one car each in the same lane field with a shared team score. Choose whichever is more fun; it must be co-op.
- LEARN: neon signs/HUD teach: crude oil is finite; most polymers aren't biodegradable and last hundreds of years (landfill, ocean); the 7 resin codes with an example each; only thermoforming polymers can be remelted and recycled; recycling steps collect → sort → wash → shred → melt → new granules; incineration with energy recovery; biopolymers (PLA from corn starch, Potatopak) are compostable. Drive through tutorial gates with the answers shown.
- TEST: items (milk bottle, drinks bottle, carrier bag, yoghurt pot, foam cup, drain pipe, PLA cup, cling film, bottle cap…) arrive; drive through the gate with the right code. Bonus waves: "Can this be recycled by remelting?" (thermoforming yes / thermosetting no: melamine plate, plug socket…), "Which goes in the compost?" (PLA / Potatopak), and a recycling-steps sequence (drive through the 5 steps in the right order). Combo multiplier for streaks; wrong = shield flicker + correct gate glows.
