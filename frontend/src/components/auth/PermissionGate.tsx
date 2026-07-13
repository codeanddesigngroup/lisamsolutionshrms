"use client";

import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { userHasPermission, type PermissionKey } from "@/lib/auth-contract";

interface PermissionGateProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuth();
  return userHasPermission(user, permission) ? <>{children}</> : <>{fallback}</>;
}
