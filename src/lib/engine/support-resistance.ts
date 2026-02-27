/// Support / Resistance Engine — Proximity-Weighted OI Centroid Model
///
/// FORMULAE (from specification):
///
///   proximityWeight = 1 / (1 + |strike − spot|)
///
///   support  = Σ(strike × putOIChange  × proxW) / Σ(putOIChange  × proxW)
///   resistance = Σ(strike × callOIChange × proxW) / Σ(callOIChange × proxW)
///
///   supportStrength    = Σ(putOIChange  × proxW) / totalPutOIInRange
///   resistanceStrength = Σ(callOIChange × proxW) / totalCallOIInRange
///
/// Levels allow full decimal precision — NOT rounded to tick size.

import type { OptionStrike, SRResult } from '../types';

export function computeSupportResistance(
  strikes: OptionStrike[],
  spotPrice: number,
): SRResult {
  let supportNum = 0;
  let supportDen = 0;
  let resistanceNum = 0;
  let resistanceDen = 0;
  let totalPutOI = 0;
  let totalCallOI = 0;

  for (const s of strikes) {
    const proximityWeight = 1 / (1 + Math.abs(s.strikePrice - spotPrice));

    // Support: strikes BELOW spot with positive putOIChange
    if (s.strikePrice < spotPrice && s.putOIChange > 0) {
      supportNum += s.strikePrice * s.putOIChange * proximityWeight;
      supportDen += s.putOIChange * proximityWeight;
    }

    // Resistance: strikes ABOVE spot with positive callOIChange
    if (s.strikePrice > spotPrice && s.callOIChange > 0) {
      resistanceNum += s.strikePrice * s.callOIChange * proximityWeight;
      resistanceDen += s.callOIChange * proximityWeight;
    }

    // Total OI changes for strength normalization
    if (s.putOIChange > 0) totalPutOI += s.putOIChange;
    if (s.callOIChange > 0) totalCallOI += s.callOIChange;
  }

  // Centroid levels (decimal precision, NOT rounded)
  const support = supportDen > 0 ? supportNum / supportDen : spotPrice;
  const resistance = resistanceDen > 0
    ? resistanceNum / resistanceDen
    : spotPrice;

  // Strength: normalized 0–1
  const supportStrength =
    totalPutOI > 0 ? Math.min(1, supportDen / totalPutOI) : 0;
  const resistanceStrength =
    totalCallOI > 0 ? Math.min(1, resistanceDen / totalCallOI) : 0;

  return {
    support,
    resistance,
    supportStrength,
    resistanceStrength,
    // Pre-volatility confidence (adjusted later by compute.ts)
    supportConfidence: supportStrength,
    resistanceConfidence: resistanceStrength,
  };
}
