/// SupportResistance — S/R levels with confidence meter bars and regime badge.

'use client';

import type { VolatilityRegime } from '@/lib/types';

interface SRProps {
  support: number;
  resistance: number;
  supportConfidence: number;
  resistanceConfidence: number;
  supportStrength: number;
  resistanceStrength: number;
  regime: VolatilityRegime;
  spot: number;
}

const regimeColors: Record<VolatilityRegime, { bg: string; text: string; label: string }> = {
  HIGH_MOMENTUM: { bg: 'bg-bearish/20', text: 'text-bearish', label: 'High Momentum' },
  COMPRESSION: { bg: 'bg-accent-blue/20', text: 'text-accent-blue', label: 'Compression' },
  NORMAL: { bg: 'bg-surface-elevated', text: 'text-text-secondary', label: 'Normal' },
};

function ConfidenceMeter({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const percent = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{percent}%</span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            color === 'text-bullish' ? 'bg-bullish' : 'bg-bearish'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SupportResistance({
  support,
  resistance,
  supportConfidence,
  resistanceConfidence,
  regime,
  spot,
}: SRProps) {
  const distToSupport = spot - support;
  const distToResistance = resistance - spot;
  const regimeStyle = regimeColors[regime];

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Support &amp; Resistance
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${regimeStyle.bg} ${regimeStyle.text}`}
        >
          {regimeStyle.label}
        </span>
      </div>

      {/* Support */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bullish" />
            <span className="text-text-primary text-sm font-medium">Support</span>
          </div>
          <span className="text-metric text-bullish font-mono tabular-nums">
            {support.toFixed(2)}
          </span>
        </div>
        <div className="text-text-muted text-xs font-mono pl-4">
          {distToSupport.toFixed(1)} pts below spot
        </div>
        <ConfidenceMeter
          value={supportConfidence}
          color="text-bullish"
          label="Confidence"
        />
      </div>

      <div className="border-t border-surface-border" />

      {/* Resistance */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-bearish" />
            <span className="text-text-primary text-sm font-medium">Resistance</span>
          </div>
          <span className="text-metric text-bearish font-mono tabular-nums">
            {resistance.toFixed(2)}
          </span>
        </div>
        <div className="text-text-muted text-xs font-mono pl-4">
          {distToResistance.toFixed(1)} pts above spot
        </div>
        <ConfidenceMeter
          value={resistanceConfidence}
          color="text-bearish"
          label="Confidence"
        />
      </div>
    </div>
  );
}
