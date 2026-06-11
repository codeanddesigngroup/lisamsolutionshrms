"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Trash2, Eye, Download, Send, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type EstimateRecord = {
  id: number | string;
  estimate_number?: string;
  client?: { name?: string; client_detail?: { company_name?: string } };
  total?: number;
  issue_date?: string;
  valid_till?: string;
  status?: string;
};

const statusColors: Record<string, string> = {
  waiting: "bg-yellow-100 text-yellow-600",
  sent: "bg-blue-100 text-blue-600",
  accepted: "bg-green-100 text-green-600",
  declined: "bg-red-100 text-red-500",
  draft: "bg-gray-100 text-gray-500",
};

export default function EstimatesPage() {
  const { showToast } = useToast();
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const response = await api.get("/estimate?include=client,project");
      setEstimates(response.data.data || []);
    } catch (err) {
      console.error("Fetch Estimates Error:", err);
      showToast("Failed to load estimates", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEstimates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEstimates = useMemo(
    () => estimates.filter((estimate) => statusFilter === "all" || estimate.status === statusFilter),
    [estimates, statusFilter],
  );

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/estimate/${deletingId}`);
      setEstimates((prev) => prev.filter((estimate) => estimate.id !== deletingId));
      setDeletingId(null);
      showToast("Estimate deleted successfully", "success");
    } catch (err) {
      console.error("Delete Estimate Error:", err);
      showToast("Failed to delete estimate", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700">Estimates</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchEstimates} className="p-2 text-gray-400 hover:text-primary" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/estimates/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Create Estimate</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="waiting">Waiting</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <button onClick={() => setStatusFilter("all")} className="flex items-center space-x-1 rounded bg-gray-600 px-6 py-2 text-xs font-semibold text-white hover:bg-gray-700">
              <RefreshCw className="h-3.5 w-3.5" /><span>Reset</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden relative min-h-[320px]">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Estimate #</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Estimate Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Valid Till</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEstimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-medium text-primary hover:underline"><Link href={`/estimates/${estimate.id}`}>{estimate.estimate_number || `EST-${estimate.id}`}</Link></td>
                    <td className="px-4 py-3 text-xs text-gray-800">{estimate.client?.client_detail?.company_name || estimate.client?.name || "N/A"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-700">${Number(estimate.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{estimate.issue_date || "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{estimate.valid_till || "N/A"}</td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[estimate.status || "draft"] || statusColors.draft}`}>{estimate.status || "draft"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1.5">
                        <Link href={`/estimates/${estimate.id}`} className="text-gray-400 hover:text-primary" title="View"><Eye className="h-4 w-4" /></Link>
                        <button className="text-green-500 hover:text-green-700" title="Send"><Send className="h-4 w-4" /></button>
                        <button className="text-gray-600 hover:text-gray-800" title="Download"><Download className="h-4 w-4" /></button>
                        <button onClick={() => setDeletingId(estimate.id)} className="text-red-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredEstimates.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-xs text-gray-500">No estimates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Estimate" size="sm">
        <div className="text-center py-4">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">This will permanently delete the estimate.</p>
          <div className="flex space-x-3">
            <Button onClick={() => setDeletingId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
