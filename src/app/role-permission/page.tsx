"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Save, Shield, UserCog } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { roleDefinitions, rolePermissions, type PermissionAction, type PermissionKey, type UserRole } from "@/lib/auth-contract";
import { useToast } from "@/context/ToastContext";

type EditableRole = Exclude<UserRole, "super_admin">;

type PermissionModule = {
  key: string;
  label: string;
  actions: PermissionAction[];
};

const editableRoles: EditableRole[] = ["admin", "employee", "client"];

const permissionModules: PermissionModule[] = [
  { key: "employees", label: "Employees", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "clients", label: "Clients", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "hr", label: "HR Settings", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "shifts", label: "Shift Types", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "attendance", label: "Attendance", actions: ["view", "create", "edit", "approve", "export"] },
  { key: "leaves", label: "Leaves", actions: ["view", "create", "edit", "approve", "delete"] },
  { key: "holidays", label: "Holidays", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "projects", label: "Projects", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "tasks", label: "Tasks", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "finance", label: "Finance", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "payroll", label: "Payroll", actions: ["view", "create", "edit", "approve", "export"] },
  { key: "tickets", label: "Tickets", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "recruitment", label: "Recruitment", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "reports", label: "Reports", actions: ["view", "export"] },
  { key: "settings", label: "Settings", actions: ["view", "edit", "manage"] },
  { key: "roles", label: "Roles & Permissions", actions: ["view", "create", "edit", "delete", "manage"] },
];

const STORAGE_KEY = "worksuite_role_permission_overrides";

function readStoredPermissions() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<Record<EditableRole, PermissionKey[]>>;
  } catch {
    return {};
  }
}

function buildInitialPermissions() {
  const stored = readStoredPermissions();
  return editableRoles.reduce<Record<EditableRole, PermissionKey[]>>((accumulator, role) => {
    accumulator[role] = stored[role] || rolePermissions[role];
    return accumulator;
  }, {} as Record<EditableRole, PermissionKey[]>);
}

function permissionKey(moduleKey: string, action: PermissionAction): PermissionKey {
  return `${moduleKey}.${action}` as PermissionKey;
}

function hasPermission(permissions: PermissionKey[], moduleKey: string, action: PermissionAction) {
  return permissions.includes("*") || permissions.includes(`${moduleKey}.*` as PermissionKey) || permissions.includes(permissionKey(moduleKey, action));
}

function togglePermission(permissions: PermissionKey[], moduleKey: string, action: PermissionAction) {
  const key = permissionKey(moduleKey, action);
  return permissions.includes(key) ? permissions.filter((item) => item !== key) : [...permissions, key];
}

export default function RolePermissionPage() {
  const { showToast } = useToast();
  const [activeRole, setActiveRole] = useState<EditableRole>("admin");
  const [permissionState, setPermissionState] = useState<Record<EditableRole, PermissionKey[]>>(buildInitialPermissions);
  const [saving, setSaving] = useState(false);

  const activePermissions = permissionState[activeRole];
  const isAdminLocked = activeRole === "admin";
  const selectedCount = useMemo(() => activePermissions.length, [activePermissions]);

  const updatePermissions = (role: EditableRole, permissions: PermissionKey[]) => {
    setPermissionState((current) => ({ ...current, [role]: permissions }));
  };

  const handleToggle = (moduleKey: string, action: PermissionAction) => {
    if (isAdminLocked) return;
    updatePermissions(activeRole, togglePermission(activePermissions, moduleKey, action));
  };

  const handleAssignAll = () => {
    if (isAdminLocked) return;
    const allPermissions = permissionModules.flatMap((moduleItem) =>
      moduleItem.actions.map((action) => permissionKey(moduleItem.key, action)),
    );
    updatePermissions(activeRole, allPermissions);
  };

  const handleRemoveAll = () => {
    if (isAdminLocked) return;
    updatePermissions(activeRole, []);
  };

  const handleSave = async () => {
    setSaving(true);
    const nextState = { ...permissionState, admin: rolePermissions.admin };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));

    try {
      await api.post("/role-permission/assignRole", {
        role: activeRole,
        permissions: nextState[activeRole],
      });
      showToast("Role permissions saved successfully.");
    } catch {
      showToast("Permissions saved locally. Future PHP endpoint should accept role and permissions payload.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 py-4 shadow-sm sm:-mx-6 sm:-mt-6 sm:px-6">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Roles & Permissions</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              role permission matrix for admin, employee, and client access
            </p>
          </div>
          <Link href="/settings">
            <Button className="h-10 border-none bg-gray-100 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <ArrowLeft className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
              <div className="border-b border-gray-50 bg-gray-50/60 p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Roles</h3>
              </div>
              <div className="space-y-2 p-3">
                <div className="rounded-xl border border-dashed border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-700">Super Admin</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">Platform role managed separately.</p>
                    </div>
                  </div>
                </div>
                {editableRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={`w-full rounded-xl p-4 text-left transition-colors ${
                      activeRole === role ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">{roleDefinitions[role].label}</span>
                      </div>
                      {activeRole === role && <Check className="h-4 w-4" />}
                    </div>
                    <p className={`mt-2 text-[10px] font-bold leading-5 ${activeRole === role ? "text-white/75" : "text-gray-400"}`}>
                      {roleDefinitions[role].description}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <div className="flex gap-3">
                <UserCog className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <p className="text-[11px] font-bold leading-5 text-blue-700">
                  Admin role remains locked with full company access.
                </p>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 bg-gray-50/40 p-5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                  {roleDefinitions[activeRole].label} Permissions
                </h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {selectedCount} permission entries selected
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={handleAssignAll} disabled={isAdminLocked} className="h-9 border-none bg-gray-100 px-4 text-[9px] font-black uppercase tracking-widest text-gray-500">
                  Assign All
                </Button>
                <Button type="button" onClick={handleRemoveAll} disabled={isAdminLocked} className="h-9 border-none bg-gray-100 px-4 text-[9px] font-black uppercase tracking-widest text-gray-500">
                  Remove All
                </Button>
                <Button type="button" onClick={handleSave} loading={saving} className="h-9 bg-primary px-5 text-[9px] font-black uppercase tracking-widest text-white">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="min-w-56 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Module</th>
                    {["view", "create", "edit", "delete", "approve", "export", "manage"].map((action) => (
                      <th key={action} className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {permissionModules.map((moduleItem) => (
                    <tr key={moduleItem.key} className="hover:bg-gray-50/60">
                      <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-700">{moduleItem.label}</td>
                      {(["view", "create", "edit", "delete", "approve", "export", "manage"] as PermissionAction[]).map((action) => {
                        const allowedAction = moduleItem.actions.includes(action);
                        const checked = hasPermission(activePermissions, moduleItem.key, action);
                        return (
                          <td key={action} className="px-4 py-4 text-center">
                            {allowedAction ? (
                              <button
                                type="button"
                                disabled={isAdminLocked}
                                onClick={() => handleToggle(moduleItem.key, action)}
                                className={`mx-auto flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                                  checked ? "bg-primary" : "bg-gray-200"
                                } ${isAdminLocked ? "cursor-not-allowed opacity-60" : "hover:ring-2 hover:ring-primary/20"}`}
                                aria-label={`${checked ? "Disable" : "Enable"} ${moduleItem.label} ${action}`}
                              >
                                <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : ""}`} />
                              </button>
                            ) : (
                              <span className="text-gray-200">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
