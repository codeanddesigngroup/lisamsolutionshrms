"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { Users, FileText, CreditCard, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Clients", value: "124", icon: Users, color: "bg-blue-500", href: "/clients" },
  { label: "Total Contracts", value: "32", icon: FileText, color: "bg-purple-500", href: "/contracts" },
  { label: "Active Projects", value: "18", icon: TrendingUp, color: "bg-green-500", href: "/projects" },
  { label: "Total Earnings", value: "$45,200", icon: CreditCard, color: "bg-yellow-500", href: "/payments" },
];

const recentClients = [
  { name: "Acme Corp", email: "contact@acme.com", joined: "2026-05-01", status: "Active" },
  { name: "Globex Corp", email: "info@globex.com", joined: "2026-05-02", status: "Active" },
  { name: "Initech", email: "hr@initech.com", joined: "2026-05-03", status: "Inactive" },
];

export default function ClientDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <h1 className="text-base font-semibold text-gray-700">Client Dashboard</h1>
          <ol className="flex text-sm text-gray-500 space-x-1">
            <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li className="text-gray-700">Client Dashboard</li>
          </ol>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow border-none bg-white shadow-sm overflow-hidden group">
                <div className="flex items-center justify-between p-2">
                  <div className={`p-4 rounded-xl ${stat.color} text-white shadow-lg shadow-${stat.color.split('-')[1]}-200 transition-transform group-hover:scale-110`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Clients Table */}
          <Card className="p-0 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">New Clients</h3>
              <Link href="/clients" className="text-[10px] font-black text-primary uppercase hover:underline">View All</Link>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Client</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentClients.map((client, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{client.name}</p>
                          <p className="text-[10px] text-gray-500">{client.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{client.joined}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          client.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-0 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Client Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex space-x-4 relative">
                    {i !== 3 && <div className="absolute left-[11px] top-6 w-[2px] h-10 bg-gray-100"></div>}
                    <div className="h-6 w-6 rounded-full bg-blue-500 border-4 border-white shadow-sm z-10 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Acme Corp posted a new project update</p>
                      <p className="text-[10px] text-gray-400 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" /> 2 hours ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
