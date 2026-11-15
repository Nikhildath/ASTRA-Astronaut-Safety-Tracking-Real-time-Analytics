import type { Reading, Indicator } from '../content';

/* ═══════════════════════════════════════════════════════════════════
   DEMO DATA GENERATOR
   ═══════════════════════════════════════════════════════════════════ */

export function generateDemoReadings(indicator: Indicator, days = 14): Reading[] {
  const readings: Reading[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let d = days - 1; d >= 0; d--) {
    let value: number;
    let notes: string | undefined = undefined;

    switch (indicator.id) {
      case 'heart-rate':
        value = 65 + Math.sin(d * 0.7) * 7 + (Math.random() - 0.5) * 4;
        if (d === 3) { value = 88; notes = 'Post-EVA high pulse rate'; }
        if (d === 8) { value = 59; notes = 'Morning resting baseline check'; }
        break;

      case 'blood-pressure':
        value = 122 + Math.cos(d * 0.6) * 6 + (Math.random() - 0.5) * 5;
        if (d === 2) { value = 136; notes = 'Post-exercise caution reading'; }
        if (d === 6) { value = 118; notes = 'Automated cuff rest check'; }
        if (d === 11) { value = 114; notes = 'Waking station check'; }
        break;

      case 'blood-sugar':
        value = 86 + Math.sin(d * 0.5) * 8 + (Math.random() - 0.5) * 6;
        if (d === 4) { value = 105; notes = 'Post-prandial meal spike'; }
        break;

      case 'body-temp':
        value = 36.6 + Math.cos(d * 0.6) * 0.3 + (Math.random() - 0.5) * 0.2;
        if (d === 5) { value = 37.4; notes = 'Mild temperature elevation after workout'; }
        break;

      case 'sleep-hours':
        value = 7.4 + Math.sin(d * 0.8) * 1.1 + (Math.random() - 0.5) * 0.5;
        if (d === 1) { value = 5.5; notes = 'Station orbital reboost noise disruption'; }
        if (d === 9) { value = 8.2; notes = 'Rest day extended sleep window'; }
        break;

      case 'mood':
        value = 7.6 + Math.cos(d * 0.5) * 1.2 + (Math.random() - 0.5) * 0.6;
        if (d === 6) { value = 5.0; notes = 'Fatigued after double shift'; }
        break;

      case 'oxygen-sat':
        value = 98 + Math.round((Math.random() - 0.5) * 2);
        if (d === 3) { value = 94; notes = 'Suit checkout low SpO2'; }
        break;

      case 'hydration':
        value = 8 + Math.round((Math.random() - 0.5) * 2);
        if (d === 2) { value = 5; notes = 'Missed hydration window during maintenance'; }
        break;

      default: {
        const mid = (indicator.normalRange[0] + indicator.normalRange[1]) / 2;
        value = mid + (Math.random() - 0.5) * 5;
      }
    }

    const decimals = indicator.unit === '°C' || indicator.unit === 'hours' ? 1 : 0;
    value = Math.round(value * (10 ** decimals)) / (10 ** decimals);

    readings.push({
      indicatorId: indicator.id,
      value,
      timestamp: now - d * dayMs + (Math.random() * 0.2 - 0.1) * dayMs,
      notes,
    });
  }

  // Return sorted newest first so readings[0] is the latest value for the dashboard
  return readings.sort((a, b) => b.timestamp - a.timestamp);
}

/* ═══════════════════════════════════════════════════════════════════
   CLINICAL ISSUE ALERT DIAGNOSTICS
   ═══════════════════════════════════════════════════════════════════ */

export function getSpecificIssueMessage(ind: Indicator, val: number | null): string {
  if (val === null) return 'No active reading recorded.';
  if (ind.id === 'blood-pressure') {
    if (val < ind.normalRange[0]) {
      return `CRITICAL HYPOTENSION ALERT (${val} mmHg): Blood pressure has dropped below safe operational limits. In microgravity, upward fluid redistribution reduces lower limb vascular resistance. This creates a severe risk of cerebral hypoperfusion, vestibular disorientation, and orthostatic syncope upon standing. Immediate fluid loading (0.5L isotonic rehydration) and adjustment of lower-body negative pressure (LBNP) or compression cuffs is recommended.`;
    }
    if (val > ind.normalRange[1]) {
      return `ELEVATED BLOOD PRESSURE (${val} mmHg): Systolic pressure exceeds the standard astronaut reference range. In microgravity, cephalad venous congestion raises intracranial pressure, accelerating Spaceflight Associated Neuroocular Syndrome (SANS), optic disc swelling, and choroidal folds. Cease high-resistance exercise immediately and check for excess dietary sodium.`;
    }
  }
  if (ind.id === 'heart-rate') {
    if (val > ind.normalRange[1]) {
      return `TACHYCARDIA ALERT (${val} bpm): Resting pulse is elevated above normal. Indicates acute cardiovascular strain, dehydration, or sustained sympathetic activation. Rest in a low-stimulus environment, rehydrate, and re-check in 15 minutes.`;
    }
    if (val < ind.normalRange[0]) {
      return `BRADYCARDIA WARNING (${val} bpm): Heart rate is below baseline. Monitor for lightheadedness, fatigue, or conductive anomalies.`;
    }
  }
  if (ind.id === 'oxygen-sat') {
    if (val <= 90) {
      return `CRITICAL HYPOXIA ALERT (${val}% SpO2): Peripheral blood oxygen saturation has dropped to dangerously low levels. Immediate inspection of the Environmental Control and Life Support System (ECLSS), cabin partial O2 pressure, and suit LiOH CO2 scrubbers is required.`;
    }
    if (val < 95) {
      return `REDUCED OXYGENATION (${val}% SpO2): Sub-optimal saturation. Check for cabin CO2 pocket accumulation or airway restriction.`;
    }
  }
  if (ind.id === 'body-temp') {
    if (val > ind.normalRange[1]) {
      return `PYREXIA / FEVER ALERT (${val} °C): Core temperature is elevated. Due to altered immune response and rapid bacterial propagation in closed spacecraft habitats, monitor for infectious symptoms and isolate from communal quarters.`;
    }
  }
  if (ind.id === 'hydration') {
    if (val < ind.normalRange[0]) {
      return `ACUTE DEHYDRATION ALERT (${val}/10): Microgravity blunts the physiological thirst mechanism. Combined with bone mineral loss and calcium leaching, dehydration drastically elevates the probability of acute renal calculi (kidney stones). Drink 500 mL water immediately.`;
    }
  }
  if (ind.id === 'sleep-hours') {
    if (val < ind.normalRange[0]) {
      return `NEURO-COGNITIVE SLEEP DEBT (${val} hrs): Severe sleep deficit recorded. On ISS and exploration missions, chronic sleep restriction degrades spatial orientation, psychomotor vigilance, and robotic arm operation safety. Schedule a 45-minute sleep countermeasure window.`;
    }
  }
  if (ind.id === 'mood') {
    if (val < ind.normalRange[0]) {
      return `BEHAVIORAL HEALTH ADVISORY (${val}/10): Self-reported mood has dipped into the caution zone. Prolonged confinement and 20-minute communication latency compound isolation stress. Engage with crew recreation or access the private psychological support channel.`;
    }
  }
  if (ind.id === 'blood-sugar') {
    if (val > ind.normalRange[1]) {
      return `METABOLIC GLYCEMIC SPIKE (${val} mg/dL): Elevated blood glucose. Review shelf-stable carbohydrate intake and ensure meal schedule consistency.`;
    }
    if (val < ind.normalRange[0]) {
      return `HYPOGLYCEMIA WARNING (${val} mg/dL): Low glucose. Consume a balanced protein/complex carb snack to maintain cognitive alertness.`;
    }
  }
  return `Telemetry indicator is outside optimal spaceflight physiological limits (${val} ${ind.unit}). Review countermeasure guidance below.`;
}

