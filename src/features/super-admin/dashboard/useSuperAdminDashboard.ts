"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { DashboardStats, RecentCompany } from "./types";

type ApiCompany = {
  id: number | string;
  name?: string;
  company_name?: string;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ApiUser = {
  id: number | string;
  role?: string | null;
  role_record?: {
    name?: string | null;
  } | null;
};

type ApiRole = {
  id: number | string;
};

const emptyStats: DashboardStats = {
  totalBranches: 0,
  activeBranches: 0,
  inactiveBranches: 0,
  admins: 0,
  permissionProfiles: 0,
};

const normalizeStatus = (status?: string | null): RecentCompany["status"] => (String(status || "").toLowerCase() === "inactive" ? "Inactive" : "Active");

const getCompanyName = (company: ApiCompany) => company.name || company.company_name || `Company ${company.id}`;

const getCompanyDate = (company: ApiCompany) => company.created_at || company.updated_at || new Date().toISOString();

const isCompanyAdmin = (user: ApiUser) => {
  const role = String(user.role || user.role_record?.name || "").trim().toLowerCase().replace(/\s+/g, "_");
  return role === "admin";
};

export const useSuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [companiesResponse, usersResponse, rolesResponse] = await Promise.all([api.get("/companies"), api.get("/users"), api.get("/roles")]);
        if (!mounted) return;

        const companies = (companiesResponse.data.data || []) as ApiCompany[];
        const users = (usersResponse.data.data || []) as ApiUser[];
        const roles = (rolesResponse.data.data || []) as ApiRole[];
        const activeCompanies = companies.filter((company) => normalizeStatus(company.status) === "Active");
        const inactiveCompanies = companies.filter((company) => normalizeStatus(company.status) === "Inactive");

        setStats({
          totalBranches: companies.length,
          activeBranches: activeCompanies.length,
          inactiveBranches: inactiveCompanies.length,
          admins: users.filter(isCompanyAdmin).length,
          permissionProfiles: roles.length,
        });

        setRecentCompanies(
          [...companies]
            .sort((a, b) => new Date(getCompanyDate(b)).getTime() - new Date(getCompanyDate(a)).getTime())
            .slice(0, 6)
            .map((company) => ({
              id: company.id,
              name: getCompanyName(company),
              email: company.email || "No email added",
              status: normalizeStatus(company.status),
              date: getCompanyDate(company),
            })),
        );
      } catch (err) {
        if (!mounted) return;
        console.error("Unable to load super admin dashboard data:", err);
        setStats(emptyStats);
        setRecentCompanies([]);
        setError("Unable to load dashboard data");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    stats,
    recentCompanies,
    loading,
    error,
  };
};
