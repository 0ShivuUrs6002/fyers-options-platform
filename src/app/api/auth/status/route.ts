/// GET  /api/auth/status — Check if user is authenticated.
/// POST /api/auth/status — Logout (destroy session).

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    const authenticated =
      !!session.accessToken &&
      (!session.expiresAt || Date.now() < session.expiresAt);

    return NextResponse.json({
      authenticated,
      expiresAt: session.expiresAt ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false, expiresAt: null });
  }
}

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
