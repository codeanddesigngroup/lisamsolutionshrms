"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Settings, 
  Filter,
  RefreshCw,
  User,
  Layers,
  Search,
  Check
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const initialNotifications = [
  { 
    id: 1, 
    type: "task", 
    title: "New Task Assigned", 
    message: "A new task 'Design System Update' has been assigned to you by Admin.", 
    time: "2 minutes ago", 
    isRead: false,
    icon: Layers,
    color: "text-blue-500",
    bg: "bg-blue-50"
  },
  { 
    id: 2, 
    type: "message", 
    title: "New Message", 
    message: "Alice Smith sent you a message regarding the 'Website Redesign' project.", 
    time: "45 minutes ago", 
    isRead: false,
    icon: MessageSquare,
    color: "text-purple-500",
    bg: "bg-purple-50"
  },
  { 
    id: 3, 
    type: "project", 
    title: "Project Milestone Reached", 
    message: "The milestone 'Phase 1 - Design' for project 'Mobile App' has been completed.", 
    time: "2 hours ago", 
    isRead: true,
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  },
  { 
    id: 4, 
    type: "system", 
    title: "System Update", 
    message: "The application has been successfully updated to version 4.2.0.", 
    time: "5 hours ago", 
    isRead: true,
    icon: Settings,
    color: "text-gray-500",
    bg: "bg-gray-50"
  },
  { 
    id: 5, 
    type: "attendance", 
    title: "Clock-in Reminder", 
    message: "Don't forget to clock-in for your shift today.", 
    time: "8 hours ago", 
    isRead: true,
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-50">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Notifications</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">You have {unreadCount} unread notifications</p>
          </div>
          <div className="flex items-center space-x-2">
             <Button 
                onClick={markAllRead}
                className="bg-white text-gray-500 border border-gray-100 text-[10px] font-black px-4 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all"
             >
                <Check className="h-4 w-4 mr-2" /> Mark All as Read
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Sidebar Filter */}
           <div className="lg:col-span-1 space-y-4">
              <Card className="p-4 border-none shadow-sm bg-white">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Filter</h3>
                 <nav className="space-y-1">
                    {[
                      { id: "all", label: "All Notifications", icon: Bell },
                      { id: "unread", label: "Unread Only", icon: Clock },
                    ].map((item) => (
                       <button
                          key={item.id}
                          onClick={() => setFilter(item.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                             filter === item.id ? "bg-primary/10 text-primary shadow-sm" : "text-gray-500 hover:bg-gray-50"
                          }`}
                       >
                          <div className="flex items-center space-x-3">
                             <item.icon className="h-4 w-4" />
                             <span>{item.label}</span>
                          </div>
                          {item.id === "unread" && unreadCount > 0 && (
                             <span className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                          )}
                       </button>
                    ))}
                 </nav>
              </Card>

              <Card className="p-5 border-none shadow-sm bg-primary/5">
                 <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Pro Tip</h4>
                 <p className="text-[11px] text-primary/70 leading-relaxed font-medium">
                    You can manage which notifications you receive in the Notification Settings page.
                 </p>
                 <Link href="/push-settings" className="inline-block mt-4 text-[10px] font-black text-primary uppercase underline tracking-widest">Settings</Link>
              </Card>
           </div>

           {/* Main Content */}
           <div className="lg:col-span-3 space-y-4">
              {filteredNotifications.length > 0 ? (
                 filteredNotifications.map((notification) => (
                    <Card 
                       key={notification.id} 
                       className={`p-5 border-none shadow-sm transition-all group relative overflow-hidden ${
                          notification.isRead ? "bg-white opacity-80" : "bg-white ring-1 ring-primary/10 shadow-lg shadow-primary/5"
                       }`}
                    >
                       {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                       )}
                       
                       <div className="flex items-start space-x-5">
                          <div className={`h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${notification.bg} ${notification.color} shadow-sm`}>
                             <notification.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <h3 className={`text-xs font-black uppercase tracking-widest ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}>
                                   {notification.title}
                                </h3>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{notification.time}</span>
                             </div>
                             <p className={`text-sm leading-relaxed ${notification.isRead ? "text-gray-400" : "text-gray-600 font-medium"}`}>
                                {notification.message}
                             </p>
                             
                             <div className="mt-4 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.isRead && (
                                   <button 
                                      onClick={() => {
                                         setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                                      }}
                                      className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                   >
                                      Mark as read
                                   </button>
                                )}
                                <button 
                                   onClick={() => deleteNotification(notification.id)}
                                   className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                >
                                   Delete
                                </button>
                             </div>
                          </div>
                       </div>
                    </Card>
                 ))
              ) : (
                 <Card className="py-20 text-center bg-white border-none shadow-sm">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Bell className="h-10 w-10 text-gray-200" />
                    </div>
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No notifications found</p>
                    <p className="text-[10px] text-gray-300 font-bold mt-2 px-6">You're all caught up! New notifications will appear here.</p>
                 </Card>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
