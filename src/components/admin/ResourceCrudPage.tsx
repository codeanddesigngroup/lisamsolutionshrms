"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export type ResourceRecord = Record<string, unknown> & {
  id?: string | number;
};

export interface ResourceFieldOption {
  label: string;
  value: string;
}

export interface ResourceField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "date" | "number" | "select" | "color";
  placeholder?: string;
  required?: boolean;
  options?: ResourceFieldOption[];
}

export interface ResourceColumn {
  key: string;
  label: string;
}

export interface ResourceStatusAction {
  label: string;
  value: string;
  endpoint?: string;
  method?: "post" | "put" | "patch";
}

interface ResourceCrudPageProps {
  title: string;
  description: string;
  endpoint: string;
  createEndpoint?: string;
  updateEndpoint?: string;
  deleteEndpoint?: string;
  columns: ResourceColumn[];
  fields: ResourceField[];
  initialRecords?: ResourceRecord[];
  breadcrumbs?: ResourceFieldOption[];
  createButtonLabel?: string;
  idKey?: string;
  statusActions?: ResourceStatusAction[];
}

function readByPath(record: ResourceRecord, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return valueToText(objectValue.name ?? objectValue.title ?? objectValue.type ?? objectValue.id);
  }
  return "-";
}

function extractRecords(payload: unknown): ResourceRecord[] {
  const root = payload as Record<string, unknown> | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;

  if (Array.isArray(data)) {
    return data.filter((item): item is ResourceRecord => Boolean(item) && typeof item === "object");
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (Array.isArray(nested.data)) {
      return nested.data.filter((item): item is ResourceRecord => Boolean(item) && typeof item === "object");
    }
  }

  return [];
}

function buildEndpoint(template: string | undefined, fallback: string, id: string | number): string {
  if (template) return template.replace("{id}", String(id));
  return `${fallback}/${id}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }
  return fallback;
}

export default function ResourceCrudPage({
  title,
  description,
  endpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  columns,
  fields,
  breadcrumbs = [],
  createButtonLabel,
  idKey = "id",
  statusActions = [],
}: ResourceCrudPageProps) {
  const { showToast } = useToast();
  const [records, setRecords] = useState<ResourceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRecord, setViewingRecord] = useState<ResourceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<ResourceRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ResourceRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(endpoint);
      const nextRecords = extractRecords(response.data);
      setRecords(nextRecords);
    } catch (error) {
      setRecords([]);
      showToast(getErrorMessage(error, `${title} API is not available yet.`), "error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, showToast, title]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) =>
      columns.some((column) => valueToText(readByPath(record, column.key)).toLowerCase().includes(query))
    );
  }, [columns, records, searchTerm]);

  const openCreate = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const openEdit = (record: ResourceRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = fields.reduce<Record<string, string>>((accumulator, field) => {
      const value = formData.get(field.name);
      accumulator[field.name] = typeof value === "string" ? value : "";
      return accumulator;
    }, {});

    const existingId = editingRecord ? readByPath(editingRecord, idKey) : undefined;
    const normalizedId = typeof existingId === "string" || typeof existingId === "number" ? existingId : undefined;

    try {
      if (editingRecord && normalizedId !== undefined) {
        const response = await api.put(buildEndpoint(updateEndpoint, endpoint, normalizedId), payload);
        const updatedRecords = extractRecords(response.data);
        const updatedRecord = updatedRecords[0] ?? { ...editingRecord, ...payload };
        setRecords((current) =>
          current.map((record) => (readByPath(record, idKey) === normalizedId ? updatedRecord : record))
        );
        showToast(`${title} updated successfully.`);
      } else {
        const response = await api.post(createEndpoint ?? endpoint, payload);
        const createdRecords = extractRecords(response.data);
        const createdRecord = createdRecords[0] ?? { id: Date.now(), ...payload };
        setRecords((current) => [createdRecord, ...current]);
        showToast(`${title} created successfully.`);
      }
    } catch (error) {
      showToast(getErrorMessage(error, "The API endpoint is not ready."), "error");
    } finally {
      setIsFormOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    const deleteId = readByPath(deletingRecord, idKey);
    if (typeof deleteId !== "string" && typeof deleteId !== "number") return;

    try {
      await api.delete(buildEndpoint(deleteEndpoint, endpoint, deleteId));
      setRecords((current) => current.filter((record) => readByPath(record, idKey) !== deleteId));
      showToast(`${title} deleted successfully.`);
    } catch (error) {
      showToast(getErrorMessage(error, "The API endpoint is not ready."), "error");
    } finally {
      setDeletingRecord(null);
    }
  };

  const handleStatusAction = async (record: ResourceRecord, action: ResourceStatusAction) => {
    const recordId = readByPath(record, idKey);
    if (typeof recordId !== "string" && typeof recordId !== "number") return;

    const requestEndpoint = buildEndpoint(action.endpoint, endpoint, recordId);
    const method = action.method ?? "post";
    try {
      await api.request({
        url: requestEndpoint,
        method,
        data: { status: action.value },
      });
      setRecords((current) =>
        current.map((item) =>
          readByPath(item, idKey) === recordId ? { ...item, status: action.value } : item
        )
      );
      showToast(`${action.label} completed.`);
    } catch (error) {
      showToast(getErrorMessage(error, "The API endpoint is not ready."), "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Link href="/dashboard" className="hover:text-primary">Home</Link>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.value} className="flex items-center gap-1">
                  <span>/</span>
                  <Link href={crumb.value} className="hover:text-primary">{crumb.label}</Link>
                </span>
              ))}
              <span>/</span>
              <span className="text-gray-700">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRecords}
              className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition-colors hover:text-primary"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={openCreate} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              {createButtonLabel ?? `Add ${title}`}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">{title} Management</h2>
              <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-gray-500">{description}</p>
            </div>
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
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
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
                      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No records found</p>
                    </td>
                  </tr>
                )}

                {!loading && filteredRecords.map((record, index) => {
                  const rowKey = readByPath(record, idKey) ?? index;
                  return (
                    <tr key={String(rowKey)} className="transition-colors hover:bg-gray-50/50">
                      {columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 text-xs font-bold text-gray-700">
                          {valueToText(readByPath(record, column.key))}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button onClick={() => setViewingRecord(record)} className="p-1.5 text-gray-400 transition-colors hover:text-primary" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          {statusActions.map((action) => (
                            <button
                              key={action.value}
                              onClick={() => handleStatusAction(record, action)}
                              className="rounded-lg bg-gray-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-primary hover:text-white"
                            >
                              {action.label}
                            </button>
                          ))}
                          <button onClick={() => openEdit(record)} className="p-1.5 text-gray-400 transition-colors hover:text-blue-500" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeletingRecord(record)} className="p-1.5 text-gray-400 transition-colors hover:text-red-500" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRecord ? `Edit ${title}` : `Create ${title}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-12 text-[10px] font-black uppercase tracking-widest">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-12 text-[10px] font-black uppercase tracking-widest">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={`${title} Details`}
        size="lg"
      >
        {viewingRecord && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <h3 className="m-0 text-sm font-black uppercase tracking-widest text-gray-800">Record Snapshot</h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                Review the selected record before editing, deleting, or applying status actions.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {columns.map((column) => (
                <div key={column.key} className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{column.label}</p>
                  <p className="break-words text-sm font-bold text-gray-800">{valueToText(readByPath(viewingRecord, column.key))}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
              <Button onClick={() => setViewingRecord(null)} className="h-11 bg-gray-100 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
                Close
              </Button>
              <Button
                onClick={() => {
                  openEdit(viewingRecord);
                  setViewingRecord(null);
                }}
                className="h-11 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white"
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        title={`Delete ${title}`}
        size="sm"
      >
        <div className="py-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-9 w-9" />
          </div>
          <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-gray-800">Delete this record?</h3>
          <p className="mb-8 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            This action removes it from this admin view and calls the matching API endpoint when available.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setDeletingRecord(null)} className="flex-1 bg-gray-100 text-gray-500 border-none h-12 text-[10px] font-black uppercase tracking-widest">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-12 text-[10px] font-black uppercase tracking-widest">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
