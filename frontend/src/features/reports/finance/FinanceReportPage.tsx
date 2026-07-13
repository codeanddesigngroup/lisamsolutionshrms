"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StableResponsiveContainer from "@/components/charts/StableResponsiveContainer";
import { Filter, RefreshCw, DollarSign, Calendar, TrendingUp, TrendingDown, CreditCard, Download, Search, Briefcase, Users } from "lucide-react";
import { formatCurrency } from "@/lib/payroll-utils";
import Link from "next/link";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const financeData = [
  { id: 1, invoice: "INV-001", client: "Acme Corp", project: "Website Redesign", total: 1500.00, paid: 1500.00, date: "2026-05-01", status: "Paid" },
  { id: 2, invoice: "INV-002", client: "Globex Corp", project: "Mobile App", total: 2200.00, paid: 0.00, date: "2026-05-02", status: "Unpaid" },
  { id: 3, invoice: "INV-003", client: "Initech", project: "API Integration", total: 800.00, paid: 400.00, date: "2026-05-03", status: "Partial" },
  { id: 4, invoice: "INV-004", client: "Umbrella Corp", project: "Website Redesign", total: 3500.00, paid: 3500.00, date: "2026-05-04", status: "Paid" },
  { id: 5, invoice: "INV-005", client: "Wayne Ent", project: "Mobile App", total: 12000.00, paid: 6000.00, date: "2026-05-05", status: "Partial" },
];

const chartData = [
  { month: 'Jan', earning: 4500 },
  { month: 'Feb', earning: 5200 },
  { month: 'Mar', earning: 4800 },
  { month: 'Apr', earning: 6100 },
  { month: 'May', earning: 7500 },
  { month: 'Jun', earning: 6800 },
];

export default function FinanceReportPage() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setProjectFilter("");
    setClientFilter("");
  };

  const filteredFinanceData = financeData.filter((row) => {
    const startMatch = !dateFrom || row.date >= dateFrom;
    const endMatch = !dateTo || row.date <= dateTo;
    const projectMatch = !projectFilter || row.project === projectFilter;
    const clientMatch = !clientFilter || row.client === clientFilter;
    return startMatch && endMatch && projectMatch && clientMatch;
  });
  const financeTotals = filteredFinanceData.reduce(
    (total, row) => ({
      invoice: total.invoice + row.total,
      paid: total.paid + row.paid,
      unpaid: total.unpaid + (row.status === "Unpaid" ? row.total : 0),
      partial: total.partial + (row.status === "Partial" ? row.total - row.paid : 0),
    }),
    { invoice: 0, paid: 0, unpaid: 0, partial: 0 },
  );
  const projectOptions = Array.from(new Set(financeData.map((row) => row.project)));
  const clientOptions = Array.from(new Set(financeData.map((row) => row.client)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <DollarSign className="h-5 w-5 mr-3 text-primary" />
              Finance Report
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Home / Reports / Financial Performance Metrics</p>
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
               <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-none shadow-sm p-6 bg-white mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">All Projects</option>
                  {projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">All Clients</option>
                  {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2 flex items-end space-x-2">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[
            { label: "Total Invoices", value: formatCurrency(financeTotals.invoice), icon: DollarSign, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Total Paid", value: formatCurrency(financeTotals.paid), icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
            { label: "Total Unpaid", value: formatCurrency(financeTotals.unpaid), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
            { label: "Total Partial", value: formatCurrency(financeTotals.partial), icon: CreditCard, color: "text-yellow-500", bg: "bg-yellow-50" },
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-none shadow-sm bg-white flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className={`text-xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h3>
              </div>
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:rotate-6 transition-transform`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </Card>
          ))}
        </div>

        {/* Chart Section */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-primary" />
            Monthly Earning Trends
          </h3>
          <StableResponsiveContainer height={288}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="month" 
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
              <Bar dataKey="earning" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#10b981' : '#d1fae5'} />
                ))}
              </Bar>
            </BarChart>
          </StableResponsiveContainer>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="text-red-500 mr-2">Note:</span> 
            Earnings are based on paid and partial payments received within the selected date range.
          </div>
        </Card>

        {/* Table Section */}
        <Card className="p-0 overflow-hidden shadow-sm border-none bg-white">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Search className="h-4 w-4 mr-2 text-primary" />
              Payment Records
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Paid Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredFinanceData.map((row, i) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs text-gray-300 font-bold text-center">{i + 1}</td>
                    <td className="px-6 py-4 text-xs font-black text-primary uppercase tracking-tight hover:underline cursor-pointer">{row.invoice}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-tighter">{row.client}</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-800 text-right">${row.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-bold text-green-600 text-right">${row.paid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">{row.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        row.status === "Paid" ? "bg-green-50 text-green-600 border-green-100" : row.status === "Unpaid" ? "bg-red-50 text-red-600 border-red-100" : "bg-yellow-50 text-yellow-600 border-yellow-100"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredFinanceData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No payment records found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
