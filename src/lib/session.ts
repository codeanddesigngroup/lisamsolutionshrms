"use client";

import Cookies from "js-cookie";
import { getDefaultRouteForRole, normalizeRole, rolePermissions, type AuthUser, type UserRole } from "./auth-contract";

// CONSTANTS FOR STORAGE
// These are the names of the "buckets" where we save data in the browser.
const TOKEN_COOKIE = "token";
const ROLE_COOKIE = "user_role";
const USER_STORAGE_KEY = "user";
const ORIGINAL_SESSION_STORAGE_KEY = "original_super_admin_session";

type OriginalSession = {
  token: string;
  user: AuthUser;
};

// saveSession: Triggered right after a successful login.
// It takes the token and user data from the backend and saves them into Cookies and LocalStorage.
export const saveSession = (token: string, user: AuthUser, remember = false) => {
  if (typeof window === "undefined") return;

  const expires = remember ? 30 : 7; // Remember me for 30 days, else 7 days.
  const normalizedUser: AuthUser = {
    ...user,
    role: normalizeRole(user.role),
    permissions: Array.isArray(user.permissions) ? user.permissions : rolePermissions[normalizeRole(user.role)],
  };

  Cookies.set(TOKEN_COOKIE, token, { expires });
  Cookies.set(ROLE_COOKIE, normalizedUser.role, { expires });
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
};

// clearSession: Triggered when the user clicks "Logout".
// It wipes the browser completely clean of any login traces.
export const clearSession = () => {
  if (typeof window === "undefined") return;

  Cookies.remove(TOKEN_COOKIE);
  Cookies.remove(ROLE_COOKIE);
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ORIGINAL_SESSION_STORAGE_KEY);
};

// getStoredUser: Retrieves the user's profile info from local storage without making an API call.
export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsedUser = JSON.parse(storedUser) as AuthUser;
    const role = normalizeRole(parsedUser.role);
    return {
      ...parsedUser,
      role,
      permissions: Array.isArray(parsedUser.permissions) ? parsedUser.permissions : rolePermissions[role],
    };
  } catch {
    clearSession(); // If the data is corrupted, clear it out.
    return null;
  }
};

// getStoredRole: Quickly checks if the user is an admin, employee, etc.
export const getStoredRole = (): UserRole => {
  const user = getStoredUser();
  return normalizeRole(user?.role || Cookies.get(ROLE_COOKIE));
};

// getStoredToken: Grabs the Bearer Token (used by api.ts to authenticate requests).
export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return Cookies.get(TOKEN_COOKIE) || null;
};

// ORIGINAL SESSION LOGIC (Super Admin "Log In As" feature)
// Super Admins can click "Log in as Employee" to test the system. 
// This saves the Super Admin's real session so they can switch back later.
export const saveOriginalSession = (token: string, user: AuthUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORIGINAL_SESSION_STORAGE_KEY, JSON.stringify({ token, user }));
};

export const getOriginalSession = (): OriginalSession | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(ORIGINAL_SESSION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as OriginalSession) : null;
  } catch {
    window.localStorage.removeItem(ORIGINAL_SESSION_STORAGE_KEY);
    return null;
  }
};

export const clearOriginalSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORIGINAL_SESSION_STORAGE_KEY);
};

// Determines where the user should go after logging in based on their role.
export const getStoredDefaultRoute = () => getDefaultRouteForRole(getStoredRole());
