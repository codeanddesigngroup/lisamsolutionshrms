"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  Phone,
  CheckCircle2,
  Info,
  ChevronDown,
  Clock,
  RefreshCw,
  UserCheck,
  UserRound
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const optionApiUrls = {
  designations: `${API_BASE_URL}/designations`,
  departments: `${API_BASE_URL}/departments`,
  shifts: `${API_BASE_URL}/shifts`,
  employees: `${API_BASE_URL}/employees`,
};

type DesignationOption = {
  id: number | string;
  name: string;
};

type DepartmentOption = {
  id: number | string;
  name?: string;
  team_name?: string;
};

type ShiftOption = {
  id: number | string;
  type?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
};

const getResponseData = async <T,>(response: Response): Promise<T[]> => {
  const result = await response.json();
  return Array.isArray(result?.data) ? result.data : [];
};

const staticPermissionActions = ["View", "Create", "Edit", "Delete", "Approve", "Export", "Manage"] as const;

const staticPermissionModules = [
  { key: "dashboard", label: "Dashboards", group: "Core", actions: ["View"], enabled: ["View"] },
  { key: "company", label: "Company Profile", group: "Core", actions: ["View", "Edit", "Manage"], enabled: [] },
  { key: "employees", label: "Employees", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Export"], enabled: [] },
  { key: "clients", label: "Clients", group: "Core", actions: ["View", "Create", "Edit", "Delete", "Export"], enabled: [] },
  { key: "hr", label: "HR Setup", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: [] },
  { key: "shifts", label: "Shift Types", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: [] },
  { key: "attendance", label: "Attendance", group: "HR", actions: ["View", "Create", "Edit", "Approve", "Export", "Manage"], enabled: ["View", "Create"] },
  { key: "leaves", label: "Leaves", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Approve", "Manage"], enabled: ["View", "Create", "Delete"] },
  { key: "holidays", label: "Holidays", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: ["View"] },
  { key: "projects", label: "Projects", group: "Work", actions: ["View", "Create", "Edit", "Delete", "Export", "Manage"], enabled: ["View"] },
  { key: "tasks", label: "Tasks", group: "Work", actions: ["View", "Create", "Edit", "Delete", "Export", "Manage"], enabled: ["View"] },
  { key: "leads", label: "Leads", group: "Core", actions: ["View", "Create", "Edit", "Delete", "Export", "Manage"], enabled: [] },
  { key: "contracts", label: "Contracts", group: "Work", actions: ["View", "Create", "Edit", "Delete", "Export"], enabled: [] },
  { key: "finance", label: "Finance", group: "Finance", actions: ["View", "Create", "Edit", "Delete", "Approve", "Export", "Manage"], enabled: [] },
  { key: "payroll", label: "Payroll", group: "Finance", actions: ["View", "Create", "Edit", "Approve", "Export", "Manage"], enabled: ["View"] },
  { key: "recruitment", label: "Recruitment", group: "HR", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: [] },
  { key: "reports", label: "Reports", group: "Core", actions: ["View", "Export"], enabled: [] },
  { key: "messages", label: "Messages", group: "Communication", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: [] },
  { key: "events", label: "Events", group: "Communication", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: ["View"] },
  { key: "notices", label: "Notice Board", group: "Communication", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: ["View"] },
  { key: "billing", label: "Billing", group: "Finance", actions: ["View", "Create", "Edit", "Delete", "Manage"], enabled: [] },
  { key: "settings", label: "Settings", group: "Settings", actions: ["View", "Edit", "Manage"], enabled: [] },
];

type PermissionActionLabel = (typeof staticPermissionActions)[number];
type PermissionState = Record<string, PermissionActionLabel[]>;

const initialPermissionState = staticPermissionModules.reduce<PermissionState>((permissions, moduleItem) => {
  permissions[moduleItem.label] = moduleItem.enabled as PermissionActionLabel[];
  return permissions;
}, {});

export default function CreateEmployeePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<PermissionState>(initialPermissionState);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedModuleCount = Object.values(permissionState).filter((actions) => actions.length > 0).length;
  const permissionKeys = staticPermissionModules.flatMap((moduleItem) =>
    (permissionState[moduleItem.label] || []).map((action) => `${moduleItem.key}.${action.toLowerCase()}`),
  );
  const companyId = user?.company_id ? String(user.company_id) : "";
  const withCompanyQuery = (url: string) => {
    if (!companyId) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}company_id=${encodeURIComponent(companyId)}`;
  };

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const [designationResponse, departmentResponse, shiftResponse] = await Promise.all([
          fetch(withCompanyQuery(optionApiUrls.designations)),
          fetch(withCompanyQuery(optionApiUrls.departments)),
          fetch(withCompanyQuery(optionApiUrls.shifts)),
        ]);

        const [designationOptions, departmentOptions, shiftOptions] = await Promise.all([
          getResponseData<DesignationOption>(designationResponse),
          getResponseData<DepartmentOption>(departmentResponse),
          getResponseData<ShiftOption>(shiftResponse),
        ]);

        setDesignations(designationOptions);
        setDepartments(departmentOptions);
        setShifts(shiftOptions);
      } catch (error) {
        console.error("Failed to load employee dropdown options:", error);
        setDesignations([]);
        setDepartments([]);
        setShifts([]);
      }
    };

    fetchDropdownOptions();
  }, [companyId]);

  const togglePermission = (moduleLabel: string, action: PermissionActionLabel) => {
    setPermissionState((current) => {
      const currentActions = current[moduleLabel] || [];
      const nextActions = currentActions.includes(action)
        ? currentActions.filter((item) => item !== action)
        : [...currentActions, action];

      return {
        ...current,
        [moduleLabel]: nextActions,
      };
    });
  };

  const toggleModulePermissions = (moduleLabel: string, actions: PermissionActionLabel[]) => {
    setPermissionState((current) => {
      const currentActions = current[moduleLabel] || [];
      const moduleFullyEnabled = actions.every((action) => currentActions.includes(action));

      return {
        ...current,
        [moduleLabel]: moduleFullyEnabled ? [] : actions,
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyId) {
      showToast("No company is assigned to this login. Employee cannot be created.", "error");
      return;
    }

    const form = event.currentTarget;
    setIsSubmitting(true);

    const formData = new FormData(form);
    const payload = {
      company_id: companyId,
      employee_id: String(formData.get("employee_id") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
      gender: String(formData.get("gender") || ""),
      designation_id: String(formData.get("designation") || "") || null,
      department_id: String(formData.get("department") || "") || null,
      shift_type_id: String(formData.get("shift_type_id") || "") || null,
      joining_date: String(formData.get("joining_date") || "") || null,
      hourly_rate: String(formData.get("hourly_rate") || "") || null,
      mobile: String(formData.get("mobile") || "") || null,
      login: formData.get("login_enabled") ? "enable" : "disable",
      status: formData.get("status_active") ? "active" : "deactive",
      permissions: permissionKeys,
    };

    try {
      const response = await fetch(optionApiUrls.employees, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || result?.error || "Failed to create employee.");
      }

      form.reset();
      setPermissionState(initialPermissionState);
      showToast("Employee created successfully.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to create employee.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">

        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">
                Onboard Employee
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Personnel / New Registration</p>
            </div>
          </div>
          <Link href="/employees">
            <Button className="bg-gray-50 text-gray-500 border-none px-4 h-10 md:h-11 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="p-8 border-none shadow-sm bg-white rounded-2xl">
            <div className="flex items-center space-x-3 mb-8 border-l-4 border-primary pl-4">
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Device ID</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    name="employee_id"
                    defaultValue=""
                    placeholder="01"
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    name="name"
                    defaultValue=""
                    placeholder="JOHN DOE"
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    name="email"
                    type="email"
                    defaultValue=""
                    placeholder="JOHN@EXAMPLE.COM"
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Password</span>
                  <button
                    type="button"
                    className="text-[8px] px-2 py-1 rounded-full transition-all bg-gray-100 text-gray-400"
                  >
                    AUTO-GENERATE
                  </button>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    defaultValue=""
                    placeholder="Enter password"
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-12 text-xs font-black tracking-tight outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Required. Use a unique password with 8 or more characters.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                <div className="relative">
                  <select
                    name="gender"
                    defaultValue=""
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Department & Role */}
          <Card className="p-8 border-none shadow-sm bg-white rounded-2xl">
            <div className="flex items-center space-x-3 mb-8 border-l-4 border-blue-500 pl-4">
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Assignment & Role</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Designation</label>
                <div className="relative">
                  <select
                    name="designation"
                    defaultValue=""
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((designation) => (
                      <option key={String(designation.id)} value={String(designation.id)}>
                        {designation.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                <div className="relative">
                  <select
                    name="department"
                    defaultValue=""
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments.map((department) => (
                      <option key={String(department.id)} value={String(department.id)}>
                        {department.name || department.team_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                </div>
              </div>



              <div className="space-y-2">
                <label className="flex items-center justify-between gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Shift Type</span>
                  <button
                    type="button"
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary transition hover:bg-primary hover:text-white"
                  >
                    New Shift
                  </button>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <select
                    name="shift_type_id"
                    defaultValue=""
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-10 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map((shift) => (
                      <option key={String(shift.id)} value={String(shift.id)}>
                        {shift.shift_name || shift.type} {shift.start_time && shift.end_time ? `(${shift.start_time}-${shift.end_time})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Create a shift here and it will be selected for this employee immediately.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Joining Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <input
                    name="joining_date"
                    type="date"
                    defaultValue="2026-01-01"
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Basic Salary (PKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[10px] text-primary">PKR</span>
                  <input
                    name="hourly_rate"
                    type="number"
                    defaultValue=""
                    placeholder="0.00"
                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                <div className="flex space-x-2">
                  <div className="flex h-[46px] min-w-16 items-center justify-center rounded-xl bg-gray-50 px-3 text-xs font-black text-gray-700">
                    +92
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <input
                      name="mobile"
                      defaultValue=""
                      placeholder="PHONE NUMBER"
                      className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>
          </Card>

          <Card className="border-none shadow-sm p-0 bg-white rounded-2xl overflow-hidden">
            <div className="rounded-2xl border border-gray-100 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Employee Module Permissions</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {selectedModuleCount} modules selected
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                  <UserRound className="h-3.5 w-3.5" />
                  Employee Access
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-100 bg-white">
                    <tr>
                      <th className="min-w-56 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Module</th>
                      {staticPermissionActions.map((action) => (
                        <th key={action} className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {action}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staticPermissionModules.map((moduleItem) => {
                      const enabledActions = permissionState[moduleItem.label] || [];
                      const allowedActions = moduleItem.actions as PermissionActionLabel[];
                      const moduleFullyEnabled = allowedActions.every((action) => enabledActions.includes(action));

                      return (
                        <tr key={moduleItem.label} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-gray-700">{moduleItem.label}</p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{moduleItem.group}</p>
                            </div>
                          </td>
                          {staticPermissionActions.map((action) => {
                            const allowed = allowedActions.includes(action);
                            const enabled = enabledActions.includes(action);

                            return (
                              <td key={action} className="px-3 py-3 text-center">
                                {allowed ? (
                                  <button
                                    type="button"
                                    onClick={() => togglePermission(moduleItem.label, action)}
                                    className={`mx-auto flex h-7 w-12 items-center rounded-full p-1 transition-colors ${enabled ? "bg-primary" : "bg-gray-200"} hover:ring-2 hover:ring-primary/20`}
                                    aria-label={`${moduleItem.label} ${action.toLowerCase()} ${enabled ? "enabled" : "disabled"}`}
                                  >
                                    <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : ""}`} />
                                  </button>
                                ) : (
                                  <span className="text-gray-200">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleModulePermissions(moduleItem.label, allowedActions)}
                              className={`mx-auto rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition ${moduleFullyEnabled ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                              {moduleFullyEnabled ? "On" : "Off"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Section 3: Extra Details */}
          <Card className="p-8 border-none shadow-sm bg-white rounded-2xl">
            <div className="flex items-center space-x-3 mb-8 border-l-4 border-orange-500 pl-4">
              <h2 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.2em]">Other Details</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Portal Login</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Access to dashboard</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="login_enabled"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Employee Status</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                        Active account
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="status_active"
                      className="sr-only peer"
                      defaultChecked
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                  Review all credentials before saving.
                </p>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-primary text-white text-[10px] font-black px-12 h-14 uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center rounded-2xl"
            >
              {isSubmitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-3" /> Complete Onboarding</>}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
