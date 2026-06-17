import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStorage } from "@/api/client";
import type { UserDTO } from "@/api/types";
import { usersApi } from "@/api/users.api";

export type AuthContextValue = {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setSession: (token: string, user: UserDTO) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [user, setUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!tokenStorage.get()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const me = await usersApi.me();
      setUser(me);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setSession = useCallback((nextToken: string, nextUser: UserDTO) => {
    tokenStorage.set(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === "ADMIN",
    isLoading,
    setSession,
    refreshUser,
    logout
  }), [isLoading, logout, refreshUser, setSession, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
