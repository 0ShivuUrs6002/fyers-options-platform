/// useAuth — Authentication state hook.
///
/// Checks /api/auth/status on mount to determine if user
/// is authenticated. Provides login/logout/saveToken actions.

'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  expiresAt: number | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    loading: true,
    expiresAt: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setState({
        authenticated: data.authenticated,
        loading: false,
        expiresAt: data.expiresAt,
      });
    } catch {
      setState({ authenticated: false, loading: false, expiresAt: null });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/login');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error('[Auth] Failed to get login URL');
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/status', { method: 'POST' });
    setState({ authenticated: false, loading: false, expiresAt: null });
  }, []);

  // Manual token entry — fallback when Cloudflare blocks OAuth
  const saveToken = useCallback(async (accessToken: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      if (res.ok) {
        await checkAuth();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [checkAuth]);

  return { ...state, login, logout, checkAuth, saveToken };
}
