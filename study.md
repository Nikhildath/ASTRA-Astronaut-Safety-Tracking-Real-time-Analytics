# ASTRA / Space Health Monitor — Comprehensive Project Architecture & Feature Blueprint

> **NASA Space Apps / Astronaut Safety Tracking & Real-Time Analytics (ASTRA)**  
> **Document:** Full Project Analysis, Architectural Deep-Dive & New Feature Blueprint  
> **Target Feature:** Daily Biometric Data Entry & Interactive Historical Health Metric Analytics (with Graph & Clinical Deep-Dive)

---

## 1. Executive Summary & NASA Mission Alignment

### 1.1 Project Overview
**ASTRA (Astronaut Safety Tracking & Real-time Analytics)** is a specialized, mission-critical health monitoring application designed for astronauts during long-duration spaceflight (such as Lunar Artemis basecamp operations, Lunar Gateway transit, and Mars exploration missions).

During deep space missions, crews face communication latency ranging from seconds to upwards of 20 minutes each way, completely eliminating the possibility of real-time telemedicine consultations from Earth flight surgeons. Astronauts must become medically autonomous. ASTRA provides an intuitive, reliable, and scientifically grounded interface to:
1. **Log and track 8 core physiological and psychological telemetry indicators.**
2. **Visualize systemic biological impacts** across 7 human body systems via an interactive 3D astronaut digital twin.
3. **Correlate health trends with the NASA Human Research Program (HRP) 5 Hazards of Human Spaceflight.**
4. **Execute autonomous step-by-step countermeasure protocols** (actions) when vital signs enter caution or critical zones.
5. **Maintain engagement and routine compliance** through a mission gamification engine (XP, ranks, streaks, badges).
6. **Decompress cognitive stress** via an integrated 3D neuro-cognitive space chase flight simulation.

---

## 2. Complete Technology Stack & System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ASTRA CLIENT APPLICATION                      │
│                  (React 19 + TypeScript 5.9 + Vite 8)                  │
├────────────────────────────────────────────────────────────────────────┤
│  Presentation & UX Layer                                              │
│  ├── Tailwind CSS 4 (Custom deep space HUD tokens, glowing borders)    │
│  ├── Sci-Fi HUD Primitives (SciBox, XenText, StatusBadge, Scanlines)   │
│  ├── Lucide React & FontAwesome 6 Pro/Free Solid icons                │
│  └── Motion & Feedback: Framer Motion 14 + GSAP 3.15                   │
├────────────────────────────────────────────────────────────────────────┤
│  Interactive 3D Graphics Engine                                        │
│  ├── Three.js r187 (WebGL Renderer, ACESFilmic Tone Mapping)          │
│  ├── GLTF Models (Astronaut Suit, Rust Suit, Employee, Heart Cutaway)  │
│  ├── Raycasting Hitboxes (System camera focus: Neuro, Cardio, Resp)   │
│  └── SpaceChaseEngine (Custom 97KB arcade 3D flight & procedural sound)│
├────────────────────────────────────────────────────────────────────────┤
│  Data, State & Telemetry Service Layer                                 │
│  ├── Offline-First Local Storage (astra_profile, astra_stats, readings)│
│  ├── Supabase Client (@supabase/supabase-js) + Realtime Postgres Sync  │
│  └── Gamification Engine (XP progression, 8 ranks, streaks, badges)    │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Core Dependencies & Libraries
| Package | Version | Purpose in Project |
| :--- | :--- | :--- |
| **`react` / `react-dom`** | `^19.2.0` | Latest React runtime powering component tree, hooks, and Concurrent features. |
| **`react-router`** | `^8.5.0` | Client-side routing between Home (`/`) and Stress Relief simulator (`/stress-relief`). |
| **`three` / `@types/three`** | `^0.187.0` | High-performance WebGL graphics for the 3D astronaut suit and space chase game. |
| **`framer-motion` / `motion`**| `^14.14.0` | Declarative UI animations, tab transitions, and card entrance choreography. |
| **`gsap` / `@gsap/react`** | `^3.15.1` | Precision cinematic camera tweens and ambient visual ring animations. |
| **`@supabase/supabase-js`** | `^2.119.0`| Remote cloud persistence, PostgreSQL synchronization, and realtime broadcast subscriptions. |
| **`tailwindcss`** | `^4.3.0` | Next-generation Tailwind CSS styling with custom theme definitions. |
| **`lucide-react`** | `^1.60.0` | Modern SVG icons for telemetry, status badges, and HUD navigation. |
| **`@fortawesome/*`** | `^3.5.0` | Specialized medical and anatomical iconography (heart, lungs, droplet, brain, etc.). |

---

## 3. Design System & Theme Analysis ("Deep Space HUD / Solo Leveling")

The visual styling is heavily inspired by futuristic spacecraft heads-up displays (HUD), cyberpunk command consoles, and glowing sci-fi system screens ("Solo Leveling" / high-tech gamer aesthetic).

### 3.1 Atmospheric Color Tokens
```css
--void:        #030509;  /* Primary background: near-absolute black space void */
--obsidian:    #080c14;  /* Elevated panel backdrops & card containers */
--panel:       #0d1322;  /* Interactive HUD card background with 82-85% alpha */
--panelHover:  #131c31;  /* High-contrast hover state */
```

### 3.2 Neon Cyberpunk Accents & Glows
* **Primary Cyan Glow (`#00f3ff`):** Represents optimal telemetry, operational links, and high-tech interface borders (`box-shadow: 0 0 20px rgba(0,243,255,0.15), inset 0 0 15px rgba(0,243,255,0.15)`).
* **Warning Amber Glow (`#fbbf24` / `#f59e0b`):** Indicates physiological metrics entering the caution zone.
* **Emergency Red Glow (`#ef4444`):** Flags critical deviations requiring immediate astronaut countermeasure execution.
* **Psionic Purple Glow (`#a855f7`):** Applied to neurological and psychological/mood tracking.

### 3.3 Visual Texture & Cockpit Immersion
1. **Scanline Overlay:** An ultra-subtle 4px linear gradient (`linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(0,243,255,0.018) 100%)`) fixed over the viewport to mimic spacecraft helmet visors or CRT cockpit displays.
2. **Radial Nebula Lighting:** Multi-point radial gradients simulating ambient light from distant nebulae and cockpit consoles.
3. **Corner Accents (`SciBox`):** Distinctive 7×7px geometric corner lines (`border-t border-l`, `border-b border-r`) framing every module.
4. **Noise Texture:** Subtle SVG turbulence overlay providing physical tactile grain to the glass panels.

### 3.4 Typography Hierarchy
* **HUD Data & Numbers:** `Orbitron` (`font-orbitron`, 500-900 weight) — used for vitals values, ranks, XP, and badges.
* **Telemetry Codes & Units:** `JetBrains Mono` / `Fira Code` — used for status chips, normal ranges, timestamps, and parameters.
* **Readability & Content:** `Inter` — used for clinical descriptions, countermeasure steps, and educational text.

---

## 4. Telemetry Indicators, Medical Baselines & Data Architecture

The application monitors **8 core biometrics** grounded in aerospace medicine, each mapped to specific normal, caution, and critical thresholds (`src/content.ts`):

| Indicator ID | Display Name | Unit | Normal Range | Caution Range | Critical Range | Color Coding | Spaceflight Clinical Context |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `heart-rate` | Heart Rate | `bpm` | 55 – 75 | 76 – 100 | > 100 or < 45 | Crimson (`#ef4444`) | Microgravity induces cephalad fluid shifts, altering cardiac stroke volume and causing orthostatic intolerance upon return. |
| `blood-pressure` | Blood Pressure | `mmHg` | 110 – 130 | 131 – 145 | > 146 or < 85 | Orange (`#f97316`) | Microgravity removes gravitational hydrostatic gradients; blood pressure drops during long flight, but spikes during acute EVA stress. |
| `blood-sugar` | Blood Glucose | `mg/dL` | 70 – 100 | 101 – 125 | > 126 or < 69 | Amber (`#eab308`) | Altered insulin sensitivity and reliance on shelf-stable, rehydrated carbohydrates affect metabolic balance. |
| `body-temp` | Body Temperature | `°C` | 36.1 – 37.2 | 37.3 – 38.0 | > 38.1 or < 35.0 | Red (`#ef4444`) | Closed vehicle ecosystems enable rapid microbial transmission; immune dysregulation in space makes fevers dangerous. |
| `sleep-hours` | Sleep Duration | `hours` | 7.0 – 9.0 | 5.0 – 6.9 | < 5.0 or > 9.1 | Purple (`#8b5cf6`) | Circadian rhythm disruption (16 sunrises/day on ISS), noise, and microgravity sleep posture lead to chronic sleep debt (ARCHeR study). |
| `mood` | Mood Rating | `/10` | 6 – 10 | 3 – 5 | 0 – 2 | Pink (`#ec4899`) | Confinement, isolation, sensory monotony, and comms delay trigger behavioral health risks. |
| `oxygen-sat` | Oxygen Saturation | `% SpO2` | 95 – 100 | 91 – 94 | <= 90 | Cyan (`#06b6d4`) | Monitors lung function and helps identify spacecraft cabin CO2 accumulation or EVA suit scrubber issues. |
| `hydration` | Hydration Level | `/10` | 7 – 10 | 4 – 6 | 0 – 3 | Blue (`#00f3ff`) | Microgravity blunts the thirst mechanism; reduced fluid intake combined with bone calcium demineralization drastically raises kidney stone risk. |

### 4.1 The 7 Body Systems
* **Cardiovascular** (`heart-rate`, `blood-pressure`, `oxygen-sat`)
* **Respiratory** (`oxygen-sat`, `heart-rate`)
* **Metabolic & Nutritional** (`blood-sugar`, `hydration`)
* **Neurological & Sensory** (`blood-pressure` — linked to SANS / Spaceflight Associated Neuroocular Syndrome)
* **Musculoskeletal** (Bone density and muscle mass, monitored via exercise countermeasure adherence)
* **Immune System** (`body-temp`)
* **Behavioral Health** (`mood`, `sleep-hours`)

### 4.2 The NASA 5 Hazards Framework
1. **Space Radiation** (Galactic Cosmic Rays & Solar Particle Events)
2. **Isolation & Confinement** (Psychological stress, sleep deprivation, team friction)
3. **Distance from Earth** (Autonomous medical care required due to comms delay)
4. **Gravity Fields** (Microgravity bone demineralization, muscle atrophy, fluid shift)
5. **Hostile / Closed Environments** (Air quality, CO2 toxicity, microbiome proliferation)

---

## 5. File-by-File & Component Breakdown

### 5.1 Root & Core Application Files
* **`index.html`:** Configures dark mode, PWA capabilities, and preconnects to Google Fonts (`Inter`, `JetBrains Mono`, `Orbitron`, `Space Grotesk`) and FontAwesome 6.5.2 CDN.
* **`src/main.tsx`:** Standard React 19 entry point mounting `<App />` into `#root`.
* **`src/App.tsx`:** Configures `BrowserRouter`, automatic scroll-to-top on route change, and routes for `/` (Home) and `/stress-relief` (Space Chase Simulator).
* **`src/styles.css`:** Core styling containing CSS custom properties, Tailwind CSS directives, glassmorphism utilities (`.glass`, `.sci-box`), status badges (`.badge-healthy`, `.badge-caution`, `.badge-critical`), and scanline effects.
* **`src/content.ts`:** Master dataset containing all mission copy (`ARCTURUS-7`), detailed indicator definitions, normal/caution/critical ranges, NASA hazards data, step-by-step action protocols, exercise regimens, nutrition recommendations, glossary terms, and gamification tiers.

### 5.2 Storage & Communication Layer (`src/lib/`)
* **`src/lib/types.ts`:** TypeScript interfaces for `ProfileData`, `StatsData`, `HealthReading`, and `PlayerData`.
* **`src/lib/storage.ts`:** Resilient `localStorage` wrapper safe from private browsing exceptions.
* **`src/lib/supabase.ts`:** Supabase client initialization reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, gracefully defaulting to offline mode if unconfigured.
* **`src/lib/data-service.ts`:** The primary telemetry orchestrator:
  - Implements offline-first caching via `localStorage` keys (`astra_profile`, `astra_stats`, `astra_readings`).
  - Fetches and stores readings (`getReadings`, `saveReading`, `getAllLocalReadings`).
  - Subscribes to Supabase Realtime Channels (`subscribeToReadings`, `subscribeToStats`, `subscribeToProfile`) for live multi-user ground telemetry syncing.
  - Manages gamification logic (`calculateXpGain`, `checkAndAwardBadges`).
  - Batch synchronizes local readings to Supabase on reconnection (`syncAllDataToSupabase`).

### 5.3 User Interface Pages (`src/pages/`)
* **`src/pages/Home.tsx`:** The central cockpit dashboard (1,754 lines). Houses 5 tab views:
  1. `dashboard`: Main telemetry view with Commander level/XP bar, quick vitals, interactive 3D astronaut canvas, selected body system panel, and 8 indicator cards.
  2. `body`: Dedicated 3D Anatomical Explorer with skin variant switcher (`astronaut`, `rust_space_suit`, `employee`) and clickable body systems.
  3. `actions`: Complete countermeasure execution protocols (elevated HR, high BP, fever, mood drop, exercise, hydration).
  4. `education`: Tabbed medical reference covering indicators, 5 hazards, medical glossary (SANS, DEXA, etc.), exercise library, and nutrition.
  5. `profile`: Astronaut credentials, XP rank progression (Cadet → Legend), streak tracking, unlocked badges, and daily check-in checklist.
* **`src/pages/StressRelief.tsx`:** Host page for the WebGL space combat flight simulator used as a psychological countermeasure for crew decompression.

### 5.4 Specialized Interactive Components (`src/components/`)
* **`src/components/ThreeScene.tsx`:** Three.js 3D viewport loading astronaut GLTF models, setting up camera orbit controls, shadow maps, and directional lighting. Supports raycasting to detect clicks on astronaut regions (head, chest, lungs, limbs) to focus on respective body systems.
* **`src/components/SpaceChaseGame.tsx` & `src/game/SpaceChaseEngine.ts`:** Full 3D space flight simulator written from scratch in Three.js with custom procedural particle engines, inertia flight physics, and real-time synthesized audio via Web Audio API (`src/game/audio.ts`).
* **`src/components/IndicatorCard.tsx`:** An earlier isolated indicator card with circular SVG `HealthRing`, trend indicators, and inline input.
* **`src/components/Modal.tsx`:** Accessible modal dialog with focus trapping and ESC-key dismissal.

---

## 6. Deep Gap Analysis: Current State vs. Requested Feature

The user's goal:
> *"daily entering the datas and also can able to see the things i mean for eg blood pressure its in home page its for today so i have to do that when i click there i can see all the old things i means prevoious things and datas and a graph and all the analysis"*

### 6.1 Current Limitations in the Codebase

| Area | Current Implementation | Gap & Required Feature |
| :--- | :--- | :--- |
| **Card Interactivity** | Indicator cards on the Dashboard are purely static cards with a "Log [Metric]" button. Clicking the card does nothing. | **Missing Drill-Down Trigger:** Clicking anywhere on an indicator card (or clicking its value / title) should open an extensive Metric Analytics & History modal or drawer. |
| **Data History Visibility** | History is stored in `localStorage` (`astra_readings`), but the card only renders the **single latest value** and a tiny 7-point SVG line. Astronauts cannot see previous days or past records. | **Missing Historical Log Table / Feed:** Need a chronological log view showing every past entry: Date, Time, Logged Value, Status, and optional clinical notes. |
| **Visual Charting / Graph** | Only an inline 70×28px `<MiniSparkline>` polyline without axes, timestamps, numbers, tooltips, or threshold zones. | **Missing Interactive Time-Series Chart:** Need an expanded, interactive chart (Line/Area graph) showing trends over 7 days, 14 days, 30 days, or mission-wide, complete with colored reference bands (Normal, Caution, Critical) and hover tooltips. |
| **Clinical Analysis & Insights** | Only displays a simple difference between the last two readings (`hist[0].value - hist[1].value`). | **Missing Statistical & Spaceflight Analysis Engine:**<br>• 7-day & 30-day moving averages<br>• Minimum & Maximum peak values<br>• Stability / Variability Index<br>• Microgravity clinical risk assessment (e.g. SANS risk for blood pressure)<br>• Automated recommendations based on trends. |
| **Daily Data Entry Flow** | Entering data currently requires opening inline numeric inputs on cards one by one. | **Missing Unified "Daily Check-in / Log Today's Vitals" Wizard:** Astronauts need a dedicated, streamlined modal/flow to log all daily indicators at once for their daily routine, earning the "Full Panel" badge (+25 XP) and updating their streak. |
| **Blood Pressure Representation** | Blood pressure is modeled as a single scalar number (`normalRange: [110, 130]`). In clinical reality, blood pressure consists of **Systolic / Diastolic** (e.g., 120 / 80 mmHg). | **Opportunity for High-Fidelity BP:** Provide dual input (Systolic & Diastolic) with automated Mean Arterial Pressure (MAP) computation while preserving backwards compatibility. |

---

## 7. Recommended Feature Architecture & Blueprint

### 7.1 Architecture of the New Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD USER ACTIONS                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│   A. Click "Daily Check-in"      │   B. Click Any Indicator Card       │
│      (Header / Action Bar)       │      (e.g., Blood Pressure)         │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│     DAILY LOGGING WIZARD         │ │   INDICATOR ANALYTICS MODAL       │
│  • Quick multi-metric form       │ │  • Today's Reading & Status Badge │
│  • Pre-filled with yesterday     │ │  • Interactive Time-Series Chart  │
│  • Range validation & slider/num │ │    (7D / 14D / 30D / All)         │
│  • Notes & symptoms per metric   │ │  • Physiological Reference Zones  │
│  • One-click "Log All Today"     │ │  • Statistical Summary (Avg, Min) │
│  • Awards XP & Check-in Streak   │ │  • Spaceflight Clinical Analysis  │
│                                  │ │  • Complete Historical Log Table  │
│                                  │ │  • Add / Edit / Delete Past Logs  │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

### 7.2 Component Blueprint: `<IndicatorDetailModal />`
When clicking any indicator (such as Blood Pressure, Heart Rate, SpO2, etc.):
1. **Header HUD Bar:**
   - Metric Name, Anatomical Icon, Associated Hazard tags, and Current Status Badge (`OPTIMAL`, `CAUTION`, `CRITICAL`).
   - Time of last reading (e.g., *"Today at 08:30 station time"*).
2. **Interactive Trend Graph:**
   - Visualizing time on the X-axis and metric values on the Y-axis.
   - Shaded horizontal threshold zones:
     - **Green band:** Normal physiological range (e.g., 110–130 mmHg).
     - **Amber band:** Caution zone (e.g., 131–145 mmHg).
     - **Red band:** Critical alert zone (>146 mmHg).
   - Time range selector: **7 Days**, **14 Days**, **30 Days**, **All-time**.
   - Interactive data points with hover tooltips displaying date, time, exact value, and notes.
3. **Statistical & Deep Space Analysis Matrix:**
   - **Current:** Latest logged value.
   - **7-Day Mean:** Moving average showing baseline drift.
   - **Peak Min / Max:** Extreme readings recorded during the selected window.
   - **Variability Score:** Standard deviation or stability indicator.
   - **Aerospace Clinical Impact:** Plain-language medical summary explaining why this metric matters in microgravity (e.g., *"Elevated BP combined with microgravity fluid shifts increases cephalad intracranial pressure, compounding SANS risk"*).
4. **Historical Data Log Table:**
   - Clean, searchable tabular list of all past readings.
   - Columns: Date & Time, Logged Value, Status Badge, Notes, Actions (Delete / Edit).
   - Ability to add a historical reading for a past date if an astronaut missed logging yesterday.

### 7.3 Component Blueprint: `<DailyCheckinModal />`
A unified daily routine modal accessible from a prominent glowing button on the dashboard:
1. Stepped or unified grid layout with all 8 indicators.
2. Direct input fields with quick +/- increment buttons and preset slider controls.
3. Live validation feedback showing whether entered values fall in Normal, Caution, or Critical range before saving.
4. "Save Daily Check-in" button that writes all readings, calculates streaks, awards +25 XP, and triggers a congratulatory HUD toast animation.

---

## 8. Implementation Plan & Proposed Phases

### Phase 1: Data Model & Service Enhancements
- Expand `Reading` type in `src/content.ts` and `src/lib/types.ts` to support optional metadata (e.g., `systolic` + `diastolic` for blood pressure, or formatted strings).
- Ensure existing readings in `localStorage` and Supabase remain 100% backwards-compatible.
- Add utility functions in `data-service.ts` to calculate statistical analytics:
  - `calculateStats(readings: Reading[])`: returns `average`, `min`, `max`, `stdDev`, `trendDirection`.
  - `generateSampleHistoryIfEmpty()`: optional helper so judges and users have rich 14-day historical curves out of the box when testing.

### Phase 2: Interactive Indicator Detail & Analytics Modal
- Build `<IndicatorDetailModal />` matching the project's exact Sci-Fi HUD theme (`SciBox`, Orbitron fonts, cyan glowing borders, scanlines).
- Implement the interactive SVG/Canvas Chart with:
  - Normal/Caution/Critical background threshold bands.
  - Smooth line curve with glowing data nodes.
  - Hover tooltip with timestamp, value, and notes.
  - 7D / 14D / 30D / All filter buttons.
- Implement the historical readings table with pagination/scroll and delete entry option.
- Implement deep space clinical analysis breakdown with NASA hazard correlation.

### Phase 3: Daily Data Entry Modal / Flow
- Build `<DailyCheckinModal />` allowing astronauts to enter all 8 vitals for "Today" in one quick screen.
- Wire into the gamification engine (+25 XP for Full Panel, streak increments, and badge evaluation).

### Phase 4: Integration into `Home.tsx` & Verification
- Make indicator cards clickable with clear hover affordance (`cursor-pointer`, cyan border highlight, "Click to view history & graph" tooltip).
- Add "Daily Check-in" quick-launch action button in the Dashboard header.
- Test thoroughly on desktop and mobile viewports.

---

## 9. Recent Deliverables & Implemented Upgrades

### 9.1 Physiological Issue Alert System (NASA Microgravity Telemetry)
- **Global Dashboard Alert Banner (`Home.tsx`):**
  - Evaluates current readings against NASA physiological hazard thresholds.
  - When any indicator enters Caution or Critical (e.g., Hypotension `< 85 mmHg`, Hypertension `> 145 mmHg`, Hypoxia `SpO2 <= 90%`, Tachycardia `> 100 bpm`, Hyperthermia `> 37.2 °C`, Dehydration `< 7/10`), an urgent animated HUD banner appears.
  - Direct diagnostic message explaining microgravity physiological etiology (e.g. upward fluid shifts, orthostatic syncope risks, SANS intracranial hypertension).
  - One-click shortcut button: `VIEW GRAPH & COUNTERMEASURES` to open the full modal.
- **Indicator Detail Modal Alert Card (`IndicatorDetailModal.tsx`):**
  - High-visibility red/amber card displaying diagnostic code `REF: AST-PHY-[ID]`.
  - Explains clinical risks, microgravity context, and links directly to emergency countermeasures and exercise protocols.

### 9.2 Chart.js Interactive Neon HUD Analytics (`IndicatorChart.tsx`)
- Powered by `chart.js` (`^4.x`) and `react-chartjs-2` (`^5.x`).
- Spline curves (`tension: 0.35`) with dynamic canvas gradient fills.
- Normal physiological limit dashed threshold lines (`borderDash: [5, 5]`) for instant zone reference.
- Custom HUD tooltip with sol telemetry timestamp, value formatting, and status badges (`[OPTIMAL]`, `[CAUTION]`, `[CRITICAL ALERT]`).
- Time range filtering (`7d`, `14d`, `30d`, `all`).

### 9.3 Authentic Sci-Fi Flight Simulation Loading Screen (`FlightLoadingScreen.tsx`)
- Located at `/stress-relief` during 3D asset initialization.
- Replaced basic CSS spinner with a full NASA flight simulator pre-flight calibration sequence:
  - Concentric rotating gyroscopic reticle with crosshairs and pulse animation.
  - Real byte-level GLTF model streaming progress via `GLTFLoader` callbacks.
  - Streaming diagnostic telemetry log terminal (`SYS-01`, `VRAM-02`, `MESH-03`, `GPU-04`, `NAV-05`, `AUDIO-06`, `BIO-07`, `RDY-08`).
  - Rotating astronaut neuro-vestibular tips explaining flow state benefits and slow-motion dilation.
  - Real-time Sol clock and orbital mission parameters.

### 9.4 14-Day Sample Telemetry Seeding (`telemetry-utils.ts`)
- Automatically seeds 14 days of realistic flight telemetry for all 8 indicators on first launch.
- Provides manual "LOAD DEMO DATA" button in modal if history has fewer than 3 readings.
- Readings sorted newest-first so latest telemetry immediately populates dashboard cards.

