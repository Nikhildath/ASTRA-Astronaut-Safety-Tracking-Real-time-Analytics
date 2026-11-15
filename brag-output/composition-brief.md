# Hyperframes Composition Brief: A.S.T.R.A. — Space Health Monitor

## Objective
Create a 20-second launch-style brag video for A.S.T.R.A., an astronaut health dashboard that hides a full 3D space dogfight behind a "Stress Relief" nav item. Deadpan mission-control delivery, cheerful corporate music.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20s (15–25s window)

## Source Material
- Project root: repo root of `astra-space-health`
- Primary files read: `index.html`, `src/styles.css` (`:root` tokens), `src/content.ts`, `src/pages/Home.tsx`, `src/pages/StressRelief.tsx`, `src/components/SpaceChaseGame.tsx`, `package.json`
- Product name: A.S.T.R.A. (ASTRA / Space Health Monitor)
- Tagline / strongest claim: the meta description — "ASTRA helps astronauts assess their own health during space missions. Track vitals, explore body systems, and get actionable guidance for long-duration spaceflight."
- Key UI or visual moment to recreate: the dashboard header + vitals grid with a `Stress Relief` nav item, then the game's `SIMULATION 07 // COMBAT THERAPY` ready screen and flight HUD
- Copy that must appear verbatim:
  - `SYSTEM ALIGNMENT // NASA SPACE APPS`
  - `Earth link — 14m delay`, `SOL 14`, `ARCTURUS-7`
  - `Dashboard · Body · Actions · Education · Profile · Stress Relief`
  - `Heart Rate  68 bpm`, `Oxygen Saturation  98 % SpO2`, `Sleep Duration  6.2 hours`, `Mood Rating  4/10`, dial label `CAUTION`
  - `SIMULATION 07 // COMBAT THERAPY`, `ENDLESS CHASE`, `LAUNCH FIGHTER`
  - HUD: `SCORE 004120`, `KILLS 5`, `WAVE 3`, `HOSTILES 4 · 2 ON YOU`, `HULL`, `BOOST`
  - `RAIDER DOWN`, `DESERT WORLD`, `DIVE IN`
  - `Track vitals. Explore body systems. Get actionable guidance.`
  - Descriptions of the game may be paraphrased from `StressRelief.tsx` ("Four worlds drift through the chase zone — desert, ice, jungle and void."), but no capability may be invented.

## Creative Direction
- Tone preset: `yc-parody`
- Creative direction: mission-control deadpan applied to a health dashboard that secretly contains a space shooter
- Interpretation: clinical instrumentation typography, wide tracking, generous holds, hard clean cuts, no shouting; the cheerful bed never reacts to combat
- Angle: the app's own "Stress Relief" button opens a 3D chase with raiders, hull damage and a score, and no part of the UI acknowledges it is a game.
- Hook: near-black, three mono log rows, then `MISSION DAY 218.`
- Outro / punchline: `Track vitals. Explore body systems. Get actionable guidance.` then `Also: alien dogfights.` then wordmark.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals / stock space footage
  - Redesigning the brand — use the project's own cyan-on-void instrumentation look
  - Celebrating or winking at the joke in the visuals; keep it straight

## Visual Identity
- Background: `#030509` void, panels `#0d1322` at ~0.82 alpha, header `#080c14`
- Text: `#e2e8f0` primary, `#94a3b8` dim, `#64748b` muted
- Accent: `#00f3ff` cyan (primary), `#a855f7` violet, `#ef4444` / `#fbbf24` for CAUTION, `#ffc02e` coins, `#34d399` patching
- Display font: Orbitron (800–900, tracking 0.2em+, cyan glow)
- Body font: JetBrains Mono for all instrumentation, Inter for prose
- Visual references from the project: hairline corner brackets on panels (`SciBox`), 4px scanline overlay at 1.8% cyan, cyan-glow borders, the flight HUD's `SCORE` / `KILLS / WAVE / HOSTILES` strip, `Bar`-style thin gradient meters, the ready-screen eyebrow + huge Orbitron title + button
- Fonts must be locally available or installed in the composition; the project loads them from Google Fonts — vendor or embed them so the render is offline-safe

## Storyboard
Use `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Mission day — 3.2s — three mono log rows, then `MISSION DAY 218.`
2. The dashboard — 3.4s — header, nav with `Stress Relief`, four vitals cards arriving one by one (one CAUTION), cursor clicks the nav item
3. Combat therapy — 3.0s — `SIMULATION 07 // COMBAT THERAPY` / `ENDLESS CHASE` / `LAUNCH FIGHTER`, click, HUD assembles
4. Two on you — 3.6s — HUD counters, dogfight with tracers and amber lock reticle, caption about raiders
5. Raider down / dive in — 3.4s — `RAIDER DOWN` + score jump, planet + `DIVE IN` prompt, caption about four worlds
6. Wordmark — 3.4s — logo, grounded positioning line, `Also: alien dogfights.`, fade

## Audio
- Audio role: warm corporate bed, deadpan against the content; sparse professional accents
- Audio arc: constant cheerful bed from 0:00, one swell at launch, payoff hits on the kill, fade to silence under the wordmark
- Music: `assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (already copied)
- Music treatment: level and steady; ~0.15s duck under the launch whoosh; fade out 0.8s at the end
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-11-by-ende-dot-app.music-cues.json` (114 BPM). Strong cues at 1.60, 3.70, 5.80, 8.96, 12.65, 17.91. Beat grid ≈0.52s. Lock the launch reveal near 8.96 and the RAIDER DOWN near 12.65 if that suits the edit; snap vitals cards to consecutive beats but hold the set ≥1.2s before reading.
- Audio-reactive treatment: subtle — cyan edge-glow bloom and HULL bar breathing on low-band energy only; no waveform or equalizer visuals
- Audio-coupled moments:
  - Scene 1 — data ticks per log row, headline on a beat
  - Scene 2 — card arrivals one by one, nav click
  - Scene 3 — launch click + low whoosh on the cut
  - Scene 4 — tracer zaps on beats, dry impacts on HULL loss
  - Scene 5 — laser zap + impact stacked on RAIDER DOWN, chime on the planet prompt
  - Scene 6 — single soft chime on the wordmark
- SFX selection guidance: UI tick for clicks, short impact for HULL loss, zap for lasers, soft bright chime for the logo. Restrained; nothing cartoonish.
- SFX analysis guidance: `/astra/.agents/skills/brag/assets/sfx/sfx-analysis.md`; prefer low high-frequency-risk files for the repeated ticks.
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density, and volume from the implemented animation. Copy chosen SFX into `brag-output/composition/assets/`.

## Hyperframes Instructions
Load `hyperframes` (composition contract + `data-*` timing, `references/format.md`, `references/motion.md`, `references/look.md`), `hyperframes-registry` (effects, transitions, titles), `media-use` (audio, audio-reactive data), `hyperframes-cli` (check/render). /brag is its own workflow: skip the `hyperframes` storyline step — no `references/types/*`, no `references/story.md`, no storylines, no `SPEC.md`, no REVIEW.md. `hyperframes check` is the only gate. Composed scenes here are UI recreations, not a narrated story — treat the storyboard above as the spec.

Requirements:
- Show real UI: the dashboard nav + vitals cards and the in-game HUD must be recognizable recreations of the actual components.
- Readable at 1080p from a phone: nothing below ~20px effective, instrumentation type ≥22px.
- 15–25s total.
- Audio layer included as specified.
- Beat locks marked `// beat-locked`; sequential reveals marked `// beat-grid`.
- Run `hyperframes check` before render.
- Keep creation and rendering local.
