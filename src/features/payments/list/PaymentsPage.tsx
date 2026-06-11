"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Trash2, Eye, CreditCard, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type PaymentRecord = {
  id: number | string;
  invoice?: { invoice_number?: string; id?: number | string };
  project?: { project_name?: string };
  amount?: number;
  date?: string;
  payment_date?: string;
  status?: string;
  payment_gateway?: string;
};

const statusColors: Record<string, string> = {
  complete: "bg-green-100 text-green-600",
  paid: "bg-green-100 text-green-600",
  approved: "bg-green-100 text-green-600",
  pending: "bg-yellow-100 text-yellow-600",
  rejected: "bg-red-100 text-red-500",
};

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get("/payment?include=invoice,project");
      setPayments(response.data.data || []);
    } catch (err) {
      console.error("Fetch Payments Error:", err);
      showToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPayments = useMemo(
    () => payments.filter((payment) => statusFilter === "all" || payment.status === statusFilter),
    [payments, statusFilter],
  );

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/payment/${deletingId}`);
      setPayments((prev) => prev.filter((payment) => payment.id !== deletingId));
      setDeletingId(null);
      showToast("Payment deleted successfully", "success");
    } catch (err) {
      console.error("Delete Payment Error:", err);
      showToast("Failed to delete payment", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700">Payments</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchPayments} className="p-2 text-gray-400 hover:text-primary" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            <Link href="/payments/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Add Payment</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                <option value="complete">Complete</option>
                <option value="paid">Paid</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-end justify-end">
              <button onClick={() => setStatusFilter("all")} className="flex items-center justify-center space-x-1 rounded bg-gray-600 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700">
                <RefreshCw className="h-3.5 w-3.5" /><span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden relative min-h-[320px]">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Paid On</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Gateway</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{payment.id}</td>
                    <td className="px-4 py-3 text-xs font-medium text-primary hover:underline"><Link href={`/payments/${payment.id}`}>{payment.invoice?.invoice_number || `PAY-${payment.id}`}</Link></td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-medium">{payment.project?.project_name || "N/A"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-700">${Number(payment.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{payment.payment_date || payment.date || "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600"><div className="flex items-center space-x-1.5"><CreditCard className="h-3.5 w-3.5 text-gray-400" /><span>{payment.payment_gateway || "offline"}</span></div></td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[payment.status || "pending"] || statusColors.pending}`}>{payment.status || "pending"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1.5">
                        <Link href={`/payments/${payment.id}`} className="text-gray-400 hover:text-primary"><Eye className="h-4 w-4" /></Link>
                        <button onClick={() => setDeletingId(payment.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredPayments.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-xs text-gray-500">No payments found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Payment" size="sm">
        <div className="text-center py-4">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">This will permanently delete the payment.</p>
          <div className="flex space-x-3">
            <Button onClick={() => setDeletingId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
