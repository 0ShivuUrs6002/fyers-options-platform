/// Iron Session configuration.
///
/// Encrypted httpOnly cookie — frontend JS cannot read token data.
/// Token lives inside the cookie (encrypted with SESSION_PASSWORD).

import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string | null;
  expiresAt?: number; // Unix ms
  appId?: string;
  oauthState?: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || 'fallback_password_change_me_at_least_32_chars!',
  cookieName: 'fyers_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
