"use client";

import { useEffect, useState } from "react";
import { defaultDashboardStats, defaultRecentCompanies } from "./data";
import type { DashboardStats, RecentCompany } from "./types";

export const useSuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    admins: 0,
    permissionProfiles: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStats(defaultDashboardStats);
      setRecentCompanies(defaultRecentCompanies);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return {
    stats,
    recentCompanies,
  };
};
