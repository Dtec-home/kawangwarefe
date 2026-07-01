/**
 * Authentication Context
 * Sprint 2: Authentication & Member Dashboard
 *
 * Provides authentication state and methods throughout the app.
 * Validates token expiry on load so stale tokens don't appear "logged in".
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { VERIFY_OTP, LOGOUT, REFRESH_TOKEN } from "@/lib/graphql/auth-mutations";

interface User {
  userId: number;
  memberId: number;
  phoneNumber: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phoneNumber: string, otpCode: string) => Promise<{ success: boolean; message: string; isNewMember?: boolean }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/**
 * Set or clear the lightweight "has_session" cookie used by
 * Next.js middleware for server-side route protection.
 * This cookie carries NO secret data — it's a boolean flag only.
 */
function setSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    // Set cookie that lasts 7 days (matching refresh token lifetime)
    document.cookie = "has_session=1; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "has_session=; path=/; max-age=0; SameSite=Lax";
  }
}

/**
 * Decode a JWT and check whether it has expired.
 * Returns true if the token is still valid (exp > now).
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds, Date.now() in ms — add 30s buffer
    return payload.exp * 1000 > Date.now() + 30_000;
  } catch {
    return false;
  }
}

// GraphQL response types
interface VerifyOtpPayload {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: number;
  memberId?: number;
  phoneNumber?: string;
  fullName?: string;
  message: string;
  isNewMember?: boolean;
}

interface RefreshTokenPayload {
  success: boolean;
  accessToken?: string;
  message: string;
}

/**
 * Read initial auth state synchronously from localStorage.
 * Returns the user/token if the access token is still valid,
 * or flags that an async refresh is needed.
 */
function getInitialAuthState(): {
  user: User | null;
  accessToken: string | null;
  needsRefresh: boolean;
} {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, needsRefresh: false };
  }

  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedToken || !storedUser) {
      return { user: null, accessToken: null, needsRefresh: false };
    }

    // Access token still valid — use it immediately (no loading spinner)
    if (isTokenValid(storedToken)) {
      setSessionCookie(true);
      return {
        user: JSON.parse(storedUser),
        accessToken: storedToken,
        needsRefresh: false,
      };
    }

    // Access token expired — check if refresh is possible
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefresh && isTokenValid(storedRefresh)) {
      return { user: null, accessToken: null, needsRefresh: true };
    }

    // Both tokens expired — clear stale data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSessionCookie(false);
  } catch {
    // Ignore storage errors
  }

  return { user: null, accessToken: null, needsRefresh: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = getInitialAuthState();
  const [user, setUser] = useState<User | null>(initial.user);
  const [accessToken, setAccessToken] = useState<string | null>(initial.accessToken);
  // Only show loading spinner when an async refresh is actually needed
  const [isLoading, setIsLoading] = useState(initial.needsRefresh);

  // Typed mutations so `data` is strongly typed (not `unknown`)
  const [verifyOtpMutation] = useMutation<
    { verifyOtp: VerifyOtpPayload },
    { phoneNumber: string; otpCode: string }
  >(VERIFY_OTP);

  const [logoutMutation] = useMutation<
    { logout: { success: boolean } },
    { refreshToken: string }
  >(LOGOUT);

  const [refreshTokenMutation] = useMutation<
    { refreshToken: RefreshTokenPayload },
    { refreshToken: string }
  >(REFRESH_TOKEN);

  // Only runs when access token expired but refresh token is still valid
  useEffect(() => {
    if (!initial.needsRefresh) return;

    const refreshSession = async () => {
      try {
        const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (!storedRefresh || !storedUser) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation RefreshToken($refreshToken: String!) {
                refreshToken(refreshToken: $refreshToken) {
                  success
                  accessToken
                }
              }`,
              variables: { refreshToken: storedRefresh },
            }),
          }
        );
        const data = await response.json();
        const result = data?.data?.refreshToken;

        if (result?.success && result?.accessToken) {
          localStorage.setItem(TOKEN_KEY, result.accessToken);
          setAccessToken(result.accessToken);
          setUser(JSON.parse(storedUser));
          setSessionCookie(true);
        } else {
          // Refresh failed — clear stale session
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setSessionCookie(false);
        }
      } catch (error) {
        console.error("Error refreshing session:", error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setSessionCookie(false);
      } finally {
        setIsLoading(false);
      }
    };

    refreshSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Proactive silent token refresh.
   * Whenever the access token changes, schedule a refresh 2 minutes before
   * it expires so users on long sessions never hit an "Authentication required"
   * error mid-request. The timer is cleared / reset whenever the token changes
   * (e.g. after refesh) or the component unmounts.
   */
  useEffect(() => {
    if (!accessToken) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const expiresInMs = payload.exp * 1000 - Date.now();
      // Refresh 2 minutes before expiry, but only if there's enough time left
      const refreshInMs = expiresInMs - 2 * 60 * 1000;

      if (refreshInMs > 0) {
        timer = setTimeout(async () => {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken && isTokenValid(refreshToken)) {
            // `refreshAccessToken` is defined below in the same closure,
            // but by the time the timer fires it will be available via the
            // ref captured at schedule-time — use the callback directly.
            try {
              const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
              if (!storedRefresh) return;
              const response = await fetch(
                process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    query: `mutation RefreshToken($refreshToken: String!) {
                      refreshToken(refreshToken: $refreshToken) {
                        success
                        accessToken
                      }
                    }`,
                    variables: { refreshToken: storedRefresh },
                  }),
                }
              );
              const json = await response.json();
              const result = json?.data?.refreshToken;
              if (result?.success && result?.accessToken) {
                localStorage.setItem(TOKEN_KEY, result.accessToken);
                setAccessToken(result.accessToken);
                setSessionCookie(true);
              }
            } catch {
              // Silent failure — the Apollo errorLink will handle recovery
            }
          }
        }, refreshInMs);
      }
    } catch {
      // Malformed token — ignore
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [accessToken]);


  const login = useCallback(
    async (phoneNumber: string, otpCode: string): Promise<{ success: boolean; message: string; isNewMember?: boolean }> => {
      try {
        const { data } = await verifyOtpMutation({
          variables: { phoneNumber, otpCode },
        });

        if (!data || !data.verifyOtp) {
          return { success: false, message: "No response from server" };
        }

        const result = data.verifyOtp;

        if (result.success && result.accessToken) {
          // Store tokens
          localStorage.setItem(TOKEN_KEY, result.accessToken);
          if (result.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);

          // Store user info
          const userData: User = {
            userId: result.userId ?? 0,
            memberId: result.memberId ?? 0,
            phoneNumber: result.phoneNumber ?? phoneNumber,
            fullName: result.fullName ?? "",
          };
          localStorage.setItem(USER_KEY, JSON.stringify(userData));

          // Update state
          setAccessToken(result.accessToken);
          setUser(userData);
          setSessionCookie(true);

          return { success: true, message: result.message, isNewMember: result.isNewMember ?? false };
        } else {
          return { success: false, message: result.message };
        }
      } catch (error: unknown) {
        console.error("Login error:", error);
        const errorMessage = error instanceof Error ? error.message : "Login failed";
        return { success: false, message: errorMessage };
      }
    },
    [verifyOtpMutation]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        await logoutMutation({
          variables: { refreshToken },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear storage and state regardless of API call success
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setSessionCookie(false);
      setAccessToken(null);
      setUser(null);
    }
  }, [logoutMutation]);

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        return false;
      }

      const { data } = await refreshTokenMutation({
        variables: { refreshToken },
      });

      if (!data || !data.refreshToken) {
        await logout();
        return false;
      }

      const result = data.refreshToken;

      if (result.success && result.accessToken) {
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        setAccessToken(result.accessToken);
        setSessionCookie(true);
        return true;
      } else {
        // Refresh token is invalid, logout user
        await logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
      return false;
    }
  }, [refreshTokenMutation, logout]);

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
