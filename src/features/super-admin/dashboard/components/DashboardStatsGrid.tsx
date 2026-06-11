import { AlertCircle, Layers, TrendingUp, Users } from "lucide-react";
import type { DashboardStatCard, DashboardStats } from "../types";

type DashboardStatsGridProps = {
  stats: DashboardStats;
};

export const DashboardStatsGrid = ({ stats }: DashboardStatsGridProps) => {
  const statCards: DashboardStatCard[] = [
    { label: "Company / Branches", value: stats.totalBranches, icon: Layers, color: "bg-info" },
    { label: "Active Branches", value: stats.activeBranches, icon: TrendingUp, color: "bg-success" },
    { label: "Inactive Branches", value: stats.inactiveBranches, icon: AlertCircle, color: "bg-warning" },
    { label: "Company Admins", value: stats.admins, icon: Users, color: "bg-secondary" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {statCards.map((stat) => (
        <div key={stat.label} className="white-box flex items-center p-4">
          <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded text-white ${stat.color}`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-[10px] font-bold uppercase text-gray-400">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
