/// Master Compute Orchestrator
///
/// Called once per refresh cycle. Receives the raw MarketSnapshot,
/// applies strike range filter, runs all engines, returns the
/// composite AnalysisResponse.
///
/// RULES:
///   - All computation uses ONLY the filtered strike range.
///   - Volatility uses currentSpot vs previousSpot.
///   - S/R confidence is adjusted by volatility regime.
///   - Single atomic response — no partial state.

import type {
  IndexSymbol,
  StrikeRange,
  MarketSnapshot,
  OptionStrike,
  AnalysisResponse,
} from '../types';
import { INDEX_CONFIG } from '../types';
import { snapshotManager } from './snapshot';
import { computeSupportResistance } from './support-resistance';
import { VolatilityEngine } from './volatility';
import { computeMarketPressure } from './market-pressure';
import { computeBuyerSellerActivity } from './buyer-seller';
import { computeStrikeAnalysis } from './strike-analysis';

// ═══════════════════════════════════════════════════════════
// STRIKE RANGE FILTER
// ═══════════════════════════════════════════════════════════

function filterStrikes(
  chain: OptionStrike[],
  spotPrice: number,
  range: StrikeRange,
  tickSize: number,
): OptionStrike[] {
  // Find ATM strike
  const atmStrike = Math.round(spotPrice / tickSize) * tickSize;
  const lowerBound = atmStrike - range * tickSize;
  const upperBound = atmStrike + range * tickSize;

  return chain.filter(
    (s) => s.strikePrice >= lowerBound && s.strikePrice <= upperBound,
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPUTE
// ═══════════════════════════════════════════════════════════

export function computeAll(
  newSnapshot: MarketSnapshot,
  index: IndexSymbol,
  strikeRange: StrikeRange,
  selectedStrike: number | null,
): AnalysisResponse | null {
  // Atomic snapshot update
  const accepted = snapshotManager.updateSnapshot(index, newSnapshot);

  const state = snapshotManager.getState(index);
  const current = state.currentSnapshot;
  if (!current) return null;

  // If timestamp unchanged, skip recomputation but still return last result
  // (This would only happen if the same timestamp comes in twice)

  const config = INDEX_CONFIG[index];
  const spot = current.spotPrice;

  // ─── Step 1: Filter strikes to selected range ───
  const filteredStrikes = filterStrikes(
    current.optionChain,
    spot,
    strikeRange,
    config.tickSize,
  );

  if (filteredStrikes.length === 0) {
    console.warn(`[Compute] No strikes in ATM±${strikeRange} range`);
    return null;
  }

  // ─── Step 2: Support / Resistance ───
  const sr = computeSupportResistance(filteredStrikes, spot);

  // ─── Step 3: Volatility ───
  const previousSpot = state.previousSnapshot?.spotPrice ?? 0;
  let secondsElapsed = 5; // default

  if (state.previousSnapshot) {
    try {
      const prevTime = new Date(state.previousSnapshot.timestamp).getTime();
      const currTime = new Date(current.timestamp).getTime();
      const diff = (currTime - prevTime) / 1000;
      if (diff > 0 && diff < 3600) secondsElapsed = diff;
    } catch {
      // Use default
    }
  }

  const volatility = state.volatilityEngine.compute(
    spot,
    previousSpot,
    secondsElapsed,
  );

  // ─── Step 4: Adjust S/R confidence by volatility regime ───
  sr.supportConfidence = VolatilityEngine.adjustConfidence(
    sr.supportStrength,
    volatility.regime,
  );
  sr.resistanceConfidence = VolatilityEngine.adjustConfidence(
    sr.resistanceStrength,
    volatility.regime,
  );

  // ─── Step 5: Market Pressure ───
  const pressure = computeMarketPressure(filteredStrikes, spot);

  // ─── Step 6: Buyer / Seller Activity ───
  const priceChange = previousSpot > 0 ? spot - previousSpot : 0;
  const buyerSeller = computeBuyerSellerActivity(
    filteredStrikes,
    priceChange,
  );

  // ─── Step 7: Strike-Specific Analysis (optional) ───
  const strikeAnalysis =
    selectedStrike !== null
      ? computeStrikeAnalysis(selectedStrike, filteredStrikes, spot)
      : null;

  // ─── Step 8: Assemble atomic response ───
  return {
    timestamp: current.timestamp,
    spot,
    index,
    expiryDate: current.expiryDate,

    support: sr.support,
    resistance: sr.resistance,
    supportConfidence: sr.supportConfidence,
    resistanceConfidence: sr.resistanceConfidence,
    supportStrength: sr.supportStrength,
    resistanceStrength: sr.resistanceStrength,

    volatilityPerSec: volatility.volatilityPerSec,
    volatilityMA: volatility.volatilityMA,
    regime: volatility.regime,

    marketPressure: pressure.pressure,
    pressureLabel: pressure.pressureLabel,

    buyerSellerSignals: buyerSeller,

    strikeSpecificData: strikeAnalysis,

    optionChain: filteredStrikes,

    refreshCount: state.refreshCount,
    priceChange,
  };
}
