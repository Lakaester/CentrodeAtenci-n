import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService, type AuthUser, type LoginError } from "./services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    const u = await authService.me();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    // Limpiar caché sensible de React Query (clientes, tickets, reportes, facturación).
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

export type { LoginError };
