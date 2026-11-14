'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface HealthRingProps {
  value: number;
  normalMin: number;
  normalMax: number;
  criticalMax?: number;
  lowCriticalMax?: number;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function HealthRing({
  value,
  normalMin,
  normalMax,
  criticalMax = 999,
  lowCriticalMax = 0,
  unit = '',
  size = 120,
  strokeWidth = 8,
  label,
  showValue = true,
  className = '',
}: HealthRingProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const isInRange = value >= normalMin && value <= normalMax;
  const isCritical = value > criticalMax || value < lowCriticalMax;
  const isCaution = !isInRange && !isCritical;

  const statusColor = isCritical
    ? 'var(--status-critical)'
    : isCaution
    ? 'var(--status-caution)'
    : 'var(--status-healthy)';

  // Calculate the percentage along the arc
  // We map the value to a 0-100% range based on the full possible range
  const fullRange = criticalMax - lowCriticalMax;
  const normalizedValue = Math.max(0, Math.min(100, ((value - lowCriticalMax) / fullRange) * 100));
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
  const offset = circumference - (normalizedValue / 100) * circumference;

  useEffect(() => {
    const path = svgRef.current?.querySelector('.health-ring-fg');
    if (path) {
      gsap.set(path, { strokeDashoffset: circumference });
      gsap.to(path, {
        strokeDashoffset: offset,
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  }, [value, offset, circumference]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          ref={svgRef}
          className="health-ring"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="health-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            strokeWidth={strokeWidth}
          />
          <circle
            className="health-ring-fg"
            cx={size / 2}
            cy={size / 2}
            r={(size - strokeWidth) / 2}
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: statusColor }}
            >
              {value}
              {unit && <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
            </span>
          </div>
        )}
        {isCritical && (
          <div className="absolute inset-0 flex items-center justify-center pulse-critical">
            <span className="text-lg" style={{ color: 'var(--status-critical)' }}>!</span>
          </div>
        )}
      </div>
      {label && (
        <span className="mt-2 text-sm font-medium text-secondary" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
