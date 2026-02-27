/// RefreshControl — Interval selector, countdown timer, and connection status.

'use client';

import type { RefreshInterval } from '@/lib/types';
import { REFRESH_INTERVALS } from '@/lib/types';

interface RefreshControlProps {
  interval: RefreshInterval;
  countdown: number;
  connected: boolean;
  refreshCount: number;
  onIntervalChange: (interval: RefreshInterval) => void;
  onManualRefresh: () => void;
}

export function RefreshControl({
  interval,
  countdown,
  connected,
  refreshCount,
  onIntervalChange,
  onManualRefresh,
}: RefreshControlProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Connection indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-bullish' : 'bg-bearish animate-pulse'
          }`}
        />
        <span className="text-text-muted text-[10px] font-mono">
          #{refreshCount}
        </span>
      </div>

      {/* Countdown ring */}
      <button
        onClick={onManualRefresh}
        className="relative w-8 h-8 flex items-center justify-center"
        title="Click to refresh now"
      >
        <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="rgba(30, 35, 51, 1)"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="rgba(74, 158, 255, 0.6)"
            strokeWidth="3"
            strokeDasharray={`${(countdown / interval) * 94.25} 94.25`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute text-[10px] font-mono text-text-secondary">
          {countdown}
        </span>
      </button>

      {/* Interval selector */}
      <div className="flex rounded-lg border border-surface-border overflow-hidden">
        {REFRESH_INTERVALS.map((val) => (
          <button
            key={val}
            onClick={() => onIntervalChange(val)}
            className={`px-2.5 py-1 text-xs font-mono transition-colors ${
              interval === val
                ? 'bg-accent-blue/20 text-accent-blue'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {val}s
          </button>
        ))}
      </div>
    </div>
  );
}
