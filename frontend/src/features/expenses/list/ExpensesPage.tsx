"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Edit, Trash2, Eye, FileText, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type ExpenseRecord = {
  id: number | string;
  item_name?: string;
  user?: { name?: string };
  project?: { project_name?: string };
  price?: number;
  purchase_date?: string;
  status?: string;
};

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-600",
  pending: "bg-yellow-100 text-yellow-600",
  rejected: "bg-red-100 text-red-500",
};

export default function ExpensesPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/expense?include=user,category,project");
      setExpenses(response.data.data);
    } catch (err) {
      console.error("Fetch Expenses Error:", err);
      showToast("Failed to load expenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (deletingExpenseId) {
      try {
        await api.delete(`/expense/${deletingExpenseId}`);
        setExpenses(prev => prev.filter(e => e.id !== deletingExpenseId));
        setDeletingExpenseId(null);
        showToast("Expense deleted successfully", "success");
      } catch (err) {
        console.error("Delete Expense Error:", err);
        showToast("Failed to delete expense", "error");
      }
    }
  };

  const filteredExpenses = expenses.filter(e => {
    return statusFilter === "All" || (e.status || "pending").toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Expenses</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchExpenses}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/expenses/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Add Expense</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl bg-gray-50 border-none px-3 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              >
                <option>All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="lg:col-span-2"></div>
            <div className="flex justify-end">
              <button 
                onClick={() => setStatusFilter("All")}
                className="flex items-center space-x-1 rounded-xl border border-gray-100 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /><span>Reset</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Expenses...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{expense.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-700">{expense.item_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700">{expense.user?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-900">{expense.price}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {expense.purchase_date ? new Date(expense.purchase_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusColors[(expense.status || "pending").toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                        {expense.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/expenses/${expense.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></Link>
                        <Link href={`/expenses/${expense.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                        <button onClick={() => setDeletingExpenseId(expense.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      No expenses found.
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
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Expense?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This will permanently delete the expense record. This action cannot be undone.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingExpenseId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
