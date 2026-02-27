/// MarketPressure — Horizontal gauge from bearish to bullish.

'use client';

interface MarketPressureProps {
  pressure: number; // -1 to +1
  pressureLabel: string;
}

export function MarketPressure({ pressure, pressureLabel }: MarketPressureProps) {
  // Map -1..+1 to 0..100 for positioning
  const position = ((pressure + 1) / 2) * 100;
  const isBullish = pressure > 0.05;
  const isBearish = pressure < -0.05;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Market Pressure
        </h3>
        <span
          className={`text-sm font-semibold ${
            isBullish
              ? 'text-bullish'
              : isBearish
                ? 'text-bearish'
                : 'text-text-secondary'
          }`}
        >
          {pressureLabel}
        </span>
      </div>

      {/* Gauge */}
      <div className="relative">
        {/* Track */}
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-gradient-to-r from-bearish/40 to-bearish/10" />
          <div className="w-px bg-surface-border" />
          <div className="flex-1 bg-gradient-to-r from-bullish/10 to-bullish/40" />
        </div>

        {/* Needle */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-all duration-500"
          style={{ left: `${position}%` }}
        >
          <div className="w-1 h-3 bg-text-primary rounded-full" />
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[4px] border-l-transparent border-r-transparent border-b-text-primary mx-auto -mt-px" />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2 text-[10px] text-text-muted font-mono">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      {/* Value */}
      <div className="text-center mt-3">
        <span className="text-lg font-mono font-semibold text-text-primary tabular-nums">
          {pressure > 0 ? '+' : ''}
          {(pressure * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
