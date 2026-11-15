'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Reading, Indicator } from '../content';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface IndicatorChartProps {
  readings: Reading[];
  indicator: Indicator;
  timeRange: '7d' | '14d' | '30d' | 'all';
  lineColor: string;
}

export function IndicatorChart({
  readings,
  indicator,
  timeRange,
  lineColor,
}: IndicatorChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const [gradient, setGradient] = useState<CanvasGradient | null>(null);

  // Filter and sort chronologically (oldest to newest for X-axis)
  const filtered = useMemo(() => {
    const now = Date.now();
    const days = { '7d': 7, '14d': 14, '30d': 30, all: Infinity }[timeRange];
    return [...readings]
      .filter(r => days === Infinity || (now - r.timestamp) < days * 86400000)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [readings, timeRange]);

  // Create neon glow gradient on canvas mount
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;

    const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    grad.addColorStop(0, `${lineColor}55`); // 33% opacity at peak
    grad.addColorStop(0.6, `${lineColor}15`);
    grad.addColorStop(1, `${lineColor}00`); // fade to transparent
    setGradient(grad);
  }, [filtered, lineColor]);

  const labels = useMemo(() => {
    return filtered.map(r => {
      const d = new Date(r.timestamp);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  }, [filtered]);

  const values = useMemo(() => filtered.map(r => r.value), [filtered]);

  const yMin = useMemo(() => {
    const minVal = Math.min(...values, indicator.normalRange[0]);
    return Math.floor(Math.min(minVal * 0.9, indicator.lowCritical[1] * 0.95));
  }, [values, indicator]);

  const yMax = useMemo(() => {
    const maxVal = Math.max(...values, indicator.normalRange[1]);
    return Math.ceil(Math.max(maxVal * 1.1, (indicator.cautionRange?.[1] ?? indicator.normalRange[1]) * 1.05));
  }, [values, indicator]);

  const chartData: ChartData<'line'> = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: indicator.name,
          data: values,
          borderColor: lineColor,
          borderWidth: 3,
          backgroundColor: gradient || `${lineColor}20`,
          fill: true,
          tension: 0.35, // smooth sci-fi spline curve
          pointBackgroundColor: values.map(v => {
            if (v > indicator.criticalRange[0] || v < indicator.lowCritical[1]) return '#ef4444';
            if (v < indicator.normalRange[0] || v > indicator.normalRange[1]) return '#fbbf24';
            return '#00f3ff';
          }),
          pointBorderColor: '#080c14',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: lineColor,
          pointHoverBorderWidth: 3,
        },
        // Dashed reference line for Normal Range Min
        {
          label: 'Normal Min',
          data: labels.map(() => indicator.normalRange[0]),
          borderColor: 'rgba(34, 197, 94, 0.4)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
        // Dashed reference line for Normal Range Max
        {
          label: 'Normal Max',
          data: labels.map(() => indicator.normalRange[1]),
          borderColor: 'rgba(34, 197, 94, 0.4)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [labels, values, indicator, lineColor, gradient]);

  const options: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 12,
            boxHeight: 2,
            color: '#94a3b8',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
            filter: item => item.text !== 'Normal Min' && item.text !== 'Normal Max',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(13, 19, 34, 0.95)',
          titleColor: '#00f3ff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(0, 243, 255, 0.3)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          titleFont: {
            family: "'Orbitron', sans-serif",
            size: 12,
            weight: 'bold',
          },
          bodyFont: {
            family: "'JetBrains Mono', monospace",
            size: 11,
          },
          callbacks: {
            title: tooltipItems => {
              const idx = tooltipItems[0].dataIndex;
              const r = filtered[idx];
              if (!r) return '';
              const dateStr = new Date(r.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return `SOL DATA // ${dateStr}`;
            },
            label: context => {
              if (context.dataset.label === 'Normal Min' || context.dataset.label === 'Normal Max') {
                return '';
              }
              const val = context.parsed.y;
              if (val === null || val === undefined) return '';
              const idx = context.dataIndex;
              const r = filtered[idx];
              const unitStr = indicator.unit !== '/10' && indicator.unit !== '% SpO2' ? ` ${indicator.unit}` : '';
              let statusLabel = 'OPTIMAL';
              if (val > indicator.criticalRange[0] || val < indicator.lowCritical[1]) {
                statusLabel = 'CRITICAL ALERT';
              } else if (val < indicator.normalRange[0] || val > indicator.normalRange[1]) {
                statusLabel = 'CAUTION';
              }
              const line1 = `Value: ${val}${unitStr} [${statusLabel}]`;
              return r?.notes ? [line1, `Notes: ${r.notes}`] : line1;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 243, 255, 0.05)',
          },
          ticks: {
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          min: yMin,
          max: yMax,
          grid: {
            color: 'rgba(0, 243, 255, 0.06)',
          },
          ticks: {
            color: '#64748b',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 10,
            },
            callback: value => `${value}`,
          },
        },
      },
    };
  }, [filtered, indicator, yMin, yMax]);

  return (
    <div className="relative w-full h-[320px] p-2">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
