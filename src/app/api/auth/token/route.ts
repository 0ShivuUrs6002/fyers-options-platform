/// POST /api/auth/token — Save a manually-entered Fyers access token.
///
/// This is the fallback for when OAuth redirect is blocked by Cloudflare.
/// The user can generate a token from Fyers dashboard (myapi.fyers.in)
/// and paste it here.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 400 },
      );
    }

    // Validate token by making a profile request to Fyers
    const profileRes = await fetch('https://api-t1.fyers.in/api/v3/profile', {
      headers: {
        'Authorization': `${process.env.FYERS_APP_ID}:${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      console.error('[Auth] Token validation failed:', profileRes.status);
      return NextResponse.json(
        { error: 'Token validation failed — check the token and try again' },
        { status: 401 },
      );
    }

    const profileData = await profileRes.json();
    if (profileData.s !== 'ok' && profileData.code !== 200) {
      console.error('[Auth] Token invalid, profile response:', profileData);
      return NextResponse.json(
        { error: 'Invalid token — Fyers rejected it' },
        { status: 401 },
      );
    }

    // Token is valid — store in session
    const session = await getSession();
    session.accessToken = accessToken;
    session.refreshToken = null;
    session.appId = process.env.FYERS_APP_ID!;
    session.expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await session.save();

    console.log('[Auth] ✓ Manual token saved successfully');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Auth] Token save error:', err);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 },
    );
  }
}
