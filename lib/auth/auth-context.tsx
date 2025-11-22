/**
 * Authentication Context
 * Sprint 2: Authentication & Member Dashboard
 *
 * Provides authentication state and methods throughout the app
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
  login: (phoneNumber: string, otpCode: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [verifyOtpMutation] = useMutation(VERIFY_OTP);
  const [logoutMutation] = useMutation(LOGOUT);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = useCallback(
    async (phoneNumber: string, otpCode: string): Promise<{ success: boolean; message: string }> => {
      try {
        const { data } = await verifyOtpMutation({
          variables: { phoneNumber, otpCode },
        });

        const result = data.verifyOtp;

        if (result.success && result.accessToken) {
          // Store tokens
          localStorage.setItem(TOKEN_KEY, result.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);

          // Store user info
          const userData: User = {
            userId: result.userId,
            memberId: result.memberId,
            phoneNumber: result.phoneNumber,
            fullName: result.fullName,
          };
          localStorage.setItem(USER_KEY, JSON.stringify(userData));

          // Update state
          setAccessToken(result.accessToken);
          setUser(userData);

          return { success: true, message: result.message };
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

      const result = data.refreshToken;

      if (result.success && result.accessToken) {
        localStorage.setItem(TOKEN_KEY, result.accessToken);
        setAccessToken(result.accessToken);
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
