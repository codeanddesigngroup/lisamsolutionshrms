"use client";

import Link from "next/link";
import { Building2, CheckCircle2, CreditCard, ShieldCheck, UserCog } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardStatsGrid } from "./components/DashboardStatsGrid";
import { RecentCompaniesTable } from "./components/RecentCompaniesTable";
import { useSuperAdminDashboard } from "./useSuperAdminDashboard";

export default function SuperAdminDashboardPage() {
  const { stats, recentCompanies, loading, error } = useSuperAdminDashboard();
  const activeRate = stats.totalBranches > 0 ? Math.round((stats.activeBranches / stats.totalBranches) * 100) : 0;
  const overviewItems = [
    { label: "Active company rate", value: `${activeRate}%`, detail: `${stats.activeBranches} active of ${stats.totalBranches}`, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Admin coverage", value: stats.admins, detail: "Company admin accounts", icon: UserCog, color: "text-blue-600 bg-blue-50" },
    { label: "Permission profiles", value: stats.permissionProfiles, detail: "Role templates configured", icon: ShieldCheck, color: "text-gray-700 bg-gray-100" },
  ];
  const quickActions = [
    { label: "Create company", href: "/super-admin/companies/create", icon: Building2 },
    { label: "Invite admin", href: "/super-admin/users/create", icon: UserCog },
    { label: "Review invoices", href: "/super-admin/invoices", icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader />
        {error && (
          <div className="rounded border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
        <DashboardStatsGrid stats={stats} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="border-none bg-white p-6 shadow-sm xl:col-span-2">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Platform Overview</h4>
                <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Company readiness and access control snapshot</p>
              </div>
              <span className="w-fit rounded bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-600">Live</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {overviewItems.map((item) => (
                <div key={item.label} className="rounded border border-gray-100 bg-gray-50/60 p-4">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="m-0 text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <h3 className="m-0 text-2xl font-black tracking-tight text-gray-800">{item.value}</h3>
                    <span className="text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-none bg-white p-6 shadow-sm">
            <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Quick Actions</h4>
            <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Common super-admin workflows</p>
            <div className="mt-5 space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between rounded border border-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Open</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <RecentCompaniesTable companies={recentCompanies} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
