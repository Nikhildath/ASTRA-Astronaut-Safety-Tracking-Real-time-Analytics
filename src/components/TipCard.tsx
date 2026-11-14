'use client';

import { Sparkles, Lightbulb } from 'lucide-react';
import { tips } from '../content';

interface TipCardProps {
  onTipChange?: (tipId: string | null) => void;
}

export function TipCard({ onTipChange }: TipCardProps) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} style={{ color: '#a855f7' }} />
        <h2 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Health Tips
        </h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
          {tips.length} tips
        </span>
      </div>

      <div className="space-y-2">
        {tips.map((tip) => (
          <button
            key={tip.id}
            onClick={() => onTipChange?.(tip.id)}
            className="w-full text-left p-3 rounded-lg transition-all hover:bg-indigo-500/5 group"
            style={{ border: '1px solid transparent' }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${onTipChange && onTipChange.toString() ? 'cursor-pointer' : ''}`}
                style={{
                  background: 'rgba(168,85,247,0.15)',
                  color: '#a855f7',
                }}
              >
                <Lightbulb size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {tip.title}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {tip.body}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
