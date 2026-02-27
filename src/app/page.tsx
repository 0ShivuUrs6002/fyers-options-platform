/// Main page — Auth gate: show Dashboard or redirect to Login.

'use client';

import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { authenticated, loading, login, logout } = useAuth();

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

          <button
            onClick={login}
            className="w-full py-3 px-4 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Connect with Fyers
          </button>

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
