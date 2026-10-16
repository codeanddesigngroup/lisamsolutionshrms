"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";
import {
  adminAssignablePermissionModules,
  getModulesFromPermissions,
  permissionActions,
  permissionKey,
  type PermissionAction,
  type PermissionKey,
  type PermissionModuleDefinition,
} from "@/lib/auth-contract";

export type EmployeeAssignableRole = "employee";

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
  permissions: PermissionKey[];
  onPermissionsChange: (permissions: PermissionKey[]) => void;
};

export default function EmployeePermissionMatrix({
  permissions,
  onPermissionsChange,
}: EmployeePermissionMatrixProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedPermissions = normalizePermissions(permissions);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="employee-permission-matrix"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full flex-wrap items-center justify-between gap-4 bg-gray-50 px-4 py-3 text-left"
      >
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">Employee Module Permissions</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {getModulesFromPermissions(normalizedPermissions).length} modules selected
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
          <UserRound className="h-3.5 w-3.5" />
          Employee Access
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div id="employee-permission-matrix" className="overflow-x-auto border-t border-gray-100">
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
      </div>}
    </div>
  );
}
