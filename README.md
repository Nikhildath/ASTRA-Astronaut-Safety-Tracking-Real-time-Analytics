# ASTRA / Space Health Monitor

A visual health monitoring tool for astronauts on long-duration space missions. Built with React, Three.js, GSAP, and Framer Motion.

## What it does

ASTRA helps astronauts assess their own health during space missions by:

- ** tracking 8 health indicators**: heart rate, blood pressure, blood glucose, body temperature, sleep hours, mood rating, oxygen saturation, and hydration level
- **Interactive 3D body map** — Three.js-powered clickable astronaut figure showing 7 body systems (cardiovascular, respiratory, metabolic, neurological, musculoskeletal, immune, behavioral)
- **NASA HRP 5 hazards framework** — space radiation, isolation/confinement, distance from Earth, gravity fields, and hostile closed environments, mapped to indicators and actions
- **Action library** — step-by-step guidance for common health situations (elevated heart rate, high blood pressure, fever, low mood, exercise protocols, hydration)
- **Education hub** — full indicator reference, glossary (SANS, orthostatic intolerance, actigraphy, DEXA, radiation dosage), exercise library, and nutrition tips
- **Gamification** — XP, levels (Cadet → Legend), streaks, and 8 achievement badges
- **Trend tracking** — 7-day sparkline charts per indicator with color-coded status (healthy/caution/critical)

## Tech stack

- **React 19** + Vite + TypeScript
- **Three.js** — 3D astronaut body visualization with raycasting clickable body parts
- **GSAP** — entrance animations, ring animations, hover effects
- **Framer Motion** — page transitions, toast animations
- **Tailwind CSS 4** — custom design tokens for deep space theme with health status colors
- **Lucide React** — icons

## Run it

```sh
npm install
npm run dev        # Vite dev server on port 5364
npm run build      # dist/client (assets) + dist/astra/index.js (Worker)
```

## Deploy with Freebuff Sites

`deploy.json` points at the build output. After `npm run build`, deploy with the Sites deployer from this directory.

## Project structure

- `src/content.ts` — all copy, indicator definitions, hazards, actions, exercise/nutrition data, gamification config
- `src/styles.css` — design tokens, space theme, status colors, glass cards, noise overlay
- `src/components/ThreeScene.tsx` — Three.js astronaut figure with clickable body regions and GSAP-free ambient motion
- `src/components/IndicatorCard.tsx` — individual health indicator with status ring, log form, trend sparkline
- `src/components/HealthRing.tsx` — animated circular health indicator
- `src/components/ActionCard.tsx` — expandable action steps
- `src/components/GamificationPanel.tsx` — XP progress, streak, badges
- `src/components/HazardCard.tsx` — NASA 5 hazards display
- `src/components/BodySystemCard.tsx` — 7 body systems grid
- `src/pages/Home.tsx` — main dashboard with 5 views (Dashboard, Body, Actions, Education, Profile)

## Credits

- 3D model: [“Astronaut by Jungle Jim”](https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845) by [Jungle Jim](https://sketchfab.com/jungle_jim), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/). Source files live in `public/models/astronaut/`.
