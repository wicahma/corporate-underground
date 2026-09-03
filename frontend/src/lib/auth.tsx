"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, normUser, type UserMe } from "./api";

interface AuthCtxValue {
  user: UserMe | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtxValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(normUser(await api<unknown>("/auth/me")));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api<void>("/auth/logout", { method: "POST" });
    } catch {
      /* server session may already be gone */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
