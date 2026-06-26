import { AlertCircle, Building2, ShieldCheck, TrendingUp, Users } from "lucide-react";
import type { DashboardStatCard, DashboardStats } from "../types";

type DashboardStatsGridProps = {
  stats: DashboardStats;
};

export const DashboardStatsGrid = ({ stats }: DashboardStatsGridProps) => {
  const statCards: DashboardStatCard[] = [
    { label: "Company / Branches", value: stats.totalBranches, icon: Building2, color: "bg-primary/10 text-primary", helper: "Total platform tenants" },
    { label: "Active Branches", value: stats.activeBranches, icon: TrendingUp, color: "bg-green-50 text-green-600", helper: "Ready for daily work" },
    { label: "Inactive Branches", value: stats.inactiveBranches, icon: AlertCircle, color: "bg-yellow-50 text-yellow-600", helper: "Need admin review" },
    { label: "Company Admins", value: stats.admins, icon: Users, color: "bg-blue-50 text-blue-600", helper: "Assigned operators" },
    { label: "Permission Profiles", value: stats.permissionProfiles, icon: ShieldCheck, color: "bg-gray-100 text-gray-700", helper: "Access templates" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {statCards.map((stat) => (
        <div key={stat.label} className="white-box p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
              <h3 className="m-0 mt-3 text-3xl font-black tracking-tight text-gray-800">{stat.value}</h3>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.helper}</span>
            <span className="h-2 w-2 rounded-full bg-green-400" />
          </div>
        </div>
      ))}
    </div>
  );
};
