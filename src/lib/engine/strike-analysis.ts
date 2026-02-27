/// Strike-Specific S/R Module
///
/// When user selects a specific strike, compute micro-support
/// and micro-resistance using local OI concentration gradient.
///
///   localSupport    = strike − (putOIChange_weighted_bias)
///   localResistance = strike + (callOIChange_weighted_bias)

import type { OptionStrike, StrikeAnalysis } from '../types';

export function computeStrikeAnalysis(
  selectedStrike: number,
  strikes: OptionStrike[],
  spotPrice: number,
): StrikeAnalysis {
  const sorted = [...strikes].sort(
    (a, b) => a.strikePrice - b.strikePrice,
  );
  const idx = sorted.findIndex((s) => s.strikePrice === selectedStrike);

  if (idx === -1) {
    return {
      strike: selectedStrike,
      localSupport: selectedStrike,
      localResistance: selectedStrike,
      confidence: 0,
    };
  }

  // Local OI gradient using ±3 neighboring strikes
  let putBias = 0;
  let callBias = 0;
  let totalWeight = 0;

  const start = Math.max(0, idx - 3);
  const end = Math.min(sorted.length - 1, idx + 3);

  for (let i = start; i <= end; i++) {
    const s = sorted[i];
    const dist = Math.abs(s.strikePrice - selectedStrike);
    const weight = 1 / (1 + dist);

    putBias += s.putOIChange * weight;
    callBias += s.callOIChange * weight;
    totalWeight += weight;
  }

  if (totalWeight > 0) {
    putBias /= totalWeight;
    callBias /= totalWeight;
  }

  // Use tick size as scaling factor
  const tickSize =
    sorted.length > 1
      ? Math.abs(sorted[1].strikePrice - sorted[0].strikePrice)
      : 50;

  const localSupport =
    selectedStrike - Math.abs(putBias) * tickSize * 0.01;
  const localResistance =
    selectedStrike + Math.abs(callBias) * tickSize * 0.01;

  // Confidence: relative OI concentration at this strike vs max
  const strikeData = sorted[idx];
  const totalOIChange =
    Math.abs(strikeData.callOIChange) + Math.abs(strikeData.putOIChange);
  const maxOIChange = sorted.reduce(
    (max, s) =>
      Math.max(max, Math.abs(s.callOIChange) + Math.abs(s.putOIChange)),
    0,
  );

  const confidence =
    maxOIChange > 0 ? Math.min(1, totalOIChange / maxOIChange) : 0;

  return { strike: selectedStrike, localSupport, localResistance, confidence };
}
