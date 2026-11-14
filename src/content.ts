// Space Health Monitor — all copy, indicators, hazards, and guidance
export const mission = {
  name: "ARCTURUS-7",
  callsign: "AUSTRALIS-4",
  environment: "ORBITAL STATION / L4 TRANSIT",
  cycle: "SOL 14 / MISSION DAY 218",
};

export const hazards = [
  {
    id: "radiation",
    name: "Space Radiation",
    tag: "HAZARD 01",
    summary:
      "Invisible high-energy particles penetrate shielding and damage DNA, raising long-term cancer risk and acute radiation sickness during solar particle events.",
    indicators: [
      "Blood cell counts (RBC, WBC, platelets)",
      "DNA damage biomarkers in blood/saliva",
      "Acute symptoms: nausea, fatigue, skin erythema",
    ],
    actions: [
      "Monitor cumulative dose badges daily",
      "During solar storms, move to shielded storm shelter",
      "Maintain hydration and antioxidant-rich nutrition",
      "Report acute symptoms to flight surgeon immediately",
    ],
    severity: "HIGH",
  },
  {
    id: "isolation",
    name: "Isolation & Confinement",
    tag: "HAZARD 02",
    summary:
      "Prolonged confinement in small groups far from Earth affects mood, sleep, team cohesion, and cognitive performance. Behavioral health is mission-critical.",
    indicators: [
      "Mood self-rating (1-10 daily)",
      "Sleep quality and duration",
      "Social interaction frequency",
      "Stress and irritability levels",
    ],
    actions: [
      "Complete daily mood and sleep check-ins",
      "Maintain private comms windows with family/psych support",
      "Use mindfulness/breathing exercises during high-stress periods",
      "Participate in group recreation and structured social time",
      "Report persistent low mood, anxiety, or sleep issues to crew psychologist",
    ],
    severity: "HIGH",
  },
  {
    id: "distance",
    name: "Distance from Earth",
    tag: "HAZARD 03",
    summary:
      "As missions go deeper, real-time ground support disappears. Communication delays reach 20+ minutes one-way to Mars. Crew must handle medical and technical emergencies autonomously.",
    indicators: [
      "Crew self-sufficiency in medical procedures",
      "Availability of onboard medical supplies and diagnostics",
      "Time-to-response for simulated emergency scenarios",
    ],
    actions: [
      "Train on onboard medical kit and diagnostic tools",
      "Practice autonomous emergency protocols regularly",
      "Keep health log current for ground consultation when delay permits",
      "Cross-train crew on critical procedures",
    ],
    severity: "MEDIUM",
  },
  {
    id: "gravity",
    name: "Gravity Fields",
    tag: "HAZARD 04",
    summary:
      "Transitions between microgravity, partial gravity (Moon 0.16g, Mars 0.38g), and Earth gravity affect bones, muscles, cardiovascular system, fluid distribution, and vestibular function.",
    indicators: [
      "Bone density markers (DEXA-equivalent scans when available)",
      "Muscle mass and strength metrics",
      "Cardiovascular: blood pressure, heart rate, orthostatic response",
      "Visual changes (SANS — Spaceflight Associated Neuroocular Syndrome)",
      "Fluid shift markers: facial swelling, leg volume",
    ],
    actions: [
      "Perform 2+ hours of exercise daily (resistive + aerobic)",
      "Monitor blood pressure and heart rate daily",
      "Report vision changes, headaches, or optic disc swelling",
      "Maintain adequate calcium, vitamin D, and protein intake",
      "Use thigh cuffs or lower body negative pressure if prescribed",
    ],
    severity: "HIGH",
  },
  {
    id: "closed",
    name: "Hostile / Closed Environment",
    tag: "HAZARD 05",
    summary:
      "A closed spacecraft ecosystem must maintain safe temperature, pressure, air quality, water, and microbial balance. Immune function changes in space increase infection risk.",
    indicators: [
      "Body temperature",
      "Immune markers (if lab available): white blood cell count",
      "respiratory rate, cough, sore throat symptoms",
      "Skin condition, rashes, wound healing",
      "Air quality and CO2 levels (crew perception of stuffiness/headache)",
    ],
    actions: [
      "Report fever, persistent cough, or unusual fatigue",
      "Maintain hygiene and cleaning routines",
      "Monitor onboard environmental sensors",
      "Report any skin lesions or slow wound healing",
      "Stay current with vaccinations and prophylactic measures",
    ],
    severity: "MEDIUM",
  },
];

export const indicators = [
  {
    id: "heart-rate",
    name: "Heart Rate",
    unit: "bpm",
    normalRange: [55, 75],
    cautionRange: [76, 100],
    criticalRange: [101, 999],
    lowCritical: [0, 45],
    description:
      "Resting heart rate reflects cardiovascular strain. In microgravity, cardiac output changes and orthostatic intolerance can develop.",
    measurement: "Measure pulse at radial artery for 30 seconds (multiply by 2) or use wrist actigraphy device.",
    spaceContext:
      "In space, resting HR may initially rise due to fluid shifts, then decrease as the heart adapts. Post-flight orthostatic tachycardia is common.",
    hazardLinks: ["gravity", "radiation"],
    color: "blue",
  },
  {
    id: "blood-pressure",
    name: "Blood Pressure",
    unit: "mmHg",
    format: (v: number) => `${Math.round(v)} mmHg`,
    normalRange: [110, 130],
    cautionRange: [131, 145],
    criticalRange: [146, 999],
    lowCritical: [0, 85],
    description:
      "Blood pressure can drop in microgravity due to fluid shifts, then rebound post-flight. Hypertension during mission may signal stress or other issues.",
    measurement: "Use automated upper-arm cuff. Rest 5 minutes before measurement. Take 3 readings 1 minute apart; record average.",
    spaceContext:
      "Astronauts experience reduced diastolic pressure in flight. Post-flight, some develop orthostatic hypotension — fainting upon standing.",
    hazardLinks: ["gravity", "closed"],
    color: "red",
  },
  {
    id: "blood-sugar",
    name: "Blood Glucose",
    unit: "mg/dL",
    normalRange: [70, 100],
    cautionRange: [101, 125],
    criticalRange: [126, 999],
    lowCritical: [0, 69],
    description:
      "Blood sugar reflects metabolic health and nutrition. In space, insulin sensitivity can change, and meal timing is irregular.",
    measurement: "Finger-prick glucometer: clean site with alcohol, lance side of fingertip, apply blood to strip, read result.",
    spaceContext:
      "Astronauts may experience altered glucose metabolism. Limited fresh food and reliance on shelf-stable meals can affect glycemic control.",
    hazardLinks: ["radiation", "closed"],
    color: "amber",
  },
  {
    id: "body-temp",
    name: "Body Temperature",
    unit: "°C",
    normalRange: [36.1, 37.2],
    cautionRange: [37.3, 38.0],
    criticalRange: [38.1, 999],
    lowCritical: [0, 35.0],
    description:
      "Body temperature indicates infection, inflammation, or environmental stress. Slight circadian variation is normal.",
    measurement: "Use oral, tympanic, or temporal artery thermometer. For oral: place under tongue, close mouth, wait for beep.",
    spaceContext:
      "In closed environments, infections can spread quickly. Elevated temperature may be the first sign of illness in an immune-changed astronaut.",
    hazardLinks: ["closed", "radiation"],
    color: "red",
  },
  {
    id: "sleep-hours",
    name: "Sleep Duration",
    unit: "hours",
    normalRange: [7, 9],
    cautionRange: [5, 6.9],
    criticalRange: [0, 4.9],
    lowCritical: [9.1, 999],
    description:
      "Sleep is foundational for physical recovery, cognitive performance, and emotional regulation. Space insomnia is extremely common.",
    measurement: "Self-report hours slept in last 24h. Optionally use actigraphy wrist device that tracks motion and light exposure.",
    spaceContext:
      "On the ISS, astronauts average ~6 hours of sleep despite 8.5-hour scheduled windows. Noise, light, discomfort, and circadian disruption all contribute. The Artemis II ARCHeR study uses wrist actigraphy to track this.",
    hazardLinks: ["isolation", "gravity"],
    color: "violet",
  },
  {
    id: "mood",
    name: "Mood Rating",
    unit: "/10",
    normalRange: [6, 10],
    cautionRange: [3, 5],
    criticalRange: [0, 2],
    lowCritical: [0, 2],
    description:
      "Self-rated mood captures behavioral health status. Persistent low mood, anxiety, or irritability can signal depression, cabin fever, or crew conflict.",
    measurement: "Rate your overall mood right now on a scale of 0 (very low) to 10 (excellent). Be honest — this is for your health.",
    spaceContext:
      "Isolation, confinement, distance from family, and high-stakes work create chronic stressors. Behavioral health issues are among the top risks for long-duration missions. Regular mood tracking enables early intervention.",
    hazardLinks: ["isolation", "distance"],
    color: "violet",
  },
  {
    id: "oxygen-sat",
    name: "Oxygen Saturation",
    unit: "% SpO2",
    normalRange: [95, 100],
    cautionRange: [91, 94],
    criticalRange: [0, 90],
    lowCritical: [0, 90],
    description:
      "Blood oxygen saturation indicates respiratory and circulatory function. Low SpO2 can signal respiratory infection, pulmonary issue, or environmental problem.",
    measurement: "Place pulse oximeter on finger (warm hands give better readings). Keep still and wait 30 seconds for stable reading.",
    spaceContext:
      "In a closed environment, CO2 buildup can cause headaches and reduced cognition. SpO2 monitoring helps distinguish environmental from medical causes of symptoms.",
    hazardLinks: ["closed", "gravity"],
    color: "cyan",
  },
  {
    id: "hydration",
    name: "Hydration Level",
    unit: "/10",
    normalRange: [7, 10],
    cautionRange: [4, 6],
    criticalRange: [0, 3],
    lowCritical: [0, 3],
    description:
      "Hydration affects cognitive function, kidney health, cardiovascular strain, and thermoregulation. In space, the thirst mechanism is blunted.",
    measurement: "Self-assess: How thirsty do you feel? What color is your urine? (Pale straw = good, dark yellow = dehydrated). Estimate water intake today.",
    spaceContext:
      "Astronauts often under-drink because microgravity disrupts fluid distribution and the thirst response. Dehydration increases kidney stone risk, which is already elevated in space due to bone calcium loss.",
    hazardLinks: ["gravity", "closed"],
    color: "blue",
  },
];

export const bodySystems = [
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    icon: "heart",
    description:
      "Heart, blood vessels, and circulation. In microgravity, blood shifts upward, the heart changes shape, and post-flight orthostatic intolerance is common.",
    indicators: ["heart-rate", "blood-pressure", "oxygen-sat"],
    hazards: ["gravity", "radiation"],
    color: "#ef4444",
  },
  {
    id: "respiratory",
    name: "Respiratory",
    icon: "lungs",
    description:
      "Lungs and breathing. Closed environment CO2 levels can affect cognition. Radiation exposure may increase long-term lung cancer risk.",
    indicators: ["oxygen-sat", "heart-rate"],
    hazards: ["closed", "radiation"],
    color: "#f97316",
  },
  {
    id: "metabolic",
    name: "Metabolic & Nutritional",
    icon: "flask",
    description:
      "Blood sugar, hydration, and nutrition. Limited fresh food and altered metabolism in space require careful monitoring.",
    indicators: ["blood-sugar", "hydration"],
    hazards: ["radiation", "closed"],
    color: "#eab308",
  },
  {
    id: "neurological",
    name: "Neurological & Sensory",
    icon: "brain",
    description:
      "Brain, vision, and vestibular system. Fluid shifts toward the head can cause SANS — vision changes, optic disc swelling, and increased intracranial pressure.",
    indicators: ["blood-pressure"],
    hazards: ["gravity", "radiation"],
    color: "#8b5cf6",
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal",
    icon: "bone",
    description:
      "Bones and muscles. Without gravity loading, astronauts lose 1-2% bone density per month and significant muscle mass. Exercise is the primary countermeasure.",
    indicators: [],
    hazards: ["gravity"],
    color: "#06b6d4",
  },
  {
    id: "immune",
    name: "Immune System",
    icon: "shield",
    description:
      "Immune function is altered in space — some immune cells become less effective while others overreact. Latent viruses can reactivate. Closed environment increases infection transmission risk.",
    indicators: ["body-temp"],
    hazards: ["radiation", "closed", "isolation"],
    color: "#10b981",
  },
  {
    id: "behavioral",
    name: "Behavioral Health",
    icon: "head",
    description:
      "Mood, sleep, cognition, and team dynamics. Isolation, confinement, and distance from Earth create chronic psychological stressors.",
    indicators: ["mood", "sleep-hours"],
    hazards: ["isolation", "distance", "closed"],
    color: "#ec4899",
  },
];

export type Reading = {
  indicatorId: string;
  value: number;
  timestamp: number;
  notes?: string;
};

export type Contributor = {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

export const contributors: Contributor[] = [
  {
    id: "nasa-hrp",
    name: "NASA Human Research Program",
    role: "Risk Framework",
    quote:
      "The five hazards of human spaceflight — space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments — form the basis for understanding astronaut health risks.",
    avatar: "nasa",
  },
  {
    id: "artemis-ii",
    name: "Artemis II Standard Measures",
    role: "Mission Data",
    quote:
      "Crew members supply a consistent set of physiological and psychological measurements so future researchers can learn more about astronaut health in deep space.",
    avatar: "artemis",
  },
  {
    id: "ARCHeR",
    name: "ARCHeR Study",
    role: "Actigraphy & Sleep",
    quote:
      "The actigraphy device worn on the wrist measures motion, sleep patterns, and light exposure — providing continuous data on crew well-being during the lunar flyby.",
    avatar: "archer",
  },
];

export const tips = [
  {
    id: "t1",
    title: "Log Daily, Even When You Feel Fine",
    body:
      "Consistent daily logging builds the trend data that makes problems visible early. A single reading means little; a pattern over days tells the story.",
  },
  {
    id: "t2",
    title: "Know Your Baseline",
    body:
      "Your normal ranges may differ from the general population. Pay attention to deviations from YOUR normal, not just whether you're inside a generic range.",
  },
  {
    id: "t3",
    title: "Combine Indicators",
    body:
      "Elevated heart rate + low mood + poor sleep together tell a different story than any one alone. Patterns across systems are more informative than single readings.",
  },
  {
    id: "t4",
    title: "Don't Wait for Critical",
    body:
      "Acting when a reading enters the caution zone prevents many critical situations. If something trends wrong for 2-3 days, mention it to crew medical even if it hasn't crossed the critical threshold.",
  },
  {
    id: "t5",
    title: "Context Matters",
    body:
      "A high heart rate after exercise is normal. A high heart rate at rest during a high-stress event needs attention. Always note what was happening when you took the reading.",
  },
];

export const actionLibrary = [
  {
    id: "a1",
    title: "Daily Health Check-In Routine",
    description:
      "Complete all indicator measurements each day. Takes approximately 10-15 minutes. Consistency matters more than perfection.",
    steps: [
      "Measure resting heart rate before getting out of sleep station",
      "Take blood pressure after resting 5 minutes",
      "Check blood glucose before or after a meal (consistent timing)",
      "Record body temperature if feeling unwell",
      "Log sleep hours from previous night",
      "Rate your mood honestly",
      "Record oxygen saturation if you have a pulse oximeter",
      "Assess hydration level",
    ],
    indicators: ["heart-rate", "blood-pressure", "blood-sugar", "body-temp", "sleep-hours", "mood", "oxygen-sat", "hydration"],
  },
  {
    id: "a2",
    title: "When Heart Rate Is Elevated",
    description:
      "Resting heart rate above 100 bpm warrants attention. Here's what to do and when to escalate.",
    steps: [
      "Rest for 10 minutes in a quiet position and re-measure",
      "Consider recent activity, stress, caffeine, or dehydration",
      "If still elevated after rest: check blood pressure and oxygen saturation",
      "Note any accompanying symptoms: chest pain, shortness of breath, dizziness",
      "If >120 bpm at rest with symptoms: notify crew medical immediately",
      "If >100 bpm persisting >24 hours: report to crew medical",
    ],
    indicators: ["heart-rate"],
  },
  {
    id: "a3",
    title: "When Blood Pressure Is High",
    description:
      "Blood pressure consistently above 140/90 mmHg requires attention in the spaceflight context.",
    steps: [
      "Rest 10 minutes, then re-measure twice more",
      "Ensure cuff is at heart level and properly sized",
      "Check for symptoms: headache, visual changes, chest discomfort",
      "Review recent sodium intake and stress levels",
      "If >160/100 mmHg: notify crew medical immediately",
      "If >140/90 mmHg persisting: log and report at next opportunity",
    ],
    indicators: ["blood-pressure"],
  },
  {
    id: "a4",
    title: "When Body Temperature Is Elevated",
    description:
      "Fever in a closed spacecraft environment requires prompt attention due to infection risk and limited medical resources.",
    steps: [
      "Confirm with a second reading after 15 minutes",
      "Check for other symptoms: cough, sore throat, body aches, rash",
      "Increase fluid intake and rest",
      "Notify crew medical if temperature >38°C (100.4°F)",
      "If >39°C (102.2°F) or with severe symptoms: urgent medical notification",
      "Isolate from crew if infectious symptoms present, per protocol",
    ],
    indicators: ["body-temp"],
  },
  {
    id: "a5",
    title: "When Mood Is Low",
    description:
      "Persistent low mood is not a personal failure — it's a predictable response to the spaceflight environment. Early intervention helps.",
    steps: [
      "Acknowledge the feeling without judgment",
      "Check: has this been ongoing for more than 2 weeks?",
      "Increase social connection: talk with crewmates, schedule comms with family",
      "Engage in a valued activity or hobby onboard",
      "Practice grounding or breathing exercises (resources in the behavior health section)",
      "If mood <4/10 for >1 week, or any thoughts of self-harm: contact crew psychologist immediately",
      "Use the private psychological support channel if available",
    ],
    indicators: ["mood", "sleep-hours"],
  },
  {
    id: "a6",
    title: "Exercise Countermeasures",
    description:
      "Exercise is the primary defense against bone and muscle loss in microgravity. Current protocols require approximately 2.5 hours per day including setup.",
    steps: [
      "Complete resistive exercise (ARED or equivalent) 6 days/week — target all major muscle groups",
      "Perform aerobic exercise (CEVIS or T2 treadmill) for cardiovascular health",
      "Use the treadmill with harness loading to simulate weight-bearing",
      "Track your exercise sessions in the mission log",
      "Report any pain, strain, or unusual symptoms during exercise",
      "Maintain protein intake to support muscle maintenance",
    ],
    indicators: [],
  },
  {
    id: "a7",
    title: "Hydration Protocol",
    description:
      "In space, you need to consciously drink more water than your thirst tells you. Aim for 2-3 liters daily.",
    steps: [
      "Keep a water container accessible at your workstation",
      "Set reminders if needed — don't rely on thirst alone",
      "Monitor urine color: aim for pale straw",
      "Increase intake during exercise and hot periods",
      "If urine is dark for more than a day: increase fluids and notify crew medical",
      "Report any kidney stone symptoms (flank pain, blood in urine) immediately",
    ],
    indicators: ["hydration"],
  },
];

export const exerciseLibrary = [
  {
    id: "e1",
    name: "Resistive Exercise (ARED)",
    duration: "45-60 min",
    frequency: "6 days/week",
    bodyParts: ["musculoskeletal"],
    description:
      "Simulates free-weight exercises using vacuum cylinders. Target squats, deadlifts, bench press, rows, and heel raises.",
  },
  {
    id: "e2",
    name: "Treadmill (T2) with Harness",
    duration: "30-45 min",
    frequency: "5-6 days/week",
    bodyParts: ["cardiovascular", "musculoskeletal"],
    description:
      "Run or walk with bungee harness providing body-weight loading. Critical for bone density maintenance in legs and spine.",
  },
  {
    id: "e3",
    name: "Cycle Ergometer (CEVIS)",
    duration: "30 min",
    frequency: "3-5 days/week",
    bodyParts: ["cardiovascular"],
    description:
      "Aerobic cycling for cardiovascular fitness. Can be done at various intensities from steady-state to interval training.",
  },
  {
    id: "e4",
    name: "Advanced Resistive Exercise Device (ARED) — Upper Body",
    duration: "30-40 min",
    frequency: "3 days/week",
    bodyParts: ["musculoskeletal"],
    description:
      "Focused upper body routine: bench press, seated row, bicep curls, tricep extensions to maintain upper body strength.",
  },
];

export const nutritionTips = [
  {
    id: "n1",
    title: "Calcium & Vitamin D",
    body:
      "Bone loss in space increases calcium in urine, raising kidney stone risk. Ensure adequate calcium intake (1000-1200 mg/day) and vitamin D supplementation as directed.",
  },
  {
    id: "n2",
    title: "Protein Intake",
    body:
      "Maintain 1.2-1.6 g protein per kg body weight daily to support muscle maintenance during exercise. Distribute protein across meals.",
  },
  {
    id: "n3",
    title: "Antioxidants",
    body:
      "Space radiation increases oxidative stress. Colorful fruits and vegetables (even rehydrated), nuts, and supplements as directed provide antioxidants that may help.",
  },
  {
    id: "n4",
    title: "Hydration Strategy",
    body:
      "Drink water consistently throughout the day. Keep a water bag handy. Dehydration exacerbates constipation (common in space), kidney stone risk, and cognitive performance.",
  },
  {
    id: "n5",
    title: "Meal Timing",
    body:
      "Regular meal timing helps regulate metabolism and mood. Avoid large meals close to exercise or sleep periods. Consistent blood sugar supports stable energy and cognition.",
  },
];

export const glossary = [
  {
    term: "SANS",
    standsFor: "Spaceflight Associated Neuroocular Syndrome",
    definition:
      "A collection of vision and eye changes seen in some astronauts, including optic disc swelling, choroidal folds, and hyperopic shifts. Thought to be related to fluid shifts toward the head in microgravity.",
  },
  {
    term: "Orthostatic Intolerance",
    standsFor: "",
    definition:
      "Difficulty maintaining blood pressure when standing upright, causing dizziness or fainting. Common after spaceflight due to cardiovascular deconditioning and fluid shifts.",
  },
  {
    term: "Actigraphy",
    standsFor: "",
    definition:
      "A method of monitoring rest/activity cycles using a wrist-worn device that measures movement. The Artemis II crew will wear actigraphy devices to track sleep patterns and activity.",
  },
  {
    term: "DEXA",
    standsFor: "Dual-Energy X-ray Absorptiometry",
    definition:
      "A scan that measures bone mineral density. Changes in bone density are a key concern for long-duration spaceflight, with astronauts losing 1-2% per month in some skeletal regions.",
  },
  {
    term: "Radiation Dosage",
    standsFor: "",
    definition:
      "The amount of ionizing radiation absorbed by the body, measured in millisieverts (mSv) or milligrays (mGy). Astronauts wear dosimeters to track cumulative exposure.",
  },
];

export const gamification = {
  badges: [
    { id: "first-log", title: "First Log", description: "Complete your first health check-in", icon: "star" },
    { id: "week-streak", title: "One Week Strong", description: "7 consecutive days of check-ins", icon: "flame" },
    { id: "perfect-month", title: "Mission Month", description: "30 consecutive days of check-ins", icon: "trophy" },
    { id: "all-indicators", title: "Full Panel", description: "Log all 8 indicators in a single day", icon: "list-check" },
    { id: "early-bird", title: "Early Bird", description: "Complete check-in before 06:00 station time", icon: "sunrise" },
    { id: "streak-14", title: "Two Weeks", description: "14 consecutive days of check-ins", icon: "zap" },
    { id: "guardian", title: "Health Guardian", description: "Consistently log and maintain all indicators in healthy range for 30 days", icon: "shield" },
    { id: "explorer", title: "Deep Space Explorer", description: "Complete 100 total check-ins", icon: "rocket" },
  ],
  xpPerAction: {
    'daily-checkin': 10,
    'full-panel': 25,
    'early-bird': 15,
    'indicator-caution': 5,
    'indicator-critical': 0,
    'healthy-week': 50,
    'healthy-month': 200,
  },
  levels: [
    { level: 1, name: "Cadet", xpRequired: 0, color: "#6b7280" },
    { level: 2, name: "Scout", xpRequired: 100, color: "#3b82f6" },
    { level: 3, name: "Pilot", xpRequired: 250, color: "#8b5cf6" },
    { level: 4, name: "Navigator", xpRequired: 500, color: "#06b6d4" },
    { level: 5, name: "Commander", xpRequired: 1000, color: "#f59e0b" },
    { level: 6, name: "Veteran", xpRequired: 2000, color: "#ef4444" },
    { level: 7, name: "Guardian", xpRequired: 5000, color: "#10b981" },
    { level: 8, name: "Legend", xpRequired: 10000, color: "#ec4899" },
  ],
};
