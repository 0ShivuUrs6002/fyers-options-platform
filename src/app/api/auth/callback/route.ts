/// GET /api/auth/callback — Fyers OAuth callback handler.
///
/// Receives auth_code from Fyers, exchanges it for access_token,
/// stores token in encrypted session cookie, redirects to dashboard.

import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthCode } from '@/lib/fyers/auth';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const authCode = url.searchParams.get('auth_code');
  const state = url.searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!authCode) {
    console.error('[Auth] Callback missing auth_code');
    return NextResponse.redirect(
      `${appUrl}/login?error=missing_code`,
    );
  }

  try {
    // Validate CSRF state
    const session = await getSession();
    const savedState = session.oauthState;

    if (state && savedState && state !== savedState) {
      console.error('[Auth] State mismatch');
      return NextResponse.redirect(
        `${appUrl}/login?error=state_mismatch`,
      );
    }

    // Exchange auth code for tokens
    console.log('[Auth] Exchanging auth code for tokens...');
    const result = await exchangeAuthCode(authCode);

    // Store in encrypted session
    session.accessToken = result.accessToken;
    session.refreshToken = result.refreshToken;
    session.appId = process.env.FYERS_APP_ID!;
    // Fyers tokens typically valid for 24h
    session.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    delete session.oauthState;
    await session.save();

    console.log('[Auth] ✓ Authentication successful');
    return NextResponse.redirect(appUrl);
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    return NextResponse.redirect(
      `${appUrl}/login?error=exchange_failed`,
    );
  }
}
