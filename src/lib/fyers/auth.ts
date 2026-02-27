/// Fyers OAuth 2.0 helper functions.
///
/// Flow:
///   1. generateAuthUrl()  → redirect user to Fyers login
///   2. exchangeAuthCode() → POST to Fyers, get access_token
///   3. refreshAccessToken() → use refresh_token (if available)

import { createHash } from 'crypto';

const FYERS_AUTH_BASE = 'https://api-t1.fyers.in/api/v3';

// ═══════════════════════════════════════════════════════════
// AUTH URL GENERATION
// ═══════════════════════════════════════════════════════════

export function generateAuthUrl(state: string): string {
  const appId = process.env.FYERS_APP_ID!;
  const redirectUri = process.env.FYERS_REDIRECT_URI!;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  return `${FYERS_AUTH_BASE}/generate-authcode?${params.toString()}`;
}

// ═══════════════════════════════════════════════════════════
// TOKEN EXCHANGE
// ═══════════════════════════════════════════════════════════

export interface TokenExchangeResult {
  accessToken: string;
  refreshToken: string | null;
}

export async function exchangeAuthCode(
  authCode: string,
): Promise<TokenExchangeResult> {
  const appId = process.env.FYERS_APP_ID!;
  const secret = process.env.FYERS_SECRET_KEY!;

  // Fyers requires SHA256(app_id:secret_key) as appIdHash
  const appIdHash = createHash('sha256')
    .update(`${appId}:${secret}`)
    .digest('hex');

  const response = await fetch(`${FYERS_AUTH_BASE}/validate-authcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      appIdHash,
      code: authCode,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  if (data.s !== 'ok' && data.code !== 200) {
    throw new Error(`Fyers error: ${data.message || JSON.stringify(data)}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
  };
}

// ═══════════════════════════════════════════════════════════
// TOKEN REFRESH
// ═══════════════════════════════════════════════════════════

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenExchangeResult | null> {
  const appId = process.env.FYERS_APP_ID!;
  const secret = process.env.FYERS_SECRET_KEY!;

  const appIdHash = createHash('sha256')
    .update(`${appId}:${secret}`)
    .digest('hex');

  try {
    const response = await fetch(`${FYERS_AUTH_BASE}/validate-refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        appIdHash,
        refresh_token: refreshToken,
        pin: '', // Some Fyers apps require PIN; leave empty if not applicable
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.s !== 'ok' && data.code !== 200) return null;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
    };
  } catch {
    console.error('[Auth] Refresh token exchange failed');
    return null;
  }
}
