/// Volatility Engine — Normalized Per-Second Volatility
///
/// FORMULAE:
///   volatility_per_sec = |spot_now − spot_prev| / seconds_elapsed
///   volatility_MA = average(last 10 volatility_per_sec)
///   volatility_ratio = volatility_per_sec / volatility_MA
///
/// Regime Detection:
///   ratio > 1.5 → HIGH_MOMENTUM
///   ratio < 0.8 → COMPRESSION
///   else        → NORMAL
///
/// Volatility-Adjusted Confidence:
///   HIGH_MOMENTUM → confidence *= 0.7
///   COMPRESSION   → confidence *= 1.2
///   Clamped 0–1.

import type { VolatilityResult, VolatilityRegime } from '../types';

const BUFFER_SIZE = 10;

export class VolatilityEngine {
  private buffer: number[] = [];

  reset(): void {
    this.buffer = [];
  }

  compute(
    currentSpot: number,
    previousSpot: number,
    secondsElapsed: number,
  ): VolatilityResult {
    // Guard: need valid previous data
    if (secondsElapsed <= 0 || previousSpot <= 0) {
      return {
        volatilityPerSec: 0,
        volatilityMA: 0,
        volatilityRatio: 0,
        regime: 'NORMAL',
        history: [...this.buffer],
      };
    }

    const volatilityPerSec =
      Math.abs(currentSpot - previousSpot) / secondsElapsed;

    // Rolling buffer (FIFO, max 10)
    this.buffer.push(volatilityPerSec);
    if (this.buffer.length > BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Moving average
    const volatilityMA =
      this.buffer.length > 0
        ? this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length
        : 0;

    // Ratio
    const volatilityRatio =
      volatilityMA > 0 ? volatilityPerSec / volatilityMA : 0;

    // Regime
    let regime: VolatilityRegime = 'NORMAL';
    if (volatilityRatio > 1.5) regime = 'HIGH_MOMENTUM';
    else if (volatilityRatio < 0.8 && this.buffer.length >= 3)
      regime = 'COMPRESSION';

    return {
      volatilityPerSec,
      volatilityMA,
      volatilityRatio,
      regime,
      history: [...this.buffer],
    };
  }

  /**
   * Adjust confidence score based on volatility regime.
   * Does NOT move S/R levels — only adjusts confidence.
   */
  static adjustConfidence(
    confidence: number,
    regime: VolatilityRegime,
  ): number {
    let adjusted = confidence;
    if (regime === 'HIGH_MOMENTUM') adjusted *= 0.7;
    else if (regime === 'COMPRESSION') adjusted *= 1.2;
    return Math.max(0, Math.min(1, adjusted));
  }
}
