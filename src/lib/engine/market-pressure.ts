/// Market Pressure Engine — Proximity × Volume Weighted
///
/// FORMULA:
///   weightedPut  = Σ(putOIChange  × proximityWeight × volumeWeight)
///   weightedCall = Σ(callOIChange × proximityWeight × volumeWeight)
///   marketPressure = weightedPut − weightedCall  (normalized −1 to +1)
///
///   proximityWeight = 1 / (1 + |strike − spot|)
///   volumeWeight    = ln(1 + callVolume + putVolume)

import type { OptionStrike, MarketPressureResult } from '../types';

export function computeMarketPressure(
  strikes: OptionStrike[],
  spotPrice: number,
): MarketPressureResult {
  let weightedPut = 0;
  let weightedCall = 0;

  for (const s of strikes) {
    const proximityWeight = 1 / (1 + Math.abs(s.strikePrice - spotPrice));
    const volumeWeight = Math.log1p(s.callVolume + s.putVolume);

    if (s.putOIChange > 0) {
      weightedPut += s.putOIChange * proximityWeight * volumeWeight;
    }
    if (s.callOIChange > 0) {
      weightedCall += s.callOIChange * proximityWeight * volumeWeight;
    }
  }

  // Normalize to −1 … +1
  const maxMag = Math.max(
    Math.abs(weightedPut),
    Math.abs(weightedCall),
    1,
  );
  const rawPressure = weightedPut - weightedCall;
  const pressure = Math.max(-1, Math.min(1, rawPressure / maxMag));

  let pressureLabel = 'Neutral';
  if (pressure > 0.2) pressureLabel = 'Bullish';
  else if (pressure < -0.2) pressureLabel = 'Bearish';

  return { weightedPut, weightedCall, pressure, pressureLabel };
}
