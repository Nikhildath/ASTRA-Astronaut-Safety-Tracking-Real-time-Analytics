'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Check, Info } from 'lucide-react';
import { HealthRing } from './HealthRing';
import type { Indicator, Reading } from '../content';

interface IndicatorCardProps {
  indicator: Indicator;
  currentValue?: number | null;
  history?: Reading[];
  onSave: (value: number, notes?: string) => void;
  savedValue?: number | null;
  isSaving?: boolean;
  lastUpdated?: string;
}

type Status = 'healthy' | 'caution' | 'critical' | 'no-data';

function getStatus(
  value: number,
  normalMin: number,
  normalMax: number,
  criticalMax: number,
  lowCriticalMax: number
): Status {
  if (value > criticalMax || value < lowCriticalMax) return 'critical';
  if (value >= normalMin && value <= normalMax) return 'healthy';
  return 'caution';
}

function StatusBadge({ status }: { status: Status }) {
  const configs = {
    healthy: { label: 'NORMAL', color: 'var(--status-healthy)', bg: 'rgba(16,185,129,0.1)' },
    caution: { label: 'CAUTION', color: 'var(--status-caution)', bg: 'rgba(245,158,11,0.1)' },
    critical: { label: 'CRITICAL', color: 'var(--status-critical)', bg: 'rgba(239,68,68,0.1)' },
    'no-data': { label: 'NO DATA', color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)' },
  };
  const cfg = configs[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}20` }}
    >
      {status === 'healthy' && <Check size={12} />}
      {status === 'caution' && <AlertTriangle size={12} />}
      {status === 'critical' && <AlertTriangle size={12} />}
      {cfg.label}
    </span>
  );
}

export function IndicatorCard({
  indicator,
  currentValue,
  history = [],
  onSave,
  savedValue,
  isSaving = false,
  lastUpdated,
}: IndicatorCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [notes, setNotes] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const status: Status = currentValue !== undefined && currentValue !== null && !isNaN(currentValue)
    ? getStatus(currentValue, indicator.normalRange[0], indicator.normalRange[1], indicator.criticalRange[1], indicator.lowCritical[1])
    : 'no-data';

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(inputValue);
    if (!isNaN(num) && isFinite(num)) {
      onSave(num, notes || undefined);
      setInputValue('');
      setNotes('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowInput(false);
      setInputValue('');
      setNotes('');
    }
  };

  // Calculate trend from history
  const trend = history.length >= 2 ? history[history.length - 1].value - history[history.length - 2].value : 0;
  const trendIcon = trend > 0.5 ? <TrendingUp size={14} /> : trend < -0.5 ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColor = trend > 0 ? 'var(--status-caution)' : trend < 0 ? 'var(--status-healthy)' : 'var(--text-muted)';

  const displayValue = savedValue !== undefined && savedValue !== null ? savedValue : currentValue;

  return (
    <div
      className="glass rounded-xl p-5 transition-all duration-300 hover:border-indigo-500/30 group"
      style={{ borderColor: status === 'critical' ? 'rgba(239,68,68,0.3)' : 'var(--space-border)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-primary flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            {indicator.name}
            <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--text-secondary)' }}>
              {indicator.unit}
            </span>
          </h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Normal: {indicator.normalRange[0]}–{indicator.normalRange[1]}
            {indicator.unit !== '/10' && indicator.unit !== '% SpO2' ? ` ${indicator.unit}` : ''}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center gap-6 mb-4">
        <HealthRing
          value={displayValue !== undefined && displayValue !== null ? displayValue : 0}
          normalMin={indicator.normalRange[0]}
          normalMax={indicator.normalRange[1]}
          criticalMax={indicator.criticalRange[1]}
          lowCriticalMax={indicator.lowCritical[1]}
          unit=""
          size={72}
          strokeWidth={6}
          showValue={false}
        />
        <div className="flex-1">
          {displayValue !== undefined && displayValue !== null ? (
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight" style={{ color: status === 'critical' ? 'var(--status-critical)' : status === 'caution' ? 'var(--status-caution)' : 'var(--text-primary)' }}>
                  {indicator.format ? indicator.format(displayValue) : displayValue}
                </span>
                <span className="text-sm flex items-center gap-1" style={{ color: trendColor }}>
                  {trendIcon}
                  {Math.abs(trend) > 0.1 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}` : 'stable'}
                </span>
              </div>
              {lastUpdated && (
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Updated {lastUpdated}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No reading yet
            </span>
          )}
        </div>
      </div>

      {showInput ? (
        <form onSubmit={handleSave} className="space-y-3 animate-in">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="number"
              step="any"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${indicator.name}...`}
              className="flex-1 bg-space-bg-2 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-indigo-400 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowInput(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'rgba(100,116,139,0.1)' }}
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)..."
            className="w-full bg-space-bg-2 border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-indigo-400/50 transition-colors"
            style={{ color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving || !inputValue}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSaving ? 'var(--text-muted)' : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.3))',
                color: 'var(--text-primary)',
                border: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              {isSaving ? 'Saving...' : 'Save Reading'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all group/action border border-dashed border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-secondary"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center justify-center gap-2">
            <Info size={14} className="opacity-60" />
            Log {indicator.name}
            <span className="text-xs opacity-60">(normal: {indicator.normalRange[0]}–{indicator.normalRange[1]})</span>
          </span>
        </button>
      )}

      {/* Mini trend sparkline */}
      {history.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-indigo-500/10">
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>7-day trend</span>
            <span className="flex items-center gap-1" style={{ color: trendColor }}>
              {trendIcon} {trend > 0 ? 'rising' : trend < 0 ? 'falling' : 'stable'}
            </span>
          </div>
          <div className="mt-2 h-8 flex items-end gap-0.5">
            {history.slice(-7).map((reading, i) => {
              const maxVal = Math.max(...history.slice(-7).map(r => r.value), indicator.normalMax * 1.2);
              const minVal = Math.min(...history.slice(-7).map(r => r.value), indicator.normalMin * 0.8);
              const range = maxVal - minVal || 1;
              const height = ((reading.value - minVal) / range) * 100;
              const isNormal = reading.value >= indicator.normalRange[0] && reading.value <= indicator.normalRange[1];
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-colors"
                  style={{
                    height: `${Math.max(4, height)}%`,
                    background: isNormal ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
                    opacity: 0.6 + (i / history.slice(-7).length) * 0.4,
                    minHeight: 4,
                  }}
                  title={`${reading.value} on ${new Date(reading.timestamp).toLocaleDateString()}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
