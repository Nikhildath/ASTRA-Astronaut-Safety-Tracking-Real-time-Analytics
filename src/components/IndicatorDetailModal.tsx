'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, Minus, Clock, Calendar, Activity,
  AlertTriangle, Check, Dumbbell, Heart, Zap, Plus,
  BarChart3, FileText, Shield,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart, faLungs, faDroplet, faThermometerHalf, faMoon,
  faFaceSmile, faWater, faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { IndicatorChart } from './IndicatorChart';
import {
  indicators, actionLibrary, exerciseLibrary, hazards, bodySystems,
} from '../content';
import type { Reading } from '../content';
import { getSpecificIssueMessage } from '../utils/telemetry-utils';

/* ═══════════════════════════════════════════════════════════════════
   THEME TOKENS — mirrors Home.tsx HUD styling
   ═══════════════════════════════════════════════════════════════════ */

const C = {
  void: '#030509',
  obsidian: '#080c14',
  panel: '#0d1322',
  panelHover: '#131c31',
  cyan: '#00f3ff',
  cyanDim: 'rgba(0,243,255,0.6)',
  cyanGlow: 'rgba(0,243,255,0.15)',
  cyanBorder: 'rgba(0,243,255,0.3)',
  blue: '#0077b6',
  purple: '#a855f7',
  purpleGlow: 'rgba(168,85,247,0.15)',
  red: '#ef4444',
  redGlow: 'rgba(239,68,68,0.15)',
  green: '#22c55e',
  greenGlow: 'rgba(34,197,94,0.15)',
  amber: '#fbbf24',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
};

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

type TimeRange = '7d' | '14d' | '30d' | 'all';
type IndicatorDef = typeof indicators[number];
type HealthStatus = 'healthy' | 'caution' | 'critical';

interface IndicatorDetailModalProps {
  indicatorId: string;
  history: Reading[];
  currentValue: number | null;
  playerId?: string;
  onClose: () => void;
  onLogReading: (id: string, val: number, notes?: string) => void;
  onGenerateDemo: (indicatorId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function inRange(value: number, range: number[]): boolean {
  return value >= Math.min(...range) && value <= Math.max(...range);
}

function getStatus(val: number, ind: IndicatorDef): HealthStatus {
  if (inRange(val, ind.criticalRange) || inRange(val, ind.lowCritical)) return 'critical';
  if (inRange(val, ind.normalRange)) return 'healthy';
  return 'caution';
}

function getIndIcon(id: string) {
  const map: Record<string, typeof faHeart> = {
    'heart-rate': faHeart, 'blood-pressure': faHeart, 'blood-sugar': faDroplet,
    'body-temp': faThermometerHalf, 'sleep-hours': faMoon, 'mood': faFaceSmile,
    'oxygen-sat': faLungs, 'hydration': faWater,
  };
  return map[id] || faFlask;
}

function getIndColor(id: string): string {
  const map: Record<string, string> = {
    'heart-rate': '#ef4444', 'blood-pressure': '#f97316', 'blood-sugar': '#eab308',
    'body-temp': '#ef4444', 'sleep-hours': '#8b5cf6', 'mood': '#ec4899',
    'oxygen-sat': '#06b6d4', 'hydration': '#00f3ff',
  };
  return map[id] || C.cyan;
}

function statusColor(s: HealthStatus): string {
  return s === 'critical' ? C.red : s === 'caution' ? C.amber : C.green;
}

function statusLabel(s: HealthStatus): string {
  return s === 'critical' ? 'CRITICAL' : s === 'caution' ? 'CAUTION' : 'OPTIMAL';
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ═══════════════════════════════════════════════════════════════════
   STATISTICS ENGINE
   ═══════════════════════════════════════════════════════════════════ */

function computeStats(readings: Reading[], indicator: IndicatorDef) {
  if (readings.length === 0) return null;
  const chrono = [...readings].sort((a, b) => a.timestamp - b.timestamp);
  const values = chrono.map(r => r.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Trend: compare older half average to newer half average
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : avg;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : avg;
  const trendDelta = secondAvg - firstAvg;
  const trendDir: 'rising' | 'falling' | 'stable' =
    Math.abs(trendDelta) < (indicator.normalRange[1] - indicator.normalRange[0]) * 0.05
      ? 'stable'
      : trendDelta > 0 ? 'rising' : 'falling';

  // Count days in each status zone
  let normalCount = 0, cautionCount = 0, criticalCount = 0;
  values.forEach(v => {
    const s = getStatus(v, indicator);
    if (s === 'healthy') normalCount++;
    else if (s === 'caution') cautionCount++;
    else criticalCount++;
  });

  // 7-day moving average (from the 7 most recent readings)
  const recent7 = values.slice(-7);
  const avg7 = recent7.length > 0 ? recent7.reduce((a, b) => a + b, 0) / recent7.length : avg;

  return {
    avg: Math.round(avg * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    stdDev: Math.round(stdDev * 100) / 100,
    avg7: Math.round(avg7 * 10) / 10,
    trendDelta: Math.round(trendDelta * 10) / 10,
    trendDir,
    normalCount,
    cautionCount,
    criticalCount,
    totalReadings: readings.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   ACTION & EXERCISE MAPPING
   ═══════════════════════════════════════════════════════════════════ */

function getRelevantActions(indicatorId: string, _status: HealthStatus | null) {
  return actionLibrary.filter(a =>
    a.indicators.includes(indicatorId) && a.id !== 'a1'
  );
}

function getRelevantExercises(indicatorId: string) {
  const ind = indicators.find(i => i.id === indicatorId);
  if (!ind) return [];
  // Map indicator to body systems
  const systems = bodySystems.filter(s => s.indicators.includes(indicatorId));
  const bodyParts = systems.map(s => s.id);
  return exerciseLibrary.filter(e =>
    e.bodyParts.some(bp => bodyParts.includes(bp))
  );
}

function getLinkedHazards(indicatorId: string) {
  const ind = indicators.find(i => i.id === indicatorId);
  if (!ind) return [];
  return hazards.filter(h => ind.hazardLinks.includes(h.id));
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN MODAL COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function IndicatorDetailModal({
  indicatorId,
  history,
  currentValue,
  onClose,
  onLogReading,
  onGenerateDemo,
}: IndicatorDetailModalProps) {
  const indicator = indicators.find(i => i.id === indicatorId)!;
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDraft, setLogDraft] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 10;

  const color = getIndColor(indicatorId);
  const icon = getIndIcon(indicatorId);
  const currentStatus: HealthStatus | null = currentValue !== null ? getStatus(currentValue, indicator) : null;

  // Sort history newest first for the table
  const sortedHistory = useMemo(() =>
    [...history].sort((a, b) => b.timestamp - a.timestamp),
    [history]
  );

  // Stats from all readings
  const stats = useMemo(() => computeStats(history, indicator), [history, indicator]);

  // Relevant actions and exercises
  const relevantActions = useMemo(() => getRelevantActions(indicatorId, currentStatus), [indicatorId, currentStatus]);
  const relevantExercises = useMemo(() => getRelevantExercises(indicatorId), [indicatorId]);
  const linkedHazards = useMemo(() => getLinkedHazards(indicatorId), [indicatorId]);

  // Paginated history
  const totalPages = Math.ceil(sortedHistory.length / HISTORY_PAGE_SIZE);
  const pageHistory = sortedHistory.slice(
    historyPage * HISTORY_PAGE_SIZE,
    (historyPage + 1) * HISTORY_PAGE_SIZE
  );

  const handleLog = () => {
    const val = parseFloat(logDraft);
    if (!isNaN(val)) {
      onLogReading(indicatorId, val, logNotes || undefined);
      setLogDraft('');
      setLogNotes('');
      setShowLogForm(false);
    }
  };

  // Dynamic clinical risk assessment
  const riskAssessment = useMemo(() => {
    if (!stats || !currentStatus) return null;
    const lines: string[] = [];

    if (currentStatus === 'critical') {
      lines.push(`⚠️ ALERT: Current ${indicator.name} reading is in the CRITICAL zone. Immediate action recommended.`);
    } else if (currentStatus === 'caution') {
      lines.push(`⚡ Current ${indicator.name} is in the CAUTION zone. Monitor closely and consider countermeasures.`);
    } else {
      lines.push(`✅ Current ${indicator.name} is within the OPTIMAL range. Continue regular monitoring.`);
    }

    if (stats.trendDir === 'rising' && indicatorId !== 'mood' && indicatorId !== 'hydration') {
      lines.push(`📈 Trend is RISING (+${stats.trendDelta}). ${
        currentStatus !== 'healthy'
          ? 'Consider intervention to stabilize values.'
          : 'Values remain within normal limits but watch for continued increase.'
      }`);
    } else if (stats.trendDir === 'falling' && (indicatorId === 'mood' || indicatorId === 'hydration')) {
      lines.push(`📉 Trend is FALLING (${stats.trendDelta}). This requires attention as ${indicator.name.toLowerCase()} is decreasing.`);
    } else if (stats.trendDir === 'falling') {
      lines.push(`📉 Trend is FALLING (${stats.trendDelta}). ${
        indicatorId === 'blood-pressure' || indicatorId === 'heart-rate'
          ? 'Monitor for hypotension or bradycardia symptoms.'
          : 'Track closely for continued decline.'
      }`);
    }

    if (stats.criticalCount > 0) {
      lines.push(`🔴 ${stats.criticalCount} of ${stats.totalReadings} readings were in the CRITICAL zone (${Math.round((stats.criticalCount / stats.totalReadings) * 100)}%).`);
    }
    if (stats.cautionCount > stats.totalReadings * 0.3) {
      lines.push(`🟡 ${stats.cautionCount} of ${stats.totalReadings} readings were in the CAUTION zone. Consider adjusting routine.`);
    }
    if (stats.stdDev > (indicator.normalRange[1] - indicator.normalRange[0]) * 0.5) {
      lines.push(`📊 High variability detected (σ = ${stats.stdDev}). Inconsistent readings may indicate environmental or physiological fluctuations.`);
    }

    return lines;
  }, [stats, currentStatus, indicator, indicatorId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4 sm:py-10"
        onClick={(e) => e.target === e.currentTarget && onClose()}>

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-4xl rounded-xl border overflow-hidden"
          style={{
            background: 'rgba(8,12,20,0.97)',
            borderColor: `${color}40`,
            boxShadow: `0 0 40px ${color}15, 0 0 80px rgba(0,0,0,0.6)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2" style={{ borderColor: `${color}60` }} />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2" style={{ borderColor: `${color}60` }} />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2" style={{ borderColor: `${color}60` }} />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2" style={{ borderColor: `${color}60` }} />

          {/* ─── HEADER ─── */}
          <div className="px-6 py-5 border-b" style={{ borderColor: `${color}25` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                  <FontAwesomeIcon icon={icon} style={{ color, filter: `drop-shadow(0 0 6px ${color}80)` }} />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: C.cyan, textShadow: `0 0 8px ${C.cyan}80` }}>
                      TELEMETRY DEEP-DIVE
                    </span>
                    {linkedHazards.map(h => (
                      <span key={h.id} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: 'rgba(239,68,68,0.08)', color: C.red, border: '1px solid rgba(239,68,68,0.2)' }}>
                        {h.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-orbitron font-bold text-xl tracking-wider mt-1"
                    style={{ color, textShadow: `0 0 15px ${color}60` }}>
                    {indicator.name}
                  </h2>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>
                    Unit: {indicator.unit} · Normal: {indicator.normalRange.join(' – ')} {indicator.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Current value display */}
                {currentValue !== null && currentStatus && (
                  <div className="text-right">
                    <div className="font-orbitron text-2xl font-black tracking-wide"
                      style={{ color: statusColor(currentStatus), textShadow: `0 0 15px ${statusColor(currentStatus)}70` }}>
                      {indicator.format ? indicator.format(currentValue) : currentValue}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1"
                      style={{
                        background: `${statusColor(currentStatus)}12`,
                        color: statusColor(currentStatus),
                        border: `1px solid ${statusColor(currentStatus)}40`,
                      }}>
                      {currentStatus === 'healthy' && <Check size={9} />}
                      {currentStatus !== 'healthy' && <AlertTriangle size={9} />}
                      {statusLabel(currentStatus)}
                    </span>
                  </div>
                )}

                <button onClick={onClose}
                  className="w-9 h-9 rounded-lg flex items-center justify-center border transition-colors hover:bg-red-500/10 hover:border-red-500/30"
                  style={{ borderColor: 'rgba(0,243,255,0.15)', color: C.textMuted }}>
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── BODY (scrollable) ─── */}
          <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${color}30 transparent` }}>

            {/* ─── PHYSIOLOGICAL ISSUE ALERT BANNER (If caution or critical) ─── */}
            {currentStatus && currentStatus !== 'healthy' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-4 relative overflow-hidden"
                style={{
                  background: currentStatus === 'critical'
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(13,19,34,0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(13,19,34,0.95) 100%)',
                  borderColor: currentStatus === 'critical' ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.45)',
                  boxShadow: currentStatus === 'critical'
                    ? '0 0 25px rgba(239,68,68,0.2), inset 0 0 15px rgba(239,68,68,0.08)'
                    : '0 0 25px rgba(245,158,11,0.18), inset 0 0 15px rgba(245,158,11,0.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      currentStatus === 'critical' ? 'animate-pulse' : ''
                    }`}
                    style={{
                      background: currentStatus === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)',
                      border: `1px solid ${currentStatus === 'critical' ? '#ef4444' : '#fbbf24'}`,
                      color: currentStatus === 'critical' ? '#ef4444' : '#fbbf24',
                    }}
                  >
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-orbitron text-xs font-black tracking-wider uppercase"
                          style={{ color: currentStatus === 'critical' ? '#ef4444' : '#fbbf24' }}
                        >
                          {currentStatus === 'critical' ? 'CRITICAL PHYSIOLOGICAL ALERT' : 'PHYSIOLOGICAL CAUTION ADVISORY'}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase font-bold"
                          style={{
                            background: currentStatus === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: currentStatus === 'critical' ? '#fca5a5' : '#fde047',
                            border: `1px solid ${currentStatus === 'critical' ? '#ef444450' : '#fbbf2450'}`,
                          }}
                        >
                          EVALUATION REQD
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        REF: AST-PHY-{indicator.id.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-200 font-mono">
                      {getSpecificIssueMessage(indicator, currentValue)}
                    </p>

                    <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span>Review recommended flight countermeasures and exercise protocol below</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Time range selector + Log button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg"
                style={{ background: 'rgba(0,243,255,0.04)', border: '1px solid rgba(0,243,255,0.1)' }}>
                {(['7d', '14d', '30d', 'all'] as TimeRange[]).map(t => (
                  <button key={t} onClick={() => setTimeRange(t)}
                    className={`px-3 py-1.5 rounded text-xs font-orbitron font-bold transition-all ${
                      timeRange === t
                        ? 'text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                    style={timeRange === t ? {
                      background: 'rgba(0,243,255,0.1)',
                      border: '1px solid rgba(0,243,255,0.35)',
                    } : { border: '1px solid transparent' }}>
                    {t === 'all' ? 'ALL' : t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {history.length < 3 && (
                  <button onClick={() => onGenerateDemo(indicatorId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all hover:border-purple-500/40 hover:text-purple-300"
                    style={{ borderColor: 'rgba(168,85,247,0.2)', color: C.purple }}>
                    <Zap size={12} />
                    LOAD DEMO DATA
                  </button>
                )}
                <button onClick={() => setShowLogForm(!showLogForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-orbitron border transition-all hover:border-cyan-500/50"
                  style={{
                    borderColor: C.cyanBorder,
                    color: C.cyan,
                    background: 'rgba(0,243,255,0.05)',
                    textShadow: `0 0 8px ${C.cyan}40`,
                  }}>
                  <Plus size={12} />
                  LOG READING
                </button>
              </div>
            </div>

            {/* Inline log form */}
            <AnimatePresence>
              {showLogForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg border p-4 space-y-3"
                    style={{ background: 'rgba(0,243,255,0.03)', borderColor: C.cyanBorder }}>
                    <div className="flex gap-3">
                      <input
                        autoFocus
                        type="number"
                        step="any"
                        value={logDraft}
                        onChange={e => setLogDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleLog(); if (e.key === 'Escape') setShowLogForm(false); }}
                        placeholder={`Enter ${indicator.name} (${indicator.unit})...`}
                        className="flex-1 bg-obsidian border rounded px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
                        style={{ borderColor: 'rgba(0,243,255,0.25)' }}
                      />
                      <input
                        type="text"
                        value={logNotes}
                        onChange={e => setLogNotes(e.target.value)}
                        placeholder="Notes (optional)..."
                        className="flex-1 bg-obsidian border rounded px-3 py-2 text-sm text-white font-mono focus:outline-none transition-colors"
                        style={{ borderColor: 'rgba(0,243,255,0.15)' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleLog}
                        className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-xs font-orbitron rounded border border-cyan-400"
                        disabled={!logDraft || isNaN(parseFloat(logDraft))}>
                        SAVE READING
                      </button>
                      <button onClick={() => setShowLogForm(false)}
                        className="py-2 px-4 bg-obsidian border text-slate-400 text-xs font-mono rounded hover:text-white"
                        style={{ borderColor: 'rgba(0,243,255,0.15)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── TREND CHART ─── */}
            <div className="rounded-lg border overflow-hidden"
              style={{ background: 'rgba(3,5,9,0.6)', borderColor: `${color}20` }}>
              <div className="px-4 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: `${color}15` }}>
                <Activity size={13} style={{ color }} />
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>
                  TREND ANALYSIS
                </span>
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>
                  — {history.length} reading{history.length !== 1 ? 's' : ''} recorded
                </span>
              </div>
              <IndicatorChart readings={history} indicator={indicator} timeRange={timeRange} lineColor={color} />
            </div>

            {/* ─── STATS GRID ─── */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '7-DAY AVG', value: stats.avg7, icon: <Activity size={14} /> },
                  { label: 'MINIMUM', value: stats.min, icon: <TrendingDown size={14} /> },
                  { label: 'MAXIMUM', value: stats.max, icon: <TrendingUp size={14} /> },
                  {
                    label: 'TREND',
                    value: stats.trendDir === 'stable' ? 'Stable'
                      : stats.trendDir === 'rising' ? `↑ +${Math.abs(stats.trendDelta)}`
                      : `↓ ${stats.trendDelta}`,
                    icon: stats.trendDir === 'rising'
                      ? <TrendingUp size={14} />
                      : stats.trendDir === 'falling'
                        ? <TrendingDown size={14} />
                        : <Minus size={14} />,
                    color: stats.trendDir === 'stable' ? C.green
                      : stats.trendDir === 'rising' ? (indicatorId === 'mood' || indicatorId === 'hydration' ? C.green : C.amber)
                      : (indicatorId === 'mood' || indicatorId === 'hydration' ? C.amber : C.green),
                  },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg border p-3"
                    style={{ background: 'rgba(13,19,34,0.7)', borderColor: 'rgba(0,243,255,0.1)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span style={{ color: s.color || color, opacity: 0.7 }}>{s.icon}</span>
                      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="font-orbitron text-lg font-bold"
                      style={{ color: s.color || C.text, textShadow: `0 0 8px ${s.color || color}40` }}>
                      {s.value}
                    </div>
                  </div>
                ))}

                {/* Status distribution bar */}
                <div className="col-span-2 sm:col-span-4 rounded-lg border p-3"
                  style={{ background: 'rgba(13,19,34,0.7)', borderColor: 'rgba(0,243,255,0.1)' }}>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>
                    READING DISTRIBUTION
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-3 rounded-full overflow-hidden flex"
                      style={{ background: 'rgba(0,0,0,0.3)' }}>
                      {stats.normalCount > 0 && (
                        <div style={{ width: `${(stats.normalCount / stats.totalReadings) * 100}%`, background: C.green }}
                          title={`${stats.normalCount} optimal`} />
                      )}
                      {stats.cautionCount > 0 && (
                        <div style={{ width: `${(stats.cautionCount / stats.totalReadings) * 100}%`, background: C.amber }}
                          title={`${stats.cautionCount} caution`} />
                      )}
                      {stats.criticalCount > 0 && (
                        <div style={{ width: `${(stats.criticalCount / stats.totalReadings) * 100}%`, background: C.red }}
                          title={`${stats.criticalCount} critical`} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.green }} />{stats.normalCount}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.amber }} />{stats.cautionCount}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: C.red }} />{stats.criticalCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CLINICAL & SPACEFLIGHT ANALYSIS ─── */}
            <div className="rounded-lg border p-4" style={{ background: 'rgba(13,19,34,0.6)', borderColor: 'rgba(168,85,247,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} style={{ color: C.purple }} />
                <span className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: C.purple, textShadow: `0 0 8px ${C.purple}80` }}>
                  SPACEFLIGHT CLINICAL ANALYSIS
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: C.textDim }}>
                {indicator.description}
              </p>
              <div className="rounded p-3 mb-3" style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)' }}>
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.purple }}>
                  MICROGRAVITY CONTEXT
                </span>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: C.textDim }}>
                  {indicator.spaceContext}
                </p>
              </div>
              {riskAssessment && riskAssessment.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,243,255,0.08)' }}>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.cyan }}>
                    DYNAMIC RISK ASSESSMENT
                  </span>
                  {riskAssessment.map((line, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: C.textDim }}>
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* ─── SUGGESTED ACTIONS & EXERCISES ─── */}
            {(relevantActions.length > 0 || relevantExercises.length > 0) && (
              <div className="rounded-lg border p-4"
                style={{
                  background: currentStatus === 'critical'
                    ? 'rgba(239,68,68,0.04)'
                    : currentStatus === 'caution'
                      ? 'rgba(245,158,11,0.04)'
                      : 'rgba(34,197,94,0.03)',
                  borderColor: currentStatus === 'critical'
                    ? 'rgba(239,68,68,0.2)'
                    : currentStatus === 'caution'
                      ? 'rgba(245,158,11,0.15)'
                      : 'rgba(34,197,94,0.12)',
                }}>
                <div className="flex items-center gap-2 mb-3">
                  <Dumbbell size={14} style={{ color: currentStatus === 'critical' ? C.red : currentStatus === 'caution' ? C.amber : C.green }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: currentStatus === 'critical' ? C.red : currentStatus === 'caution' ? C.amber : C.green }}>
                    {currentStatus === 'critical' ? 'URGENT COUNTERMEASURES' : currentStatus === 'caution' ? 'RECOMMENDED ACTIONS' : 'MAINTENANCE PROTOCOL'}
                  </span>
                </div>

                {/* Actions */}
                {relevantActions.map(action => (
                  <div key={action.id} className="mb-3">
                    <h4 className="font-orbitron text-sm font-bold tracking-wider mb-1.5"
                      style={{ color: C.text }}>
                      {action.title}
                    </h4>
                    <p className="text-xs mb-2" style={{ color: C.textDim }}>{action.description}</p>
                    <div className="space-y-1">
                      {action.steps.map((step, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs"
                          style={{ color: C.textDim }}>
                          <span className="font-orbitron font-bold text-[10px] mt-0.5 shrink-0"
                            style={{ color: C.cyan, minWidth: 18 }}>
                            {String(j + 1).padStart(2, '0')}
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Exercises */}
                {relevantExercises.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,243,255,0.08)' }}>
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: C.cyan }}>
                      RECOMMENDED EXERCISES
                    </span>
                    <div className="grid sm:grid-cols-2 gap-2 mt-2">
                      {relevantExercises.map(ex => (
                        <div key={ex.id} className="p-3 rounded-lg border"
                          style={{ background: 'rgba(3,5,9,0.4)', borderColor: 'rgba(0,243,255,0.1)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-orbitron text-xs font-bold" style={{ color: C.text }}>
                              {ex.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                            <span><Clock size={9} className="inline mr-1" />{ex.duration}</span>
                            <span><Calendar size={9} className="inline mr-1" />{ex.frequency}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
                            {ex.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── HISTORICAL LOG TABLE ─── */}
            <div className="rounded-lg border overflow-hidden"
              style={{ background: 'rgba(3,5,9,0.5)', borderColor: 'rgba(0,243,255,0.12)' }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(0,243,255,0.1)' }}>
                <div className="flex items-center gap-2">
                  <FileText size={13} style={{ color }} />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color }}>
                    HISTORICAL LOG
                  </span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>
                  {sortedHistory.length} total readings
                </span>
              </div>

              {sortedHistory.length === 0 ? (
                <div className="px-4 py-10 text-center space-y-2">
                  <BarChart3 size={28} className="mx-auto" style={{ color: C.textMuted, opacity: 0.3 }} />
                  <p className="text-xs font-mono" style={{ color: C.textMuted }}>
                    No readings logged yet. Start logging to build your health timeline.
                  </p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: C.textMuted, background: 'rgba(0,243,255,0.02)', borderBottom: '1px solid rgba(0,243,255,0.06)' }}>
                    <span>Date & Time</span>
                    <span className="text-center">Value</span>
                    <span className="text-center">Status</span>
                    <span>Notes</span>
                  </div>

                  {/* Table rows */}
                  {pageHistory.map((r, i) => {
                    const s = getStatus(r.value, indicator);
                    const sc = statusColor(s);
                    return (
                      <div key={i}
                        className="grid grid-cols-[1fr_100px_80px_1fr] gap-2 items-center px-4 py-2.5 border-b transition-colors hover:bg-cyan-500/[0.02]"
                        style={{ borderColor: 'rgba(0,243,255,0.04)' }}>
                        <div className="text-xs font-mono" style={{ color: C.textDim }}>
                          <Calendar size={10} className="inline mr-1.5" style={{ color: C.textMuted }} />
                          {formatDateTime(r.timestamp)}
                        </div>
                        <div className="text-center font-orbitron text-sm font-bold"
                          style={{ color: sc, textShadow: `0 0 8px ${sc}40` }}>
                          {indicator.format ? indicator.format(r.value) : r.value}
                        </div>
                        <div className="flex justify-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                            style={{
                              background: `${sc}10`,
                              color: sc,
                              border: `1px solid ${sc}30`,
                            }}>
                            {s === 'healthy' ? 'OK' : s.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] truncate" style={{ color: C.textMuted }}>
                          {r.notes || '—'}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'rgba(0,243,255,0.02)' }}>
                      <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>
                        Page {historyPage + 1} of {totalPages}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                          disabled={historyPage === 0}
                          className="px-2.5 py-1 rounded text-[10px] font-mono border transition-all disabled:opacity-30"
                          style={{ borderColor: 'rgba(0,243,255,0.15)', color: C.cyan }}>
                          ← PREV
                        </button>
                        <button
                          onClick={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={historyPage >= totalPages - 1}
                          className="px-2.5 py-1 rounded text-[10px] font-mono border transition-all disabled:opacity-30"
                          style={{ borderColor: 'rgba(0,243,255,0.15)', color: C.cyan }}>
                          NEXT →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── MEASUREMENT GUIDE ─── */}
            <div className="rounded-lg border p-4"
              style={{ background: 'rgba(0,243,255,0.02)', borderColor: 'rgba(0,243,255,0.1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={13} style={{ color: C.cyan }} />
                <span className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: C.cyan }}>
                  HOW TO MEASURE
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.textDim }}>
                {indicator.measurement}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

