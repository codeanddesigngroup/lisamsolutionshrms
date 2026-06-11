import type { AuthUser } from "./auth-contract";

export type EmployeeScopedRecord = {
  user_id?: unknown;
  employee_id?: unknown;
  assigned_user_id?: unknown;
  assigned_to?: unknown;
  employee?: unknown;
  user?: unknown;
  users?: unknown[];
  employees?: unknown[];
  attendees?: unknown[];
  assignees?: unknown[];
  audience?: unknown;
};

type ScopeOptions = {
  includePublic?: boolean;
};

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : null;

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

const idValues = (value: unknown) => {
  const record = toRecord(value);
  if (!record) return value ? [String(value)] : [];

  return ["id", "user_id", "employee_id", "assigned_user_id"]
    .map((key) => record[key])
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map(String);
};

const textValue = (value: unknown, key: "email" | "name" | "employee") => {
  const record = toRecord(value);
  return record ? normalize(record[key]) : normalize(value);
};

const collectArray = (value: unknown) => (Array.isArray(value) ? value : []);

const publicLabels = new Set(["all", "all employees", "everyone", "company-wide", "company"]);

export const isPublicEmployeeRecord = (record: EmployeeScopedRecord) => {
  const directLabels = [record.audience, record.employee, record.user, record.assigned_to]
    .map((value) => textValue(value, "name"))
    .filter(Boolean);

  return directLabels.some((label) => publicLabels.has(label));
};

export const isEmployeeScopedRecordForUser = (record: EmployeeScopedRecord, user: AuthUser | null, options: ScopeOptions = {}) => {
  if (!user) return false;
  if (options.includePublic && isPublicEmployeeRecord(record)) return true;

  const userIds = new Set(idValues(user));
  const userEmail = normalize(user.email);
  const userName = normalize(user.name);
  const directIds = [
    ...idValues(record.user_id),
    ...idValues(record.employee_id),
    ...idValues(record.assigned_user_id),
    ...idValues(record.assigned_to),
    ...idValues(record.employee),
    ...idValues(record.user),
  ];

  if (directIds.some((id) => userIds.has(id))) return true;

  const relatedPeople = [
    ...collectArray(record.users),
    ...collectArray(record.employees),
    ...collectArray(record.attendees),
    ...collectArray(record.assignees),
    record.employee,
    record.user,
    record.assigned_to,
  ].filter(Boolean);

  return relatedPeople.some((person) => {
    if (idValues(person).some((id) => userIds.has(id))) return true;
    if (userEmail && textValue(person, "email") === userEmail) return true;
    return Boolean(userName && (textValue(person, "name") === userName || textValue(person, "employee") === userName));
  });
};

export const filterEmployeeScopedRecords = <T extends EmployeeScopedRecord>(records: T[], user: AuthUser | null, options: ScopeOptions = {}) => {
  if (user?.role !== "employee") return records;
  return records.filter((record) => isEmployeeScopedRecordForUser(record, user, options));
};
