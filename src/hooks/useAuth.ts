/// useAuth — Authentication state hook.
///
/// Checks /api/auth/status on mount to determine if user
/// is authenticated. Provides login/logout actions.

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

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/status', { method: 'POST' });
    setState({ authenticated: false, loading: false, expiresAt: null });
  }, []);

  return { ...state, login, logout, checkAuth };
}
