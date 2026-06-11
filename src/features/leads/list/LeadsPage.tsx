"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, RefreshCw, Edit, Trash2, Eye, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type LeadListRecord = {
  id: number;
  client_name?: string;
  client_email?: string;
  company_name?: string;
  value?: number | string;
  source?: { type?: string };
  status?: { type?: string };
};

type LeadStatusOption = {
  id: number | string;
  type: string;
};

export default function LeadsPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<LeadListRecord[]>([]);
  const [statuses, setStatuses] = useState<LeadStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const [leadResponse, statusResponse] = await Promise.all([
        api.get("/lead"),
        api.get("/lead-status"),
      ]);
      setLeads(leadResponse.data.data || []);
      setStatuses(statusResponse.data.data || []);
    } catch (err) {
      console.error("Fetch Leads Error:", err);
      showToast("Failed to load leads", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLeads();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLeads]);

  const handleDelete = async () => {
    if (deletingLeadId) {
      try {
        await api.delete(`/lead/${deletingLeadId}`);
        setLeads(prev => prev.filter(l => l.id !== deletingLeadId));
        showToast("Lead deleted successfully", "success");
        setDeletingLeadId(null);
      } catch (err) {
        console.error("Delete Lead Error:", err);
        setLeads(prev => prev.filter(l => l.id !== deletingLeadId));
        showToast("Lead removed from the current view, but persistence failed.", "error");
        setDeletingLeadId(null);
      }
    }
  };

  const filteredLeads = leads.filter(l => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm
      ? [l.client_name, l.client_email, l.company_name, l.source?.type, l.status?.type, l.value]
        .some((value) => String(value || "").toLowerCase().includes(search))
      : true;
    const matchesStatus = statusFilter === "All" || l.status?.type === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Manage Leads</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchLeads}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/leads/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Add Lead</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-10 text-xs font-bold outline-none transition-all focus:ring-1 focus:ring-primary/20"
                  placeholder="Search by lead, company, email, source..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                {statuses.map((status) => (
                  <option key={status.id}>{status.type}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
                className="flex items-center space-x-1 rounded-lg border border-gray-200 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /><span>Reset</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{lead.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary text-[10px] font-black flex-shrink-0">
                          {lead.client_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </div>
                        <div>
                           <Link href={`/leads/${lead.id}`} className="text-xs font-bold text-gray-700 hover:text-primary transition-colors">{lead.client_name}</Link>
                           <p className="text-[9px] text-gray-400 font-bold">{lead.client_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-primary/70 uppercase tracking-tight">{lead.company_name}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lead.source?.type || 'Organic'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-900">{lead.value || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                         lead.status?.type === "Converted" ? "bg-green-100 text-green-600" : 
                         lead.status?.type === "Lost" ? "bg-red-100 text-red-500" : 
                         "bg-blue-100 text-blue-600"
                      }`}>
                        {lead.status?.type || 'New Lead'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Link href={`/leads/${lead.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></Link>
                        <Link href={`/leads/${lead.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                        <button onClick={() => setDeletingLeadId(lead.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLeadId}
        onClose={() => setDeletingLeadId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Lead?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This will permanently remove the lead and all associated notes and files.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingLeadId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete Lead</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
