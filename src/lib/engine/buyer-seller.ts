/// Buyer / Seller Activity Engine
///
/// Uses priceChange (currentSpot − previousSpot) to classify OI changes:
///
///   Call Seller:  callOIChange > 0 AND priceChange < 0
///   Put Seller:   putOIChange  > 0 AND priceChange > 0
///   Call Buyer:   callOIChange > 0 AND priceChange > 0
///   Put Buyer:    putOIChange  > 0 AND priceChange < 0
///
/// Dominance: if one category > 60% of total → active signal.

import type { OptionStrike, BuyerSellerSignal, DominantActivity } from '../types';

export function computeBuyerSellerActivity(
  strikes: OptionStrike[],
  priceChange: number,
): BuyerSellerSignal {
  let callBuyer = 0;
  let callSeller = 0;
  let putBuyer = 0;
  let putSeller = 0;

  for (const s of strikes) {
    // Call Seller: callOI building + price falling
    if (s.callOIChange > 0 && priceChange < 0) {
      callSeller += s.callOIChange;
    }

    // Put Seller: putOI building + price rising
    if (s.putOIChange > 0 && priceChange > 0) {
      putSeller += s.putOIChange;
    }

    // Call Buyer: callOI building + price rising
    if (s.callOIChange > 0 && priceChange > 0) {
      callBuyer += s.callOIChange;
    }

    // Put Buyer: putOI building + price falling
    if (s.putOIChange > 0 && priceChange < 0) {
      putBuyer += s.putOIChange;
    }
  }

  const total = callBuyer + callSeller + putBuyer + putSeller;

  // Determine dominance
  const categories: { key: DominantActivity; value: number }[] = [
    { key: 'CALL_BUYER', value: callBuyer },
    { key: 'CALL_SELLER', value: callSeller },
    { key: 'PUT_BUYER', value: putBuyer },
    { key: 'PUT_SELLER', value: putSeller },
  ];

  let dominant: DominantActivity = 'NONE';
  let dominancePercent = 0;

  if (total > 0) {
    const sorted = [...categories].sort((a, b) => b.value - a.value);
    dominancePercent = (sorted[0].value / total) * 100;
    if (dominancePercent > 60) {
      dominant = sorted[0].key;
    }
  }

  return {
    callBuyer,
    callSeller,
    putBuyer,
    putSeller,
    dominant,
    dominancePercent,
  };
}
