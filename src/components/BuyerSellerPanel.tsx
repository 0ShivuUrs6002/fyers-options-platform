/// BuyerSellerPanel — 4 signal badges with dominant highlight.

'use client';

import type { BuyerSellerSignal, DominantActivity } from '@/lib/types';

interface BuyerSellerPanelProps {
  signals: BuyerSellerSignal;
}

interface BadgeConfig {
  key: DominantActivity;
  label: string;
  value: number;
  color: string;
  activeBg: string;
}

export function BuyerSellerPanel({ signals }: BuyerSellerPanelProps) {
  const total =
    signals.callBuyer +
    signals.callSeller +
    signals.putBuyer +
    signals.putSeller;

  const badges: BadgeConfig[] = [
    {
      key: 'CALL_BUYER',
      label: 'Call Buyer',
      value: signals.callBuyer,
      color: 'text-bullish',
      activeBg: 'bg-bullish/20 border-bullish/40',
    },
    {
      key: 'CALL_SELLER',
      label: 'Call Seller',
      value: signals.callSeller,
      color: 'text-bearish',
      activeBg: 'bg-bearish/20 border-bearish/40',
    },
    {
      key: 'PUT_BUYER',
      label: 'Put Buyer',
      value: signals.putBuyer,
      color: 'text-bearish',
      activeBg: 'bg-bearish/20 border-bearish/40',
    },
    {
      key: 'PUT_SELLER',
      label: 'Put Seller',
      value: signals.putSeller,
      color: 'text-bullish',
      activeBg: 'bg-bullish/20 border-bullish/40',
    },
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Buyer / Seller Activity
        </h3>
        {signals.dominant !== 'NONE' && (
          <span className="text-xs font-mono text-accent-amber">
            {signals.dominancePercent.toFixed(0)}% dominant
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge) => {
          const isDominant = signals.dominant === badge.key;
          const pct = total > 0 ? ((badge.value / total) * 100).toFixed(0) : '0';

          return (
            <div
              key={badge.key}
              className={`relative rounded-lg border px-3 py-2.5 transition-all duration-300 ${
                isDominant
                  ? badge.activeBg
                  : 'border-surface-border bg-surface-elevated'
              }`}
            >
              {isDominant && (
                <div className="absolute top-1 right-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-amber opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-amber" />
                  </span>
                </div>
              )}
              <div className={`text-xs font-medium ${isDominant ? badge.color : 'text-text-secondary'}`}>
                {badge.label}
              </div>
              <div className={`text-sm font-mono font-semibold mt-0.5 ${isDominant ? badge.color : 'text-text-primary'}`}>
                {pct}%
              </div>
              <div className="text-text-muted text-[10px] font-mono">
                {badge.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
