import type { LucideIcon } from "lucide-react";

export type DashboardStats = {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  admins: number;
  permissionProfiles: number;
};

export type DashboardStatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  helper: string;
};

export type RecentCompany = {
  id: number | string;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  date: string;
};
