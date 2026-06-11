"use client";

import { ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import {
  adminAssignablePermissionModules,
  getModulesFromPermissions,
  permissionActions,
  permissionKey,
  type PermissionAction,
  type PermissionKey,
  type PermissionModuleDefinition,
} from "@/lib/auth-contract";

export type EmployeeAssignableRole = "admin" | "employee";

const roleOptions: Array<{
  value: EmployeeAssignableRole;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "employee",
    label: "Employee",
    description: "Self-service portal access",
    icon: UserRound,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Company management access",
    icon: ShieldCheck,
  },
];

const normalizePermissions = (permissions: PermissionKey[]): PermissionKey[] =>
  Array.from(new Set<PermissionKey>(["dashboard.view", "profile.*", ...permissions]));

const getModuleActionKeys = (moduleItem: PermissionModuleDefinition) =>
  moduleItem.actions.map((action) => permissionKey(moduleItem.key, action));

const expandModuleWildcard = (permissions: PermissionKey[], moduleItem: PermissionModuleDefinition) => {
  const wildcard = `${moduleItem.key}.*` as PermissionKey;
  if (!permissions.includes(wildcard)) return permissions;
  return [...permissions.filter((permission) => permission !== wildcard), ...getModuleActionKeys(moduleItem)];
};

const hasPermission = (permissions: PermissionKey[], moduleKey: string, action: PermissionAction) =>
  permissions.includes("*") || permissions.includes(`${moduleKey}.*` as PermissionKey) || permissions.includes(permissionKey(moduleKey, action));

const togglePermission = (permissions: PermissionKey[], moduleItem: PermissionModuleDefinition, action: PermissionAction) => {
  const expandedPermissions = expandModuleWildcard(permissions, moduleItem);
  const key = permissionKey(moduleItem.key, action);
  return normalizePermissions(
    expandedPermissions.includes(key)
      ? expandedPermissions.filter((permission) => permission !== key)
      : [...expandedPermissions, key],
  );
};

const setModulePermissions = (permissions: PermissionKey[], moduleItem: PermissionModuleDefinition, enabled: boolean) => {
  const moduleKeys = new Set<PermissionKey>([`${moduleItem.key}.*` as PermissionKey, ...getModuleActionKeys(moduleItem)]);
  const nextPermissions = permissions.filter((permission) => !moduleKeys.has(permission));
  return normalizePermissions(enabled ? [...nextPermissions, `${moduleItem.key}.*` as PermissionKey] : nextPermissions);
};

type EmployeePermissionMatrixProps = {
  role: EmployeeAssignableRole;
  permissions: PermissionKey[];
  onRoleChange: (role: EmployeeAssignableRole) => void;
  onPermissionsChange: (permissions: PermissionKey[]) => void;
};

export default function EmployeePermissionMatrix({
  role,
  permissions,
  onRoleChange,
  onPermissionsChange,
}: EmployeePermissionMatrixProps) {
  const normalizedPermissions = normalizePermissions(permissions);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Role & Module Permissions</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {getModulesFromPermissions(normalizedPermissions).length} modules selected
          </p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
          {role === "admin" ? "Admin Access" : "Employee Access"}
        </span>
      </div>
      <div className="grid gap-3 border-b border-gray-100 bg-white p-4 sm:grid-cols-2">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const selected = role === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onRoleChange(option.value)}
              aria-pressed={selected}
              className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 text-left transition ${
                selected ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-primary/30 hover:bg-white"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-primary text-white" : "bg-white text-gray-400"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-widest">{option.label}</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 bg-white">
            <tr>
              <th className="min-w-56 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Module</th>
              {permissionActions.map((action) => (
                <th key={action} className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {action}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">All</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {adminAssignablePermissionModules.map((moduleItem) => {
              const enabledActions = moduleItem.actions.filter((action) => hasPermission(normalizedPermissions, moduleItem.key, action));
              const moduleFullyEnabled = enabledActions.length === moduleItem.actions.length;

              return (
                <tr key={moduleItem.key} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-700">{moduleItem.label}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{moduleItem.group}</p>
                    </div>
                  </td>
                  {permissionActions.map((action) => {
                    const allowed = moduleItem.actions.includes(action);
                    const checked = allowed && hasPermission(normalizedPermissions, moduleItem.key, action);
                    return (
                      <td key={action} className="px-3 py-3 text-center">
                        {allowed ? (
                          <button
                            type="button"
                            onClick={() => onPermissionsChange(togglePermission(normalizedPermissions, moduleItem, action))}
                            className={`mx-auto flex h-7 w-12 items-center rounded-full p-1 transition-colors ${checked ? "bg-primary" : "bg-gray-200"} hover:ring-2 hover:ring-primary/20`}
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
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onPermissionsChange(setModulePermissions(normalizedPermissions, moduleItem, !moduleFullyEnabled))}
                      className={`mx-auto rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest transition ${
                        moduleFullyEnabled ? "bg-primary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
  );
}
