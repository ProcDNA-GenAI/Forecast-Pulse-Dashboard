"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthConfig, getUserInfo, loginUrl, logout as logoutApi } from "@/utils/auth/api";
import type { AuthMode, AuthUser } from "@/utils/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  authMode: AuthMode;
  isAuthenticated: boolean;
  isLoading: boolean;
  beginLogin: (nextPath?: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function currentRelativePath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function nextPathFromLoginUrl() {
  if (typeof window === "undefined") {
    return "/";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");
  return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const initialized = useRef(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("sso");
  const [isLoading, setIsLoading] = useState(true);

  const beginLogin = useCallback((nextPath = "/") => {
    if (typeof window !== "undefined") {
      window.location.assign(loginUrl(nextPath));
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    void (async () => {
      try {
        const [config, currentUser] = await Promise.all([
          getAuthConfig().catch(() => ({ mode: "sso" as const })),
          getUserInfo(),
        ]);

        setAuthMode(config.mode);

        if (!currentUser) {
          setUser(null);
          return;
        }

        setUser({
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.display_name,
          email: currentUser.email,
          isAdmin: currentUser.is_admin ?? false,
          department: currentUser.department ?? null,
          jobTitle: currentUser.job_title ?? null,
          profileUrl: currentUser.profile_url ?? null,
          expiresAt: currentUser.expires_at,
        });

        if (pathname === "/login") {
          router.replace(nextPathFromLoginUrl());
        }
      } catch (error) {
        console.error("Unable to validate the authentication session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [pathname, router]);

  const logout = useCallback(async () => {
    try {
      const response = await logoutApi();
      setUser(null);
      window.location.assign(response.logout_url);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
      window.location.assign("/login");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authMode,
      isAuthenticated: Boolean(user),
      isLoading,
      beginLogin,
      logout,
    }),
    [authMode, beginLogin, isLoading, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

export { currentRelativePath };
