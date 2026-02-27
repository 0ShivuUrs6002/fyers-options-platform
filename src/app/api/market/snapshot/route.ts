/// GET /api/market/snapshot — Main data endpoint.
///
/// Called by frontend every N seconds (polling model).
/// Fetches from Fyers API, runs all computation engines,
/// returns composite AnalysisResponse.
///
/// Query params:
///   index:         NIFTY | BANKNIFTY | SENSEX
///   range:         5 | 10
///   selectedStrike: number (optional)
///
/// RULES:
///   - Auth required (checks session cookie)
///   - If Fyers fetch fails → return 503 with previous data retained server-side
///   - All computation happens HERE, not in frontend

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { fetchOptionChain } from '@/lib/fyers/api';
import { computeAll } from '@/lib/engine/compute';
import type { IndexSymbol, StrikeRange } from '@/lib/types';

const VALID_INDICES = new Set(['NIFTY', 'BANKNIFTY', 'SENSEX']);
const VALID_RANGES = new Set([5, 10]);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // ─── Auth check ───
  const session = await getSession();
  if (
    !session.accessToken ||
    (session.expiresAt && Date.now() > session.expiresAt)
  ) {
    return NextResponse.json(
      { error: 'Not authenticated', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  // ─── Parse query params ───
  const url = new URL(request.url);
  const index = (url.searchParams.get('index') || 'NIFTY') as IndexSymbol;
  const range = parseInt(url.searchParams.get('range') || '10', 10) as StrikeRange;
  const selectedStrikeParam = url.searchParams.get('selectedStrike');
  const selectedStrike = selectedStrikeParam
    ? parseFloat(selectedStrikeParam)
    : null;

  // ─── Validate params ───
  if (!VALID_INDICES.has(index)) {
    return NextResponse.json(
      { error: 'Invalid index. Use NIFTY, BANKNIFTY, or SENSEX.' },
      { status: 400 },
    );
  }
  if (!VALID_RANGES.has(range)) {
    return NextResponse.json(
      { error: 'Invalid range. Use 5 or 10.' },
      { status: 400 },
    );
  }

  try {
    // ─── Fetch from Fyers (AWAITED, blocking) ───
    const snapshot = await fetchOptionChain(index);

    if (!snapshot) {
      console.warn('[Snapshot Route] Fyers returned null — keeping previous snapshot');
      return NextResponse.json(
        {
          error: 'Data temporarily unavailable',
          code: 'FETCH_FAILED',
        },
        { status: 503 },
      );
    }

    // ─── Data validation ───
    if (
      snapshot.spotPrice <= 0 ||
      snapshot.optionChain.length === 0 ||
      !snapshot.timestamp
    ) {
      console.warn('[Snapshot Route] Invalid data received');
      return NextResponse.json(
        { error: 'Invalid data received from broker', code: 'INVALID_DATA' },
        { status: 502 },
      );
    }

    // ─── Compute all metrics (ALL computation happens here) ───
    const result = computeAll(snapshot, index, range, selectedStrike);

    if (!result) {
      return NextResponse.json(
        { error: 'Computation failed — no strikes in range', code: 'NO_DATA' },
        { status: 422 },
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[API] ${index} spot=${result.spot.toFixed(1)} ` +
        `S=${result.support.toFixed(1)} R=${result.resistance.toFixed(1)} ` +
        `regime=${result.regime} (${elapsed}ms)`,
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Snapshot Route] Error:', err);
    return NextResponse.json(
      {
        error: 'Server error',
        code: 'INTERNAL',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
