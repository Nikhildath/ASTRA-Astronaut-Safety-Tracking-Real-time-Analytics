# Brag Plan: A.S.T.R.A. — Space Health Monitor

## What is this app?
A NASA Space Apps mission-health dashboard for astronauts — eight vitals, five spaceflight hazards, body systems, badges — that also ships a playable 3D space dogfight behind a nav item called **Stress Relief**.

## The angle
The most serious instrument in the room has a tab for blowing up aliens. Play it deadpan: mission-control calm, precise readings, absolute procedural seriousness — while the app's own "Stress Relief" button opens up a full 3D chase with raiders, hull damage and a score. The joke is not that the game exists; the joke is that nobody in the UI acknowledges it is a game.

## Hook (first 2-3 seconds)
Black. One line, mission-log style: **"MISSION DAY 218."** Then the dashboard's own status bar resolves underneath it — `SYSTEM ALIGNMENT // NASA SPACE APPS`, `EARTH LINK — 14m DELAY` — and we cut to a nav bar where every item is clinical. The last item is `Stress Relief`. Nothing explains it. That mismatch is the hook.

## Key moments (the middle)
- The vitals grid: Heart Rate, Oxygen Saturation, Sleep Duration, Mood Rating, each with a real unit and a status badge; one of them dropping into **CAUTION** while the rest stay nominal.
- A cursor clicking `Stress Relief` in the nav — the cut from a medical dashboard into a dark cockpit.
- **SIMULATION 07 // COMBAT THERAPY** / **ENDLESS CHASE** / `LAUNCH FIGHTER` — the app's own ready screen, verbatim.
- The flight HUD: `SCORE 004120`, `KILLS 5`, `WAVE 3`, `HOSTILES 4 · 2 ON YOU`, a draining HULL bar, a `BOOST` bar, and the gold COIN counter.
- **RAIDER DOWN** kill confirmation, then a planet prompt reading **DIVE IN** — the app's four diveable worlds (desert, ice, jungle, void).

## Outro / punchline
Back to dashboard calm: the A.S.T.R.A. logo, and one dry line that names what it actually is — "Track vitals. Explore body systems. Get actionable guidance." — followed by the honesty beat: "Also: alien dogfights." Then the wordmark holds.

## User flow worth showing
1. **Entry** — dashboard, squad status, `SOL 14`, vitals cards with one CAUTION.
2. **Action** — click `Stress Relief` → `LAUNCH FIGHTER`; the sim boots into the cockpit.
3. **Result** — HUD fills: score climbing, hostiles marked `2 ON YOU`, `RAIDER DOWN` confirmation, planet `DIVE IN` prompt.

The three beats are the spine of the video; the landing-page material only frames them.

## Tone
- Preset: `yc-parody`
- Creative direction: mission-control deadpan applied to an astronaut health dashboard that secretly contains a space shooter
- Interpretation: no shouting, no exclamation marks, generous holds, hard clean cuts, monospace instrumentation type, and cheerful corporate music running underneath the dogfight. Gravity in the delivery makes the absurdity land.

## Format: landscape — 1920x1080
## Duration: 20s

## Visual identity (from the project)
- Background: `#030509` (void) with `#080c14` (obsidian) panels
- Accent: `#00f3ff` (cyan), plus `#a855f7` (violet) and `#ef4444` (critical red)
- Text: `#e2e8f0`, dim `#94a3b8`, muted `#64748b`
- Display font: Orbitron (900, wide tracking, cyan glow)
- Body/UI font: JetBrains Mono for instrumentation, Inter for prose
- Strongest visual element: the cyan-glow panel with hairline corner brackets and a scanline overlay; the in-game flight HUD in the same type system

## Share copy (draft)
Astronaut health monitor with eight vitals, five hazards, and one (1) space dogfight behind a tab called Stress Relief.

## Audio direction
- Role: warm corporate bed, deadpan against the content; sparse professional accents
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (114 BPM, cheerful business-pop — the joke is that it never changes when the lasers start)
- Music treatment: start at 0:00 on the hook, hold a steady level, brief 0.15s duck on the launch cut, fade under the final wordmark
- Music cue guidance: preset read from `assets/music/cues/…vol-11…music-cues.md`. Strong cues in window: 1.60, 3.70, 5.80, 8.96, 12.65, 17.91. Beat grid ≈0.52s apart. Use the 8.96 and 12.65 cues for the two combat reveals; snap the three vitals-card arrivals to consecutive beats but hold each long enough to read.
- Audio-reactive treatment: subtle — a barely-there flicker on the cyan edge glow and HULL bar bloom only; no waveform bars
- SFX posture: sparse to moderate, motion-matched: soft UI tick on nav click, one low whoosh on the launch cut, a dry laser zap + a short impact on RAIDER DOWN, a soft chime on the final wordmark
- Audio-coupled moments: the nav click, the LAUNCH press, the three vitals cards arriving one by one, the kill confirmation, the final logo
- Restraint rule: nothing comedic in the sound design. No cartoon boings, no explosions over the top; the video is funnier if the audio stays professional.

## Storyboard

### Scene 1 — Mission day — 3.2s
Near-black. A thin cyan scanline sweeps once. Text arrives in three log rows, monospace, small, then the headline: **MISSION DAY 218.** Under it, tiny: `SYSTEM ALIGNMENT // NASA SPACE APPS` and `EARTH LINK — 14m DELAY`.
Sequential/interaction: yes — three log rows appear one at a time, then the headline lands and holds (≥1.2s settled).
Audio intent: a quiet, confident start; the bed comes in on the first row.
Audio-coupled idea: soft data ticks per row; headline lands on a beat.
Music: cheerful business-pop, low in the mix.
Transition mood: hard cut → Scene 2

### Scene 2 — The dashboard — 3.4s
Recreate the dashboard at 1920x1080: cyan-bordered header with the A.S.T.R.A. mark, nav reading `Dashboard · Body · Actions · Education · Profile · Stress Relief`, `SOL 14` chip. Four vitals cards slide in one at a time — **Heart Rate 68 bpm**, **Oxygen Saturation 98 % SpO2**, **Sleep Duration 6.2 hours**, **Mood Rating 4/10** with a CAUTION badge. Then a cursor moves up the nav and clicks `Stress Relief`.
Sequential/interaction: yes — 4 cards arrive one by one; cursor travel + click simulated.
Audio intent: orderly, clinical; the clicks are the only drama.
Audio-coupled idea: card-by-card arrival on consecutive beats, then hold the full set ≥1.2s before the click.
Music: same bed, unchanged.
Transition mood: hard, with a single cyan flash on the click → Scene 3

### Scene 3 — Combat therapy — 3.0s
The cockpit: nebula gradient, drifting starfield. **SIMULATION 07 // COMBAT THERAPY** over **ENDLESS CHASE** in huge Orbitron, the app's parser line about raiders and coin trails small beneath it, and the `LAUNCH FIGHTER` button. Cursor clicks. The frame snaps to full flight — HUD appearing corner by corner.
Sequential/interaction: yes — button click, then HUD chrome assembles.
Audio intent: the one swell of the video.
Audio-coupled idea: click, low whoosh on the cut, HUD elements tick in.
Music: bed continues, tiny duck under the whoosh.
Transition mood: dramatic → Scene 4

### Scene 4 — Two on you — 3.6s
The flight HUD in the app's own type: `SCORE 004120`, `KILLS 5`, `WAVE 3`, `HOSTILES 4 · 2 ON YOU` in amber, a HULL bar dropping in steps, BOOST bar, gold coin counter. Behind it, a simple 3D-feeling dogfight: one raider crossing, tracer lines, a lock reticle turning from cyan to amber. A small caption lands: **"One or two raiders on you early. A whole furball later."**
Sequential/interaction: yes — HUD fields count up one by one; HULL loses two chunks.
Audio intent: tension without panic; the bed does the work.
Audio-coupled idea: tracer zaps on beats, HULL chunks with dry impacts.
Music: unchanged — the gap between cheerful scoring and incoming fire is the joke.
Transition mood: hard cut → Scene 5

### Scene 5 — Raider down / dive in — 3.4s
`RAIDER DOWN` flashes across the HUD in Orbitron italics with the score jumping `004120 → 004220`. Then the camera tilts toward a planet: `DESERT WORLD` label, `DIVE IN` prompt with the key hint, and the line **"Four worlds. Thirty seconds of surface combat each."**
Sequential/interaction: yes — kill text, score tick, planet prompt.
Audio intent: one satisfying payoff hit, then settle.
Audio-coupled idea: impact + laser zap stack on RAIDER DOWN; chime as the planet prompt appears.
Music: continues, level steady.
Transition mood: soft crossfade → Scene 6

### Scene 6 — Wordmark — 3.4s
Void background, scanlines. The A.S.T.R.A. mark and wordmark resolve in cyan with its glow. Line one: **"Track vitals. Explore body systems. Get actionable guidance."** Line two, smaller, mono, after a beat: **"Also: alien dogfights."** Hold. Music fades out under the final logo.
Sequential/interaction: yes — two lines arrive in sequence, the second after a held beat.
Audio intent: dry, resolved, no triumph.
Audio-coupled idea: single soft chime on the wordmark; bed fades 0.8s.
Music: fade to silence by the last frame.
Transition mood: end.

**Music mood for this video:** cheerful corporate business-pop, deliberately at odds with lasers.
**Audio summary:** a steady, professional bed that never acknowledges the game, punctuated by precise UI and dogfight accents, resolving into silence on the wordmark.
