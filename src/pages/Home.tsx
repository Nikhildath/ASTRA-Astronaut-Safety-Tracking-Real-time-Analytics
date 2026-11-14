'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Activity, AlertTriangle, Check, Plus, Clock,
  Star, Zap, ChevronRight, Settings, HelpCircle, Award,
  Wifi, Shield,
} from 'lucide-react';
import { faHeart, faLungs, faDroplet, faThermometerHalf, faMoon, faFaceSmile, faWater, faFlask, faBrain, faBone, faShieldHalved, faSun, faGlobe, faHouse, faQuestionCircle, faBan, faLock, faMedal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  initializePlayer,
  saveProfile,
  saveStats,
  getReadings,
  saveReading,
  checkAndAwardBadges,
  isSupabaseConfigured,
} from '../lib/data-service';
import type { ProfileData, StatsData } from '../lib/types';
import { ThreeScene } from '../components/ThreeScene';
import {
  indicators, actionLibrary, bodySystems, mission, hazards,
  gamification, glossary, contributors, exerciseLibrary, nutritionTips,
} from '../content';
import type { Reading } from '../content';

/* ─── Color tokens (matching the Solo Leveling sci-fi style) ─── */

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
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
};

/* ─── Types ──────────────────────────────────────────────── */

type ViewMode = 'dashboard' | 'body' | 'actions' | 'education' | 'profile';
type EducationTab = 'indicators' | 'hazards' | 'glossary' | 'exercise' | 'nutrition';
type BodySystem = typeof bodySystems[number];

/* ─── Helpers ────────────────────────────────────────────── */

function inRange(value: number, range: number[]): boolean {
  return value >= Math.min(...range) && value <= Math.max(...range);
}

function getStatus(val: number, ind: typeof indicators[number]): 'healthy' | 'caution' | 'critical' {
  if (inRange(val, ind.criticalRange) || inRange(val, ind.lowCritical)) return 'critical';
  if (inRange(val, ind.normalRange)) return 'healthy';
  return 'caution';
}

function getIndIcon(id: string) {
  switch (id) {
    case 'heart-rate': return faHeart;
    case 'blood-pressure': return faHeart;
    case 'blood-sugar': return faDroplet;
    case 'body-temp': return faThermometerHalf;
    case 'sleep-hours': return faMoon;
    case 'mood': return faFaceSmile;
    case 'oxygen-sat': return faLungs;
    case 'hydration': return faWater;
    default: return faFlask;
  }
}

function getIndColor(id: string): string {
  switch (id) {
    case 'heart-rate': return C.red;
    case 'blood-pressure': return '#f97316';
    case 'blood-sugar': return '#eab308';
    case 'body-temp': return C.red;
    case 'sleep-hours': return '#8b5cf6';
    case 'mood': return '#ec4899';
    case 'oxygen-sat': return '#06b6d4';
    case 'hydration': return C.cyan;
    default: return C.cyan;
  }
}

/* ─── Sci-fi UI primitives ──────────────────────────────── */

function SciBox({ children, className = '', glowColor = 'cyan' }: {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'red' | 'purple' | 'green';
}) {
  const glowMap = {
    cyan: `0 0 20px ${C.cyanGlow}, inset 0 0 15px ${C.cyanGlow}`,
    red: `0 0 25px ${C.redGlow}, inset 0 0 15px ${C.redGlow}`,
    purple: `0 0 20px ${C.purpleGlow}, inset 0 0 15px ${C.purpleGlow}`,
    green: `0 0 20px ${C.greenGlow}, inset 0 0 15px ${C.greenGlow}`,
  };
  return (
    <div
      className={`sci-box rounded-lg p-5 relative overflow-hidden ${className}`}
      style={{
        background: 'rgba(13,19,34,0.82)',
        borderColor: glowColor === 'red' ? 'rgba(239,68,68,0.4)' : glowColor === 'purple' ? 'rgba(168,85,247,0.3)' : glowColor === 'green' ? 'rgba(34,197,94,0.3)' : C.cyanBorder,
        boxShadow: glowMap[glowColor],
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-7 h-7 border-t border-l" style={{ borderColor: glowColor === 'red' ? C.red : glowColor === 'purple' ? C.purple : C.cyan, opacity: 0.5 }} />
      <div className="absolute bottom-0 right-0 w-7 h-7 border-b border-r" style={{ borderColor: glowColor === 'red' ? C.red : glowColor === 'purple' ? C.purple : C.cyan, opacity: 0.5 }} />
      {children}
    </div>
  );
}

function Label({ text, color = 'cyan', glow = false }: {
  text: string; color?: 'cyan' | 'red' | 'purple' | 'green' | 'muted';
  glow?: boolean;
}) {
  const colorMap = {
    cyan: C.cyan, red: C.red, purple: C.purple, green: C.green, muted: C.textMuted,
  };
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-widest"
      style={{
        color: colorMap[color],
        textShadow: glow ? `0 0 8px ${colorMap[color]}80` : undefined,
      }}
    >
      {text}
    </span>
  );
}

function XenText({ children, glowColor = 'cyan', size = 'lg' }: {
  children: React.ReactNode;
  glowColor?: 'cyan' | 'red' | 'purple' | 'green';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}) {
  const colorMap = { cyan: C.cyan, red: C.red, purple: C.purple, green: C.green };
  const sizeMap = { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl' };
  return (
    <span
      className={`font-orbitron font-bold tracking-wider ${sizeMap[size]}`}
      style={{
        color: colorMap[glowColor] || C.text,
        textShadow: `0 0 12px ${colorMap[glowColor] || C.cyan}80`,
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: 'healthy' | 'caution' | 'critical' | 'muted' }) {
  const map = {
    healthy: { bg: `rgba(34,197,94,0.1)`, color: C.green, border: `rgba(34,197,94,0.4)`, label: 'OPTIMAL' },
    caution: { bg: `rgba(245,158,11,0.1)`, color: '#fbbf24', border: `rgba(245,158,11,0.4)`, label: 'CAUTION' },
    critical: { bg: `rgba(239,68,68,0.1)`, color: C.red, border: `rgba(239,68,68,0.4)`, label: 'CRITICAL' },
    muted: { bg: `rgba(100,116,139,0.08)`, color: C.textMuted, border: `rgba(100,116,139,0.2)`, label: 'NO DATA' },
  };
  const m = map[status];
  return (
    <span className="px-2.5 py-0.5 text-[10px] font-mono rounded font-bold flex items-center gap-1.5" style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}>
      {status === 'healthy' && <Check size={9} />}
      {status === 'caution' && <AlertTriangle size={9} />}
      {status === 'critical' && <AlertTriangle size={9} />}
      {m.label}
    </span>
  );
}

/* ─── Selected body-system detail panel ──────────────────── */

function SystemDetailPanel({
  system,
  currentValues,
  history,
  editingId,
  draft,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onOpenHazard,
  onOpenActions,
}: {
  system: BodySystem;
  currentValues: Record<string, number | null>;
  history: Record<string, Reading[]>;
  editingId: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: (id: string, value: number | null) => void;
  onCancelEdit: () => void;
  onSave: (id: string, value: number) => void;
  onOpenHazard: (id: string) => void;
  onOpenActions: () => void;
}) {
  const glowColor: 'cyan' | 'red' | 'purple' | 'green' =
    system.id === 'cardiovascular' || system.id === 'immune'
      ? 'red'
      : system.id === 'neurological' || system.id === 'behavioral'
        ? 'purple'
        : 'cyan';

  const rows = system.indicators
    .map(id => ({ ind: indicators.find(i => i.id === id), hist: history[id] ?? [] }))
    .filter((row): row is { ind: typeof indicators[number]; hist: Reading[] } => Boolean(row.ind));

  return (
    <SciBox className="p-5" glowColor={glowColor}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `${system.color}1a`, color: system.color, border: `1px solid ${system.color}55` }}
          >
            <FontAwesomeIcon icon={getEmoji(system.id)} size="xl" style={{ color: system.color }} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Label text="LIVE FOCUS" color="cyan" glow />
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,243,255,0.08)', color: C.cyan, border: '1px solid rgba(0,243,255,0.25)' }}
              >
                CAM → {system.name.toUpperCase()}
              </span>
            </div>
            <XenText size="md" glowColor={glowColor === 'red' ? 'red' : glowColor === 'purple' ? 'purple' : 'cyan'}>
              {system.name} System
            </XenText>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>
              {system.indicators.length} indicator{system.indicators.length !== 1 ? 's' : ''} · {system.hazards.length} hazard{system.hazards.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {system.hazards.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onOpenHazard(h)}
              title={`Open ${hazardLabel(h)} protocol`}
              className="text-[10px] px-2 py-1 rounded font-mono transition-colors hover:bg-red-500/20"
              style={{ background: 'rgba(239,68,68,0.08)', color: C.red, border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="flex items-center gap-1">
                <HazardIcon id={h} />
                {hazardLabel(h)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed mt-3" style={{ color: C.textDim }}>
        {system.description}
      </p>

      {rows.length > 0 ? (
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {rows.map(({ ind, hist }) => {
            const val = currentValues[ind.id];
            const status = val !== null && val !== undefined ? getStatus(val, ind) : 'muted';
            const histValues = hist.slice(0, 7).map(r => r.value).reverse();
            const color = status === 'critical' ? C.red : status === 'caution' ? '#fbbf24' : status === 'healthy' ? C.green : C.textMuted;
            const display = val !== null && val !== undefined
              ? `${ind.format ? ind.format(val) : val}${ind.unit && ind.unit !== '/10' && ind.unit !== '% SpO2' ? ` ${ind.unit}` : ''}`
              : 'No data';

            return (
              <div
                key={ind.id}
                className="rounded-lg border p-3"
                style={{ borderColor: 'rgba(0,243,255,0.12)', background: 'rgba(3,9,16,0.55)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FontAwesomeIcon icon={getIndIcon(ind.id)} size="lg" style={{ color }} />
                    <span className="text-xs font-medium truncate">{ind.name}</span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {histValues.length >= 2 && (
                      <MiniSparkline values={histValues} color={color} />
                    )}
                    <span className="font-orbitron text-sm" style={{ color }}>{display}</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono" style={{ color: C.textMuted }}>
                  <span>7-DAY TREND</span>
                  <span>NORMAL {ind.normalRange.join(' – ')}</span>
                </div>

                {editingId === ind.id ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      autoFocus
                      type="number"
                      step="any"
                      value={draft}
                      onChange={e => onDraftChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const n = parseFloat(draft);
                          if (!Number.isNaN(n)) onSave(ind.id, n);
                          onCancelEdit();
                        }
                        if (e.key === 'Escape') onCancelEdit();
                      }}
                      placeholder={`${ind.name} (${ind.unit})`}
                      className="flex-1 min-w-0 bg-obsidian border border-cyan-500/30 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const n = parseFloat(draft);
                        if (!Number.isNaN(n)) onSave(ind.id, n);
                        onCancelEdit();
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-[10px] font-orbitron rounded border border-cyan-400"
                    >
                      SAVE
                    </button>
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="px-2 py-1.5 bg-obsidian border border-cyan-500/20 text-slate-400 text-[10px] font-mono rounded hover:text-white"
                    >
                      ESC
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartEdit(ind.id, val)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-mono border transition-all hover:border-cyan-500/50 hover:text-cyan-300"
                    style={{ borderColor: 'rgba(0,243,255,0.18)', color: C.textMuted, background: 'transparent' }}
                  >
                    <Plus size={10} />
                    LOG {ind.name.toUpperCase()}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'rgba(0,243,255,0.12)', background: 'rgba(3,9,16,0.55)' }}>
          <p className="text-xs" style={{ color: C.textDim }}>
            No direct telemetry indicator is mapped to this system. Track it through activity and countermeasure adherence.
          </p>
          <button
            type="button"
            onClick={onOpenActions}
            className="text-[10px] font-mono px-2.5 py-1 rounded border transition-colors hover:bg-cyan-500/10"
            style={{ borderColor: 'rgba(0,243,255,0.25)', color: C.cyan }}
          >
            OPEN COUNTERMEASURES →
          </button>
        </div>
      )}
    </SciBox>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export function Home() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [educationTab, setEducationTab] = useState<EducationTab>('indicators');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('neurological');
  const [profile, setProfile] = useState<ProfileData>({ id: '', player_name: 'Commander', player_role: 'Mission Specialist', callsign: 'AUSTRALIS-4' });
  const [stats, setStats] = useState<StatsData>({ id: '', player_id: '', total_xp: 0, total_checkins: 0, current_streak: 0, longest_streak: 0, last_checkin_date: undefined, unlocked_badges: [] });
  // Note: isLoading and isSyncing states are available for future UI enhancements

  // Load data from Supabase/localStorage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const result = await initializePlayer();
        setProfile(result.profile);
        setStats(result.stats);
      } catch (err) {
        console.error('Failed to load player data:', err);
        // Fallback to defaults
        setProfile({ id: '', player_name: 'Commander', player_role: 'Mission Specialist', callsign: 'AUSTRALIS-4' });
        setStats({ id: '', player_id: '', total_xp: 0, total_checkins: 0, current_streak: 0, longest_streak: 0, last_checkin_date: undefined, unlocked_badges: [] });
      } finally {
        // Data loaded successfully
      }
    }
    loadData();
  }, []);

  // Sync data when stats change
  useEffect(() => {
    if (stats.player_id && stats.id) {
      saveStats(stats).catch(console.error);
    }
  }, [stats]);

  // Sync profile when it changes
  useEffect(() => {
    if (profile.id) {
      saveProfile(profile).catch(console.error);
    }
  }, [profile]);
  const currentLevel = gamification.levels.find(l => stats.total_xp < l.xpRequired) || gamification.levels[gamification.levels.length - 1];
  const prevLevel = gamification.levels[Math.max(0, gamification.levels.indexOf(currentLevel) - 1)];
  const xpInLevel = prevLevel ? stats.total_xp - prevLevel.xpRequired : stats.total_xp;
  const xpForNext = currentLevel.xpRequired - (prevLevel?.xpRequired || 0);
  const progressPct = Math.min(100, (xpInLevel / Math.max(1, xpForNext)) * 100);
  const level = currentLevel.level;
  const xp = stats.total_xp;
  const maxXp = currentLevel.xpRequired;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // Load history from Supabase/localStorage whenever profile changes
  const [history, setHistory] = useState<Record<string, Reading[]>>({});
  
  useEffect(() => {
    async function loadHistory() {
      if (!profile.id) return;
      const readings: Record<string, Reading[]> = {};
      for (const ind of indicators) {
        const indReadings = await getReadings(profile.id, ind.id);
        readings[ind.id] = indReadings;
      }
      setHistory(readings);
    }
    loadHistory();
  }, [profile.id]);

  // Get current values from latest readings
  const currentValues: Record<string, number | null> = {};
  indicators.forEach(ind => {
    const readingsForInd = history[ind.id] || [];
    currentValues[ind.id] = readingsForInd.length > 0 ? readingsForInd[0].value : null;
  });

  // Calculate stats from current readings
  let critical = 0, caution = 0, healthy = 0;
  const indMap = new Map(indicators.map(i => [i.id, i]));
  for (const [id, v] of Object.entries(currentValues)) {
    if (v === null || v === undefined) continue;
    const ind = indMap.get(id);
    if (!ind) continue;
    const status = getStatus(v, ind);
    if (status === 'critical') critical++;
    else if (status === 'healthy') healthy++;
    else caution++;
  }

  const activeSystem = bodySystems.find(s => s.id === selectedSystem) ?? bodySystems[0];

  const handleBodySelect = useCallback((id: string) => {
    setSelectedSystem(id);
  }, []);

  const handleOpenHazard = useCallback(() => {
    setEducationTab('hazards');
    setView('education');
  }, []);

  const handleOpenActions = useCallback(() => {
    setView('actions');
  }, []);

  const onStartEdit = useCallback((id: string, val: number | null) => {
    setEditingId(id);
    setDraft(val !== null ? String(val) : '');
  }, []);

  const onCancelEdit = useCallback(() => {
    setEditingId(null);
    setDraft('');
  }, []);

  // Save a reading and update stats
  const handleSave = useCallback(async (id: string, val: number, notes?: string) => {
    if (!profile.id) return;
    
    const reading: Reading = { indicatorId: id, value: val, timestamp: Date.now(), notes };
    
    // Save to Supabase/localStorage
    await saveReading(profile.id, reading);
    
    // Reload history for this indicator
    const newReadings = await getReadings(profile.id, id);
    setHistory(prev => ({ ...prev, [id]: newReadings }));
    
    // Check if all indicators are logged
    const allLoggedNow = indicators.every(ind => {
      const indHistory = history[ind.id] || [];
      return indHistory.length > 0;
    });
    
    // Update stats
    setStats(prev => {
      const today = getTodayDate();
      const wasSameDay = prev.last_checkin_date === today;
      const newStreak = wasSameDay ? prev.current_streak : 1;
      const newLongestStreak = Math.max(prev.longest_streak, newStreak);
      const newTotalXp = prev.total_xp + (allLoggedNow ? 25 : 10);
      const newTotalCheckins = prev.total_checkins + 1;
      
      const newBadges = checkAndAwardBadges({
        ...prev,
        total_xp: newTotalXp,
        total_checkins: newTotalCheckins,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_checkin_date: today,
      }, allLoggedNow);
      
      return {
        ...prev,
        total_xp: newTotalXp,
        total_checkins: newTotalCheckins,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_checkin_date: today,
        unlocked_badges: newBadges,
      };
    });
  }, [profile.id, history, currentValues]);

  return (
    <div className="min-h-screen bg-void text-slate-100 font-sans overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Scanline overlay */}
      <div className="fixed inset-0 z-40 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(0,243,255,0.018) 50%, rgba(0,243,255,0.018) 100%)',
        backgroundSize: '100% 4px',
      }} />

      {/* Deep space gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 20%, rgba(0,243,255,0.04) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 30%, rgba(168,85,247,0.03) 0%, transparent 55%),
          radial-gradient(ellipse 100% 60% at 50% 50%, #060b15 0%, #030509 70%)
        `,
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-obsidian/95 border-b backdrop-blur-md" style={{ borderColor: C.cyanBorder }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo + nav */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border flex items-center justify-center" style={{ borderColor: C.cyan, boxShadow: `0 0 15px ${C.cyanGlow}` }}>
                  <Globe size={16} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px #00f3ff)' }} />
                </div>
                <div>
                  <div className="font-orbitron font-black text-sm tracking-widest" style={{ color: C.cyan, textShadow: '0 0 10px rgba(0,243,255,0.7)' }}>
                    A.S.T.R.A.
                  </div>
                  <div className="text-[9px] font-mono tracking-widest" style={{ color: C.cyanDim }}>
                    SYSTEM ALIGNMENT // NASA SPACE APPS
                  </div>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1 border-l border-cyan-500/20 pl-6">
                {(['dashboard', 'body', 'actions', 'education', 'profile'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 ${view === v ? 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.2)]' : 'text-slate-400 hover:text-cyan-300 hover:bg-panel border border-transparent'}`}
                  >
                    {v === 'dashboard' && <Activity size={11} className="inline mr-1.5" style={{ color: view === v ? C.cyan : undefined }} />}
                    {v === 'body' && <Globe size={11} className="inline mr-1.5" style={{ color: view === v ? C.cyan : undefined }} />}
                    {v === 'actions' && <Settings size={11} className="inline mr-1.5" style={{ color: view === v ? C.cyan : undefined }} />}
                    {v === 'education' && <HelpCircle size={11} className="inline mr-1.5" style={{ color: view === v ? C.cyan : undefined }} />}
                    {v === 'profile' && <Award size={11} className="inline mr-1.5" style={{ color: view === v ? C.cyan : undefined }} />}
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right: status + actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono" style={{ color: C.textDim }}>
                <div className="flex items-center gap-1.5">
                  <Wifi size={12} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 2px #00f3ff)' }} />
                  <span className="hidden xs:inline">Earth link</span>
                  <span className="text-slate-500">—</span>
                  <span className="text-cyan-300">14m delay</span>
                </div>
                <div className="text-slate-600">|</div>
                <div className="flex items-center gap-1.5 bg-panel px-3 py-1 rounded border" style={{ borderColor: C.cyanBorder }}>
                  <Clock size={12} className="text-cyan-400" />
                  <span className="font-mono">SOL {mission.cycle.split(' ')[1]}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <button
                  onClick={() => setView('profile')}
                  className="px-2.5 py-1 bg-panel hover:bg-cyan-950/50 border transition rounded text-xs font-mono hidden sm:flex items-center gap-1.5"
                  style={{ borderColor: C.cyanBorder, color: C.cyanDim }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {isSupabaseConfigured ? 'CLOUD' : 'LOCAL'}
                </button>
              </div>

              {/* Quest notification dot */}
              <button
                onClick={() => setView('actions')}
                className="relative w-8 h-8 rounded flex items-center justify-center bg-panel border hover:bg-cyan-950/50 transition"
                style={{ borderColor: C.cyanBorder }}
              >
                <Settings size={14} className="text-slate-400" />
                {caution > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                    {caution > 0 ? '!' : ''}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 pt-6 gap-6">
        {/* Sidebar */}              <aside className="lg:w-64 shrink-0 space-y-4">
          <nav className="md:hidden grid grid-cols-5 gap-1 p-1 rounded border" style={{ borderColor: C.cyanBorder, background: 'rgba(13,19,34,0.82)' }}>
            {(['dashboard', 'body', 'actions', 'education', 'profile'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`py-2 rounded text-[10px] font-mono transition-all ${view === v ? 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-300' : 'text-slate-400 hover:text-cyan-300 border border-transparent'}`}
              >
                {v === 'dashboard' ? 'Dash' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </nav>
          <SciBox className="space-y-4">
            {/* Player status mini */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 border flex items-center justify-center" style={{ borderColor: C.cyan }}>
                  <span className="font-orbitron font-black text-sm" style={{ color: currentLevel.color }}>{level}</span>
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: C.text }}>{profile.player_role}</div>
                  <div className="text-[10px] font-mono" style={{ color: C.textMuted }}>{currentLevel.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-orbitron text-sm font-bold" style={{ color: currentLevel.color }}>{stats.total_xp}</div>
                <div className="text-[10px] font-mono" style={{ color: C.textMuted }}>XP</div>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                <span>EXPERIENCE</span>
                <span style={{ color: currentLevel.color }}>{stats.total_xp} / {maxXp}</span>
              </div>
              <div className="w-full bg-obsidian rounded-full h-1.5 overflow-hidden border" style={{ borderColor: C.cyanBorder }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.color || '#a855f7'})` }} />
              </div>
              <div className="text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                Next rank: {gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.name || 'MAX LEVEL'}
              </div>
            </div>

            <div className="divider my-2" />

            {/* Vital stats */}
            <div>
              <Label text="VITAL STATS" color="cyan" />
              <div className="mt-2 space-y-2">
                {indicators.slice(0, 4).map(ind => {
                  const val = currentValues[ind.id];
                  const status = val !== null ? getStatus(val, ind) : 'muted';
                  const statusColor = status === 'healthy' ? C.green : status === 'caution' ? '#fbbf24' : status === 'critical' ? C.red : C.textMuted;
                  const displayVal = val !== null ? (ind.format ? ind.format(val) : `${val}${ind.unit !== '/10' && ind.unit !== '% SpO2' ? ` ${ind.unit}` : ''}`) : 'No data';
                  return (
                    <div key={ind.id} className="flex items-center justify-between">
                      <span className="text-xs font-mono" style={{ color: C.textDim }}>{ind.name}</span>
                      <span className="font-orbitron text-xs font-bold" style={{ color: statusColor }}>{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divider my-2" />

            {/* Quest chain */}
            <div>
              <Label text="DAILY QUEST CHAIN" color="cyan" />
              <div className="mt-2 flex items-center gap-1.5">
                {['1', '2', '3', '4'].map((n, i) => (
                  <div
                    key={n}
                                         className={`h-1.5 rounded flex-1 transition-all ${i < Math.min(2, stats.total_checkins) ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.6)]' : 'bg-obsidian border'}`}
                     style={i < Math.min(2, stats.total_checkins) ? {} : { borderColor: C.cyanBorder }}
                  />
                ))}
                                  <span className="text-[10px] font-mono ml-2 shrink-0" style={{ color: C.cyan }}>
                  {Math.min(4, stats.total_checkins)} / 4 CLEARED
                </span>
              </div>
            </div>

            <div className="divider my-2" />

            {/* Rank badge */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <Label text="HUNTER RANK" color="cyan" />
                <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>Participation tier</p>
              </div>
              <div className="w-9 h-9 rounded bg-cyan-950 border flex items-center justify-center" style={{ borderColor: C.cyan, boxShadow: `0 0 12px ${C.cyanGlow}` }}>
                <span className="font-orbitron font-black text-lg" style={{ color: C.cyan, textShadow: '0 0 8px rgba(0,243,255,0.7)' }}>S</span>
              </div>
            </div>

            <div className="divider my-2" />

            {/* Mission countdown */}
            <div>
              <Label text="MISSION ARES I" color="cyan" />
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-orbitron text-xl font-bold" style={{ color: C.text }}>186</span>
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>/ 540 days</span>
              </div>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: C.cyanDim }}>En route to Mars Orbit</p>
            </div>

            <div className="divider my-2" />

            {/* Profile avatar */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-8 h-8 rounded bg-cyan-950 border flex items-center justify-center text-cyan-400 font-orbitron font-bold text-sm" style={{ borderColor: C.cyan }}>
                {profile.player_name.charAt(0).toUpperCase()}{profile.player_role.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: C.text }}>{profile.player_name}</p>
                <p className="text-[10px] font-mono truncate" style={{ color: C.textMuted }}>{profile.callsign || 'N/A'}</p>
              </div>
            </div>
          </SciBox>

          {/* Reward widget */}
          <SciBox glowColor="purple" className="p-4">
            <Label text="REWARD COSMETIC" color="purple" />
            <p className="font-orbitron text-sm font-bold mt-1" style={{ color: '#c084fc' }}>Aurora system skin</p>
            <p className="text-[10px] mt-1" style={{ color: C.textMuted }}>Shared orbital goal. Unlocked.</p>
          </SciBox>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Greeting banner */}
          <SciBox glowColor="cyan" className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[10px] font-mono rounded">System Broadcast</span>
                <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>DAY 186 // 14 NOV 2031</span>
              </div>
              <XenText size="2xl" glowColor="cyan">THE SYSTEM IS ONLINE.</XenText>
              <p className="text-xs mt-1" style={{ color: C.cyanDim }}>
                Welcome back, {profile.player_name}. Mission {profile.callsign || 'ACTIVE'} continues.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-cyan-950/60 border px-4 py-3 rounded shrink-0" style={{ borderColor: C.cyanBorder }}>
              <div className="text-right">
                <p className="text-[10px] font-mono" style={{ color: C.cyanDim }}>SYSTEM SYNC LEVEL</p>
                <XenText size="md" glowColor="cyan">99.8% OPTIMAL</XenText>
              </div>
              <Shield size={20} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px #00f3ff)', animation: 'pulseGlow 3s infinite ease-in-out' }} />
            </div>
          </SciBox>

          {/* Health status notice */}
          <div className="flex items-start gap-3 bg-cyan-950/20 border rounded-lg p-4" style={{ borderColor: C.cyanBorder }}>
            <div className="w-9 h-9 rounded bg-cyan-900/50 border flex items-center justify-center shrink-0" style={{ borderColor: C.cyan }}>
              <Check size={16} className="text-cyan-400" />
            </div>
            <div className="min-w-0">
              <XenText size="md" glowColor="cyan">HEALTH STATUS: Routine monitoring nominal</XenText>
              <p className="text-xs mt-1" style={{ color: C.textDim }}>
                {healthy}/{indicators.length} indicators in range. {caution > 0 ? `${caution} need attention` : ''} {critical > 0 ? `${critical} critical — act immediately` : ''}
              </p>
            </div>
            {caution > 0 && (
              <span className="px-3 py-1 bg-amber-500/20 border text-amber-300 text-[10px] font-mono rounded shrink-0" style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
                {caution} item{caution > 1 ? 's' : ''} need attention
              </span>
            )}
          </div>

          {/* ─── Dashboard View ─────── */}
          {view === 'dashboard' && (
            <div className="space-y-5">
              {/* Player Status Card */}
              <SciBox className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <XenText size="sm" glowColor="cyan">[ PLAYER STATUS ]</XenText>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>ID: #ND-7709-ARES</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r pb-4 lg:pb-0 lg:pr-6" style={{ borderColor: C.cyanBorder }}>
                    <Label text="LEVEL" color="cyan" />
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="font-orbitron font-black text-5xl md:text-6xl tracking-wider" style={{ color: currentLevel.color, textShadow: `0 0 20px ${currentLevel.color}60` }}>
                        {level}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,243,255,0.08)', color: currentLevel.color, border: `1px solid ${currentLevel.color}40` }}>
                        {currentLevel.name}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                        <span>EXPERIENCE</span>
                        <span style={{ color: C.cyan }}>{xp} / {maxXp} XP</span>
                      </div>
                      <div className="w-full bg-obsidian rounded-full h-2 overflow-hidden border" style={{ borderColor: C.cyanBorder }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${currentLevel.color} 0%, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.color || '#a855f7'} 50%, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 2)]?.color || '#ec4899'} 100%)` }} />
                      </div>
                      <p className="text-[10px] font-mono mt-1.5" style={{ color: C.textMuted }}>Next rank: {gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.name || 'MAX LEVEL'}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-4">
                    <div>
                      <XenText size="xl">{profile.player_name.toUpperCase()}</XenText>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: C.cyanDim }}>CLASS // {profile.player_role.toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {indicators.slice(0, 4).map(ind => {
                        const val = currentValues[ind.id];
                        const status = val !== null ? getStatus(val, ind) : 'muted';
                        const statusColor = status === 'healthy' ? C.green : status === 'caution' ? '#fbbf24' : status === 'critical' ? C.red : C.textMuted;
                        const displayVal = val !== null ? (ind.format ? ind.format(val) : `${val}${ind.unit !== '/10' && ind.unit !== '% SpO2' ? ` ${ind.unit}` : ''}`) : '--';
                        return (
                          <div key={ind.id} className="bg-obsidian/60 border rounded p-2.5" style={{ borderColor: C.cyanBorder }}>
                            <p className="text-[9px] font-mono" style={{ color: C.textMuted }}>{ind.name.toUpperCase().replace(/ /g, '-')}</p>
                            <p className="font-orbitron text-sm font-bold mt-0.5" style={{ color: statusColor, textShadow: `0 0 8px ${statusColor}60` }}>{displayVal}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SciBox>

              {/* 3D Body Scene */}
              <SciBox className="overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: C.cyanBorder }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                    <Globe size={15} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px #00f3ff)' }} />
                    <span className="font-medium">Interactive Body Map</span>
                    <span className="text-xs ml-1" style={{ color: C.textMuted }}>— click a body part to log</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono" style={{ color: C.textMuted }}>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />Cardiovascular</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />Respiratory</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} />Neurological</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#06b6d4' }} />MSK</span>
                  </div>
                </div>
                <div className="h-[300px] sm:h-[380px] md:h-[420px]">
                  <ThreeScene
                    onSelectBodyPart={handleBodySelect}
                    vitals={{
                      heartRate: currentValues['heart-rate'] ?? null,
                      spo2: currentValues['oxygen-sat'] ?? null,
                    }}
                  />
                </div>
              </SciBox>

              {/* Selected System Detail Panel */}
              <SystemDetailPanel
                system={activeSystem}
                currentValues={currentValues}
                history={history}
                editingId={editingId}
                draft={draft}
                onDraftChange={setDraft}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSave={handleSave}
                onOpenHazard={handleOpenHazard}
                onOpenActions={handleOpenActions}
              />

              {/* Indicator grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {indicators.map((ind, i) => {
                  const val = currentValues[ind.id];
                  const reading = history[ind.id]?.[0] || null;
                  const hist = history[ind.id] || [];
                  const status = val !== null ? getStatus(val, ind) : 'muted';
                  const trend = hist.length >= 2 ? hist[0].value - hist[1].value : 0;
                  const icon = getIndIcon(ind.id);
                  const color = getIndColor(ind.id);

                  return (
                    <motion.div
                      key={ind.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35 }}
                      className="data-sci-animate"
                    >
                      <SciBox glowColor={status === 'critical' ? 'red' : status === 'healthy' ? 'green' : 'cyan'} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${color}12`, color }}>
                              <FontAwesomeIcon icon={icon} size="lg" />
                            </div>
                            <div>
                              <XenText size="sm" glowColor={status === 'critical' ? 'red' : 'cyan'}>{ind.name}</XenText>
                              <div className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>
                                Normal: {ind.normalRange.join(' – ')}
                                {ind.unit !== '/10' && ind.unit !== '% SpO2' ? ` ${ind.unit}` : ''}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="flex items-end justify-between pt-2" style={{ borderTop: '1px solid rgba(0,243,255,0.1)' }}>
                          <div className="min-w-0">
                            {val !== null ? (
                              <>
                                <div className="flex items-baseline gap-2">
                                  <span className="font-orbitron text-2xl font-bold tracking-tight" style={{ color: status === 'critical' ? C.red : status === 'caution' ? '#fbbf24' : C.text, textShadow: status === 'critical' ? '0 0 12px rgba(239,68,68,0.7)' : status === 'caution' ? '0 0 12px rgba(245,158,11,0.5)' : undefined }}>
                                    {ind.format ? ind.format(val) : val}
                                  </span>
                                  {Math.abs(trend) > 0.3 && (
                                    <span className="text-xs font-mono flex items-center gap-0.5" style={{ color: trend > 0 ? '#f87171' : C.green }}>
                                      {trend > 0 ? '↑' : '↓'}
                                      {Math.abs(trend).toFixed(1)}
                                    </span>
                                  )}
                                </div>
                                {reading && (
                                  <div className="text-[10px] font-mono mt-1" style={{ color: C.textMuted }}>
                                    <Clock size={9} className="inline mr-1" />
                                    {new Date(reading.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs" style={{ color: C.textMuted }}>No reading logged</span>
                            )}
                          </div>
                          {hist.length >= 2 && (
                            <div className="hidden sm:block">
                              <MiniSparkline values={hist.slice(0, 7).map(r => r.value)} color={status === 'critical' ? C.red : status === 'caution' ? '#fbbf24' : C.green} />
                            </div>
                          )}
                        </div>

                        {editingId === ind.id ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <input
                              autoFocus
                              type="number"
                              step="any"
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const n = parseFloat(draft);
                                  if (!Number.isNaN(n)) handleSave(ind.id, n);
                                  setEditingId(null);
                                }
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              placeholder={`Enter ${ind.name}...`}
                              className="w-full bg-obsidian border border-cyan-500/30 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const n = parseFloat(draft);
                                  if (!Number.isNaN(n)) handleSave(ind.id, n);
                                  setEditingId(null);
                                }}
                                className="flex-1 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white text-xs font-orbitron rounded border border-cyan-400"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="py-1.5 px-3 bg-obsidian border text-slate-400 text-xs font-mono rounded hover:text-white hover:border-cyan-500/30"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(ind.id);
                              setDraft(val !== null ? String(val) : '');
                            }}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded text-xs font-mono border transition-all hover:border-cyan-500/50 hover:text-cyan-300"
                            style={{ borderColor: 'rgba(0,243,255,0.2)', color: C.textMuted, background: 'transparent' }}
                          >
                            <Plus size={11} />
                            Log {ind.name}
                          </button>
                        )}

                        {hist.length >= 3 && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,243,255,0.08)' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>7d trend</span>
                              <div className="flex-1 h-5 flex items-end gap-0.5">
                                {hist.slice(-7).map((r, j) => {
                                  const maxV = Math.max(...hist.slice(-7).map(x => x.value), ind.normalRange[1] * 1.1);
                                  const minV = Math.min(...hist.slice(-7).map(x => x.value), ind.normalRange[0] * 0.9);
                                  const range = maxV - minV || 1;
                                  const h = Math.max(3, ((r.value - minV) / range) * 100);
                                  const ok = r.value >= ind.normalRange[0] && r.value <= ind.normalRange[1];
                                  return (
                                    <div
                                      key={j}
                                      className="flex-1 rounded-t-sm transition-all"
                                      style={{ height: `${h}%`, background: ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)', minHeight: 3 }}
                                                                         />
                                   );
                                 })}
                               </div>
                             </div>
                           </div>
                         )}
                       </SciBox>
                     </motion.div>
                  )
                })}
                </div>
             </div>
          )}

          {/* ─── Body View ──────────── */}
          {view === 'body' && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-5">
                <SciBox className="overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: C.cyanBorder }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                      <Globe size={15} className="text-cyan-400" style={{ filter: 'drop-shadow(0 0 4px #00f3ff)' }} />
                      <span className="font-medium">Body Systems Explorer</span>
                    </div>
                    <Label text="CLICK BODY PARTS" color="cyan" glow />
                  </div>
                  <div className="h-[380px] sm:h-[440px]">
                    <ThreeScene
                    onSelectBodyPart={handleBodySelect}
                    vitals={{
                      heartRate: currentValues['heart-rate'] ?? null,
                      spo2: currentValues['oxygen-sat'] ?? null,
                    }}
                  />
                  </div>
                </SciBox>

                <SystemDetailPanel
                  system={activeSystem}
                  currentValues={currentValues}
                  history={history}
                  editingId={editingId}
                  draft={draft}
                  onDraftChange={setDraft}
                  onStartEdit={onStartEdit}
                  onCancelEdit={onCancelEdit}
                  onSave={handleSave}
                  onOpenHazard={handleOpenHazard}
                  onOpenActions={handleOpenActions}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bodySystems.map(sys => (
                    <button
                      key={sys.id}
                      onClick={() => setSelectedSystem(sys.id)}
                      className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all hover:border-cyan-500/40 hover:bg-cyan-950/20"
                      style={{
                        borderColor: selectedSystem === sys.id ? sys.color : 'rgba(0,243,255,0.15)',
                        background: selectedSystem === sys.id ? `${sys.color}14` : 'transparent',
                        boxShadow: selectedSystem === sys.id ? `0 0 14px ${sys.color}33` : undefined,
                      }}
                    >
                      <FontAwesomeIcon icon={getEmoji(sys.id)} size="lg" style={{ color: sys.color, filter: 'drop-shadow(0 0 4px rgba(0,243,255,0.3))' }} />
                      <div>
                        <XenText size="sm">{sys.name}</XenText>
                        <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>{sys.indicators.length} indicator{sys.indicators.length !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <SciBox className="p-5">
                  <Label text="MISSION PROGRESS" color="cyan" />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={12} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }} />
                      <XenText size="sm" glowColor="cyan">{stats.total_xp} XP</XenText>
                    </div>
                    <XenText size="sm" glowColor="cyan">Level {level}</XenText>
                  </div>
                                     <div className="mt-2">
                    <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                      <span>Next rank</span>
                      <span style={{ color: currentLevel.color }}>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-obsidian rounded-full h-2 overflow-hidden border" style={{ borderColor: C.cyanBorder }}>
                      <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.color || '#a855f7'})` }} />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid rgba(0,243,255,0.1)' }}>
                    {[
                      { v: stats.current_streak.toString(), l: 'Streak', c: '#f97316' },
                      { v: stats.total_checkins.toString(), l: 'Logs', c: C.cyan },
                      { v: stats.unlocked_badges.length.toString(), l: 'Badges', c: C.green },
                    ].map(s => (
                      <div key={s.l} className="text-center p-2 rounded" style={{ background: 'rgba(8,12,20,0.6)', border: '1px solid rgba(0,243,255,0.1)' }}>
                        <div className="text-sm font-bold" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-[10px]" style={{ color: C.textMuted }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </SciBox>

                <SciBox className="p-5" glowColor="green">
                  <Label text="ABOUT ASTRA" color="green" />
                  <div className="mt-2 space-y-2 text-xs" style={{ color: C.textDim }}>
                    {[
                      'Real-time 3D body map with clickable systems',
                      'NASA HRP 5-hazard framework mapped to body',
                      'Real vital sign logging with local storage',
                      'Trend tracking with 7-day sparklines',
                      `Mission: ${mission.name} // ${mission.environment}`,
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: C.green, boxShadow: '0 0 4px rgba(34,197,94,0.6)' }} />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </SciBox>
              </div>
            </div>
          )}

          {/* ─── Actions View ──────── */}
          {view === 'actions' && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-3">
                {actionLibrary.map((action, i) => (
                  <SciBox key={action.id} className="p-5" glowColor={i === 0 ? 'cyan' : 'purple'}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Label text="GUIDANCE" color="cyan" />
                          {action.indicators.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(34,197,94,0.08)', color: C.green, border: '1px solid rgba(34,197,94,0.2)' }}>
                              {action.indicators.length} indicator{action.indicators.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <XenText size="md" glowColor={i === 0 ? 'cyan' : 'purple'}>{action.title}</XenText>
                        <p className="text-sm mt-1" style={{ color: C.textDim }}>{action.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-cyan-400 shrink-0 mt-1" style={{ filter: 'drop-shadow(0 0 4px rgba(0,243,255,0.4))' }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {action.steps.slice(0, 4).map((step, j) => (
                        <div key={j} className="p-2 rounded bg-obsidian/60 border text-center text-[10px] font-mono" style={{ borderColor: 'rgba(0,243,255,0.15)', color: C.textMuted }}>
                          <span className="text-cyan-400 font-bold">{j + 1}</span>
                          <br />
                          {step.length > 25 ? step.slice(0, 22) + '…' : step}
                        </div>
                      ))}
                    </div>
                  </SciBox>
                ))}
              </div>
              <div className="space-y-4">
                <SciBox className="p-5">
                  <Label text="QUICK GUIDANCE" color="cyan" />
                  <div className="mt-2 space-y-1">
                    {actionLibrary.slice(0, 5).map(a => (
                      <button key={a.id} className="w-full text-left px-3 py-2 rounded text-xs font-mono transition-all hover:bg-cyan-950/30 hover:text-cyan-300 border border-transparent hover:border-cyan-500/20" style={{ color: C.textMuted }}>
                        {a.title}
                      </button>
                    ))}
                  </div>
                </SciBox>
                <SciBox className="p-5" glowColor="purple">
                  <Label text="STREAK STATUS" color="purple" />
                                      <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-cyan-950 border flex items-center justify-center" style={{ borderColor: C.cyan }}>
                      <Zap size={18} className="text-orange-400" style={{ filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.5))' }} />
                    </div>
                    <div>
                      <XenText size="lg" glowColor="red">{stats.current_streak}</XenText>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>Day Streak</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-mono" style={{ color: C.textMuted }}>
                    Best: {stats.longest_streak} days · Keep logging to maintain
                  </div>
                </SciBox>
              </div>
            </div>
          )}

          {/* ─── Education View ───── */}
          {view === 'education' && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-1 sci-box p-1" style={{ background: 'transparent' }}>
                {(['indicators', 'hazards', 'glossary', 'exercise', 'nutrition'] as EducationTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setEducationTab(t)}
                    className={`px-4 py-2 rounded-lg text-xs font-orbitron transition-all ${educationTab === t ? 'bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.2)]' : 'text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-500/20'}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {educationTab === 'indicators' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indicators.map(ind => {
                    const ic = getIndColor(ind.id);
                    const em = getIndIcon(ind.id);
                    return (
                      <SciBox key={ind.id} glowColor={ic === C.red ? 'red' : ic === C.cyan ? 'cyan' : 'purple'} className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${ic}12`, color: ic }}>
                              <FontAwesomeIcon icon={em} size="lg" />
                            </div>
                            <div>
                              <XenText size="md" glowColor={ic === C.red ? 'red' : 'cyan'}>{ind.name}</XenText>
                              <div className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{ind.unit} · {ind.normalRange.join(' – ')}</div>
                            </div>
                          </div>
                          <StatusBadge status="healthy" />
                        </div>
                        <p className="text-sm" style={{ color: C.textDim }}>{ind.description}</p>
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,243,255,0.1)' }}>
                          <Label text="HOW TO MEASURE" color="cyan" />
                          <p className="text-xs mt-1" style={{ color: C.textDim }}>{ind.measurement}</p>
                        </div>
                        <div className="mt-2">
                          <Label text="IN SPACE" color="purple" />
                          <p className="text-xs mt-1" style={{ color: C.textDim }}>{ind.spaceContext}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ind.hazardLinks.map(h => (
                            <span key={h} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(239,68,68,0.08)', color: C.red, border: '1px solid rgba(239,68,68,0.2)' }}>
                              <span className="flex items-center gap-1">
                                <HazardIcon id={h} />
                                {hazardLabel(h)}
                              </span>
                            </span>
                          ))}
                        </div>
                                              </SciBox>
                      );
                    })}
                </div>
              )}

              {educationTab === 'hazards' && (
                <div className="space-y-4">
                  <SciBox glowColor="red" className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={16} className="text-red-400" style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }} />
                      <XenText size="lg" glowColor="red">FIVE HAZARDS OF HUMAN SPACEFLIGHT</XenText>
                    </div>
                    <p className="text-sm" style={{ color: C.textDim }}>NASA's Human Research Program identifies five hazards that drive astronaut health risks.</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      {hazards.map(h => (
                        <div key={h.id} className="p-4 rounded bg-obsidian/80 border" style={{ borderColor: C.cyanBorder }}>
                          <div className="flex items-center justify-between mb-2">
                            <Label text={h.tag} color="cyan" />
                            <span className="text-[10px] font-orbitron font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ background: h.severity === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', color: h.severity === 'HIGH' ? C.red : '#fbbf24', border: `1px solid ${h.severity === 'HIGH' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                              {h.severity}
                            </span>
                          </div>
                          <XenText size="sm" glowColor="cyan">{h.name}</XenText>
                          <p className="text-xs mt-1" style={{ color: C.textDim }}>{h.summary}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.indicators.map((ind, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 font-mono">{ind}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SciBox>
                </div>
              )}

              {educationTab === 'glossary' && (
                <div className="space-y-3">
                  {glossary.map(g => (
                    <SciBox key={g.term} className="p-5" glowColor="cyan">
                      <div className="flex items-baseline gap-2 mb-1">
                        <XenText size="md" glowColor="cyan">{g.term}</XenText>
                        {g.standsFor && <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>({g.standsFor})</span>}
                      </div>
                      <p className="text-sm" style={{ color: C.textDim }}>{g.definition}</p>
                    </SciBox>
                  ))}
                </div>
              )}

              {educationTab === 'exercise' && (
                <div className="space-y-3">
                  {exerciseLibrary.map(ex => (
                    <SciBox key={ex.id} className="p-5" glowColor="green">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <XenText size="md" glowColor="green">{ex.name}</XenText>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{ex.duration} · {ex.frequency}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(34,197,94,0.08)', color: C.green, border: '1px solid rgba(34,197,94,0.2)' }}>EXERCISE</span>
                      </div>
                      <p className="text-sm" style={{ color: C.textDim }}>{ex.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ex.bodyParts.map(p => (
                          <span key={p} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(0,243,255,0.06)', color: C.cyan, border: '1px solid rgba(0,243,255,0.15)' }}>{p}</span>
                        ))}
                      </div>
                    </SciBox>
                  ))}
                </div>
              )}

              {educationTab === 'nutrition' && (
                <div className="space-y-3">
                  {nutritionTips.map(t => (
                    <SciBox key={t.id} className="p-5" glowColor="cyan">
                      <XenText size="md" glowColor="cyan">{t.title}</XenText>
                      <p className="text-sm mt-1" style={{ color: C.textDim }}>{t.body}</p>
                    </SciBox>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Profile View ─────── */}
          {view === 'profile' && (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-5">
                <SciBox className="p-6" glowColor="cyan">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' }} />
                      <XenText size="lg" glowColor="cyan">MISSION PROGRESS</XenText>
                    </div>
                    <div className="text-right">
                      <XenText size="xl" glowColor="cyan">{stats.total_xp}</XenText>
                      <span className="text-xs font-mono ml-1" style={{ color: C.textMuted }}>XP</span>
                    </div>
                  </div>

                                     <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: C.textMuted }}>
                    <span className="font-orbitron" style={{ color: C.text }}>{currentLevel.name} · Lv.{level}</span>
                    <span className="font-mono" style={{ color: currentLevel.color }}>{stats.total_xp} / {maxXp} XP</span>
                  </div>
                  <div className="w-full bg-obsidian rounded-full h-3 overflow-hidden border mt-1" style={{ borderColor: C.cyanBorder }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 1)]?.color || '#a855f7'}, ${gamification.levels[Math.min(gamification.levels.length - 1, gamification.levels.indexOf(currentLevel) + 2)]?.color || '#ec4899'})` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,243,255,0.1)' }}>
                    {[
                      { label: 'Day Streak', value: String(stats.current_streak), sub: 'days', color: '#f97316' },
                      { label: 'Total Logs', value: String(stats.total_checkins), sub: 'readings', color: C.cyan },
                      { label: 'Badges', value: String(stats.unlocked_badges.length), sub: 'earned', color: C.green },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-lg" style={{ background: 'rgba(8,12,20,0.6)', border: '1px solid rgba(0,243,255,0.1)' }}>
                        <div className="text-2xl font-orbitron font-bold" style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}>{s.value}</div>
                        <div className="text-xs mt-1" style={{ color: C.textMuted }}>{s.label}</div>
                        <div className="text-[10px]" style={{ color: C.textMuted }}>{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </SciBox>

                <SciBox className="p-6" glowColor="purple">
                  <XenText size="md" glowColor="purple">RESEARCH FOUNDATION</XenText>
                  <div className="mt-4 space-y-3">
                    {contributors.map(c => (
                      <div key={c.id} className="p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.15)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(168,85,247,0.15)', color: C.purple }}>
                            {c.avatar[0]}
                          </div>
                          <div>
                            <XenText size="sm" glowColor="purple">{c.name}</XenText>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: C.textMuted }}>{c.role}</p>
                          </div>
                        </div>
                        <p className="text-xs italic" style={{ color: C.textDim }}>“{c.quote}”</p>
                      </div>
                    ))}
                  </div>
                </SciBox>
              </div>

              <div className="space-y-4">
                <SciBox className="p-5" glowColor="cyan">
                  <Label text="DAILY CHECKLIST" color="cyan" />
                  <div className="mt-3 space-y-2">
                    {indicators.map(ind => {
                      const done = currentValues[ind.id] !== null;
                      return (
                        <div key={ind.id} className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${done ? 'bg-cyan-400 text-white' : 'border border-slate-600'}`} style={{ boxShadow: done ? '0 0 6px rgba(0,243,255,0.5)' : undefined }}>
                            {done && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-xs font-mono ${done ? 'text-cyan-300' : 'text-slate-500'}`}>{ind.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </SciBox>

                <SciBox className="p-5" glowColor="purple">
                  <Label text="ACHIEVEMENTS" color="purple" />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {gamification.badges.map(badge => {
                      const unlocked = stats.unlocked_badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className="rounded-lg p-2.5 border transition-all"
                          style={{
                            borderColor: unlocked ? 'rgba(168,85,247,0.35)' : 'rgba(100,116,139,0.15)',
                            background: unlocked ? 'rgba(168,85,247,0.08)' : 'rgba(8,12,20,0.5)',
                            opacity: unlocked ? 1 : 0.5,
                          }}
                        >
                          <div className="text-base" style={{ filter: unlocked ? 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' : 'grayscale(1)' }}>
                            {unlocked ? <FontAwesomeIcon icon={faMedal} size="sm" style={{ filter: unlocked ? 'drop-shadow(0 0 4px rgba(168,85,247,0.6))' : 'grayscale(1)' }} /> : <FontAwesomeIcon icon={faLock} size="sm" style={{ filter: 'grayscale(1)' }} />}
                          </div>
                          <p className="text-[10px] font-mono mt-1 leading-tight" style={{ color: unlocked ? C.purple : C.textMuted }}>
                            {badge.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </SciBox>

                <SciBox className="p-5" glowColor="green">
                  <Label text="MISSION SETTINGS" color="green" />
                  <div className="mt-3 space-y-3 text-xs font-mono" style={{ color: C.textMuted }}>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(0,243,255,0.08)' }}>
                      <span>Callsign</span>
                      <span className="text-cyan-300">{profile.callsign || mission.callsign}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(0,243,255,0.08)' }}>
                      <span>Environment</span>
                      <span className="text-cyan-300">{mission.environment}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(0,243,255,0.08)' }}>
                      <span>Mission Cycle</span>
                      <span className="text-cyan-300">{mission.cycle}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(0,243,255,0.08)' }}>
                      <span>Notifications</span>
                      <span className="text-cyan-300">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5" style={{ borderColor: 'rgba(0,243,255,0.08)' }}>
                      <span>Data Sync</span>
                      <span className="text-cyan-300">{isSupabaseConfigured ? 'Connected' : 'Local Only'}</span>
                    </div>
                  </div>
                </SciBox>

                <SciBox className="p-5" glowColor="purple">
                  <Label text="EDIT PROFILE" color="purple" />
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                        Player Name
                      </label>
                      <input
                        type="text"
                        value={profile.player_name}
                        onChange={(e) => setProfile(prev => ({ ...prev, player_name: e.target.value }))}
                        className="w-full bg-obsidian border border-cyan-500/30 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                        placeholder="Enter name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                        Role / Rank
                      </label>
                      <input
                        type="text"
                        value={profile.player_role}
                        onChange={(e) => setProfile(prev => ({ ...prev, player_role: e.target.value }))}
                        className="w-full bg-obsidian border border-cyan-500/30 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                        placeholder="Enter role"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono mb-1" style={{ color: C.textMuted }}>
                        Callsign
                      </label>
                      <input
                        type="text"
                        value={profile.callsign || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, callsign: e.target.value }))}
                        className="w-full bg-obsidian border border-cyan-500/30 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                        placeholder="Enter callsign"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (profile.id) {
                          await saveProfile(profile);
                        }
                      }}
                      className="w-full py-2 rounded text-xs font-mono font-bold transition-all"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(0,243,255,0.3), rgba(168,85,247,0.3))',
                        color: C.cyan,
                        border: '1px solid rgba(0,243,255,0.4)',
                      }}
                    >
                      SAVE PROFILE
                    </button>
                  </div>
                </SciBox>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t pb-4" style={{ borderColor: 'rgba(0,243,255,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-mono" style={{ color: C.textMuted }}>
          <p>A.S.T.R.A. Human Performance System // NASA Space Apps Challenge Edition</p>
          <p>Guidance supports flight medical protocol; clinical assessment verified.</p>
          <p>3D model: “Astronaut by Jungle Jim” · CC-BY-4.0</p>
        </div>
      </footer>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px rgba(0,243,255,0.8)); }
          50% { opacity: 0.6; filter: drop-shadow(0 0 2px rgba(0,243,255,0.2)); }
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,243,255,0.15), transparent);
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 70, h = 28;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
    </svg>
  );
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getEmoji(id: string) {
  const map: Record<string, typeof faHeart> = {
    cardiovascular: faHeart,
    respiratory: faLungs,
    metabolic: faFlask,
    neurological: faBrain,
    musculoskeletal: faBone,
    immune: faShieldHalved,
    behavioral: faBan,
  };
  return map[id] || faFlask;
}

function hazardLabel(id: string): string {
  const map: Record<string, string> = {
    radiation: 'Radiation',
    isolation: 'Isolation',
    distance: 'Distance',
    gravity: 'Gravity',
    closed: 'Closed Env',
  };
  return map[id] || id;
}

function HazardIcon({ id }: { id: string }) {
  const map: Record<string, typeof faSun> = {
    radiation: faSun,
    isolation: faLock,
    distance: faGlobe,
    gravity: faMoon,
    closed: faHouse,
  };
  return <FontAwesomeIcon icon={map[id] || faQuestionCircle} size="xs" style={{ color: C.red }} />;
}

// Education tab state — moved inside component below
