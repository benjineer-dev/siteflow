'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '@/lib/api';
import {
  type AuthResponse,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from '@/lib/auth-types';

const TOKEN_STORAGE_KEY =
  'siteflow.accessToken';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (
    request: LoginRequest,
  ) => Promise<void>;
  register: (
    request: RegisterRequest,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const saveSession = useCallback(
    (auth: AuthResponse) => {
      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        auth.accessToken,
      );

      setToken(auth.accessToken);
      setUser(auth.user);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreSession(): Promise<void> {
      const storedToken =
        localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const currentUser =
          await apiRequest<AuthUser>(
            '/auth/me',
            {
              token: storedToken,
            },
          );

        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setUser(currentUser);
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (
      request: LoginRequest,
    ): Promise<void> => {
      const auth =
        await apiRequest<AuthResponse>(
          '/auth/login',
          {
            method: 'POST',
            body: request,
          },
        );

      saveSession(auth);
    },
    [saveSession],
  );

  const register = useCallback(
    async (
      request: RegisterRequest,
    ): Promise<void> => {
      const auth =
        await apiRequest<AuthResponse>(
          '/auth/register',
          {
            method: 'POST',
            body: request,
          },
        );

      saveSession(auth);
    },
    [saveSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}