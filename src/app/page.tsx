/// Main page — Auth gate: show Dashboard or redirect to Login.

'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Home() {
  const { authenticated, loading, logout } = useAuth();

  // Build Fyers OAuth URL entirely client-side — no server call.
  // This makes the <a href> a normal browser navigation that
  // Cloudflare won't block.
  const authUrl = useMemo(() => {
    const appId = process.env.NEXT_PUBLIC_FYERS_APP_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_FYERS_REDIRECT_URI || '';
    if (!appId || !redirectUri) return '';

    const state = generateState();
    // Store state in sessionStorage for CSRF validation on callback
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fyers_oauth_state', state);
    }

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });

    return `https://api-t1.fyers.in/api/v3/generate-authcode?${params.toString()}`;
  }, []);

  // Loading check
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-secondary text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show login page
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="card max-w-sm w-full mx-4 text-center space-y-6 py-10">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              OPTIONS<span className="text-accent-blue">LAB</span>
            </h1>
            <p className="text-text-muted text-sm">
              Real-time options analysis powered by Fyers
            </p>
          </div>

          {/* REAL <a> tag — browser-native navigation, not JS redirect */}
          <a
            href={authUrl}
            rel="noopener"
            className="block w-full py-3 px-4 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium text-sm transition-colors text-center"
          >
            Connect with Fyers
          </a>

          <p className="text-text-muted text-xs leading-relaxed">
            Securely authenticate via Fyers OAuth 2.0.
            <br />
            Your credentials never touch this app.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated — show dashboard
  return <Dashboard onLogout={logout} />;
}
