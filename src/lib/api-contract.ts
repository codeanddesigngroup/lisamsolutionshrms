export type ApiResource =
  | "account-setup"
  | "admins"
  | "attendance"
  | "attendance-settings"
  | "billing"
  | "clients"
  | "chat-conversations"
  | "chat-messages"
  | "companies"
  | "contacts"
  | "contracts"
  | "credit-notes"
  | "currencies"
  | "departments"
  | "designations"
  | "devices"
  | "discussions"
  | "employees"
  | "estimates"
  | "events"
  | "expenses"
  | "holidays"
  | "employee-docs"
  | "leave-quotas"
  | "invoices"
  | "leads"
  | "leaves"
  | "notices"
  | "payments"
  | "payroll"
  | "payroll-cycles"
  | "payroll-settings"
  | "products"
  | "projects"
  | "proposals"
  | "reports"
  | "role-permission"
  | "settings"
  | "salary-components"
  | "salary-groups"
  | "salary-payment-methods"
  | "salary-tds"
  | "shift-types"
  | "tasks"
  | "time-logs"
  | "employee-salaries"
  | "employee-salary-groups"
  | "employee-payroll-cycles"
  | "user-activities";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
};

export type ApiListQuery = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  include?: string | string[];
  sort?: string;
  direction?: "asc" | "desc";
  [key: string]: string | number | boolean | string[] | undefined;
};

const singularResourceMap: Record<string, string> = {
  admin: "admins",
  client: "clients",
  "chat-conversation": "chat-conversations",
  "chat-message": "chat-messages",
  "client-category": "client-categories",
  contact: "contacts",
  contract: "contracts",
  "contract-type": "contract-types",
  currency: "currencies",
  department: "departments",
  designation: "designations",
  discussion: "discussions",
  "discussion-category": "discussion-categories",
  employee: "employees",
  "employee-faq": "employee-faqs",
  "employee-faq-category": "employee-faq-categories",
  "employee-doc": "employee-docs",
  "employee-docs": "employee-docs",
  estimate: "estimates",
  event: "events",
  expense: "expenses",
  holiday: "holidays",
  invoice: "invoices",
  lead: "leads",
  "lead-category": "lead-categories",
  "lead-source": "lead-sources",
  "lead-status": "lead-statuses",
  leave: "leaves",
  "leave-type": "leave-types",
  leaveType: "leave-types",
  "leave-quota": "leave-quotas",
  notice: "notices",
  payment: "payments",
  payroll: "payroll",
  "payroll-cycle": "payroll-cycles",
  "payroll-setting": "payroll-settings",
  product: "products",
  project: "projects",
  "project-category": "project-categories",
  proposal: "proposals",
  "role-permission": "role-permission",
  "salary-component": "salary-components",
  "salary-group": "salary-groups",
  "salary-payment-method": "salary-payment-methods",
  "salary-tds": "salary-tds",
  "shift-type": "shift-types",
  task: "tasks",
  "task-category": "task-categories",
  "task-label": "task-labels",
  "task-request": "task-requests",
  team: "teams",
  "time-log": "time-logs",
  "employee-salary": "employee-salaries",
  "employee-salary-group": "employee-salary-groups",
  "employee-payroll-cycle": "employee-payroll-cycles",
  "user-activity": "user-activities",
};

const nestedRouteMap: Record<string, string> = {
  "billing/packages": "billing/packages",
  "billing/data": "billing/summary",
  "billing/select-package": "billing/package-selections",
  "billing/offline-payment-submit": "billing/offline-payments",
  "payroll/generate": "payroll/generate",
  "payroll/updateStatus": "payroll/update-status",
  "payroll/update-status": "payroll/update-status",
  "payroll/cycle-data": "payroll/cycle-data",
  "salary-components": "salary-components",
  "salary-groups": "salary-groups",
  "salary-tds": "salary-tds",
  "salary-tds/status": "payroll-settings",
  "payment-methods": "salary-payment-methods",
  "salary-payment-methods": "salary-payment-methods",
  "employee-salary": "employee-salaries",
  "employee-salary/payroll-cycle": "employee-payroll-cycles",
  "employee-salary/payroll-status": "employee-salaries/status",
  "employee-salary-groups": "employee-salary-groups",
  "payroll-setting": "payroll-settings",
};

const stripSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const splitUrl = (url: string) => {
  const [pathPart = "", queryPart] = url.split("?");
  return {
    path: stripSlashes(pathPart),
    query: queryPart ? `?${queryPart}` : "",
  };
};

export const normalizeApiPath = (inputUrl?: string) => {
  if (!inputUrl) return inputUrl;
  if (/^https?:\/\//i.test(inputUrl)) return inputUrl;

  const { path, query } = splitUrl(inputUrl);
  if (!path) return inputUrl;
  if (path.startsWith("v1/")) return `/${path}${query}`;

  const parts = path.split("/");
  const first = parts[0];
  const nestedKey = parts.length > 1 ? `${first}/${parts[1]}` : first;

  if (nestedRouteMap[nestedKey]) {
    const remaining = parts.slice(2);
    return `/v1/${[nestedRouteMap[nestedKey], ...remaining].join("/")}${query}`;
  }

  const resource = singularResourceMap[first] || first;
  return `/v1/${[resource, ...parts.slice(1)].join("/")}${query}`;
};

export const apiRoutes = {
  resource: (resource: ApiResource) => `/v1/${resource}`,
  detail: (resource: ApiResource, id: number | string) => `/v1/${resource}/${id}`,
  action: (resource: ApiResource, id: number | string, action: string) => `/v1/${resource}/${id}/${stripSlashes(action)}`,
  collectionAction: (resource: ApiResource, action: string) => `/v1/${resource}/${stripSlashes(action)}`,
  settings: (group: string) => `/v1/settings/${stripSlashes(group)}`,
};

export const buildQueryString = (query: ApiListQuery = {}) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      params.set(key, value.join(","));
      return;
    }
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};
