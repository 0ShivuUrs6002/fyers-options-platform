/// VolatilityChart — SVG sparkline of normalized volatility history.

'use client';

import type { VolatilityRegime } from '@/lib/types';

interface VolatilityChartProps {
  volatilityPerSec: number;
  volatilityMA: number;
  regime: VolatilityRegime;
  history: number[];
}

export function VolatilityChart({
  volatilityPerSec,
  volatilityMA,
  regime,
  history,
}: VolatilityChartProps) {
  // Build SVG sparkline
  const width = 300;
  const height = 60;
  const padding = 4;

  const maxVal = Math.max(...history, volatilityMA, 0.001);
  const points = history.map((val, i) => {
    const x = padding + (i / Math.max(history.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const maY = height - padding - (volatilityMA / maxVal) * (height - 2 * padding);

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Volatility
        </h3>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-text-primary">
            {volatilityPerSec.toFixed(3)}/s
          </span>
          <span className="text-text-muted">
            MA: {volatilityMA.toFixed(3)}/s
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-16"
          preserveAspectRatio="none"
        >
          {/* MA line (dashed) */}
          {history.length > 1 && (
            <line
              x1={padding}
              y1={maY}
              x2={width - padding}
              y2={maY}
              stroke="rgba(139, 146, 165, 0.3)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}

          {/* Volatility line */}
          {history.length > 1 && (
            <polyline
              points={points.join(' ')}
              fill="none"
              stroke={
                regime === 'HIGH_MOMENTUM'
                  ? '#ff4757'
                  : regime === 'COMPRESSION'
                    ? '#4a9eff'
                    : '#00d68f'
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Current value dot */}
          {history.length > 0 && (
            <circle
              cx={padding + ((history.length - 1) / Math.max(history.length - 1, 1)) * (width - 2 * padding)}
              cy={height - padding - (history[history.length - 1] / maxVal) * (height - 2 * padding)}
              r="3"
              fill={
                regime === 'HIGH_MOMENTUM'
                  ? '#ff4757'
                  : regime === 'COMPRESSION'
                    ? '#4a9eff'
                    : '#00d68f'
              }
            />
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
        <span>Rolling 10-cycle normalized volatility</span>
        <span className="ml-auto font-mono">{history.length}/10 samples</span>
      </div>
    </div>
  );
}
