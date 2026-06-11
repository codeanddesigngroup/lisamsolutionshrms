import type { AuthUser } from "./auth-contract";

export type TaskAssignmentRecord = {
  users?: unknown[];
  task_users?: unknown[];
  assignees?: unknown[];
  employee?: unknown;
  user?: unknown;
  assigned_to?: unknown;
  assigned_user_id?: unknown;
  employee_id?: unknown;
  user_id?: unknown;
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

const textValue = (value: unknown, key: "email" | "name") => {
  const record = toRecord(value);
  return record ? normalize(record[key]) : "";
};

const collectArray = (value: unknown) => (Array.isArray(value) ? value : []);

export const getTaskAssignees = (task: TaskAssignmentRecord) => [
  ...collectArray(task.users),
  ...collectArray(task.task_users),
  ...collectArray(task.assignees),
  task.employee,
  task.user,
  task.assigned_to,
].filter(Boolean);

export const isTaskAssignedToUser = (task: TaskAssignmentRecord, user: AuthUser | null) => {
  if (!user) return false;

  const userIds = new Set(idValues(user));
  const userEmail = normalize(user.email);
  const userName = normalize(user.name);

  const directAssigneeIds = [
    ...idValues(task.employee_id),
    ...idValues(task.user_id),
    ...idValues(task.assigned_user_id),
    ...idValues(task.assigned_to),
  ];

  if (directAssigneeIds.some((id) => userIds.has(id))) return true;

  return getTaskAssignees(task).some((assignee) => {
    if (idValues(assignee).some((id) => userIds.has(id))) return true;
    if (userEmail && textValue(assignee, "email") === userEmail) return true;
    return Boolean(userName && textValue(assignee, "name") === userName);
  });
};

export const filterTasksForUser = <T extends TaskAssignmentRecord>(tasks: T[], user: AuthUser | null) => {
  if (user?.role !== "employee") return tasks;
  return tasks.filter((task) => isTaskAssignedToUser(task, user));
};
