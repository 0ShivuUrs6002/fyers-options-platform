/// SpotPrice — Large, bold spot price display with change indicator.

'use client';

interface SpotPriceProps {
  spot: number;
  priceChange: number;
  timestamp: string;
  expiryDate: string;
}

export function SpotPrice({ spot, priceChange, timestamp, expiryDate }: SpotPriceProps) {
  const isPositive = priceChange >= 0;
  const changePercent = spot > 0 ? (priceChange / spot) * 100 : 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Spot Price
        </span>
        <span className="text-text-muted text-xs font-mono">{expiryDate}</span>
      </div>

      <div className="flex items-baseline gap-4">
        <span className="text-spot text-text-primary font-mono tabular-nums">
          {spot.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>

        <div className={`flex items-center gap-1.5 ${
          isPositive ? 'text-bullish' : 'text-bearish'
        }`}>
          <svg
            width="12" height="12" viewBox="0 0 12 12"
            className={`${isPositive ? '' : 'rotate-180'}`}
          >
            <path
              d="M6 2L10 8H2L6 2Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-lg font-semibold font-mono tabular-nums">
            {isPositive ? '+' : ''}
            {priceChange.toFixed(2)}
          </span>
          <span className="text-sm opacity-70 font-mono">
            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="mt-2 text-text-muted text-xs font-mono">
        {timestamp}
      </div>
    </div>
  );
}
