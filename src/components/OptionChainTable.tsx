/// OptionChainTable — Range-filtered option chain with strike selector.

'use client';

import type { OptionStrike, StrikeAnalysis } from '@/lib/types';

interface OptionChainTableProps {
  chain: OptionStrike[];
  spot: number;
  selectedStrike: number | null;
  onSelectStrike: (strike: number | null) => void;
  strikeAnalysis: StrikeAnalysis | null;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function OptionChainTable({
  chain,
  spot,
  selectedStrike,
  onSelectStrike,
  strikeAnalysis,
}: OptionChainTableProps) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-border flex items-center justify-between">
        <h3 className="text-text-secondary text-xs font-medium tracking-wider uppercase">
          Option Chain
        </h3>
        {selectedStrike !== null && (
          <button
            onClick={() => onSelectStrike(null)}
            className="text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Strike-specific analysis banner */}
      {strikeAnalysis && (
        <div className="px-5 py-2.5 bg-accent-blue/5 border-b border-surface-border">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-accent-blue font-medium">
              Strike {strikeAnalysis.strike}
            </span>
            <span className="text-text-secondary">
              Local S: <span className="text-bullish font-mono">{strikeAnalysis.localSupport.toFixed(2)}</span>
            </span>
            <span className="text-text-secondary">
              Local R: <span className="text-bearish font-mono">{strikeAnalysis.localResistance.toFixed(2)}</span>
            </span>
            <span className="text-text-secondary">
              Conf: <span className="text-text-primary font-mono">{(strikeAnalysis.confidence * 100).toFixed(0)}%</span>
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted border-b border-surface-border">
              <th className="px-3 py-2 text-right font-medium">OI</th>
              <th className="px-3 py-2 text-right font-medium">Chg OI</th>
              <th className="px-3 py-2 text-right font-medium">Vol</th>
              <th className="px-3 py-2 text-right font-medium">IV</th>
              <th className="px-3 py-2 text-right font-medium">LTP</th>
              <th className="px-3 py-2 text-center font-bold bg-surface-elevated">Strike</th>
              <th className="px-3 py-2 text-left font-medium">LTP</th>
              <th className="px-3 py-2 text-left font-medium">IV</th>
              <th className="px-3 py-2 text-left font-medium">Vol</th>
              <th className="px-3 py-2 text-left font-medium">Chg OI</th>
              <th className="px-3 py-2 text-left font-medium">OI</th>
            </tr>
          </thead>
          <tbody>
            {chain.map((s) => {
              const isATM =
                Math.abs(s.strikePrice - spot) <=
                (chain.length > 1
                  ? Math.abs(chain[1].strikePrice - chain[0].strikePrice) / 2
                  : 25);
              const isSelected = selectedStrike === s.strikePrice;
              const isITMCall = s.strikePrice < spot;
              const isITMPut = s.strikePrice > spot;

              return (
                <tr
                  key={s.strikePrice}
                  onClick={() =>
                    onSelectStrike(
                      isSelected ? null : s.strikePrice,
                    )
                  }
                  className={`cursor-pointer border-b border-surface-border/50 transition-colors ${
                    isSelected
                      ? 'bg-accent-blue/10'
                      : isATM
                        ? 'bg-accent-amber/5'
                        : 'hover:bg-surface-hover'
                  }`}
                >
                  {/* CALL side */}
                  <td className={`px-3 py-1.5 text-right font-mono ${isITMCall ? 'text-text-muted' : 'text-text-primary'}`}>
                    {formatNum(s.callOI)}
                  </td>
                  <td className={`px-3 py-1.5 text-right font-mono ${
                    s.callOIChange > 0
                      ? 'text-bullish'
                      : s.callOIChange < 0
                        ? 'text-bearish'
                        : 'text-text-muted'
                  }`}>
                    {s.callOIChange > 0 ? '+' : ''}
                    {formatNum(s.callOIChange)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-text-secondary">
                    {formatNum(s.callVolume)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-text-muted">
                    {s.callIV > 0 ? s.callIV.toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-text-primary">
                    {s.callLTP.toFixed(2)}
                  </td>

                  {/* STRIKE */}
                  <td
                    className={`px-3 py-1.5 text-center font-mono font-bold bg-surface-elevated ${
                      isATM ? 'text-accent-amber' : 'text-text-primary'
                    }`}
                  >
                    {s.strikePrice}
                    {isATM && (
                      <span className="ml-1 text-[9px] text-accent-amber/70">ATM</span>
                    )}
                  </td>

                  {/* PUT side */}
                  <td className="px-3 py-1.5 text-left font-mono text-text-primary">
                    {s.putLTP.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-left font-mono text-text-muted">
                    {s.putIV > 0 ? s.putIV.toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-1.5 text-left font-mono text-text-secondary">
                    {formatNum(s.putVolume)}
                  </td>
                  <td className={`px-3 py-1.5 text-left font-mono ${
                    s.putOIChange > 0
                      ? 'text-bullish'
                      : s.putOIChange < 0
                        ? 'text-bearish'
                        : 'text-text-muted'
                  }`}>
                    {s.putOIChange > 0 ? '+' : ''}
                    {formatNum(s.putOIChange)}
                  </td>
                  <td className={`px-3 py-1.5 text-left font-mono ${isITMPut ? 'text-text-muted' : 'text-text-primary'}`}>
                    {formatNum(s.putOI)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
