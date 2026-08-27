import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { backend } from "@/lib/backend/client";
import type { PublicUser } from "@/lib/backend/types";
import { usesCustomToken } from "@/lib/auth/session-mode.mjs";

type AuthValue = {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  login(email: string, password: string): Promise<{ status: string }>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);
const TOKEN_KEY = "price-master:session";
const NATIVE_SESSION = "supabase-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const customToken = usesCustomToken(backend.sessionMode);
  const refresh = useCallback(async () => {
    const saved = customToken ? localStorage.getItem(TOKEN_KEY) : NATIVE_SESSION;
    if (!saved) {
      setLoading(false);
      return;
    }
    try {
      const nextUser = await backend.validateSession(saved);
      await backend.preload?.(saved, nextUser);
      setUser(nextUser);
      setToken(saved);
    } catch {
      if (customToken) localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [customToken]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function login(email: string, password: string) {
    const result = await backend.login(email, password);
    if (result.token) {
      await backend.preload?.(result.token, result.user);
      if (customToken) localStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      setUser(result.user);
    }
    return { status: result.status };
  }
  async function logout() {
    if (token) await backend.logout(token);
    if (customToken) localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return value;
}
