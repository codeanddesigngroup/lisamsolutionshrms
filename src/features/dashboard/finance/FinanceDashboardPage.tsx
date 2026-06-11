"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { DollarSign, Wallet, TrendingUp, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const stats = [
  { label: "Paid Invoices", value: "25", icon: DollarSign, color: "bg-success-gradient", href: "/invoices" },
  { label: "Total Expenses", value: "$4,500", icon: Wallet, color: "bg-warning-gradient", href: "/expenses" },
  { label: "Total Earnings", value: "$32,400", icon: TrendingUp, color: "bg-danger-gradient", href: "/payments" },
  { label: "Total Profit", value: "$27,900", icon: CreditCard, color: "bg-inverse-gradient", href: "#" },
];

const overviews = {
  invoice: [
    { label: "Paid", count: 25, percent: 70, color: "green" },
    { label: "Unpaid", count: 8, percent: 20, color: "red" },
    { label: "Partial", count: 3, percent: 10, color: "yellow" },
  ],
  estimate: [
    { label: "Accepted", count: 15, percent: 60, color: "green" },
    { label: "Waiting", count: 8, percent: 30, color: "yellow" },
    { label: "Declined", count: 2, percent: 10, color: "red" },
  ],
  proposal: [
    { label: "Accepted", count: 10, percent: 50, color: "green" },
    { label: "Waiting", count: 8, percent: 40, color: "yellow" },
    { label: "Declined", count: 2, percent: 10, color: "red" },
  ],
};

const tableData = [
  { id: 1, number: "INV-001", project: "Website Redesign", client: "Acme Corp", total: "$1,500.00", date: "2026-05-01", status: "Paid" },
  { id: 2, number: "INV-002", project: "Mobile App", client: "Globex Corp", total: "$2,200.00", date: "2026-05-02", status: "Unpaid" },
  { id: 3, number: "INV-003", project: "API Integration", client: "Initech", total: "$800.00", date: "2026-05-03", status: "Partial" },
];

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState("invoice");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <h1 className="text-base font-semibold text-gray-700">Finance Dashboard</h1>
          <ol className="flex text-sm text-gray-500 space-x-1">
            <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li className="text-gray-700">Finance Dashboard</li>
          </ol>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-700">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Overviews Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(overviews).map(([key, items]) => (
            <Card key={key} className="p-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">{key} Overview</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className={`text-${item.color}-600`}>
                        <span className="mr-1">{item.count}</span>
                        {item.label}
                      </span>
                      <span className="text-gray-400">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className={`bg-${item.color}-500 h-1.5 rounded-full`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs Section */}
        <Card className="p-0 overflow-hidden">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {["invoice", "estimate", "expense", "payment"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === tab ? "border-primary text-primary bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}s
              </button>
            ))}
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">#</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">{activeTab} #</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Client</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-400">{row.id}</td>
                    <td className="px-6 py-4 text-xs font-bold text-primary hover:underline cursor-pointer">{row.number}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{row.project}</td>
                    <td className="px-6 py-4 text-xs text-gray-600 font-medium">{row.client}</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-800">{row.total}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        row.status === "Paid" ? "bg-green-100 text-green-700" : row.status === "Unpaid" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Horizontal Charts Row */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-8">Earnings By Client</h3>
            <div className="space-y-6">
              {[
                { name: "Acme Corp", value: "$12,000", percent: 80 },
                { name: "Globex Corp", value: "$8,500", percent: 60 },
                { name: "Initech", value: "$5,200", percent: 40 },
                { name: "Soylent Corp", value: "$3,100", percent: 25 },
              ].map((item) => (
                <div key={item.name} className="flex items-center space-x-4">
                  <div className="w-32 text-xs font-bold text-gray-500 truncate">{item.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${item.percent}%` }}></div>
                  </div>
                  <div className="w-20 text-right text-xs font-black text-gray-700">{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
