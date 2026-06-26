"use client";

import { Bell, Power, ChevronDown, User, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onMenuClick?: () => void;
}

type NavbarTitleRule = {
  prefix: string;
  title: string;
  section: string;
};

const navbarTitleRules: NavbarTitleRule[] = [
  { prefix: "/super-admin/dashboard", title: "Dashboard", section: "Super Admin" },
  { prefix: "/super-admin/profile", title: "Profile", section: "Super Admin" },
  { prefix: "/super-admin/companies", title: "Companies & Branches", section: "Super Admin" },
  { prefix: "/super-admin/admins", title: "Admins", section: "Super Admin" },
  { prefix: "/super-admin/packages", title: "Packages", section: "Super Admin" },
  { prefix: "/super-admin/invoices", title: "Invoices", section: "Super Admin" },
  { prefix: "/super-admin/settings", title: "Settings", section: "Super Admin" },
  { prefix: "/employee/dashboard", title: "Employee Dashboard", section: "Dashboard" },
  { prefix: "/member/dashboard", title: "Employee Dashboard", section: "Dashboard" },
  { prefix: "/dashboard/client", title: "Client Dashboard", section: "Dashboard" },
  { prefix: "/dashboard/project", title: "Project Dashboard", section: "Dashboard" },
  { prefix: "/dashboard/hr", title: "HR Dashboard", section: "Dashboard" },
  { prefix: "/dashboard/finance", title: "Finance Dashboard", section: "Dashboard" },
  { prefix: "/dashboard", title: "Dashboard", section: "Overview" },
  { prefix: "/leads", title: "Leads", section: "Sales" },
  { prefix: "/lead-form", title: "Lead Form", section: "Sales" },
  { prefix: "/lead-settings", title: "Lead Settings", section: "Sales" },
  { prefix: "/clients", title: "Clients", section: "Clients" },
  { prefix: "/client-contacts", title: "Client Contacts", section: "Clients" },
  { prefix: "/client-settings", title: "Client Settings", section: "Clients" },
  { prefix: "/employees", title: "Employees", section: "HR" },
  { prefix: "/teams", title: "Departments", section: "HR" },
  { prefix: "/designation", title: "Designations", section: "HR" },
  { prefix: "/attendance/settings/shifts", title: "Shift Settings", section: "Attendance" },
  { prefix: "/attendance/settings/policies", title: "Attendance Policies", section: "Attendance" },
  { prefix: "/attendance/reports", title: "Attendance Reports", section: "Attendance" },
  { prefix: "/attendance", title: "Attendance", section: "HR" },
  { prefix: "/holidays", title: "Holiday Calendar", section: "HR" },
  { prefix: "/leaves/settings", title: "Leave Settings", section: "Leaves" },
  { prefix: "/leaves", title: "Leaves", section: "HR" },
  { prefix: "/leave-type", title: "Leave Types", section: "Leaves" },
  { prefix: "/contracts", title: "Contracts", section: "Work" },
  { prefix: "/contract-type", title: "Contract Types", section: "Work" },
  { prefix: "/projects", title: "Projects", section: "Work" },
  { prefix: "/project-category", title: "Project Categories", section: "Work" },
  { prefix: "/project-template", title: "Project Templates", section: "Work" },
  { prefix: "/tasks", title: "Tasks", section: "Work" },
  { prefix: "/taskboard", title: "Task Board", section: "Work" },
  { prefix: "/task-calendar", title: "Task Calendar", section: "Work" },
  { prefix: "/task-category", title: "Task Categories", section: "Work" },
  { prefix: "/task-label", title: "Task Labels", section: "Work" },
  { prefix: "/task-request", title: "Task Requests", section: "Work" },
  { prefix: "/sub-task", title: "Sub Tasks", section: "Work" },
  { prefix: "/time-logs", title: "Time Logs", section: "Work" },
  { prefix: "/discussion-categories", title: "Discussion Categories", section: "Work" },
  { prefix: "/discussion", title: "Discussion", section: "Work" },
  { prefix: "/recruitment", title: "Recruitment", section: "Recruitment" },
  { prefix: "/estimates", title: "Estimates", section: "Finance" },
  { prefix: "/invoices", title: "Invoices", section: "Finance" },
  { prefix: "/invoice-recurring", title: "Recurring Invoices", section: "Finance" },
  { prefix: "/payments", title: "Payments", section: "Finance" },
  { prefix: "/expenses-recurring", title: "Recurring Expenses", section: "Finance" },
  { prefix: "/expenses", title: "Expenses", section: "Finance" },
  { prefix: "/credit-notes", title: "Credit Notes", section: "Finance" },
  { prefix: "/payroll/settings", title: "Payroll Settings", section: "Payroll" },
  { prefix: "/employee/payroll", title: "My Payslips", section: "Payroll" },
  { prefix: "/member/payroll", title: "My Payslips", section: "Payroll" },
  { prefix: "/payroll", title: "Payroll", section: "Payroll" },
  { prefix: "/user-chat", title: "Messages", section: "Communication" },
  { prefix: "/events", title: "Events", section: "Calendar" },
  { prefix: "/event-calendar", title: "Event Calendar", section: "Calendar" },
  { prefix: "/event-type", title: "Event Types", section: "Calendar" },
  { prefix: "/notices", title: "Notice Board", section: "Communication" },
  { prefix: "/reports", title: "Reports", section: "Reports" },
  { prefix: "/billing", title: "Billing", section: "Billing" },
  { prefix: "/settings", title: "Settings", section: "System" },
  { prefix: "/account-setup", title: "Account Setup", section: "System" },
  { prefix: "/role-permission", title: "Roles & Permissions", section: "System" },
  { prefix: "/theme-settings", title: "Theme Settings", section: "System" },
  { prefix: "/currencies", title: "Currency Settings", section: "Finance" },
  { prefix: "/taxes", title: "Tax Settings", section: "Finance" },
  { prefix: "/profile", title: "My Profile", section: "Account" },
  { prefix: "/products", title: "Products", section: "Products" },
  { prefix: "/notes", title: "Notes", section: "Notes" },
];

const titleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getNavbarTitle = (pathname: string) => {
  const normalizedPath = pathname === "/" ? "/dashboard" : pathname;
  const matchedRule = navbarTitleRules.find(
    (rule) => normalizedPath === rule.prefix || normalizedPath.startsWith(`${rule.prefix}/`),
  );

  if (matchedRule) return matchedRule;

  const segments = normalizedPath.split("/").filter(Boolean);
  const readableSegments = segments.filter((segment) => Number.isNaN(Number(segment)));
  const titleSegment = readableSegments[readableSegments.length - 1] || readableSegments[0] || "dashboard";
  const sectionSegment = readableSegments[0] || "overview";

  return {
    title: titleCase(titleSegment),
    section: titleCase(sectionSegment),
  };
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navbarTitle = getNavbarTitle(pathname);
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "user@company.com";
  const displayRole = (user?.role || "member").replace("_", " ");
  const showEmployeeNotifications = user?.role === "employee";
  const profileHref = user?.role === "super_admin" ? "/super-admin/profile" : "/profile";

  return (
    <header className="app-navbar sticky top-0 z-40 flex h-[60px] w-full items-center justify-between px-6 border-b">
      {/* Left side: mobile toggle + module title */}
      <div className="flex min-w-0 items-center space-x-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="block rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden"
          aria-label="Open navigation menu"
          aria-controls="mobile-sidebar"
        >
           <Menu className="h-6 w-6" />
        </button>

        <div className="flex min-w-0 items-center pt-1">
          <h1 className="truncate text-sm font-black uppercase tracking-widest text-gray-800 md:text-base">
            {navbarTitle.title}
          </h1>
        </div>
      </div>

      {/* Right side: notifications, user */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        {showEmployeeNotifications && (
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${showNotifications ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-80 bg-white shadow-lg text-gray-800 border border-[#f2f2f3]">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Notifications</h4>
                <span className="text-[8px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4 px-3 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Bell className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-gray-700 leading-normal">A new task <span className="text-primary font-black">&quot;Design System Update&quot;</span> has been assigned to you.</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-wider">2 Minutes ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-50">
                <Link href="/notifications" className="block text-center py-2 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-colors">View All Activities</Link>
              </div>
            </div>
          )}
        </div>
        )}

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className={`flex items-center space-x-3 rounded-xl p-1.5 pr-3 transition-all ${showUserDropdown ? "bg-gray-100" : "hover:bg-gray-50"}`}
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden shadow-sm">
               <User className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden text-left md:block">
               <p className="text-xs font-black text-gray-800 leading-tight">{displayName}</p>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest capitalize">{displayRole}</p>
            </div>
            <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${showUserDropdown ? "rotate-180" : ""}`} />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 top-12 z-50 w-56 bg-white text-gray-800 shadow-lg border border-[#f2f2f3]">
              <div className="p-5 border-b border-gray-50 bg-gray-50/30 rounded-t-2xl">
                <p className="text-xs font-black text-gray-800">{displayName}</p>
                <p className="text-[10px] text-gray-400 font-medium">{displayEmail}</p>
              </div>
              <div className="p-2">
                <Link href={profileHref} className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-primary transition-all">
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </div>
              <div className="p-2 border-t border-gray-50">
                <button onClick={logout} className="flex w-full items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest">
                  <Power className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
