import type { DashboardStats, RecentCompany } from "./types";

export const defaultDashboardStats: DashboardStats = {
  totalBranches: 6,
  activeBranches: 5,
  inactiveBranches: 1,
  admins: 4,
  permissionProfiles: 8,
};

export const defaultRecentCompanies: RecentCompany[] = [
  { id: 1, name: "Head Office", email: "info@lisam.com", status: "Active", date: "2024-05-01" },
  { id: 2, name: "Operations Branch", email: "operations@lisam.com", status: "Active", date: "2024-05-03" },
  { id: 3, name: "Remote Team", email: "remote@lisam.com", status: "Inactive", date: "2024-05-05" },
];
