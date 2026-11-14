'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Clock } from 'lucide-react';
import type { ActionLibrary } from '../content';

interface ActionCardProps {
  action: ActionLibrary;
  isActive?: boolean;
  onClick?: () => void;
}

export function ActionCard({ action, isActive = false, onClick }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass rounded-xl overflow-hidden transition-all duration-300 border ${isActive ? 'border-indigo-500/30' : 'border-transparent'}`}
      onClick={onClick}
    >
      <button
        className="w-full p-4 text-left hover:bg-indigo-500/5 transition-colors"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--text-secondary)' }}>
                ACTION
              </span>
              {action.indicators.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--status-healthy)' }}>
                  {action.indicators.length} indicator{action.indicators.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-primary" style={{ color: 'var(--text-primary)' }}>
              {action.title}
            </h3>
            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {action.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {expanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-indigo-500/10 pt-3 space-y-3">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={14} />
              {action.steps.length} step{action.steps.length > 1 ? 's' : ''}
            </div>
            <ol className="space-y-2">
              {action.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                    style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--text-secondary)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
            {action.indicators.length > 0 && (
              <div className="pt-2 border-t border-indigo-500/10">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Relevant indicators:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {action.indicators.map(id => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded text-xs font-mono"
                      style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--status-healthy)' }}
                    >
                      {id.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
