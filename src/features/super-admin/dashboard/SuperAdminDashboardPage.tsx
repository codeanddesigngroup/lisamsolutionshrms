"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStatsGrid } from "./components/DashboardStatsGrid";
import { RecentCompaniesTable } from "./components/RecentCompaniesTable";
import { useSuperAdminDashboard } from "./useSuperAdminDashboard";

export default function SuperAdminDashboardPage() {
  const { stats, recentCompanies } = useSuperAdminDashboard();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />
        <DashboardStatsGrid stats={stats} />
        <RecentCompaniesTable companies={recentCompanies} />
      </div>
    </DashboardLayout>
  );
}
