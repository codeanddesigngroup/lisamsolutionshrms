"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  Calendar, 
  Users,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

const reportsList = [
  {
    title: "Task Reports",
    items: [
      { label: "Task Report", href: "/reports/tasks", icon: FileText, description: "View task progress and status reports." },
    ]
  },
  {
    title: "Finance Reports",
    items: [
      { label: "Finance Report", href: "/reports/finance", icon: DollarSign, description: "Summary of income, expenses, and profit." },
      { label: "Income vs Expense", href: "/reports/income-expense", icon: BarChart3, description: "Comparative report of earnings vs spending." },
      { label: "Payroll Report", href: "/reports/payroll", icon: FileText, description: "Detailed monthly payroll and salary reports." },
      { label: "Expense Report", href: "/reports/expense", icon: DollarSign, description: "Analysis of company and project expenses." },
    ]
  },
  {
    title: "HR Reports",
    items: [
      { label: "Leave Report", href: "/reports/leave", icon: Calendar, description: "Analyze leave patterns and balances." },
      { label: "Attendance Report", href: "/reports/attendance", icon: Users, description: "Daily and monthly attendance statistics." },
    ]
  }
];

export default function ReportsPage() {
  const [stats, setStats] = useState({
    earnings: "0.00",
    completedTasks: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchReportStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard");
      const data = response.data.data;
      setStats({
        earnings: data.totalEarnings || "0.00",
        completedTasks: data.completedTasks || 0,
        activeProjects: data.totalProjects || 0,
      });
    } catch (err) {
      console.error("Fetch Report Stats Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReportStats();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReportStats]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-8 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Reports Overview</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Reports</span>
            </div>
          </div>
          <button
              onClick={fetchReportStats}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative">
           {loading && (
             <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
             </div>
           )}
           <Card className="p-6 bg-blue-500 text-white border-none shadow-lg shadow-blue-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Earnings</h3>
              <p className="text-2xl font-black">${stats.earnings}</p>
              <div className="mt-4 flex items-center text-[10px] font-bold">
                 <TrendingUp className="h-3 w-3 mr-1" /> Live from finance module
              </div>
           </Card>
           <Card className="p-6 bg-purple-500 text-white border-none shadow-lg shadow-purple-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Tasks Completed</h3>
              <p className="text-2xl font-black">{stats.completedTasks}</p>
              <div className="mt-4 flex items-center text-[10px] font-bold">
                 <TrendingUp className="h-3 w-3 mr-1" /> Project progress summary
              </div>
           </Card>
           <Card className="p-6 bg-green-500 text-white border-none shadow-lg shadow-green-200">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Projects</h3>
              <p className="text-2xl font-black">{stats.activeProjects}</p>
              <div className="mt-4 flex items-center text-[10px] font-bold">
                 <TrendingUp className="h-3 w-3 mr-1" /> Active project lifecycle
              </div>
           </Card>
        </div>

        <div className="space-y-8">
          {reportsList.map((group, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">{group.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <Card className="p-6 hover:shadow-md transition-all group border-gray-100 hover:border-primary/20 flex items-start space-x-4 cursor-pointer bg-white">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-1 group-hover:text-primary transition-colors">{item.label}</h3>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{item.description}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
