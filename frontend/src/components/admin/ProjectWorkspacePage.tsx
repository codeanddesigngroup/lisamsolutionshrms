"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Layers,
  Milestone,
  MoreHorizontal,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { filterTasksForUser, type TaskAssignmentRecord } from "@/lib/task-visibility";

const PROJECT_API_TIMEOUT_MS = 1500;

export type ProjectWorkspaceRecord = Record<string, unknown> & {
  id?: string | number;
};

export interface ProjectWorkspaceColumn {
  key: string;
  label: string;
}

export interface ProjectWorkspaceFieldOption {
  label: string;
  value: string;
}

export interface ProjectWorkspaceField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "date" | "number" | "select" | "color" | "checkbox" | "url";
  placeholder?: string;
  required?: boolean;
  options?: ProjectWorkspaceFieldOption[];
}

export interface ProjectWorkspaceStatusAction {
  label: string;
  value: string;
  endpoint?: string;
  method?: "post" | "put" | "patch";
}

interface ProjectWorkspacePageProps {
  section: string;
  description: string;
  endpointCandidates: string[];
  columns: ProjectWorkspaceColumn[];
  fields?: ProjectWorkspaceField[];
  projectDataKeys?: string[];
  createEndpoint?: string;
  updateEndpoint?: string;
  deleteEndpoint?: string;
  createButtonLabel?: string;
  idKey?: string;
  statusActions?: ProjectWorkspaceStatusAction[];
  detailPathTemplate?: string;
  viewMode?: "table" | "gantt" | "burndown";
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

const projectNav = [
  { label: "Overview", href: "/projects/{projectId}", icon: Layers },
  { label: "Members", href: "/projects/{projectId}/members", icon: Users },
  { label: "Milestones", href: "/projects/{projectId}/milestones", icon: Milestone },
  { label: "Tasks", href: "/projects/{projectId}/tasks", icon: CheckSquare },
  { label: "Files", href: "/projects/{projectId}/files", icon: Paperclip },
  { label: "Notes", href: "/projects/{projectId}/notes", icon: FileText },
  { label: "Issues", href: "/projects/{projectId}/issues", icon: AlertCircle },
  { label: "Invoices", href: "/projects/{projectId}/invoices", icon: FileText },
  { label: "Payments", href: "/projects/{projectId}/payments", icon: DollarSign },
  { label: "Gantt", href: "/projects/{projectId}/gantt", icon: MoreHorizontal },
  { label: "Burndown", href: "/projects/{projectId}/burndown", icon: MoreHorizontal },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-600",
  approved: "bg-green-100 text-green-600",
  complete: "bg-green-100 text-green-600",
  completed: "bg-green-100 text-green-600",
  finished: "bg-green-100 text-green-600",
  paid: "bg-green-100 text-green-600",
  incomplete: "bg-yellow-100 text-yellow-700",
  pending: "bg-yellow-100 text-yellow-700",
  "in progress": "bg-blue-100 text-blue-600",
  open: "bg-blue-100 text-blue-600",
  unpaid: "bg-red-100 text-red-600",
  rejected: "bg-red-100 text-red-600",
  closed: "bg-gray-100 text-gray-600",
};

function buildPath(template: string, projectId: string, recordId?: string | number): string {
  return template
    .replaceAll("{projectId}", projectId)
    .replaceAll("{id}", recordId === undefined ? "" : String(recordId));
}

function addQueryParam(path: string, key: string, value: string): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${base}?${params.toString()}`;
}

function readByPath(record: ProjectWorkspaceRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return valueToText(
      objectValue.name ??
        objectValue.title ??
        objectValue.heading ??
        objectValue.milestone_title ??
        objectValue.file_name ??
        objectValue.invoice_number ??
        objectValue.id
    );
  }
  return "-";
}

function extractRecords(payload: unknown): ProjectWorkspaceRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is ProjectWorkspaceRecord => Boolean(item) && typeof item === "object");
  }

  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const candidates = [root.data, root.records, root.items, root.result];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is ProjectWorkspaceRecord => Boolean(item) && typeof item === "object");
    }
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        return nested.data.filter((item): item is ProjectWorkspaceRecord => Boolean(item) && typeof item === "object");
      }
    }
  }

  return [];
}

function extractProject(payload: unknown): Project | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const candidate = root.data && typeof root.data === "object" && !Array.isArray(root.data) ? root.data : root;
  return candidate as Project;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

function formatDate(value: unknown): string {
  const text = valueToText(value);
  if (text === "-") return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString();
}

function statusBadge(value: unknown) {
  const text = valueToText(value);
  if (text === "-") return text;
  const color = statusColors[text.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${color}`}>
      {text}
    </span>
  );
}

function recordsFromProject(project: Project | null, keys: string[] = []): ProjectWorkspaceRecord[] {
  if (!project) return [];

  for (const key of keys) {
    const value = readByPath(project as unknown as ProjectWorkspaceRecord, key);
    if (Array.isArray(value)) {
      return value.filter((item): item is ProjectWorkspaceRecord => Boolean(item) && typeof item === "object");
    }
  }

  return [];
}

function normalizeFormValue(field: ProjectWorkspaceField, formData: FormData): string | number | boolean {
  if (field.type === "checkbox") return formData.get(field.name) === "on";

  const value = formData.get(field.name);
  const normalized = typeof value === "string" ? value : "";
  if (field.type === "number" && normalized !== "") return Number(normalized);
  return normalized;
}

export default function ProjectWorkspacePage({
  section,
  description,
  endpointCandidates,
  columns,
  fields = [],
  projectDataKeys = [],
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  createButtonLabel,
  idKey = "id",
  statusActions = [],
  detailPathTemplate,
  viewMode = "table",
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
}: ProjectWorkspacePageProps) {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const projectId = String(params.id ?? "");
  const [project, setProject] = useState<Project | null>(null);
  const [records, setRecords] = useState<ProjectWorkspaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRecord, setViewingRecord] = useState<ProjectWorkspaceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<ProjectWorkspaceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProjectWorkspaceRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const isTaskSection = section.toLowerCase() === "tasks";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canCreateRecord = Boolean(allowCreate && (!isTaskSection || (isAdmin && (hasPermission("tasks.create") || hasPermission("tasks.manage")))));
  const canEditRecord = Boolean(allowEdit && (!isTaskSection || (isAdmin && (hasPermission("tasks.edit") || hasPermission("tasks.manage")))));
  const canDeleteRecord = Boolean(allowDelete && (!isTaskSection || (isAdmin && (hasPermission("tasks.delete") || hasPermission("tasks.manage")))));
  const canRunStatusActions = Boolean(!isTaskSection || (isAdmin && (hasPermission("tasks.edit") || hasPermission("tasks.manage"))));

  const resolvedEndpoints = useMemo(
    () =>
      endpointCandidates.map((endpoint) => {
        const resolvedEndpoint = buildPath(endpoint, projectId);
        if (isTaskSection && user?.role === "employee" && user.id) {
          return addQueryParam(resolvedEndpoint, "user_id", String(user.id));
        }
        return resolvedEndpoint;
      }),
    [endpointCandidates, isTaskSection, projectId, user]
  );

  const primaryEndpoint = resolvedEndpoints[0] ?? "";

  const loadWorkspace = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    let fetchedProject: Project | null = null;

    try {
      const projectResponse = await api.get(
        `/project/${projectId}?include=client,members,tasks,milestones,files,invoices,payments,expenses,issues,notes`,
        { timeout: PROJECT_API_TIMEOUT_MS }
      );
      fetchedProject = extractProject(projectResponse.data);
      setProject(fetchedProject);
    } catch {
      try {
        const projectResponse = await api.get(`/project/${projectId}`, { timeout: PROJECT_API_TIMEOUT_MS });
        fetchedProject = extractProject(projectResponse.data);
        setProject(fetchedProject);
      } catch {
        setProject({
          id: Number(projectId),
          project_name: `Project #${projectId}`,
          project_summary: "",
          start_date: "",
          deadline: "",
          status: "in progress",
        });
      }
    }

    const projectRecords = recordsFromProject(fetchedProject, projectDataKeys);
    for (const endpoint of resolvedEndpoints) {
      try {
        const response = await api.get(endpoint, { timeout: PROJECT_API_TIMEOUT_MS });
        const nextRecords = extractRecords(response.data);
        setRecords(nextRecords.length > 0 ? nextRecords : projectRecords);
        setLoading(false);
        return;
      } catch {
        // Try the next known endpoint shape for this Laravel-derived module.
      }
    }

    setRecords(projectRecords);
    setLoading(false);
  }, [projectDataKeys, projectId, resolvedEndpoints]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const filteredRecords = useMemo(() => {
    const visibleRecords = isTaskSection
      ? (filterTasksForUser(records as unknown as TaskAssignmentRecord[], user) as unknown as ProjectWorkspaceRecord[])
      : records;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return visibleRecords;
    return visibleRecords.filter((record) =>
      columns.some((column) => valueToText(readByPath(record, column.key)).toLowerCase().includes(query))
    );
  }, [columns, isTaskSection, records, searchTerm, user]);

  const openCreate = () => {
    if (!canCreateRecord) {
      showToast("You can view assigned tasks but cannot create tasks.", "info");
      return;
    }
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const openEdit = (record: ProjectWorkspaceRecord) => {
    if (!canEditRecord) {
      showToast("You can view assigned tasks but cannot edit task setup.", "info");
      return;
    }
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const getRecordId = (record: ProjectWorkspaceRecord): string | number | undefined => {
    const value = readByPath(record, idKey);
    return typeof value === "string" || typeof value === "number" ? value : undefined;
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = fields.reduce<Record<string, string | number | boolean>>((accumulator, field) => {
      accumulator[field.name] = normalizeFormValue(field, formData);
      return accumulator;
    }, {});
    payload.project_id = payload.project_id || projectId;

    const recordId = editingRecord ? getRecordId(editingRecord) : undefined;

    try {
      if (editingRecord && recordId !== undefined) {
        const endpoint = buildPath(updateEndpoint ?? `${primaryEndpoint}/{id}`, projectId, recordId);
        const response = await api.put(endpoint, payload);
        const updatedRecord = extractRecords(response.data)[0] ?? { ...editingRecord, ...payload };
        setRecords((current) => current.map((record) => (getRecordId(record) === recordId ? updatedRecord : record)));
        showToast(`${section} updated successfully.`);
      } else {
        const endpoint = buildPath(createEndpoint ?? primaryEndpoint, projectId);
        const response = await api.post(endpoint, payload);
        const createdRecord = extractRecords(response.data)[0] ?? { id: Date.now(), ...payload };
        setRecords((current) => [createdRecord, ...current]);
        showToast(`${section} created successfully.`);
      }
    } catch (error) {
      showToast(getErrorMessage(error, "The matching project API is not ready."), "error");
    } finally {
      setIsFormOpen(false);
    }
  };

  const deleteRecord = async () => {
    if (!canDeleteRecord) {
      showToast("You can view assigned tasks but cannot delete them.", "info");
      setDeletingRecord(null);
      return;
    }

    if (!deletingRecord) return;
    const recordId = getRecordId(deletingRecord);
    if (recordId === undefined) return;

    try {
      const endpoint = buildPath(deleteEndpoint ?? `${primaryEndpoint}/{id}`, projectId, recordId);
      await api.delete(endpoint);
      setRecords((current) => current.filter((record) => getRecordId(record) !== recordId));
      showToast(`${section} deleted successfully.`);
    } catch (error) {
      showToast(getErrorMessage(error, "The matching project API is not ready."), "error");
    } finally {
      setDeletingRecord(null);
    }
  };

  const applyStatusAction = async (record: ProjectWorkspaceRecord, action: ProjectWorkspaceStatusAction) => {
    if (!canRunStatusActions) {
      showToast("You can view assigned tasks but cannot update their status.", "info");
      return;
    }

    const recordId = getRecordId(record);
    if (recordId === undefined) return;

    try {
      await api.request({
        url: buildPath(action.endpoint ?? `${primaryEndpoint}/{id}`, projectId, recordId),
        method: action.method ?? "post",
        data: { status: action.value, project_id: projectId },
      });
      setRecords((current) =>
        current.map((item) => (getRecordId(item) === recordId ? { ...item, status: action.value } : item))
      );
      showToast(`${action.label} completed.`);
    } catch (error) {
      showToast(getErrorMessage(error, "The matching project API is not ready."), "error");
    }
  };

  const projectName = project?.project_name ?? `Project #${projectId}`;
  const activeHref = `/projects/${projectId}/${section.toLowerCase().replaceAll(" ", "-")}`;

  const renderTable = () => (
    <Card className="border-none bg-white p-0 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {column.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-16 text-center">
                  <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Loading records</p>
                </td>
              </tr>
            )}
            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-16 text-center">
                  <Layers className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No records found</p>
                </td>
              </tr>
            )}
            {!loading &&
              filteredRecords.map((record, index) => {
                const recordId = getRecordId(record);
                return (
                  <tr key={String(recordId ?? index)} className="transition-colors hover:bg-gray-50/50">
                    {columns.map((column) => {
                      const value = readByPath(record, column.key);
                      const cell = column.key.toLowerCase().includes("date")
                        ? formatDate(value)
                        : column.key.toLowerCase().includes("status")
                          ? statusBadge(value)
                          : valueToText(value);
                      const href = detailPathTemplate && recordId !== undefined ? buildPath(detailPathTemplate, projectId, recordId) : "";
                      return (
                        <td key={column.key} className="px-6 py-4 text-xs font-bold text-gray-700">
                          {href && column === columns[0] ? (
                            <Link href={href} className="text-primary hover:underline">{cell}</Link>
                          ) : (
                            cell
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button onClick={() => setViewingRecord(record)} className="p-1.5 text-gray-400 transition-colors hover:text-primary" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        {canRunStatusActions && statusActions.map((action) => (
                          <button
                            key={action.value}
                            onClick={() => applyStatusAction(record, action)}
                            className="rounded-lg bg-gray-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-primary hover:text-white"
                          >
                            {action.label}
                          </button>
                        ))}
                        {canEditRecord && fields.length > 0 && (
                          <button onClick={() => openEdit(record)} className="p-1.5 text-gray-400 transition-colors hover:text-blue-500" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteRecord && (
                          <button onClick={() => setDeletingRecord(record)} className="p-1.5 text-gray-400 transition-colors hover:text-red-500" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderGantt = () => (
    <Card className="border-none bg-white p-6 shadow-sm">
      {filteredRecords.length === 0 ? (
        <div className="py-12 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record, index) => {
          const title = valueToText(readByPath(record, "heading") ?? readByPath(record, "title") ?? readByPath(record, "milestone_title"));
          const status = valueToText(readByPath(record, "status"));
          const offset = Math.min(index * 8, 48);
          const width = Math.max(22, 72 - offset / 2);
          return (
            <div key={String(getRecordId(record) ?? index)} className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr] md:items-center">
              <div>
                <p className="text-xs font-black text-gray-800">{title}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {formatDate(readByPath(record, "start_date"))} - {formatDate(readByPath(record, "due_date") ?? readByPath(record, "deadline"))}
                </p>
              </div>
              <div className="h-10 rounded-xl bg-gray-50 p-1">
                <div
                  className="flex h-full items-center rounded-lg bg-primary px-3 text-[9px] font-black uppercase tracking-widest text-white shadow-sm"
                  style={{ marginLeft: `${offset}%`, width: `${width - offset / 3}%` }}
                >
                  {status}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </Card>
  );

  const renderBurndown = () => {
    const source = filteredRecords;
    const total = source.length;
    const completed = source.filter((record) => {
      const status = valueToText(readByPath(record, "status")).toLowerCase();
      return status === "completed" || status === "complete" || status === "finished";
    }).length;
    const remaining = Math.max(total - completed, 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-none bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Burndown Snapshot</h2>
              <p className="mt-1 text-xs font-medium text-gray-500">Completion trend based on the current project task set.</p>
            </div>
            <span className="text-3xl font-black text-primary">{progress}%</span>
          </div>
          <div className="space-y-4">
            <div className="h-4 overflow-hidden rounded-full bg-gray-50">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Total", total],
                ["Completed", completed],
                ["Remaining", remaining],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-gray-800">{value}</p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card className="border-none bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-800">Open Scope</h3>
          <div className="space-y-3">
            {source.slice(0, 6).map((record, index) => (
              <div key={String(getRecordId(record) ?? index)} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="truncate text-xs font-bold text-gray-600">
                  {valueToText(readByPath(record, "heading") ?? readByPath(record, "title"))}
                </span>
                {statusBadge(readByPath(record, "status"))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition-colors hover:text-primary"
              title="Back to project"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-black uppercase tracking-widest text-gray-800">{section}</h1>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {projectName} / Project #{projectId}
              </p>
            </div>
          </div>
          {canCreateRecord && fields.length > 0 && (
            <Button onClick={openCreate} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              {createButtonLabel ?? `Add ${section}`}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-1.5 shadow-sm">
          {projectNav.map((item) => {
            const href = buildPath(item.href, projectId);
            const active = href === activeHref || (section === "Overview" && href === `/projects/${projectId}`);
            return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <Card className="border-none bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">{section} Workspace</h2>
              <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-gray-500">{description}</p>
            </div>
            {viewMode === "table" && (
              <div className="flex w-full max-w-md gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-xs font-bold outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    placeholder="Search records..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  disabled={!searchTerm}
                  className="rounded-xl border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </Card>

        {viewMode === "gantt" ? renderGantt() : viewMode === "burndown" ? renderBurndown() : renderTable()}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRecord ? `Edit ${section}` : `Create ${section}`}
        size="lg"
      >
        <form onSubmit={submitForm} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {fields.map((field) => {
              const defaultValue = editingRecord ? valueToText(readByPath(editingRecord, field.name)) : "";
              return (
                <div key={field.name} className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      defaultValue={defaultValue === "-" ? "" : defaultValue}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="h-32 w-full rounded-xl border-none bg-gray-50 p-4 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  ) : field.type === "select" ? (
                    <select
                      name={field.name}
                      defaultValue={defaultValue === "-" ? "" : defaultValue}
                      required={field.required}
                      className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select {field.label}</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <label className="flex h-12 items-center gap-3 rounded-xl bg-gray-50 px-4 text-xs font-bold text-gray-600">
                      <input name={field.name} type="checkbox" defaultChecked={defaultValue === "true" || defaultValue === "1"} className="rounded border-gray-300 text-primary focus:ring-primary/20" />
                      Enabled
                    </label>
                  ) : (
                    <input
                      name={field.name}
                      type={field.type ?? "text"}
                      defaultValue={defaultValue === "-" ? "" : defaultValue}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 border-t border-gray-50 pt-4">
            <Button type="button" onClick={() => setIsFormOpen(false)} className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Cancel
            </Button>
            <Button type="submit" className="h-12 flex-1 bg-primary text-[10px] font-black uppercase tracking-widest text-white">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={`${section} Details`}
        size="lg"
      >
        {viewingRecord && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <h3 className="m-0 text-sm font-black uppercase tracking-widest text-gray-800">Project Record Snapshot</h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                Review this project workspace record before editing, deleting, or changing status.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {columns.map((column) => (
                <div key={column.key} className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{column.label}</p>
                  <div className="break-words text-sm font-bold text-gray-800">
                    {column.key.toLowerCase().includes("status")
                      ? statusBadge(readByPath(viewingRecord, column.key))
                      : valueToText(readByPath(viewingRecord, column.key))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
              <Button onClick={() => setViewingRecord(null)} className="h-11 bg-gray-100 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Close
              </Button>
              {canEditRecord && fields.length > 0 && (
                <Button
                  onClick={() => {
                    openEdit(viewingRecord);
                    setViewingRecord(null);
                  }}
                  className="h-11 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        title={`Delete ${section}`}
        size="sm"
      >
        <div className="py-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <Trash2 className="h-9 w-9" />
          </div>
          <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-gray-800">Delete this record?</h3>
          <p className="mb-8 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            This removes the record from the project workspace and calls the matching API when available.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setDeletingRecord(null)} className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Cancel
            </Button>
            <Button onClick={deleteRecord} className="h-12 flex-1 bg-red-500 text-[10px] font-black uppercase tracking-widest text-white">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
