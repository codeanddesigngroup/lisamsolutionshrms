import Card from "@/components/ui/Card";
import type { AdminStats } from "../types";

type AdminStatsCardsProps = {
  stats: AdminStats;
};

export const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  const statItems = [
    { label: "Total Admins", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Company / Branches", value: stats.companies },
    { label: "Restricted", value: stats.restricted },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.label} className="border-none bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{item.value}</p>
        </Card>
      ))}
    </div>
  );
};
