"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { Ticket, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Tickets", value: "85", icon: Ticket, color: "bg-blue-500", href: "/tickets" },
  { label: "Open Tickets", value: "12", icon: AlertCircle, color: "bg-red-500", href: "/tickets?status=open" },
  { label: "Pending Tickets", value: "8", icon: Clock, color: "bg-yellow-500", href: "/tickets?status=pending" },
  { label: "Resolved Tickets", value: "65", icon: CheckCircle, color: "bg-green-500", href: "/tickets?status=resolved" },
];

const recentTickets = [
  { id: "TIC-101", subject: "Cannot login to dashboard", requester: "Jane Smith", priority: "High", status: "Open" },
  { id: "TIC-102", subject: "How to add new employee?", requester: "John Doe", priority: "Medium", status: "Pending" },
  { id: "TIC-103", subject: "Invoice calculation error", requester: "Alice White", priority: "Low", status: "Resolved" },
];

export default function TicketDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <h1 className="text-base font-semibold text-gray-700">Ticket Dashboard</h1>
          <ol className="flex text-sm text-gray-500 space-x-1">
            <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li className="text-gray-700">Ticket Dashboard</li>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tickets Table */}
          <Card className="p-0 lg:col-span-2 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Tickets</h3>
              <Link href="/tickets" className="text-[10px] font-black text-primary uppercase hover:underline">View All</Link>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Ticket</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Requester</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTickets.map((ticket, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/tickets/${ticket.id}`} className="text-xs font-bold text-primary hover:underline">{ticket.subject}</Link>
                        <p className="text-[10px] text-gray-400">{ticket.id}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 font-medium">{ticket.requester}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ticket.priority === "High" ? "text-red-500" : ticket.priority === "Medium" ? "text-yellow-600" : "text-blue-500"
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ticket.status === "Open" ? "bg-red-100 text-red-600" : ticket.status === "Pending" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Ticket Stats / Feedback */}
          <Card className="p-0 lg:col-span-1 overflow-hidden border-none shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Performance</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-3xl font-black text-primary">98%</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Satisfaction Score</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold">Avg. Response Time</span>
                  <span className="text-gray-800 font-black">2.5 hrs</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[70%]"></div>
                </div>
                
                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-gray-500 font-bold">Avg. Resolution Time</span>
                  <span className="text-gray-800 font-black">18.2 hrs</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full">
                  <div className="bg-green-500 h-1.5 rounded-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
