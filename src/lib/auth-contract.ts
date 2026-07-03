import { isSaasBillingEnabled, isSaasBillingPath } from "./product-config";

export type UserRole = "super_admin" | "admin" | "employee" | "client";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "approve" | "export" | "manage";

export type PermissionModuleKey =
  | "dashboard"
  | "company"
  | "settings"
  | "roles"
  | "employees"
  | "clients"
  | "hr"
  | "shifts"
  | "attendance"
  | "leaves"
  | "holidays"
  | "projects"
  | "tasks"
  | "finance"
  | "payroll"
  | "recruitment"
  | "reports"
  | "messages"
  | "events"
  | "notices"
  | "leads"
  | "contracts"
  | "products"
  | "billing"
  | "faq"
  | "profile";

export type PermissionKey =
  | "*"
  | `${PermissionModuleKey}.${PermissionAction | "*"}`;

export type PermissionModuleDefinition = {
  key: PermissionModuleKey;
  label: string;
  group: "core" | "hr" | "work" | "finance" | "communication" | "settings";
  actions: PermissionAction[];
};

export const permissionActions: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "manage"];

const basePermissionModules: PermissionModuleDefinition[] = [
  { key: "dashboard", label: "Dashboards", group: "core", actions: ["view"] },
  { key: "company", label: "Company Profile", group: "core", actions: ["view", "edit", "manage"] },
  { key: "employees", label: "Employees", group: "hr", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "clients", label: "Clients", group: "core", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "hr", label: "HR Setup", group: "hr", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "shifts", label: "Shift Types", group: "hr", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "attendance", label: "Attendance", group: "hr", actions: ["view", "create", "edit", "approve", "export", "manage"] },
  { key: "leaves", label: "Leaves", group: "hr", actions: ["view", "create", "edit", "approve", "delete", "manage"] },
  { key: "holidays", label: "Holidays", group: "hr", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "projects", label: "Projects", group: "work", actions: ["view", "create", "edit", "delete", "export", "manage"] },
  { key: "tasks", label: "Tasks", group: "work", actions: ["view", "create", "edit", "delete", "export", "manage"] },
  { key: "leads", label: "Leads", group: "core", actions: ["view", "create", "edit", "delete", "export", "manage"] },
  { key: "contracts", label: "Contracts", group: "work", actions: ["view", "create", "edit", "delete", "export"] },
  { key: "finance", label: "Finance", group: "finance", actions: ["view", "create", "edit", "delete", "approve", "export", "manage"] },
  { key: "payroll", label: "Payroll", group: "finance", actions: ["view", "create", "edit", "approve", "export", "manage"] },
  { key: "recruitment", label: "Recruitment", group: "hr", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "reports", label: "Reports", group: "core", actions: ["view", "export"] },
  { key: "messages", label: "Messages", group: "communication", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "events", label: "Events", group: "communication", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "notices", label: "Notice Board", group: "communication", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "billing", label: "Billing", group: "finance", actions: ["view", "create", "edit", "delete", "manage"] },
  { key: "settings", label: "Settings", group: "settings", actions: ["view", "edit", "manage"] },
];

export const permissionModules = basePermissionModules.filter(
  (moduleItem) => isSaasBillingEnabled || moduleItem.key !== "billing",
);

export const adminAssignablePermissionModules = permissionModules.filter((moduleItem) => moduleItem.key !== "profile");

export const permissionKey = (moduleKey: PermissionModuleKey | string, action: PermissionAction): PermissionKey =>
  `${moduleKey}.${action}` as PermissionKey;

export const expandModulePermissions = (moduleKey: PermissionModuleKey) => {
  const moduleItem = permissionModules.find((item) => item.key === moduleKey);
  return moduleItem ? moduleItem.actions.map((action) => permissionKey(moduleKey, action)) : [];
};

export const getModulesFromPermissions = (permissions: string[] = []) => {
  if (permissions.includes("*")) {
    return adminAssignablePermissionModules.map((moduleItem) => moduleItem.key);
  }

  return Array.from(
    new Set(
      permissions
        .map((permission) => permission.split(".")[0] as PermissionModuleKey)
        .filter((moduleKey) => adminAssignablePermissionModules.some((moduleItem) => moduleItem.key === moduleKey)),
    ),
  );
};

export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: number | string | null;
  permissions?: string[];
  modules?: string[];
  impersonator_role?: UserRole | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RoleDefinition = {
  label: string;
  panel: "platform" | "company" | "employee" | "client";
  defaultRoute: string;
  description: string;
  scope: string;
};

export const roleDefinitions: Record<UserRole, RoleDefinition> = {
  super_admin: {
    label: "Super Admin",
    panel: "platform",
    defaultRoute: "/super-admin/dashboard",
    description: "Internal system owner who manages company structure, branches, admins, permissions, and global settings.",
    scope: "No employee self-scope. Can administer the internal company system layer only.",
  },
  admin: {
    label: "Admin",
    panel: "company",
    defaultRoute: "/dashboard",
    description: "Company administrator who manages HR, clients, work, finance, payroll, recruitment, settings, and reports.",
    scope: "Company scoped. Can manage records inside their company.",
  },
  employee: {
    label: "Employee",
    panel: "employee",
    defaultRoute: "/employee/dashboard",
    description: "Internal employee portal for attendance, leaves, holidays, payslips, assigned projects, tasks, notices, and profile.",
    scope: "Company scoped and generally self/team scoped depending on assigned permissions.",
  },
  client: {
    label: "Client",
    panel: "client",
    defaultRoute: "/dashboard/client",
    description: "Customer portal for assigned projects, invoices, estimates, payments, events, notices, and communication.",
    scope: "Company scoped and limited to client-owned or shared records.",
  },
};

export const roleDefaultRoutes: Record<UserRole, string> = {
  super_admin: roleDefinitions.super_admin.defaultRoute,
  admin: roleDefinitions.admin.defaultRoute,
  employee: roleDefinitions.employee.defaultRoute,
  client: roleDefinitions.client.defaultRoute,
};

export const rolePermissions: Record<UserRole, PermissionKey[]> = {
  super_admin: ["*"],
  admin: [
    "dashboard.*",
    "company.*",
    "settings.*",
    "roles.*",
    "employees.*",
    "clients.*",
    "hr.*",
    "shifts.*",
    "attendance.*",
    "leaves.*",
    "holidays.*",
    "projects.*",
    "tasks.*",
    "finance.*",
    "payroll.*",
    "recruitment.*",
    "reports.*",
    "messages.*",
    "events.*",
    "notices.*",
    "leads.*",
    "contracts.*",
    "products.*",
    "billing.*",
    "faq.*",
    "profile.*",
  ],
  employee: [
    "dashboard.view",
    "profile.*",
    "attendance.view",
    "attendance.create",
    "leaves.view",
    "leaves.create",
    "leaves.delete",
    "holidays.view",
    "payroll.view",
    "projects.view",
    "tasks.view",
    "messages.*",
    "events.view",
    "notices.view",
    "faq.view",
  ],
  client: [
    "dashboard.view",
    "profile.*",
    "projects.view",
    "tasks.view",
    "tasks.create",
    "finance.view",
    "messages.*",
    "events.view",
    "notices.view",
    "faq.view",
  ],
};

const publicPathPrefixes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/unauthorized"];

const disabledPathPrefixes = ["/faqs", "/employees/faq", "/employee-faq", "/employee-faq-category", "/search"];

type RoleRouteRule = {
  prefixes: string[];
  roles: UserRole[];
};

type PermissionRouteRule = {
  prefixes: string[];
  anyOf: PermissionKey[];
};

export const roleRouteRules: RoleRouteRule[] = [
  {
    prefixes: ["/super-admin"],
    roles: ["super_admin"],
  },
  {
    prefixes: ["/settings", "/account-setup", "/module-settings", "/role-permission", "/custom-fields"],
    roles: ["admin"],
  },
  {
    prefixes: ["/billing", "/payroll", "/payment-gateway-credentials", "/email-settings", "/invoice-settings"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/employees", "/teams", "/designation", "/device", "/attendance/settings/shifts", "/attendance-settings", "/leaves-settings"],
    roles: ["admin"],
  },
  {
    prefixes: ["/attendance/bulk", "/attendance/settings", "/attendance/reports"],
    roles: ["admin"],
  },
  {
    prefixes: ["/leaves/all", "/leaves/settings", "/leave-type"],
    roles: ["admin"],
  },
  {
    prefixes: ["/holidays/create"],
    roles: ["admin"],
  },
  {
    prefixes: ["/tasks/create"],
    roles: ["admin"],
  },
  {
    prefixes: ["/events/create", "/event-type"],
    roles: ["admin"],
  },
  {
    prefixes: ["/attendance", "/leaves", "/holidays"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/clients", "/client-settings"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/dashboard/client"],
    roles: ["client"],
  },
  {
    prefixes: ["/employee/dashboard", "/employee/payroll", "/member/dashboard", "/member/payroll"],
    roles: ["employee"],
  },
  {
    prefixes: ["/invoices", "/estimates", "/proposals", "/credit-notes", "/payments", "/expenses", "/invoice-recurring", "/expenses-recurring"],
    roles: ["admin", "employee", "client"],
  },
  {
    prefixes: ["/leads", "/lead-form", "/lead-settings"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/recruitment"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/reports"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/user-chat"],
    roles: ["admin", "employee"],
  },
  {
    prefixes: ["/projects", "/tasks", "/taskboard", "/task-calendar", "/events", "/event-calendar", "/notices", "/faqs", "/search", "/profile"],
    roles: ["admin", "employee", "client"],
  },
  {
    prefixes: ["/products", "/contracts"],
    roles: ["admin", "employee", "client"],
  },
];

export const permissionRouteRules: PermissionRouteRule[] = [
  { prefixes: ["/dashboard"], anyOf: ["dashboard.view"] },
  { prefixes: ["/settings", "/account-setup", "/module-settings", "/custom-fields"], anyOf: ["settings.view", "settings.manage"] },
  { prefixes: ["/role-permission"], anyOf: ["roles.view", "roles.manage"] },
  { prefixes: ["/billing"], anyOf: ["billing.view", "billing.manage"] },
  { prefixes: ["/payroll"], anyOf: ["payroll.view", "payroll.manage"] },
  { prefixes: ["/faqs", "/employees/faq"], anyOf: ["faq.view", "faq.manage"] },
  { prefixes: ["/employees"], anyOf: ["employees.view", "employees.manage"] },
  { prefixes: ["/device"], anyOf: ["attendance.view", "attendance.manage"] },
  { prefixes: ["/teams", "/designation", "/attendance-settings"], anyOf: ["hr.view", "hr.manage"] },
  { prefixes: ["/attendance/settings/shifts"], anyOf: ["shifts.view", "shifts.manage"] },
  { prefixes: ["/leaves/all", "/leaves/settings", "/leave-type"], anyOf: ["leaves.view", "leaves.manage", "leaves.approve"] },
  { prefixes: ["/attendance/bulk", "/attendance/settings", "/attendance/reports"], anyOf: ["attendance.manage"] },
  { prefixes: ["/attendance"], anyOf: ["attendance.view", "attendance.manage"] },
  { prefixes: ["/leaves"], anyOf: ["leaves.view", "leaves.manage"] },
  { prefixes: ["/holidays/create"], anyOf: ["holidays.create", "holidays.manage"] },
  { prefixes: ["/holidays"], anyOf: ["holidays.view", "holidays.manage"] },
  { prefixes: ["/clients", "/client-settings"], anyOf: ["clients.view", "clients.manage"] },
  { prefixes: ["/invoices", "/estimates", "/proposals", "/credit-notes", "/payments", "/expenses", "/invoice-recurring", "/expenses-recurring"], anyOf: ["finance.view", "finance.manage"] },
  { prefixes: ["/leads", "/lead-form", "/lead-settings"], anyOf: ["leads.view", "leads.manage"] },
  { prefixes: ["/recruitment"], anyOf: ["recruitment.view", "recruitment.manage"] },
  { prefixes: ["/reports"], anyOf: ["reports.view", "reports.export"] },
  { prefixes: ["/contracts"], anyOf: ["contracts.view", "contracts.manage"] },
  { prefixes: ["/projects"], anyOf: ["projects.view", "projects.manage"] },
  { prefixes: ["/tasks/create"], anyOf: ["tasks.create", "tasks.manage"] },
  { prefixes: ["/tasks", "/taskboard", "/task-calendar", "/task-category"], anyOf: ["tasks.view", "tasks.manage"] },
  { prefixes: ["/user-chat"], anyOf: ["messages.view"] },
  { prefixes: ["/events/create", "/event-type"], anyOf: ["events.create", "events.manage"] },
  { prefixes: ["/events", "/event-calendar"], anyOf: ["events.view", "events.manage"] },
  { prefixes: ["/notices"], anyOf: ["notices.view", "notices.manage"] },
  { prefixes: ["/products"], anyOf: ["products.view", "products.manage"] },
  { prefixes: ["/profile", "/search"], anyOf: ["profile.view", "dashboard.view"] },
];

export const normalizeRole = (role?: string | null): UserRole => {
  if (role === "super-admin") return "super_admin";
  if (role === "super_admin" || role === "admin" || role === "employee" || role === "client") {
    return role;
  }

  return "admin";
};

export const isPublicPath = (pathname: string) =>
  publicPathPrefixes.some((prefix) => pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`)));

export const isDisabledPath = (pathname: string) =>
  disabledPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const getDefaultRouteForRole = (role?: string | null) => roleDefaultRoutes[normalizeRole(role)];

export const canRoleAccessPath = (role: UserRole, pathname: string) => {
  if (isPublicPath(pathname)) return true;
  if (isDisabledPath(pathname)) return false;
  if (!isSaasBillingEnabled && isSaasBillingPath(pathname)) return false;

  const matchedRule = roleRouteRules.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );

  if (!matchedRule) {
    return role === "admin";
  }

  return matchedRule.roles.includes(role);
};

export const canUserAccessPath = (user: AuthUser | null, pathname: string) =>
  Boolean(user && canRoleAccessPath(normalizeRole(user.role), pathname) && hasPathPermission(user, pathname));

export const hasPathPermission = (user: AuthUser, pathname: string) => {
  const role = normalizeRole(user.role);
  if (role === "super_admin") return true;

  const matchedRule = permissionRouteRules.find((rule) =>
    rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)),
  );

  if (!matchedRule) return true;
  return matchedRule.anyOf.some((permission) => userHasPermission(user, permission));
};

export const userHasPermission = (user: AuthUser | null, permission: PermissionKey) => {
  if (!user) return false;
  const permissions = Array.isArray(user.permissions) ? user.permissions : rolePermissions[normalizeRole(user.role)];
  if (permissions.includes("*")) return true;

  const [moduleName] = permission.split(".");
  return permissions.some((item) => item === permission || item === `${moduleName}.*` || item === `${user.role}.*`);
};

export const getDefaultRouteForUser = (user: AuthUser | null) => {
  if (!user) return "/login";

  const role = normalizeRole(user.role);
  const roleDefault = getDefaultRouteForRole(role);
  if (canUserAccessPath(user, roleDefault)) return roleDefault;
  if (role !== "admin") return roleDefault;

  const firstAllowedRule = permissionRouteRules.find((rule) => rule.anyOf.some((permission) => userHasPermission(user, permission)));
  return firstAllowedRule?.prefixes[0] || "/profile";
};

export const makeDevUserFromEmail = (email: string): AuthUser => {
  const normalizedEmail = email.toLowerCase();
  const role: UserRole = normalizedEmail.includes("super")
    ? "super_admin"
    : normalizedEmail.includes("employee")
      ? "employee"
      : normalizedEmail.includes("client")
        ? "client"
        : "admin";
  const idByRole: Record<UserRole, number | string> = {
    super_admin: "platform-1",
    admin: 1,
    employee: 2,
    client: 1,
  };

  return {
    id: idByRole[role],
    name: roleDefinitions[role].label,
    email,
    role,
    company_id: role === "super_admin" ? null : 1,
    permissions: rolePermissions[role],
    modules: role === "super_admin" ? ["platform"] : getModulesFromPermissions(rolePermissions[role]),
  };
};
