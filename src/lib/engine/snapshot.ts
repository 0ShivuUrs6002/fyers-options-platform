/// Snapshot Manager — server-side state for each index.
///
/// Maintains currentSnapshot, previousSnapshot, and per-index
/// volatility buffers. Lives in module scope (persists during
/// warm serverless instances, rebuilds on cold start).

import type { IndexSymbol, MarketSnapshot } from '../types';
import { VolatilityEngine } from './volatility';

export interface IndexState {
  currentSnapshot: MarketSnapshot | null;
  previousSnapshot: MarketSnapshot | null;
  volatilityEngine: VolatilityEngine;
  lastComputeTimestamp: string;
  refreshCount: number;
}

class SnapshotManager {
  private states = new Map<IndexSymbol, IndexState>();

  getState(index: IndexSymbol): IndexState {
    if (!this.states.has(index)) {
      this.states.set(index, {
        currentSnapshot: null,
        previousSnapshot: null,
        volatilityEngine: new VolatilityEngine(),
        lastComputeTimestamp: '',
        refreshCount: 0,
      });
    }
    return this.states.get(index)!;
  }

  /**
   * Atomic snapshot replacement.
   *
   * Returns false if timestamp unchanged (skip recomputation).
   * Returns true if new snapshot was accepted.
   */
  updateSnapshot(index: IndexSymbol, newSnapshot: MarketSnapshot): boolean {
    const state = this.getState(index);

    // Skip if timestamp unchanged
    if (
      state.currentSnapshot &&
      state.currentSnapshot.timestamp === newSnapshot.timestamp
    ) {
      console.log(`[Snapshot] Timestamp unchanged for ${index} — skipping`);
      return false;
    }

    // Atomic replacement: previous = current, current = new
    state.previousSnapshot = state.currentSnapshot;
    state.currentSnapshot = newSnapshot;
    state.lastComputeTimestamp = newSnapshot.timestamp;
    state.refreshCount++;

    console.log(
      `[Snapshot] ${index} #${state.refreshCount}: ` +
        `spot=${newSnapshot.spotPrice} ts="${newSnapshot.timestamp}" ` +
        `strikes=${newSnapshot.optionChain.length}`,
    );

    return true;
  }

  /** Reset a single index (e.g., on index switch). */
  resetIndex(index: IndexSymbol): void {
    const state = this.getState(index);
    state.currentSnapshot = null;
    state.previousSnapshot = null;
    state.volatilityEngine.reset();
    state.lastComputeTimestamp = '';
    state.refreshCount = 0;
  }

  /** Reset everything (e.g., on interval change). */
  resetAll(): void {
    this.states.clear();
  }
}

// Module-level singleton — survives across warm serverless invocations
export const snapshotManager = new SnapshotManager();
