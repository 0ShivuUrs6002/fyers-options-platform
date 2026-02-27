/// GET /api/auth/login — Redirect to Fyers OAuth page.
///
/// Generates a unique state parameter, stores it in session,
/// and redirects the user to Fyers login.

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

    console.log('[Auth] Redirecting to Fyers OAuth');
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 },
    );
  }
}
