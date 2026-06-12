import { rolePermissions, type PermissionKey } from "@/lib/auth-contract";
import type { AdminAccount, AdminFormState, Company } from "./types";

const profilePermission: PermissionKey = "profile.*";

const permissionTemplates: Array<{ id: string; label: string; permissions: PermissionKey[] }> = [
  { id: "full", label: "Full Access", permissions: rolePermissions.admin },
  {
    id: "hr",
    label: "HR Admin",
    permissions: [
      "dashboard.view",
      "employees.*",
      "hr.*",
      "shifts.*",
      "attendance.*",
      "leaves.*",
      "holidays.*",
      "recruitment.*",
      "reports.view",
      "reports.export",
      "events.view",
      "notices.view",
      profilePermission,
    ],
  },
  {
    id: "project",
    label: "Project Admin",
    permissions: [
      "dashboard.view",
      "clients.view",
      "projects.*",
      "tasks.*",
      "reports.view",
      "messages.*",
      "events.view",
      profilePermission,
    ],
  },
  {
    id: "finance",
    label: "Finance Admin",
    permissions: [
      "dashboard.view",
      "clients.view",
      "products.*",
      "finance.*",
      "payroll.view",
      "reports.view",
      "reports.export",
      profilePermission,
    ],
  },
];

export const emptyAdminForm: AdminFormState = {
  name: "",
  email: "",
  password: "",
  company_id: "",
  status: "active",
  permissions: ["dashboard.view", profilePermission],
};

export const normalizePermissions = (permissions: PermissionKey[]) => Array.from(new Set([...permissions, profilePermission]));

export const getCompanyName = (company?: Company) => company?.company_name || company?.name || "Unassigned";

export const getAdminCompanyId = (admin: AdminAccount) => String(admin.company_id || admin.company?.id || "");

export const sameId = (left?: number | string, right?: number | string) => String(left ?? "") === String(right ?? "");

const getPermissionSignature = (permissions: PermissionKey[]) => normalizePermissions(permissions).sort().join("|");

export const getAdminRoleLabel = (permissions: PermissionKey[] = []) => {
  const permissionSignature = getPermissionSignature(permissions);
  const exactTemplate = permissionTemplates.find((template) => getPermissionSignature(template.permissions) === permissionSignature);
  if (exactTemplate) return exactTemplate.label;
  if (permissions.includes("*")) return "Full Access";
  return "Custom Admin";
};
