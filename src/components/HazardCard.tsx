'use client';

import { ArrowRight, AlertTriangle } from 'lucide-react';
import { hazards } from '../content';

interface HazardCardProps {
  onClick?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
};

export function HazardCard({ onClick }: HazardCardProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <AlertTriangle size={20} style={{ color: 'var(--status-caution)' }} />
        Five Hazards of Spaceflight
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        NASA's Human Research Program has identified five hazards that affect astronaut health. Click each hazard to learn how it impacts your body and what you can do about it.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {hazards.map((hazard) => {
          const sev = SEVERITY_COLORS[hazard.severity];
          return (
            <button
              key={hazard.id}
              onClick={onClick}
              className="glass rounded-xl p-4 text-left transition-all hover:border-indigo-500/30 group"
              style={{
                borderColor: 'var(--space-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--text-muted)' }}>
                  {hazard.tag}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                >
                  {hazard.severity}
                </span>
              </div>

              <h3 className="text-base font-display font-bold mb-1 group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                {hazard.name}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {hazard.summary}
              </p>

              <div className="mt-3 flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                <span className="text-indigo-400">→</span>
                {hazard.indicators.length} linked indicators
                <ArrowRight size={12} className="ml-1 opacity-50" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
