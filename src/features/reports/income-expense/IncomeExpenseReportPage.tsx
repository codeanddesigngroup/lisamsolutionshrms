"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StableResponsiveContainer from "@/components/charts/StableResponsiveContainer";
import { Filter, RefreshCw, BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Search, Download } from "lucide-react";
import { formatCurrency } from "@/lib/payroll-utils";
import Link from "next/link";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const reportData = [
  { date: "Jan 2026", income: 5000, expense: 2000, profit: 3000 },
  { date: "Feb 2026", income: 7000, expense: 2500, profit: 4500 },
  { date: "Mar 2026", income: 6000, expense: 3000, profit: 3000 },
  { date: "Apr 2026", income: 8500, expense: 2100, profit: 6400 },
  { date: "May 2026", income: 9000, expense: 2800, profit: 6200 },
  { date: "Jun 2026", income: 9500, expense: 3000, profit: 6500 },
];

export default function IncomeExpenseReportPage() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [duration, setDuration] = useState("all");

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setDuration("all");
  };

  const monthDate = (label: string) => {
    const [monthName, year] = label.split(" ");
    const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
    return new Date(Number(year), monthIndex, 1);
  };
  const durationLimit = duration === "all" ? reportData.length : Number(duration);
  const durationRows = duration === "all" ? reportData : reportData.slice(-durationLimit);
  const filteredReportData = durationRows.filter((row) => {
    const dateValue = monthDate(row.date).toISOString().slice(0, 10);
    const startMatch = !dateFrom || dateValue >= dateFrom;
    const endMatch = !dateTo || dateValue <= dateTo;
    return startMatch && endMatch;
  });
  const totals = filteredReportData.reduce(
    (total, row) => ({
      income: total.income + row.income,
      expense: total.expense + row.expense,
      profit: total.profit + row.profit,
    }),
    { income: 0, expense: 0, profit: 0 },
  );
  const stats = [
    { label: "Total Income", value: formatCurrency(totals.income), color: "text-green-500", icon: TrendingUp, bg: "bg-green-50" },
    { label: "Total Expense", value: formatCurrency(totals.expense), color: "text-red-500", icon: TrendingDown, bg: "bg-red-50" },
    { label: "Total Profit", value: formatCurrency(totals.profit), color: "text-blue-500", icon: DollarSign, bg: "bg-blue-50" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <BarChart3 className="h-5 w-5 mr-3 text-primary" />
              Income vs Expense
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Home / Reports / Financial Comparison Analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
               <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-none shadow-sm p-6 bg-white mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From Date</label>
              <div className="relative cursor-pointer">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">To Date</label>
              <div className="relative cursor-pointer">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Duration</label>
              <select value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                <option value="all">All Months</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-end space-x-2">
              <Button onClick={handleRefresh} className="flex-1 bg-primary text-white text-[10px] font-black h-11 uppercase tracking-widest">
                Apply
              </Button>
              <Button onClick={handleReset} className="bg-gray-100 text-gray-500 border-none px-6 h-11 text-[10px] font-black uppercase tracking-widest">
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm p-6 bg-white overflow-hidden relative group hover:shadow-md transition-all">
              <div className="flex items-center space-x-4 relative z-10">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className={`text-xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h4>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card className="bg-white border-none shadow-sm p-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-primary" />
            Monthly Comparison Trends
          </h3>
          <StableResponsiveContainer height={320}>
            <BarChart data={filteredReportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </StableResponsiveContainer>
        </Card>

        {/* Table Section */}
        <Card className="border-none shadow-sm bg-white overflow-hidden p-0">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Search className="h-4 w-4 mr-2 text-primary" />
              Financial Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Month</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Income</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Expense</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReportData.map((data, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 text-xs font-black text-gray-700 uppercase tracking-tighter">{data.date}</td>
                    <td className="px-8 py-5 text-xs text-green-600 font-bold text-right tracking-tight">${data.income.toLocaleString()}</td>
                    <td className="px-8 py-5 text-xs text-red-500 font-bold text-right tracking-tight">${data.expense.toLocaleString()}</td>
                    <td className="px-8 py-5 text-xs text-blue-600 font-black text-right tracking-tight">${data.profit.toLocaleString()}</td>
                  </tr>
                ))}
                {filteredReportData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No financial rows found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50/50 font-black border-t border-gray-100">
                <tr>
                  <td className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400">Total Summary</td>
                  <td className="px-8 py-5 text-xs text-green-600 text-right tracking-tight">${totals.income.toLocaleString()}</td>
                  <td className="px-8 py-5 text-xs text-red-500 text-right tracking-tight">${totals.expense.toLocaleString()}</td>
                  <td className="px-8 py-5 text-xs text-blue-600 text-right tracking-tight">${totals.profit.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
