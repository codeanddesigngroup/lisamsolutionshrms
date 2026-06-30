"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { canUserAccessPath, type AuthUser, type UserRole } from "@/lib/auth-contract";
import { isSaasBillingEnabled } from "@/lib/product-config";
import { useAuth } from "@/context/AuthContext";
import logo from "../../../public/logo.png";
import logo2 from "../../../public/logo-full.png";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Users,
  UserSquare2,
  Layers,
  DollarSign,
  ShoppingBag,
  MessageSquare,
  Calendar,
  LayoutPanelLeft,
  PieChart,
  Settings,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Power,
  User,
  Search,
  Shield,
  Cpu,
} from "lucide-react";

interface SubItem {
  label: string;
  href: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  submenu?: SubItem[];
}

const menuItems: MenuItem[] = [
  {
    icon: Shield,
    label: "Super Admin",
    href: "/super-admin/dashboard",
    submenu: [
      { label: "Dashboard", href: "/super-admin/dashboard" },
      { label: "Company / Branches", href: "/super-admin/companies" },
      { label: "Users", href: "/super-admin/users" },
      { label: "Packages", href: "/super-admin/packages" },
      { label: "Invoices", href: "/super-admin/invoices" },
      { label: "Settings", href: "/super-admin/settings" },
    ],  
  },
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    submenu: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Employee Dashboard", href: "/employee/dashboard" },
      { label: "Client Dashboard", href: "/dashboard/client" },
    ],
  },
  {
    icon: FileText,
    label: "Lead",
    href: "/leads",
    submenu: [
      { label: "Leads", href: "/leads" },
      { label: "Lead Kanban", href: "/leads/kanban" },
      { label: "Lead Form", href: "/lead-form" },
      { label: "Lead Settings", href: "/lead-settings" },
    ],
  },
  {
    icon: Users,
    label: "Clients",
    href: "/clients",
    submenu: [
      { label: "Clients", href: "/clients" },
      { label: "Client Contacts", href: "/client-contacts" },
      { label: "Client Notes", href: "/notes" },
    ],
  },
  {
    icon: UserSquare2,
    label: "HR",
    href: "/employees",
    submenu: [
      { label: "Employees", href: "/employees" },
      { label: "Department", href: "/teams" },
      { label: "Designation", href: "/designation" },
      { label: "Attendance", href: "/attendance" },
      { label: "Attendance Policies", href: "/attendance/settings/policies" },
      { label: "Deduction Report", href: "/attendance/reports/deductions" },
      { label: "Shift Settings", href: "/attendance/settings/shifts" },
      { label: "Holidays", href: "/holidays" },
      { label: "Leaves", href: "/leaves" },
    ],
  },
  { icon: Cpu, label: "Device", href: "/device" },
  {
    icon: Layers,
    label: "Work",
    href: "/projects",
    submenu: [
      { label: "Contracts", href: "/contracts" },
      { label: "Projects", href: "/projects" },
      { label: "Tasks", href: "/tasks" },
      { label: "Task Board", href: "/taskboard" },
      { label: "Task Calendar", href: "/task-calendar" },
    ],
  },
  {
    icon: Briefcase,
    label: "Recruit",
    href: "/recruitment/dashboard",
    submenu: [
      { label: "Dashboard", href: "/recruitment/dashboard" },
      { label: "Job Openings", href: "/recruitment/jobs" },
      { label: "Applications", href: "/recruitment/applications" },
      { label: "Interview Schedule", href: "/recruitment/interviews" },
      { label: "Onboarding", href: "/recruitment/onboarding" },
      { label: "Skill", href: "/recruitment/skills" },
      { label: "Job Location", href: "/recruitment/locations" },
      { label: "Job Category", href: "/recruitment/categories" },
      { label: "Department", href: "/recruitment/departments" },
      { label: "Custom Question", href: "/recruitment/questions" },
      { label: "Candidate Database", href: "/recruitment/archive" },
      { label: "Recruit Settings", href: "/recruitment/settings" },
      { label: "Update Application", href: "/recruitment/update" },
    ],
  },
  {
    icon: DollarSign,
    label: "Finance",
    href: "/invoices",
    submenu: [
      { label: "Estimates", href: "/estimates" },
      { label: "Invoices", href: "/invoices" },
      { label: "Invoice Recurring", href: "/invoice-recurring" },
      { label: "Payments", href: "/payments" },
      { label: "Expenses", href: "/expenses" },
      { label: "Expenses Recurring", href: "/expenses-recurring" },
      { label: "Credit Notes", href: "/credit-notes" },
    ],
  },
  {
    icon: LayoutDashboard,
    label: "Payroll",
    href: "/payroll",
    submenu: [
      { label: "Payroll Dashboard", href: "/payroll" },
      { label: "Salary Settings", href: "/payroll/settings" },
    ],
  },
  // { icon: ShoppingBag, label: "Products", href: "/products" },
  { icon: MessageSquare, label: "Messages", href: "/user-chat" },
  {
    icon: Calendar,
    label: "Events",
    href: "/event-calendar",
    submenu: [
      { label: "Event Calendar", href: "/event-calendar" },
      { label: "Event Types", href: "/event-type" },
    ],
  },
  { icon: LayoutPanelLeft, label: "Notice Board", href: "/notices" },
  {
    icon: PieChart,
    label: "Reports",
    href: "/reports",
    submenu: [
      { label: "Task Report", href: "/reports/tasks" },
      { label: "Finance Report", href: "/reports/finance" },
      { label: "Income vs Expense", href: "/reports/income-expense" },
      { label: "Leave Report", href: "/reports/leave" },
      { label: "Attendance Report", href: "/reports/attendance" },
      { label: "Payroll Report", href: "/reports/payroll" },
    ],
  },
  { icon: BookOpen, label: "Billing", href: "/billing" },
  {
    icon: HelpCircle,
    label: "FAQ",
    href: "/faqs",
    submenu: [
      { label: "My FAQ", href: "/faqs" },
      { label: "Employee FAQ", href: "/employees/faq" },
      { label: "FAQ Categories", href: "/employees/faq/category" },
    ],
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    submenu: [
      { label: "Settings Home", href: "/settings" },
      { label: "Account Setup", href: "/account-setup" },
      // { label: "Role Permissions", href: "/role-permission" },
      // { label: "Custom Fields", href: "/custom-fields" },
      // { label: "Module Settings", href: "/module-settings" },
    ],
  },
  { icon: Search, label: "Search", href: "/search" },
];

const hiddenSidebarLabels = new Set(["FAQ", "Search"]);

const superAdminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/super-admin/dashboard" },
  { icon: User, label: "Profile", href: "/super-admin/profile" },
  { icon: Users, label: "Company / Branches", href: "/super-admin/companies" },
  { icon: Shield, label: "Users", href: "/super-admin/users" },
  { icon: ShoppingBag, label: "Packages", href: "/super-admin/packages" },
  { icon: DollarSign, label: "Invoices", href: "/super-admin/invoices" },
  { icon: Settings, label: "Settings", href: "/super-admin/settings" },
];

const roleMenuAccess: Record<UserRole, string[]> = {
  super_admin: superAdminMenuItems.map((item) => item.label),
  admin: menuItems.filter((item) => item.label !== "Super Admin").map((item) => item.label),
  employee: menuItems.filter((item) => item.label !== "Super Admin").map((item) => item.label),
  client: ["Dashboard", "Work", "Finance", "Messages", "Events", "Notice Board"],
};

const roleSubmenuAccess: Partial<Record<UserRole, Record<string, string[]>>> = {
  employee: {
    Dashboard: ["Employee Dashboard"],
    HR: ["Attendance", "Holidays", "Leaves"],
    Work: ["Projects", "Tasks", "Task Board", "Task Calendar"],
    Events: ["Event Calendar"],
    Payroll: ["My Payslips"],
  },
  client: {
    Dashboard: ["Client Dashboard"],
    Work: ["Projects", "Tasks", "Task Board", "Task Calendar"],
    Finance: ["Estimates", "Invoices", "Payments", "Credit Notes"],
  },
};

const canOpenItem = (user: AuthUser | null, userRole: UserRole, item: MenuItem) => {
  if (userRole === "super_admin") return true;
  if (!user) return false;
  if (canUserAccessPath(user, item.href)) return true;
  return Boolean(item.submenu?.some((sub) => canUserAccessPath(user, sub.href)));
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = mobileOpen || isHovered;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, stopImpersonation } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const hydratedUser = hasHydrated ? user : null;
  const userRole = hydratedUser?.role || "employee";
  const userName = hydratedUser?.name || "User";

  const filteredMenuItems = useMemo(() => {
    if (userRole === "super_admin") {
      return superAdminMenuItems.filter(
        (item) => isSaasBillingEnabled || (item.href !== "/super-admin/packages" && item.href !== "/super-admin/invoices")
      );
    }

    const allowedMenus = roleMenuAccess[userRole];
    const submenuAccess = roleSubmenuAccess[userRole] || {};

    return menuItems
      .filter((item) => allowedMenus.includes(item.label))
      .filter((item) => !hiddenSidebarLabels.has(item.label))
      .filter((item) => isSaasBillingEnabled || item.label !== "Billing")
      .filter((item) => canOpenItem(hydratedUser, userRole, item))
      .map((item) => {
        const roleDashboardHref =
          userRole === "employee" ? "/employee/dashboard" : userRole === "client" ? "/dashboard/client" : item.href;
        const employeePayrollItem =
          userRole === "employee" && item.label === "Payroll"
            ? { ...item, href: "/employee/payroll", submenu: [{ label: "My Payslips", href: "/employee/payroll" }] }
            : item;
        if (userRole === "employee" && item.label === "Dashboard") {
          return {
            ...item,
            href: roleDashboardHref,
            submenu: undefined,
          };
        }
        if (userRole === "admin" && item.label === "Dashboard") {
          return {
            ...item,
            href: "/dashboard",
            submenu: undefined,
          };
        }
        const normalizedItem = employeePayrollItem.label === "Dashboard" ? { ...employeePayrollItem, href: roleDashboardHref } : employeePayrollItem;
        const allowedSubmenuLabels = submenuAccess[item.label];
        const roleFilteredSubmenu = normalizedItem.submenu
          ?.filter((sub) => isSaasBillingEnabled || (sub.href !== "/super-admin/packages" && sub.href !== "/super-admin/invoices"))
          .filter((sub) => !allowedSubmenuLabels || allowedSubmenuLabels.includes(sub.label))
          .map((sub) => (normalizedItem.label === "Dashboard" && sub.label === "Dashboard" ? { ...sub, href: roleDashboardHref } : sub));

        const permissionFilteredSubmenu = hydratedUser
          ? roleFilteredSubmenu?.filter((sub) => canUserAccessPath(hydratedUser, sub.href))
          : roleFilteredSubmenu;

        const href =
          hydratedUser && !canUserAccessPath(hydratedUser, normalizedItem.href) && permissionFilteredSubmenu?.length
            ? permissionFilteredSubmenu[0].href
            : normalizedItem.href;

        if (!item.submenu) return { ...normalizedItem, href };

        return {
          ...normalizedItem,
          href,
          submenu: permissionFilteredSubmenu,
        };
      });
  }, [hydratedUser, userRole]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasHydrated(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  const toggleMenu = (item: MenuItem) => {
    if (item.submenu) {
      setOpenMenus((prev) =>
        prev.includes(item.label) ? [] : [item.label]
      );
    } else {
      router.push(item.href);
      setOpenMenus([]);
      onMobileClose?.();
    }
  };

  const isMenuOpen = (item: MenuItem) =>
    openMenus.includes(item.label) || (item.submenu?.some((s) => isActive(s.href)) ?? false);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-secondary/55 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="mobile-sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`app-sidebar fixed left-0 top-0 z-50 flex h-full flex-col overflow-hidden shadow-2xl transition-all duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full md:w-[70px]"
          } ${isHovered ? "md:w-[260px]" : "md:shadow-lg"}`}
        aria-label="Primary navigation"
      >
        {/* Logo */}
        <div className={`app-sidebar-border flex h-[65px] items-center border-b px-4 transition-all duration-300 ${isExpanded ? "justify-start" : "justify-center"}`}>
          <Link href="/dashboard" onClick={() => { setOpenMenus([]); onMobileClose?.(); }} className="flex-shrink-0">
            {isExpanded ? (
              <Image
                src={logo}
                alt="Worksuite"
                width={130}
                height={38}
                className="max-h-[38px] object-contain animate-in fade-in duration-500"
              />
            ) : (
              <Image
                src={logo2}
                alt="Lisamsolutions"
                width={130}
                height={38}
                className="max-h-[38px] object-contain animate-in fade-in duration-500"
              />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-white/10 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          hover:[&::-webkit-scrollbar-thumb]:bg-white/20 
          transition-colors">
          {userRole === "super_admin" ? (
            <div className="space-y-1.5 px-3">
              {filteredMenuItems.map((item) => {
                const isItemActive = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpenMenus([]);
                      onMobileClose?.();
                    }}
                    title={!isExpanded ? item.label : ""}
                    aria-current={isItemActive ? "page" : undefined}
                    className={`flex items-center rounded-xl px-3 py-3 text-[15px] transition-all group ${isItemActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "app-sidebar-muted app-sidebar-hover"
                      } ${!isExpanded ? "justify-center px-0 w-10 mx-auto" : "justify-start"}`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isItemActive ? "text-white" : "app-sidebar-muted"}`} />
                    {isExpanded && (
                      <span className="ml-3 truncate animate-in slide-in-from-left-2 duration-300">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <ul className="space-y-1.5 px-3">
              {filteredMenuItems.map((item) => {
                const isOpen = isMenuOpen(item);
                const isItemActive = isActive(item.href);

                return (
                  <li key={item.label}>
                    <div
                      className={`flex items-center rounded-xl px-3 py-3 text-[15px] transition-all cursor-pointer group ${isItemActive || isOpen
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "app-sidebar-muted app-sidebar-hover"
                        } ${!isExpanded ? "justify-center px-0 w-10 mx-auto" : "justify-between"}`}
                      onClick={() => toggleMenu(item)}
                      title={!isExpanded ? item.label : ""}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleMenu(item);
                        }
                      }}
                      aria-expanded={item.submenu ? isOpen : undefined}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isItemActive || isOpen ? "text-white" : "app-sidebar-muted"}`} />
                        {isExpanded && (
                          <span className="truncate animate-in slide-in-from-left-2 duration-300">
                            {item.label}
                          </span>
                        )}
                      </div>
                      {isExpanded && item.submenu && (
                        <div className="transition-transform duration-200">
                          {isOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 opacity-60" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submenu */}
                    {item.submenu && isOpen && isExpanded && (
                      <ul className="app-sidebar-border mt-1 space-y-1 ml-4 border-l pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {item.submenu.map((sub) => {
                          const isSubActive = isActive(sub.href);
                          return (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                onClick={onMobileClose}
                                className={`block rounded-lg py-2 px-3 text-[13px] font-medium transition-all ${isSubActive
                                  ? "text-primary bg-primary/5 font-black"
                                  : "app-sidebar-muted app-sidebar-hover"
                                  }`}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>


        {/* Footer - User */}
        <div className={`app-sidebar-footer app-sidebar-border border-t p-3 transition-all duration-300 ${!isExpanded ? "flex flex-col items-center space-y-4" : ""}`}>
          <div className={`flex items-center ${isExpanded ? "justify-between" : "flex-col space-y-4"}`}>
            {/* User avatar + dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="app-sidebar-user-button flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl hover:ring-2 hover:ring-primary transition-all"
                aria-label="Open user menu"
              >
                <User className="app-sidebar-user-icon h-5 w-5" />
              </button>
              {showUserMenu && isExpanded && (
                <div className="app-sidebar app-sidebar-border absolute bottom-12 left-0 z-50 w-52 rounded-2xl shadow-2xl border p-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="app-sidebar-border px-3 py-3 border-b mb-1">
                    <p className="text-xs font-black text-primary truncate">{userName}</p>
                    <p className="app-sidebar-muted mt-1 text-[10px] uppercase tracking-widest">{userRole}</p>
                    {hydratedUser?.impersonator_role && (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-yellow-500">Impersonating Company</p>
                    )}
                  </div>
                  {hydratedUser?.impersonator_role === "super_admin" && (
                    <button type="button" onClick={stopImpersonation} className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all">
                      <Shield className="h-4 w-4" /> <span>Return to Super Admin</span>
                    </button>
                  )}
                  <button type="button" onClick={logout} className="flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                    <Power className="h-4 w-4" /> <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

          </div>  
        </div>
      </aside>
    </>
  );
}
