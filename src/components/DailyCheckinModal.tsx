'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Plus, Minus, Activity,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart, faLungs, faDroplet, faThermometerHalf, faMoon,
  faFaceSmile, faWater, faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { indicators } from '../content';

const C = {
  void: '#030509',
  obsidian: '#080c14',
  panel: '#0d1322',
  cyan: '#00f3ff',
  cyanDim: 'rgba(0,243,255,0.6)',
  cyanGlow: 'rgba(0,243,255,0.15)',
  cyanBorder: 'rgba(0,243,255,0.3)',
  purple: '#a855f7',
  red: '#ef4444',
  green: '#22c55e',
  amber: '#fbbf24',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  textMuted: '#64748b',
};

function inRange(value: number, range: number[]): boolean {
  return value >= Math.min(...range) && value <= Math.max(...range);
}

function getStatus(val: number, ind: typeof indicators[number]): 'healthy' | 'caution' | 'critical' {
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

interface DailyCheckinModalProps {
  currentValues: Record<string, number | null>;
  onClose: () => void;
  onSaveAll: (readings: Record<string, number>, notes?: string) => void;
}

export function DailyCheckinModal({
  currentValues,
  onClose,
  onSaveAll,
}: DailyCheckinModalProps) {
  // Initialize values with current or mid-range defaults
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    indicators.forEach(ind => {
      const existing = currentValues[ind.id];
      if (existing !== null && existing !== undefined) {
        init[ind.id] = String(existing);
      } else {
        // default to normal midpoint
        const mid = (ind.normalRange[0] + ind.normalRange[1]) / 2;
        const decimals = ind.unit === '°C' || ind.unit === 'hours' ? 1 : 0;
        init[ind.id] = String(Math.round(mid * (10 ** decimals)) / (10 ** decimals));
      }
    });
    return init;
  });

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
  };

  const handleAdjust = (id: string, delta: number) => {
    const cur = parseFloat(formData[id]) || 0;
    const ind = indicators.find(i => i.id === id);
    const decimals = ind?.unit === '°C' || ind?.unit === 'hours' ? 1 : 0;
    const newVal = Math.round((cur + delta) * (10 ** decimals)) / (10 ** decimals);
    setFormData(prev => ({ ...prev, [id]: String(newVal) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const parsed: Record<string, number> = {};
    Object.entries(formData).forEach(([id, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num)) parsed[id] = num;
    });
    onSaveAll(parsed, notes || undefined);
    onClose();
  };

  // Count healthy vs caution vs critical
  let healthyCount = 0, cautionCount = 0, criticalCount = 0;
  indicators.forEach(ind => {
    const num = parseFloat(formData[ind.id]);
    if (!isNaN(num)) {
      const s = getStatus(num, ind);
      if (s === 'healthy') healthyCount++;
      else if (s === 'caution') cautionCount++;
      else criticalCount++;
    }
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4 sm:py-10"
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl rounded-xl border overflow-hidden"
          style={{
            background: 'rgba(8,12,20,0.98)',
            borderColor: 'rgba(0,243,255,0.4)',
            boxShadow: '0 0 50px rgba(0,243,255,0.15), 0 0 100px rgba(0,0,0,0.8)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60" />

          {/* Header */}
          <div className="px-6 py-5 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(0,243,255,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'rgba(0,243,255,0.1)', border: '1px solid rgba(0,243,255,0.4)', color: C.cyan }}>
                <Activity size={20} style={{ filter: 'drop-shadow(0 0 6px #00f3ff)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    DAILY BIOMETRIC LOGGING
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/30">
                    +25 XP BONUS
                  </span>
                </div>
                <h2 className="font-orbitron font-bold text-lg text-white tracking-wider mt-0.5">
                  TODAY&apos;S HEALTH CHECK-IN
                </h2>
              </div>
            </div>

            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-red-500/10 hover:border-red-500/30"
              style={{ borderColor: 'rgba(0,243,255,0.15)', color: C.textMuted }}>
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Live summary banner */}
            <div className="flex items-center justify-between p-3 rounded-lg border text-xs font-mono"
              style={{ background: 'rgba(0,243,255,0.03)', borderColor: 'rgba(0,243,255,0.15)' }}>
              <div className="flex items-center gap-4">
                <span className="text-slate-300">Live Assessment:</span>
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {healthyCount} Optimal
                </span>
                {cautionCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {cautionCount} Caution
                  </span>
                )}
                {criticalCount > 0 && (
                  <span className="flex items-center gap-1.5 text-red-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    {criticalCount} Critical
                  </span>
                )}
              </div>
              <span className="text-cyan-400 text-[10px]">
                8 / 8 Tracked
              </span>
            </div>

            {/* Indicator Inputs Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {indicators.map(ind => {
                const color = getIndColor(ind.id);
                const icon = getIndIcon(ind.id);
                const rawVal = formData[ind.id] || '';
                const num = parseFloat(rawVal);
                const valid = !isNaN(num);
                const status = valid ? getStatus(num, ind) : 'healthy';
                const statusC = status === 'critical' ? C.red : status === 'caution' ? C.amber : C.green;
                const step = ind.unit === '°C' ? 0.1 : ind.unit === 'hours' ? 0.5 : 1;

                return (
                  <div
                    key={ind.id}
                    className="rounded-lg border p-3.5 transition-all"
                    style={{
                      background: 'rgba(13,19,34,0.7)',
                      borderColor: status === 'critical' ? 'rgba(239,68,68,0.4)' : status === 'caution' ? 'rgba(245,158,11,0.3)' : 'rgba(0,243,255,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-sm"
                          style={{ background: `${color}15`, color }}>
                          <FontAwesomeIcon icon={icon} />
                        </div>
                        <div>
                          <span className="font-orbitron text-xs font-bold text-white tracking-wide">
                            {ind.name}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400">
                            Normal: {ind.normalRange.join(' – ')} {ind.unit}
                          </p>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold"
                        style={{
                          background: `${statusC}12`,
                          color: statusC,
                          border: `1px solid ${statusC}30`,
                        }}>
                        {status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleAdjust(ind.id, -step)}
                        className="w-8 h-8 rounded border bg-obsidian text-slate-300 flex items-center justify-center hover:border-cyan-400 hover:text-white transition-colors"
                        style={{ borderColor: 'rgba(0,243,255,0.2)' }}
                      >
                        <Minus size={12} />
                      </button>

                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="any"
                          value={rawVal}
                          onChange={e => handleChange(ind.id, e.target.value)}
                          className="w-full bg-obsidian border rounded px-3 py-1.5 text-center font-orbitron font-bold text-sm text-white focus:outline-none transition-colors"
                          style={{
                            borderColor: status === 'critical' ? 'rgba(239,68,68,0.6)' : 'rgba(0,243,255,0.3)',
                            color: statusC,
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 pointer-events-none">
                          {ind.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAdjust(ind.id, step)}
                        className="w-8 h-8 rounded border bg-obsidian text-slate-300 flex items-center justify-center hover:border-cyan-400 hover:text-white transition-colors"
                        style={{ borderColor: 'rgba(0,243,255,0.2)' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mission / Context Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                DAILY MISSION LOG NOTES (OPTIONAL)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Note any EVA activities, exercise routines, sleep quality, or unusual environmental conditions..."
                rows={2}
                className="w-full bg-obsidian border rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                style={{ borderColor: 'rgba(0,243,255,0.2)' }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-lg font-orbitron font-bold text-sm tracking-wider text-white transition-all shadow-lg flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(90deg, #0077b6 0%, #00b4d8 50%, #00f3ff 100%)',
                  boxShadow: '0 0 20px rgba(0,243,255,0.3)',
                  border: '1px solid #00f3ff',
                }}
              >
                <Check size={16} />
                SUBMIT TODAY&apos;S HEALTH LOG (+25 XP)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-6 rounded-lg font-mono text-xs text-slate-400 border bg-obsidian hover:text-white transition-colors"
                style={{ borderColor: 'rgba(0,243,255,0.15)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

