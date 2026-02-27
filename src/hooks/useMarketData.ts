/// useMarketData — Polling hook with deterministic refresh engine.
///
/// RULES (from specification):
///   1. Only ONE active timer.
///   2. On interval change: cancel timer → reset state → start new timer.
///   3. No overlapping requests (requestInProgress lock).
///   4. If fetch fails: keep previous data visible, show error.
///   5. Countdown ticks every second for UI display.

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  AnalysisResponse,
  IndexSymbol,
  StrikeRange,
  RefreshInterval,
} from '@/lib/types';

interface MarketDataState {
  data: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  countdown: number;
  connected: boolean;
}

interface MarketDataConfig {
  index: IndexSymbol;
  range: StrikeRange;
  interval: RefreshInterval;
  selectedStrike: number | null;
  enabled: boolean;
}

export function useMarketData(config: MarketDataConfig) {
  const { index, range, interval, selectedStrike, enabled } = config;

  const [state, setState] = useState<MarketDataState>({
    data: null,
    loading: true,
    error: null,
    countdown: interval,
    connected: false,
  });

  // ─── Refs for mutable values (no re-renders) ───
  const requestInProgress = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownValueRef = useRef<number>(interval);

  // ─── Core fetch function (AWAITED, never fire-and-forget) ───
  const fetchSnapshot = useCallback(async () => {
    if (requestInProgress.current) {
      console.log('[Poll] Request in progress — skip');
      return;
    }

    requestInProgress.current = true;

    try {
      const params = new URLSearchParams({
        index,
        range: String(range),
      });
      if (selectedStrike !== null) {
        params.set('selectedStrike', String(selectedStrike));
      }

      const res = await fetch(`/api/market/snapshot?${params.toString()}`);

      if (res.status === 401) {
        setState((prev) => ({
          ...prev,
          error: 'Session expired. Please log in again.',
          connected: false,
          loading: false,
        }));
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          error: errorData.error || 'Data temporarily unavailable',
          loading: false,
          // Keep previous data visible (spec requirement)
        }));
        return;
      }

      const data: AnalysisResponse = await res.json();

      setState({
        data,
        loading: false,
        error: null,
        countdown: interval,
        connected: true,
      });

      // Reset countdown
      countdownValueRef.current = interval;
    } catch (err) {
      console.error('[Poll] Fetch error:', err);
      setState((prev) => ({
        ...prev,
        error: 'Network error — retrying next cycle',
        loading: false,
      }));
    } finally {
      requestInProgress.current = false;
    }
  }, [index, range, interval, selectedStrike]);

  // ─── Timer management ───
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchSnapshot();

    // Start refresh timer (THE only timer)
    timerRef.current = setInterval(() => {
      fetchSnapshot();
    }, interval * 1000);

    // Start countdown display timer (1s ticks, display only)
    countdownValueRef.current = interval;
    countdownRef.current = setInterval(() => {
      countdownValueRef.current = Math.max(0, countdownValueRef.current - 1);
      setState((prev) => ({
        ...prev,
        countdown: countdownValueRef.current,
      }));
    }, 1000);

    // Cleanup on config change or unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      timerRef.current = null;
      countdownRef.current = null;
      requestInProgress.current = false;
    };
  }, [enabled, index, range, interval, selectedStrike, fetchSnapshot]);

  // ─── Manual refresh ───
  const refresh = useCallback(async () => {
    // Reset countdown
    countdownValueRef.current = interval;
    setState((prev) => ({ ...prev, countdown: interval }));
    await fetchSnapshot();
  }, [interval, fetchSnapshot]);

  return { ...state, refresh };
}
