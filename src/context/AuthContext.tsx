"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  clearOriginalSession,
  getOriginalSession,
  getStoredToken,
  getStoredUser,
  clearSession,
  saveOriginalSession,
  saveSession,
} from "@/lib/session";
import { canUserAccessPath, getDefaultRouteForRole, getDefaultRouteForUser, isPublicPath, userHasPermission, type AuthUser, type PermissionKey } from "@/lib/auth-contract";
import api from "@/lib/api";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser, remember?: boolean, redirectTo?: string) => void;
  logout: () => void;
  stopImpersonation: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  isAuthenticated: boolean;
  canAccess: (pathname: string) => boolean;
  hasPermission: (permission: PermissionKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    if (!user && !isPublicPath(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && !canUserAccessPath(user, pathname)) {
      router.replace(`/unauthorized?from=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, router, user]);

  useEffect(() => {
    if (user?.role !== "employee" || user.id === undefined || user.id === null) return;

    const syncEmployeePermissions = async () => {
      try {
        const response = await api.get(`/employee/${encodeURIComponent(String(user.id))}`);
        const permissions = Array.isArray(response.data?.data?.permissions) ? response.data.data.permissions as string[] : [];

        setUser((currentUser) => {
          if (!currentUser || currentUser.role !== "employee") return currentUser;
          const currentPermissions = [...(currentUser.permissions || [])].sort();
          const nextPermissions = [...permissions].sort();
          if (JSON.stringify(currentPermissions) === JSON.stringify(nextPermissions)) return currentUser;

          const updatedUser = { ...currentUser, permissions };
          saveSession(getStoredToken() || "", updatedUser, true);
          return updatedUser;
        });
      } catch {
        // Keep the current session during temporary API failures.
      }
    };

    const handleFocus = () => void syncEmployeePermissions();
    void syncEmployeePermissions();
    const intervalId = window.setInterval(() => void syncEmployeePermissions(), 5000);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user?.id, user?.role]);

  const login = (token: string, user: AuthUser, remember = false, redirectTo?: string) => {
    if (user.impersonator_role === "super_admin" && user.role === "admin" && user.company_id && user.company_id !== null) {
      const currentToken = getStoredToken();
      if (currentToken) {
        const currentUser = getStoredUser();
        if (currentUser?.role === "super_admin") {
          saveOriginalSession(currentToken, currentUser);
        }
      }
    }

    saveSession(token, user, remember);
    setUser(user);
    showToast(`Welcome, ${user.name}!`);
    const safeRedirect = redirectTo && canUserAccessPath(user, redirectTo) ? redirectTo : getDefaultRouteForUser(user);
    router.push(safeRedirect);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    showToast("Logged out successfully.");
    router.push("/login");
  };

  const stopImpersonation = () => {
    const originalSession = getOriginalSession();
    if (!originalSession) {
      logout();
      return;
    }

    clearOriginalSession();
    saveSession(originalSession.token, originalSession.user, true);
    setUser(originalSession.user);
    showToast("Returned to Super Admin.");
    router.push(getDefaultRouteForRole(originalSession.user.role));
  };

  const updateUser = (updatedFields: Partial<AuthUser>) => {
    if (user) {
      const newUser = { ...user, ...updatedFields };
      setUser(newUser);
      const token = getStoredToken() || "";
      saveSession(token, newUser, true); 
    }
  };

  const canAccess = (targetPathname: string) => canUserAccessPath(user, targetPathname);
  const hasPermission = (permission: PermissionKey) => userHasPermission(user, permission);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        stopImpersonation,
        updateUser,
        isAuthenticated: !!user,
        canAccess,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
