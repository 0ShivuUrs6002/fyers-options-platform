/// GET /api/auth/login — Returns Fyers OAuth URL.
///
/// Instead of server-side redirect (which Cloudflare blocks),
/// returns the URL for the client to navigate via window.location.

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { generateAuthUrl } from '@/lib/fyers/auth';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    // Generate CSRF state token
    const state = randomBytes(16).toString('hex');

    // Store state in session for validation on callback
    const session = await getSession();
    session.oauthState = state;
    await session.save();

    const authUrl = generateAuthUrl(state);

    console.log('[Auth] Returning Fyers OAuth URL for client redirect');
    return NextResponse.json({ url: authUrl });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 },
    );
  }
}
