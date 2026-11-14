'use client';

import { MapPin, Activity, Info } from 'lucide-react';
import { faHeart, faLungs, faFlask, faBrain, faBone, faShieldHalved, faSun, faGlobe, faHouse, faQuestionCircle, faBan, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { bodySystems } from '../content';

interface BodySystemCardProps {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

const ICON_COLORS: Record<string, string> = {
  cardiovascular: '#ef4444',
  respiratory: '#f97316',
  metabolic: '#eab308',
  neurological: '#8b5cf6',
  musculoskeletal: '#06b6d4',
  immune: '#10b981',
  behavioral: '#ec4899',
};

function SystemIcon({ systemId, isActive }: { systemId: string; isActive: boolean }) {
  const color = ICON_COLORS[systemId] || '#6366f1';
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all"
      style={{
        background: isActive ? `${color}20` : 'rgba(99,102,241,0.05)',
        color,
        border: `2px solid ${isActive ? color : 'transparent'}`,
      }}
    >
      {getIcon(systemId)}
    </div>
  );
}

function getIcon(systemId: string) {
  const iconMap: Record<string, typeof faHeart> = {
    cardiovascular: faHeart,
    respiratory: faLungs,
    metabolic: faFlask,
    neurological: faBrain,
    musculoskeletal: faBone,
    immune: faShieldHalved,
    behavioral: faBan,
  };
  return iconMap[systemId] || faFlask;
}

export function BodySystemCard({ selectedId, onSelect }: BodySystemCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-display font-bold" style={{ color: 'var(--text-primary)' }}>
          Body Systems
        </h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--text-muted)' }}>
          7 systems
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Click a system to explore how spaceflight affects it and which indicators to monitor.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {bodySystems.map((system) => {
          const isActive = selectedId === system.id;
          const color = ICON_COLORS[system.id] || '#6366f1';

          return (
            <button
              key={system.id}
              onClick={() => onSelect?.(system.id)}
              className={`rounded-xl p-3 text-left transition-all border ${isActive ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-transparent hover:border-indigo-500/20'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all shrink-0"
                  style={{
                    background: isActive ? `${color}20` : 'rgba(100,116,139,0.1)',
                    color,
                    border: isActive ? `2px solid ${color}` : '1px solid transparent',
                  }}
                >
                  <FontAwesomeIcon icon={getIcon(system.id)} size="lg" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: isActive ? color : 'var(--text-primary)' }}>
                    {system.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {system.indicators.length} indicator{system.indicators.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {system.hazards.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {system.hazards.map(hazId => (
                    <span
                      key={hazId}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                      }}
                    >
                      <FontAwesomeIcon icon={hazId === 'radiation' ? faSun :
                        hazId === 'isolation' ? faLock :
                        hazId === 'distance' ? faGlobe :
                        hazId === 'gravity' ? faMoon :
                        hazId === 'closed' ? faHouse : faQuestionCircle} size="xs" />
                      {' '}{hazId}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
