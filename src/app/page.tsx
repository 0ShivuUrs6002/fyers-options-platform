/// Main page — Auth gate: show Dashboard or redirect to Login.
///
/// Three auth strategies to bypass Cloudflare blocking:
///   1. Meta-refresh redirect through a clean intermediate page (no JS, no referrer)
///   2. Manual URL copy-paste (user opens in address bar — cleanest)
///   3. Manual token entry (user gets token from Fyers dashboard directly)

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Home() {
  const { authenticated, loading, logout, saveToken } = useAuth();
  const [manualToken, setManualToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const authUrl = useMemo(() => {
    const appId = process.env.NEXT_PUBLIC_FYERS_APP_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_FYERS_REDIRECT_URI || '';
    if (!appId || !redirectUri) return '';
    const state = generateState();
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

  const handleCopyUrl = useCallback(async () => {
    if (!authUrl) return;
    await navigator.clipboard.writeText(authUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [authUrl]);

  const handleManualToken = useCallback(async () => {
    const token = manualToken.trim();
    if (!token) {
      setTokenError('Please paste your access token');
      return;
    }
    setTokenError('');
    const success = await saveToken(token);
    if (!success) {
      setTokenError('Failed to save token. Check the token and try again.');
    }
  }, [manualToken, saveToken]);

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
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center space-y-6 py-8 px-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              OPTIONS<span className="text-accent-blue">LAB</span>
            </h1>
            <p className="text-text-muted text-sm">
              Real-time options analysis powered by Fyers
            </p>
          </div>

          {/* ═══ STRATEGY 1: Meta-refresh redirect (bypasses Cloudflare) ═══ */}
          <a
            href={`/api/auth/redirect?url=${encodeURIComponent(authUrl)}`}
            rel="noreferrer noopener"
            className="block w-full py-3 px-4 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium text-sm transition-colors text-center"
          >
            Connect with Fyers
          </a>

          {/* ═══ ADVANCED OPTIONS ═══ */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-text-muted text-xs hover:text-text-secondary transition-colors"
          >
            {showAdvanced ? '▲ Hide options' : '▼ Login not working? Try these options'}
          </button>

          {showAdvanced && (
            <div className="space-y-5 pt-2 border-t border-surface-border">

              {/* ═══ STRATEGY 2: Copy URL and paste in browser ═══ */}
              <div className="space-y-2">
                <p className="text-text-secondary text-xs font-medium">
                  Option A: Copy login URL & paste in address bar
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={authUrl}
                    className="flex-1 bg-surface text-text-muted text-xs font-mono px-3 py-2 rounded border border-surface-border truncate"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2 bg-surface-elevated hover:bg-surface-hover text-text-secondary text-xs rounded border border-surface-border transition-colors whitespace-nowrap"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-text-muted text-[10px]">
                  Copy → open new tab → paste in address bar → Enter
                </p>
              </div>

              {/* ═══ STRATEGY 3: Manual token entry ═══ */}
              <div className="space-y-2">
                <p className="text-text-secondary text-xs font-medium">
                  Option B: Paste access token directly
                </p>
                <ol className="text-text-muted text-[10px] text-left list-decimal list-inside space-y-0.5">
                  <li>Go to <a href="https://myapi.fyers.in/dashboard" target="_blank" rel="noreferrer" className="text-accent-blue underline">myapi.fyers.in/dashboard</a></li>
                  <li>Click your app → Generate Token → Login</li>
                  <li>Copy the access token and paste below</li>
                </ol>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste access token here..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="flex-1 bg-surface text-text-primary text-xs font-mono px-3 py-2 rounded border border-surface-border focus:border-accent-blue focus:outline-none"
                  />
                  <button
                    onClick={handleManualToken}
                    className="px-3 py-2 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue text-xs rounded border border-accent-blue/30 transition-colors whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
                {tokenError && (
                  <p className="text-bearish text-[10px]">{tokenError}</p>
                )}
              </div>
            </div>
          )}

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
