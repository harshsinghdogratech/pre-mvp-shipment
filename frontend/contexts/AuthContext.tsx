"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const setSession = useCallback((t: string, u: User) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{
      access_token: string;
      token_type: string;
      user: User;
    }>("/auth/login", { email: email.trim(), password });
    setSession(data.access_token, data.user);
    return data.user;
  }, [setSession]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    (async () => {
      try {
        const { data } = await api.get<User>("/auth/me");
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    })();
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      setSession,
    }),
    [user, token, loading, login, logout, setSession]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
