"use client";

import DashboardLayout from "./DashboardLayout";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  Settings, 
  Languages, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CreditCard, 
  Bell, 
  Mail,
  Palette,
  Cloud
} from "lucide-react";

const settingsNav = [
  { group: "System", items: [
    { label: "Company Settings", href: "/settings/company", icon: Building2 },
    { label: "App Settings", href: "/settings/app", icon: Settings },
    { label: "Language Settings", href: "/settings/language", icon: Languages },
    { label: "Theme Settings", href: "/settings/theme", icon: Palette },
  ]},
  { group: "HR & Finance", items: [
    { label: "Attendance Settings", href: "/settings/attendance", icon: Clock },
    { label: "Leave Settings", href: "/settings/leave", icon: Calendar },
    { label: "Finance Settings", href: "/settings/finance", icon: CreditCard },
  ]},
  { group: "Communications", items: [
    { label: "Notification Settings", href: "/settings/notifications", icon: Bell },
    { label: "Email Settings", href: "/settings/email", icon: Mail },
    { label: "Pusher Settings", href: "/settings/pusher", icon: Cloud },
  ]},
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardLayout>
      <div className="flex space-x-6">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
               <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Settings</h2>
            </div>
            <div className="p-2 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
              {settingsNav.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="px-3 py-2 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{group.group}</p>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link 
                        key={item.label} 
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                          isActive 
                            ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5" 
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
