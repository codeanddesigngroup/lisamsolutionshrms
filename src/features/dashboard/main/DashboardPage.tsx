"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Users, 
  UserSquare2, 
  Layers, 
  Receipt, 
  CheckSquare,
  Clock,
  Ticket,
  AlertCircle,
  PhoneCall,
  Calendar as CalendarIcon,
  CheckCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const statsData = {
    totalClients: 24,
    totalEmployees: 18,
    totalProjects: 12,
    unpaidInvoices: 5,
    pendingTasks: 34,
    hoursLogged: "156 hrs",
    completedTasks: 89,
    todayAttendance: "16/18",
    resolvedTickets: 65,
    unresolvedTickets: 12,
  };

  const stats = [
    { label: "Total Clients", value: statsData.totalClients, icon: Users, color: "text-blue-500", bg: "bg-blue-50", href: "/clients" },
    { label: "Total Employees", value: statsData.totalEmployees, icon: UserSquare2, color: "text-orange-500", bg: "bg-orange-50", href: "/employees" },
    { label: "Total Projects", value: statsData.totalProjects, icon: Layers, color: "text-purple-500", bg: "bg-purple-50", href: "/projects" },
    { label: "Unpaid Invoices", value: statsData.unpaidInvoices, icon: Receipt, color: "text-red-500", bg: "bg-red-50", href: "/invoices" },
    { label: "Pending Tasks", value: statsData.pendingTasks, icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-50", href: "/tasks" },
    { label: "Hours Logged", value: statsData.hoursLogged, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50", href: "/time-logs" },
    { label: "Completed Tasks", value: statsData.completedTasks, icon: CheckSquare, color: "text-green-500", bg: "bg-green-50", href: "/tasks" },
    { label: "Today Attendance", value: statsData.todayAttendance, icon: UserSquare2, color: "text-pink-500", bg: "bg-pink-50", href: "/attendance" },
    { label: "Resolved Tickets", value: statsData.resolvedTickets, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", href: "/tickets" },
    { label: "Unresolved Tickets", value: statsData.unresolvedTickets, icon: Ticket, color: "text-rose-500", bg: "bg-rose-50", href: "/tickets" },
  ];

  const newTickets = [
    { id: 1, title: "Cannot access the server via SSH", time: "2 hours ago" },
    { id: 2, title: "Update billing information", time: "5 hours ago" },
    { id: 3, title: "Feature request: Dark mode", time: "1 day ago" },
  ];

  const overdueTasks = [
    { id: 1, title: "Finalize homepage mockup", project: "Website Redesign", due: "2026-05-01" },
    { id: 2, title: "Setup staging environment", project: "Mobile App", due: "2026-05-03" },
    { id: 3, title: "Client presentation", project: "Brand Identity", due: "2026-05-04" },
  ];

  const pendingFollowUps = [
    { id: 1, name: "Acme Corp", due: "Today 2:00 PM" },
    { id: 2, name: "Globex Inc", due: "Tomorrow 10:00 AM" },
    { id: 3, name: "Stark Industries", due: "2026-05-09 11:30 AM" },
  ];

  const projectActivities = [
    { project: "Website Redesign", action: "Milestone reached", user: "Alice S.", time: "2 hours ago", color: "bg-blue-500" },
    { project: "Mobile App", action: "New task added", user: "Bob J.", time: "4 hours ago", color: "bg-purple-500" },
    { project: "API Integration", action: "Completed phase 1", user: "Carol W.", time: "1 day ago", color: "bg-green-500" },
  ];

  const userActivities = [
    { user: "Alice Smith", action: "Uploaded a new file to project.", time: "1 hour ago", initials: "AS", color: "bg-blue-100 text-blue-600" },
    { user: "Bob Johnson", action: "Created a new invoice.", time: "3 hours ago", initials: "BJ", color: "bg-green-100 text-green-600" },
    { user: "David Lee", action: "Logged 4 hours on 'Backend Setup'.", time: "5 hours ago", initials: "DL", color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-3 border-b border-gray-50">
          <div>
            <h1 className="font-black text-gray-800 uppercase tracking-widest flex items-center">
              Dashboard
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Welcome back, Admin</p>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-right hidden sm:block">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Current Time</p>
                <p className="text-xs font-bold text-primary flex items-center justify-end">
                   <Clock className="h-3.5 w-3.5 mr-1" /> {time || "Loading..."}
                </p>
             </div>
             <div className="text-right hidden md:block">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Today&apos;s Date</p>
                <p className="text-xs font-bold text-gray-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
             </div>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-none group bg-white p-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary group-hover:text-white shadow-sm`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider truncate">{stat.label}</p>
                    <p className="text-lg font-black text-gray-900 truncate">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Chart Mockup */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">Recent Earnings</h3>
            </div>
            <div className="p-6">
               <div className="h-48 flex items-end justify-between px-2 relative">
                 <div className="absolute top-0 w-full border-t border-dashed border-gray-200"></div>
                 <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200"></div>
                 
                 {[30, 45, 25, 60, 40, 80, 50, 75, 40, 90, 60, 85].map((h, i) => (
                   <div key={i} className="w-1/12 px-1 relative group h-full flex items-end">
                     <div className="w-full bg-blue-100 rounded-t-sm hover:bg-blue-200 transition-colors relative" style={{ height: `${h}%` }}>
                       <div className="absolute -top-1 w-full border-t-2 border-primary"></div>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="flex justify-between mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                 <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
               </div>
               <p className="mt-4 text-[10px] text-gray-500 font-medium">
                 <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold mr-2 uppercase tracking-widest">Note</span> 
                 Earnings chart visualizes payments received over the last 12 months.
               </p>
            </div>
          </Card>

          {/* Leaves Calendar / Notices Mockup */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">Leaves & Events</h3>
               <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="p-6 space-y-4">
               {[
                 { date: "May 08", event: "Alice Smith - Sick Leave", color: "bg-red-50 text-red-600 border-red-100" },
                 { date: "May 10", event: "Company Meeting", color: "bg-blue-50 text-blue-600 border-blue-100" },
                 { date: "May 15", event: "Bob Johnson - Vacation", color: "bg-green-50 text-green-600 border-green-100" },
               ].map((item, i) => (
                 <div key={i} className={`flex items-center p-3 border rounded-xl ${item.color}`}>
                   <div className="flex-shrink-0 text-center px-3 border-r border-current border-opacity-20">
                     <p className="text-[10px] font-black uppercase">{item.date.split(' ')[0]}</p>
                     <p className="text-sm font-black">{item.date.split(' ')[1]}</p>
                   </div>
                   <div className="px-4">
                     <p className="text-xs font-bold">{item.event}</p>
                   </div>
                 </div>
               ))}
               <div className="text-center pt-2">
                 <Link href="/leaves" className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest">View Full Calendar</Link>
               </div>
            </div>
          </Card>

          {/* New Tickets */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">New Tickets</h3>
            </div>
            <div className="p-0">
               <ul className="divide-y divide-gray-50">
                 {newTickets.map((ticket, i) => (
                   <li key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                       <span className="text-[10px] font-black text-gray-400">{i + 1}.</span>
                       <Link href="/tickets" className="text-xs font-bold text-primary hover:underline">{ticket.title}</Link>
                     </div>
                     <span className="text-[10px] text-gray-400 font-medium italic">{ticket.time}</span>
                   </li>
                 ))}
               </ul>
            </div>
          </Card>

          {/* Overdue Tasks */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">Overdue Tasks</h3>
            </div>
            <div className="p-0">
               <ul className="divide-y divide-gray-50">
                 {overdueTasks.map((task, i) => (
                   <li key={i} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div className="flex items-start space-x-3">
                       <span className="text-[10px] font-black text-gray-400 mt-0.5">{i + 1}.</span>
                       <div>
                         <Link href="/tasks" className="text-xs font-bold text-gray-800 hover:text-primary transition-colors">{task.title}</Link>
                         <p className="text-[10px] text-gray-500 font-medium mt-0.5">{task.project}</p>
                       </div>
                     </div>
                     <span className="inline-block bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest self-start sm:self-center whitespace-nowrap">
                       {task.due}
                     </span>
                   </li>
                 ))}
               </ul>
            </div>
          </Card>

          {/* Pending Lead Follow-Up */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">Pending Follow-Up</h3>
            </div>
            <div className="p-0">
               <ul className="divide-y divide-gray-50">
                 {pendingFollowUps.map((lead, i) => (
                   <li key={i} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                     <div className="flex items-center space-x-3">
                       <span className="text-[10px] font-black text-gray-400">{i + 1}.</span>
                       <Link href="/leads" className="text-xs font-bold text-primary hover:underline flex items-center">
                          <PhoneCall className="h-3 w-3 mr-1.5" /> {lead.name}
                       </Link>
                     </div>
                     <span className="inline-block bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest self-start sm:self-center whitespace-nowrap">
                       {lead.due}
                     </span>
                   </li>
                 ))}
               </ul>
            </div>
          </Card>

          {/* Project Activity Timeline */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">Project Activity Timeline</h3>
            </div>
            <div className="p-6 relative">
               <div className="absolute left-9 top-6 bottom-6 w-px bg-gray-100" />
               <div className="space-y-6">
                 {projectActivities.map((item, i) => (
                    <div key={i} className="flex items-start space-x-6 relative">
                       <div className="text-right w-16 flex-shrink-0 mt-0.5">
                          <p className="text-[9px] font-black text-gray-400 uppercase leading-tight">{item.time}</p>
                       </div>
                       <div className={`h-4 w-4 rounded-full ${item.color} border-2 border-white shadow-sm z-10 flex-shrink-0 mt-0.5`} />
                       <div>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            <span className="font-bold text-gray-900">{item.project}:</span> {item.action}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest">By {item.user}</p>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </Card>

          {/* User Activity Timeline */}
          <Card className="p-0 border-none shadow-sm overflow-hidden bg-white lg:col-span-2">
            <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30">
               <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">User Activity Timeline</h3>
            </div>
            <div className="p-6 relative">
               <div className="absolute left-[3.25rem] top-6 bottom-6 w-px bg-gray-100" />
               <div className="space-y-6">
                 {userActivities.map((item, i) => (
                    <div key={i} className="flex items-start space-x-6 relative">
                       <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-black z-10 flex-shrink-0 border-4 border-white shadow-sm ${item.color}`}>
                         {item.initials}
                       </div>
                       <div className="flex-1 mt-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-gray-800">
                              <span className="text-primary hover:underline cursor-pointer">{item.user}</span>
                            </p>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:ml-4 mt-1 sm:mt-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{item.action}</p>
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
