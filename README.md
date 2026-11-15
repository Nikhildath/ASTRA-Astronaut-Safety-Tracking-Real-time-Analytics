<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/gradient.svg?title=ASTRA&subtitle=Space+Health+Monitor&theme=violet&mode=dark&logo=rocket&logoColor=f5e6ff&width=900&height=200" />
    <img alt="ASTRA Space Health Monitor" src="https://shieldcn.dev/header/gradient.svg?title=ASTRA&subtitle=Space+Health+Monitor&theme=violet&mode=light&logo=rocket&logoColor=7c3aed&width=900&height=200" />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/stargazers">
    <img alt="GitHub Stars" src="https://shieldcn.dev/github/stars/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&logo=github&size=sm" />
  </a>
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/blob/main/LICENSE">
    <img alt="License" src="https://shieldcn.dev/github/license/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&size=sm" />
  </a>
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/commits/main">
    <img alt="Last Commit" src="https://shieldcn.dev/github/last-commit/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&size=sm" />
  </a>
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/actions">
    <img alt="CI Status" src="https://shieldcn.dev/github/ci/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&workflow=CI&branch=main&size=sm" />
  </a>
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/issues">
    <img alt="Open Issues" src="https://shieldcn.dev/github/issues/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&size=sm" />
  </a>
  <a href="https://github.com/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics/pulls">
    <img alt="Open PRs" src="https://shieldcn.dev/github/open-prs/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?variant=secondary&size=sm" />
  </a>
</p>

---

**ASTRA** is a visual health monitoring tool for astronauts on long-duration space missions. Built with React 19, Three.js, GSAP, Framer Motion, and Tailwind CSS 4.

## What it does

ASTRA helps astronauts assess their own health during space missions by:

- **Tracking 8 health indicators**: heart rate, blood pressure, blood glucose, body temperature, sleep hours, mood rating, oxygen saturation, and hydration level
- **Interactive 3D body map** — Three.js-powered clickable astronaut figure showing 7 body systems (cardiovascular, respiratory, metabolic, neurological, musculoskeletal, immune, behavioral)
- **NASA HRP 5 hazards framework** — space radiation, isolation/confinement, distance from Earth, gravity fields, and hostile closed environments, mapped to indicators and actions
- **Action library** — step-by-step guidance for common health situations (elevated heart rate, high blood pressure, fever, low mood, exercise protocols, hydration)
- **Education hub** — full indicator reference, glossary (SANS, orthostatic intolerance, actigraphy, DEXA, radiation dosage), exercise library, and nutrition tips
- **Gamification** — XP, levels (Cadet → Legend), streaks, and 8 achievement badges
- **Trend tracking** — 7-day sparkline charts per indicator with color-coded status (healthy/caution/critical)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 + Vite + TypeScript |
| **3D** | Three.js (astronaut figure with raycasting clickable body parts) |
| **Animation** | GSAP (entrance animations, ring animations, hover effects) + Framer Motion (page transitions, toast animations) |
| **Styling** | Tailwind CSS 4 (custom design tokens for deep space theme with health status colors) |
| **Icons** | Lucide React + FontAwesome |
| **Backend** | Hono + Cloudflare Workers |
| **Database** | Supabase |
| **PWA** | vite-plugin-pwa (offline-first with 50MB cache for 3D models) |

## Run it

```sh
# Install dependencies
npm install

# Start dev server (port 5364)
npm run dev

# Type-check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy

### Vercel (Recommended)

```sh
npm i -g vercel
vercel --prod
```

### Render

1. Connect your GitHub repo to Render
2. Build command: `npm run build`
3. Start command: `npm run preview` (or serve `dist/client` as static site)
4. Add environment variables as needed

### Cloudflare Workers (Current Config)

The project includes a Cloudflare Worker entrypoint in `src/worker/index.ts` with `wrangler.jsonc` config.

```sh
npm run build
npx wrangler deploy
```

### Android APK

Signed release APK: `npx cap sync android && cd android && ./gradlew assembleRelease`
Output: `android/app/build/outputs/apk/release/*.apk`
Signing: `android/keystore/astra-release.p12` (committed — every build uses the same signature, so updates install over previous versions). Regenerate with `node scripts/generate-keystore.mjs` if ever needed.

### Windows EXE

Installer: `npx cap sync @capawesome/capacitor-electron && cd electron && npm run pack`
Output: `electron/dist/ASTRA Setup *.exe`
Signing: unsigned by default (Windows shows a SmartScreen notice). To remove it, add `CSC_LINK` + `CSC_KEY_PASSWORD` GitHub secrets with a code-signing certificate — the workflow picks them up automatically with no further changes.

Both are built automatically by the CI workflow on every push to `main` (`.github/workflows/build-app.yml`) — download the `android-apk` and `windows-exe` artifacts from the run summary.

## Project Structure

```
src/
├── content.ts           # All copy, indicator definitions, hazards, actions, exercise/nutrition data, gamification config
├── styles.css           # Design tokens, space theme, status colors, glass cards, noise overlay
├── components/
│   ├── ThreeScene.tsx       # Three.js astronaut figure with clickable body regions
│   ├── IndicatorCard.tsx    # Health indicator with status ring, log form, trend sparkline
│   ├── HealthRing.tsx       # Animated circular health indicator
│   ├── ActionCard.tsx       # Expandable action steps
│   ├── GamificationPanel.tsx # XP progress, streak, badges
│   ├── HazardCard.tsx       # NASA 5 hazards display
│   ├── BodySystemCard.tsx   # 7 body systems grid
│   └── ...                  # 25+ reusable UI components
├── pages/
│   ├── Home.tsx       # Main dashboard with 5 views (Dashboard, Body, Actions, Education, Profile)
│   ├── Docs.tsx
│   ├── Pricing.tsx
│   ├── StressRelief.tsx
│   └── ...
├── game/               # SpaceChase mini-game engine
├── lib/                # Utilities (supabase, storage, motion, commands, ascii, etc.)
├── App.tsx
└── main.tsx
```

## Key Features in Detail

### Health Indicators (8 tracked)

| Indicator | Unit | Normal Range | Caution | Critical |
|-----------|------|--------------|---------|----------|
| Heart Rate | bpm | 55–75 | 76–100 | >100 |
| Blood Pressure | mmHg | 110–130 | 131–145 | >145 |
| Blood Glucose | mg/dL | 70–100 | 101–125 | >125 |
| Body Temperature | °C | 36.1–37.2 | 37.3–38.0 | >38.0 |
| Sleep Duration | hours | 7–9 | 5–6.9 | <5 |
| Mood Rating | /10 | 6–10 | 3–5 | 0–2 |
| Oxygen Saturation | % SpO2 | 95–100 | 91–94 | <90 |
| Hydration Level | /10 | 7–10 | 4–6 | 0–3 |

### NASA HRP 5 Hazards Mapped

1. **Space Radiation** — DNA damage, cancer risk, acute radiation sickness
2. **Isolation & Confinement** — mood, sleep, team cohesion, cognitive performance
3. **Distance from Earth** — communication delays, autonomous medical response
4. **Gravity Fields** — bone loss, muscle atrophy, cardiovascular deconditioning, SANS
5. **Hostile/Closed Environment** — air quality, microbial balance, immune changes

### Gamification System

- **XP rewards** for daily check-ins, full panels, early birds, healthy streaks
- **8 Levels**: Cadet → Scout → Pilot → Navigator → Commander → Veteran → Guardian → Legend
- **8 Badges**: First Log, One Week Strong, Mission Month, Full Panel, Early Bird, Two Weeks, Health Guardian, Deep Space Explorer

## Credits

- 3D model: [“Astronaut by Jungle Jim”](https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845) by [Jungle Jim](https://sketchfab.com/jungle_jim), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/). Source files live in `public/models/astronaut/`.
- NASA Human Research Program — Five Hazards of Human Spaceflight framework
- Artemis II Standard Measures / ARCHeR Study — actigraphy and sleep tracking research

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/contributors/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?theme=violet&mode=dark&limit=20&radius=8" />
    <img alt="Contributors" src="https://shieldcn.dev/contributors/Nikhildath/ASTRA-Astronaut-Safety-Tracking-Real-time-Analytics.svg?theme=violet&mode=light&limit=20&radius=8" />
  </picture>
</p>

<p align="center">
  <sub>Built with care for the final frontier. 🚀</sub>
</p>