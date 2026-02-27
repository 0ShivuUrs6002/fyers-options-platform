/// Fyers Market Data API Client.
///
/// Fetches option chain data from Fyers API v3.
/// All responses are parsed into our internal OptionStrike[] format.
///
/// IMPORTANT: If Fyers changes their response format, update the
/// parseOptionChainResponse() function below. The rest of the system
/// only works with our OptionStrike interface.

import type { IndexSymbol, OptionStrike, MarketSnapshot, INDEX_CONFIG } from '../types';
import { INDEX_CONFIG as CONFIG } from '../types';
import { getSession } from '../session';
import { refreshAccessToken } from './auth';

const FYERS_DATA_BASE = 'https://api-t1.fyers.in/api/v3';

// ═══════════════════════════════════════════════════════════
// TOKEN MANAGEMENT — auto-refresh before every call
// ═══════════════════════════════════════════════════════════

interface ValidToken {
  accessToken: string;
  appId: string;
}

async function getValidToken(): Promise<ValidToken | null> {
  const session = await getSession();

  if (!session.accessToken || !session.appId) {
    return null;
  }

  // Check if token is expired (with 60s buffer)
  if (session.expiresAt && Date.now() > session.expiresAt - 60_000) {
    console.log('[FyersAPI] Access token expired, attempting refresh...');

    if (session.refreshToken) {
      const result = await refreshAccessToken(session.refreshToken);
      if (result) {
        session.accessToken = result.accessToken;
        session.refreshToken = result.refreshToken;
        // Fyers tokens typically last 24h
        session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
        await session.save();
        console.log('[FyersAPI] Token refreshed successfully');
      } else {
        console.error('[FyersAPI] Token refresh failed');
        return null;
      }
    } else {
      console.error('[FyersAPI] No refresh token available');
      return null;
    }
  }

  return { accessToken: session.accessToken, appId: session.appId };
}

// ═══════════════════════════════════════════════════════════
// OPTION CHAIN FETCH
// ═══════════════════════════════════════════════════════════

export async function fetchOptionChain(
  index: IndexSymbol,
  strikeCount: number = 20,
): Promise<MarketSnapshot | null> {
  const token = await getValidToken();
  if (!token) return null;

  const config = CONFIG[index];
  const url = `${FYERS_DATA_BASE}/optionChain?symbol=${encodeURIComponent(config.fyersSymbol)}&strikecount=${strikeCount}`;

  console.log(`[FyersAPI] Fetching: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `${token.appId}:${token.accessToken}`,
    },
    signal: AbortSignal.timeout(8000), // 8s hard timeout
  });

  if (!response.ok) {
    console.error(`[FyersAPI] HTTP ${response.status}: ${await response.text()}`);
    return null;
  }

  const raw = await response.json();

  if (raw.s !== 'ok' && raw.code !== 200) {
    console.error(`[FyersAPI] Error: ${raw.message || JSON.stringify(raw)}`);
    return null;
  }

  return parseOptionChainResponse(raw, index);
}

// ═══════════════════════════════════════════════════════════
// RESPONSE PARSER
// ═══════════════════════════════════════════════════════════
//
// Fyers API v3 option chain response format (approximate).
// ADJUST THIS FUNCTION if the actual response structure differs.
//
// Expected structure:
// {
//   "s": "ok",
//   "code": 200,
//   "data": {
//     "expiryData": [{ "date": "27-FEB-2026", "expiry": 1740614400 }],
//     "optionsChain": [
//       {
//         "strikePrice": 24500,
//         "call": {
//           "ltp": 150.5,
//           "oi": 5000000,
//           "chg_oi": 50000,
//           "volume": 100000,
//           "iv": 12.5
//         },
//         "put": {
//           "ltp": 80.3,
//           "oi": 3000000,
//           "chg_oi": -30000,
//           "volume": 80000,
//           "iv": 11.8
//         }
//       }
//     ],
//     "spot": {
//       "ltp": 24380.5,
//       "timestamp": "2026-02-27 14:30:00"
//     }
//   }
// }

function parseOptionChainResponse(
  raw: Record<string, unknown>,
  index: IndexSymbol,
): MarketSnapshot | null {
  try {
    const data = raw.data as Record<string, unknown> | undefined;
    if (!data) {
      console.error('[FyersAPI] No data field in response');
      return null;
    }

    // ─── Spot price ───
    const spot = data.spot as Record<string, unknown> | undefined;
    const spotPrice = Number(spot?.ltp ?? 0);
    const timestamp = String(spot?.timestamp ?? new Date().toISOString());

    if (spotPrice <= 0) {
      console.error('[FyersAPI] Invalid spot price:', spotPrice);
      return null;
    }

    // ─── Expiry ───
    const expiryData = data.expiryData as Array<Record<string, unknown>> | undefined;
    const expiryDate = expiryData?.[0]?.date
      ? String(expiryData[0].date)
      : '';

    // ─── Option chain strikes ───
    const chainRaw = data.optionsChain as Array<Record<string, unknown>> | undefined;
    if (!chainRaw || chainRaw.length === 0) {
      console.error('[FyersAPI] Empty option chain');
      return null;
    }

    const optionChain: OptionStrike[] = [];

    for (const entry of chainRaw) {
      const strike = Number(entry.strikePrice ?? 0);
      if (strike <= 0) continue;

      const call = (entry.call ?? entry.call_options ?? {}) as Record<string, unknown>;
      const put = (entry.put ?? entry.put_options ?? {}) as Record<string, unknown>;

      optionChain.push({
        strikePrice: strike,
        callOI: Number(call.oi ?? 0),
        putOI: Number(put.oi ?? 0),
        callOIChange: Number(call.chg_oi ?? call.change_oi ?? 0),
        putOIChange: Number(put.chg_oi ?? put.change_oi ?? 0),
        callVolume: Number(call.volume ?? 0),
        putVolume: Number(put.volume ?? 0),
        callLTP: Number(call.ltp ?? 0),
        putLTP: Number(put.ltp ?? 0),
        callIV: Number(call.iv ?? 0),
        putIV: Number(put.iv ?? 0),
      });
    }

    // Validate: no NaN values
    for (const s of optionChain) {
      if (Object.values(s).some((v) => typeof v === 'number' && isNaN(v))) {
        console.error('[FyersAPI] NaN detected in strike:', s.strikePrice);
        return null;
      }
    }

    // Sort by strike price
    optionChain.sort((a, b) => a.strikePrice - b.strikePrice);

    return {
      timestamp,
      spotPrice,
      optionChain,
      expiryDate,
      index,
    };
  } catch (err) {
    console.error('[FyersAPI] Parse error:', err);
    return null;
  }
}
