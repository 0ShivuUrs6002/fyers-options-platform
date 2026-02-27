/// Dashboard — Main layout composing all analysis components.

'use client';

import { useState, useCallback } from 'react';
import type {
  IndexSymbol,
  StrikeRange,
  RefreshInterval,
} from '@/lib/types';
import { INDEX_CONFIG } from '@/lib/types';
import { useMarketData } from '@/hooks/useMarketData';
import { SpotPrice } from './SpotPrice';
import { SupportResistance } from './SupportResistance';
import { BuyerSellerPanel } from './BuyerSellerPanel';
import { MarketPressure } from './MarketPressure';
import { VolatilityChart } from './VolatilityChart';
import { OptionChainTable } from './OptionChainTable';
import { RefreshControl } from './RefreshControl';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  // ─── User-controlled state ───
  const [index, setIndex] = useState<IndexSymbol>('NIFTY');
  const [range, setRange] = useState<StrikeRange>(10);
  const [interval, setInterval] = useState<RefreshInterval>(5);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);

  // ─── Market data (polling hook) ───
  const { data, loading, error, countdown, connected, refresh } = useMarketData({
    index,
    range,
    interval,
    selectedStrike,
    enabled: true,
  });

  // ─── Handlers ───
  const handleIndexChange = useCallback((newIndex: IndexSymbol) => {
    setIndex(newIndex);
    setSelectedStrike(null);
  }, []);

  const handleIntervalChange = useCallback((newInterval: RefreshInterval) => {
    setInterval(newInterval);
  }, []);

  const handleRangeChange = useCallback((newRange: StrikeRange) => {
    setRange(newRange);
    setSelectedStrike(null);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Index selector */}
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-text-primary tracking-wide hidden sm:block">
              OPTIONS<span className="text-accent-blue">LAB</span>
            </h1>

            {/* Index tabs */}
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {(Object.keys(INDEX_CONFIG) as IndexSymbol[]).map((idx) => (
                <button
                  key={idx}
                  onClick={() => handleIndexChange(idx)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    index === idx
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {idx}
                </button>
              ))}
            </div>

            {/* Range selector */}
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {([5, 10] as StrikeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`px-2.5 py-1.5 text-xs font-mono transition-colors ${
                    range === r
                      ? 'bg-accent-purple/20 text-accent-purple'
                      : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  ±{r}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Refresh + Logout */}
          <div className="flex items-center gap-4">
            <RefreshControl
              interval={interval}
              countdown={countdown}
              connected={connected}
              refreshCount={data?.refreshCount ?? 0}
              onIntervalChange={handleIntervalChange}
              onManualRefresh={refresh}
            />
            <button
              onClick={onLogout}
              className="text-text-muted text-xs hover:text-text-secondary transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ═══ ERROR BANNER ═══ */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="bg-bearish/10 border border-bearish/20 rounded-lg px-4 py-2.5 text-sm text-bearish">
            {error}
          </div>
        </div>
      )}

      {/* ═══ LOADING STATE ═══ */}
      {loading && !data && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary text-sm">
              Connecting to Fyers API...
            </p>
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {data && (
        <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          {/* Row 1: Spot + Buyer/Seller */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpotPrice
              spot={data.spot}
              priceChange={data.priceChange}
              timestamp={data.timestamp}
              expiryDate={data.expiryDate}
            />
            <BuyerSellerPanel signals={data.buyerSellerSignals} />
          </div>

          {/* Row 2: S/R */}
          <SupportResistance
            support={data.support}
            resistance={data.resistance}
            supportConfidence={data.supportConfidence}
            resistanceConfidence={data.resistanceConfidence}
            supportStrength={data.supportStrength}
            resistanceStrength={data.resistanceStrength}
            regime={data.regime}
            spot={data.spot}
          />

          {/* Row 3: Pressure + Volatility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MarketPressure
              pressure={data.marketPressure}
              pressureLabel={data.pressureLabel}
            />
            <VolatilityChart
              volatilityPerSec={data.volatilityPerSec}
              volatilityMA={data.volatilityMA}
              regime={data.regime}
              history={[]} // Volatility history from server (extend API if needed)
            />
          </div>

          {/* Row 4: Option Chain Table */}
          <OptionChainTable
            chain={data.optionChain}
            spot={data.spot}
            selectedStrike={selectedStrike}
            onSelectStrike={setSelectedStrike}
            strikeAnalysis={data.strikeSpecificData}
          />
        </main>
      )}
    </div>
  );
}
