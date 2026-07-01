import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  setAccessToken,
  setTokenRefreshedHandler,
} from '../api/client';
import type { AuthResponse, User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // trwa próba przywrócenia sesji po starcie
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Gdy klient po cichu odświeży access token, nie zmieniamy usera —
  // token trzymany jest w module api. Handler zostawiamy dla ewentualnej synchronizacji.
  useEffect(() => {
    setTokenRefreshedHandler(() => {
      // token już zaktualizowany w module api; nic więcej nie trzeba robić
    });
  }, []);

  // Przy starcie próbujemy przywrócić sesję z refresh cookie (httpOnly).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api<AuthResponse>('/api/auth/refresh', {
          method: 'POST',
        });
        if (active) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch {
        // brak ważnej sesji — użytkownik niezalogowany
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await api<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignorujemy błąd wylogowania — i tak czyścimy stan lokalny
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
