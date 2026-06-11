"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, RefreshCw, Trash2, Eye, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type InvoiceRecord = {
  id: number | string;
  invoice_number?: string;
  client?: { name?: string; client_detail?: { company_name?: string } };
  project?: { project_name?: string };
  total?: number;
  issue_date?: string;
  status?: string;
};

const statusColors: Record<string, string> = {
  "paid": "bg-green-100 text-green-600",
  "unpaid": "bg-gray-100 text-gray-500",
  "overdue": "bg-red-100 text-red-500",
  "partial": "bg-blue-100 text-blue-600",
  "draft": "bg-yellow-100 text-yellow-600",
};

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get("/invoice?include=client,project");
      setInvoices(response.data.data);
    } catch (err) {
      console.error("Fetch Invoices Error:", err);
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    return statusFilter === "All" || (inv.status || "draft").toLowerCase() === statusFilter.toLowerCase();
  });

  const handleDelete = async () => {
    if (deletingInvoiceId) {
      try {
        await api.delete(`/invoice/${deletingInvoiceId}`);
        setInvoices(prev => prev.filter(inv => inv.id !== deletingInvoiceId));
        setDeletingInvoiceId(null);
        showToast("Invoice deleted successfully", "success");
      } catch (err) {
        console.error("Delete Invoice Error:", err);
        showToast("Failed to delete invoice", "error");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Invoices</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchInvoices}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/invoices/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Create Invoice</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="lg:col-span-2"></div>
            <div className="flex justify-end">
              <button 
                onClick={() => setStatusFilter("All")}
                className="flex items-center space-x-1 rounded-lg border border-gray-200 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /><span>Reset</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Invoices...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"># Invoice</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                       <span className="text-xs font-black text-primary">{inv.invoice_number}</span>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{inv.project?.project_name || 'No Project'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-700">{inv.client?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs font-black text-gray-900">{inv.total}</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusColors[(inv.status || "draft").toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                        {inv.status || "draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/invoices/${inv.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></Link>
                        <button className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Download"><Download className="h-4 w-4" /></button>
                        <button onClick={() => setDeletingInvoiceId(inv.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      No invoices found.
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
        isOpen={!!deletingInvoiceId}
        onClose={() => setDeletingInvoiceId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Invoice?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This will permanently delete the invoice record. This action cannot be undone.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingInvoiceId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
