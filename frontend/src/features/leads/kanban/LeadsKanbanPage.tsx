"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, MoreVertical, Phone, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { Lead } from "@/types";
import { useToast } from "@/context/ToastContext";

type LeadStatus = {
  id: number | string;
  type: string;
  color?: string;
};

const defaultStatuses: LeadStatus[] = [
  { id: 1, type: "New Lead", color: "#03a9f3" },
  { id: 2, type: "In Process", color: "#fec107" },
  { id: 5, type: "Proposal Sent", color: "#ab8ce4" },
  { id: 3, type: "Converted", color: "#00c292" },
  { id: 4, type: "Lost", color: "#e46a76" },
];

const getLabel = (value: unknown, fallback = "New Lead") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "type" in value) return String((value as { type?: string }).type || fallback);
  return fallback;
};

const toCurrency = (value?: number | string) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export default function LeadsKanbanPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>(defaultStatuses);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, statusRes] = await Promise.all([api.get("/lead"), api.get("/lead-status")]);
      setLeads(leadRes.data.data || []);
      setStatuses((statusRes.data.data || defaultStatuses) as LeadStatus[]);
    } catch (err) {
      console.error("Fetch Lead Kanban Error:", err);
      showToast("Failed to load lead board", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBoard();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBoard]);

  const columns = useMemo(() => {
    const allStatuses = statuses.length ? statuses : defaultStatuses;
    return allStatuses.map((status) => ({
      ...status,
      leads: leads.filter((lead) => getLabel(lead.status) === status.type),
    }));
  }, [leads, statuses]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Lead Kanban Board</h1>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Link href="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link href="/leads" className="hover:text-primary">Leads</Link>
              <span>/</span>
              <span className="text-gray-700">Kanban Board</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchBoard} className="rounded bg-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-600 transition-all hover:bg-gray-200">
              <RefreshCw className={`mr-2 inline h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link href="/leads" className="flex h-8 items-center rounded bg-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-600 transition-all hover:bg-gray-200">
              List View
            </Link>
            <Link href="/leads/create">
              <Button className="flex h-8 items-center space-x-1 border-none bg-primary px-3 text-[10px] text-white hover:bg-primary/90">
                <Plus className="h-3 w-3" />
                <span>Add Lead</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="-mx-6 flex space-x-6 overflow-x-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-200">
          {columns.map((column) => (
            <div key={column.id} className="w-72 flex-shrink-0">
              <div className="mb-4 flex items-center justify-between rounded-t-lg border-t-4 bg-white p-3 shadow-sm" style={{ borderTopColor: column.color || "#03a9f3" }}>
                <div className="flex items-center space-x-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-700">{column.type}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{column.leads.length}</span>
                </div>
                <MoreVertical className="h-4 w-4 text-gray-300" />
              </div>

              <div className="space-y-3">
                {column.leads.map((lead) => {
                  const leadName = lead.client_name || lead.name || "Lead Contact";
                  const companyName = lead.company_name || lead.company || "Prospect Company";
                  const source = getLabel(lead.source, "Organic");
                  const agentName = typeof lead === "object" && "agent" in lead && lead.agent && typeof lead.agent === "object"
                    ? String((lead.agent as { name?: string }).name || "Sales")
                    : "Sales";
                  const initials = agentName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

                  return (
                    <div key={lead.id} className="group cursor-grab rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:scale-95">
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">{source}</span>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{initials || "SA"}</div>
                      </div>
                      <Link href={`/leads/${lead.id}`} className="mb-1 block text-xs font-bold leading-tight text-gray-800 transition-colors hover:text-primary">
                        {leadName}
                      </Link>
                      <p className="mb-3 text-[10px] font-medium text-gray-400">{companyName}</p>

                      <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-3">
                        <div className="text-[11px] font-black text-gray-700">{toCurrency(lead.value)}</div>
                        <div className="flex items-center space-x-2">
                          <a href={`mailto:${lead.client_email || lead.email || ""}`} className="rounded p-1.5 text-gray-400 transition-all hover:bg-gray-50 hover:text-primary">
                            <Mail className="h-3 w-3" />
                          </a>
                          <a href={`tel:${lead.mobile || lead.phone || ""}`} className="rounded p-1.5 text-gray-400 transition-all hover:bg-gray-50 hover:text-primary">
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!loading && column.leads.length === 0 && (
                  <div className="flex justify-center rounded-lg border-2 border-dashed border-gray-100 py-12 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">No Leads</p>
                  </div>
                )}

                <Link href="/leads/create" className="flex w-full items-center justify-center space-x-2 rounded border border-gray-100 bg-white py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-all hover:border-primary/20 hover:text-primary">
                  <Plus className="h-3 w-3" />
                  <span>Add Lead</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
