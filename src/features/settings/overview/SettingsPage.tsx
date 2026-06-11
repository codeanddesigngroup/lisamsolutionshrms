"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { 
  Settings as SettingsIcon, 
  Clock, 
  CreditCard,
  Cpu,
  ShieldCheck,
  Palette,
  FileText,
  Calendar,
  Briefcase,
  Tags,
  GitPullRequest,
  DollarSign,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type SettingsItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  module: string;
  description: string;
};

const settingsGroups: Array<{ title: string; items: SettingsItem[] }> = [
  {
    title: "Core Controls",
    items: [
      { label: "Company & Account Setup", href: "/account-setup", icon: SettingsIcon, module: "Company", description: "Company profile, timezone, invoice prefix, and account defaults." },
      { label: "Roles & Permissions", href: "/role-permission", icon: ShieldCheck, module: "Access", description: "Role permission matrix used by admin, employee, and client access." },
      { label: "Theme Settings", href: "/theme-settings", icon: Palette, module: "Appearance", description: "Saved color, sidebar, top bar, radius, and density settings." },
    ]
  },
  {
    title: "HR Configuration",
    items: [
      { label: "Attendance Settings", href: "/attendance-settings", icon: Clock, module: "Attendance", description: "Office hours, clock-in limits, open days, radius, IP, and reminders." },
      { label: "Attendance Devices", href: "/settings/attendance-devices", icon: Cpu, module: "Attendance", description: "Biometric device registration and sync status." },
      { label: "Shift Settings", href: "/attendance/settings/shifts", icon: Calendar, module: "Shifts", description: "Shift timings, break windows, grace minutes, and attendance rules." },
      { label: "Leave Types", href: "/leave-type", icon: Calendar, module: "Leaves", description: "Leave balances and colors used by leave requests and reports." },
      { label: "Holiday Calendar", href: "/holidays", icon: Calendar, module: "Holidays", description: "Company holidays, weekly offs, and calendar/list views." },
    ]
  },
  {
    title: "Work Configuration",
    items: [
      { label: "Project Categories", href: "/project-category", icon: Briefcase, module: "Projects", description: "Project category records used by project forms and reporting filters." },
      { label: "Task Labels", href: "/task-label", icon: Tags, module: "Tasks", description: "Task labels used by tasks, task board, and quick task creation." },
      { label: "Task Requests", href: "/task-request", icon: GitPullRequest, module: "Tasks", description: "Incoming task request review, approval, and rejection flow." },
      { label: "Event Types", href: "/event-type", icon: Calendar, module: "Events", description: "Event type names and colors for the admin event calendar." },
    ]
  },
  {
    title: "Finance & Sales",
    items: [
      { label: "Payroll Settings", href: "/payroll/settings", icon: DollarSign, module: "Payroll", description: "Salary components, groups, employee payroll setup, TDS, and payments." },
      { label: "Currency Settings", href: "/currencies", icon: CreditCard, module: "Finance", description: "Currency records and exchange rates used by finance screens." },
      { label: "Lead Settings", href: "/lead-settings", icon: FileText, module: "Leads", description: "Lead sources, statuses, and categories used by CRM workflows." },
    ]
  },
  {
    title: "Support",
    items: [
      { label: "Ticket Form", href: "/ticket-form", icon: Ticket, module: "Tickets", description: "Public ticket form fields, status behavior, and sorting." },
    ]
  },
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-8 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Settings</span>
            </div>
          </div>
        </div>

        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{group.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item, i) => (
                <Link key={i} href={item.href}>
                  <Card className="p-5 hover:shadow-md transition-all group border-gray-100 hover:border-primary/30 flex items-start space-x-4 cursor-pointer h-full bg-white">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">{item.label}</h3>
                        <span className="shrink-0 rounded-full border border-gray-100 bg-gray-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                          {item.module}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-medium">{item.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
