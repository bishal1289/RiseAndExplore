import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type { AdminUser } from './lib/types';

interface AuthValue {
  user: AdminUser | null;
  loading: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  setUser: (u: AdminUser) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api<AdminUser>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const setUser = (u: AdminUser | null) => qc.setQueryData(['auth', 'me'], u);

  const value: AuthValue = {
    user: data ?? null,
    loading: isLoading,
    isOwner: data?.role === 'owner',
    login: async (email, password) => {
      const u = await api<AdminUser>('/auth/login', { method: 'POST', body: { email, password } });
      setUser(u);
      return u;
    },
    logout: async () => {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      qc.removeQueries({ queryKey: ['admin'] });
    },
    setUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
