'use client';

import { Medal, Star, Flame, Trophy, Zap, Shield, Rocket, ListCheck, Sunrise, Users } from 'lucide-react';
import { gamification } from '../content';

interface GamificationPanelProps {
  totalXp?: number;
  currentStreak?: number;
  totalCheckins?: number;
  unlockedBadges?: string[];
}

const BADGE_ICONS: Record<string, typeof Medal> = {
  star: Star,
  flame: Flame,
  trophy: Trophy,
  'list-check': ListCheck,
  sunrise: Sunrise,
  zap: Zap,
  shield: Shield,
  rocket: Rocket,
};

function LevelBadge({ level }: { level: typeof gamification.levels[number] }) {
  return (
    <div className="flex items-center gap-3 glass rounded-xl p-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
        style={{
          background: `${level.color}20`,
          color: level.color,
          border: `2px solid ${level.color}40`,
        }}
      >
        {level.level}
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {level.name}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {level.xpRequired.toLocaleString()} XP to next
        </div>
      </div>
    </div>
  );
}

export function GamificationPanel({
  totalXp = 0,
  currentStreak = 0,
  totalCheckins = 0,
  unlockedBadges = [],
}: GamificationPanelProps) {
  const currentLevel = gamification.levels.find(l => totalXp < l.xpRequired) || gamification.levels[gamification.levels.length - 1];
  const prevLevel = gamification.levels[Math.max(0, gamification.levels.indexOf(currentLevel) - 1)];
  const xpInLevel = prevLevel ? totalXp - prevLevel.xpRequired : totalXp;
  const xpForNext = currentLevel.xpRequired - (prevLevel?.xpRequired || 0);
  const progressPct = Math.min(100, (xpInLevel / xpForNext) * 100);

  return (
    <div className="glass rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Medal size={20} style={{ color: 'var(--status-caution)' }} />
          Mission Progress
        </h2>
        <span className="text-2xl font-bold" style={{ color: 'var(--status-caution)' }}>
          {totalXp.toLocaleString()}
          <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}> XP</span>
        </span>
      </div>

      {/* Level progress */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            {currentLevel.name} <span style={{ color: 'var(--text-muted)' }}>Level {currentLevel.level}</span>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {xpInLevel.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
              boxShadow: '0 0 12px rgba(99,102,241,0.4)',
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-lg p-3 text-center" style={{ borderColor: 'var(--space-border)' }}>
          <Flame size={18} className="mx-auto mb-1" style={{ color: '#f97316' }} />
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{currentStreak}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Day Streak</div>
        </div>
        <div className="glass rounded-lg p-3 text-center" style={{ borderColor: 'var(--space-border)' }}>
          <Rocket size={18} className="mx-auto mb-1" style={{ color: '#6366f1' }} />
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{totalCheckins}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Logs</div>
        </div>
        <div className="glass rounded-lg p-3 text-center" style={{ borderColor: 'var(--space-border)' }}>
          <Shield size={18} className="mx-auto mb-1" style={{ color: '#10b981' }} />
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{unlockedBadges.length}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Badges</div>
        </div>
      </div>

      {/* Badges grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Star size={14} />
          Achievements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {gamification.badges.map(badge => {
            const Icon = BADGE_ICONS[badge.icon] || Star;
            const isUnlocked = unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-lg p-3 text-center transition-all ${isUnlocked ? 'opacity-100' : 'opacity-30 grayscale'}`}
                style={{
                  background: isUnlocked ? 'rgba(99,102,241,0.05)' : 'transparent',
                  border: isUnlocked ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
                }}
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${isUnlocked ? '' : 'grayscale'}`}
                  style={{
                    background: isUnlocked ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.1)',
                    color: isUnlocked ? '#f59e0b' : 'var(--text-muted)',
                  }}
                >
                  <Icon size={20} />
                </div>
                <div className="text-xs font-semibold" style={{ color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {badge.title}
                </div>
                {isUnlocked && <div className="text-xs mt-0.5" style={{ color: '#10b981' }}>Unlocked</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
