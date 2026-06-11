"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Sliders, Search, RefreshCw, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialExpenses = [
  { id: 1, item: "Office Rent", employee: "Admin", price: "$2,000.00", frequency: "Monthly", nextExpense: "2026-06-01", status: "Active" },
  { id: 2, item: "Internet Bill", employee: "John Doe", price: "$150.00", frequency: "Monthly", nextExpense: "2026-06-05", status: "Active" },
  { id: 3, item: "Cleaning Service", employee: "Admin", price: "$300.00", frequency: "Weekly", nextExpense: "2026-05-14", status: "Inactive" },
];

export default function ExpensesRecurringPage() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewingExpense, setViewingExpense] = useState<(typeof initialExpenses)[number] | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<(typeof initialExpenses)[number] | null>(null);

  const filteredExpenses = expenses.filter((expense) => {
    const query = searchTerm.trim().toLowerCase();
    const searchMatch = !query || `${expense.item} ${expense.employee} ${expense.frequency} ${expense.status}`.toLowerCase().includes(query);
    const startMatch = !dateFrom || expense.nextExpense >= dateFrom;
    const endMatch = !dateTo || expense.nextExpense <= dateTo;
    const employeeMatch = employeeFilter === "All" || expense.employee === employeeFilter;
    const statusMatch = statusFilter === "All" || expense.status === statusFilter;
    return searchMatch && startMatch && endMatch && employeeMatch && statusMatch;
  });
  const employeeOptions = Array.from(new Set(expenses.map((expense) => expense.employee)));

  const resetFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setEmployeeFilter("All");
    setStatusFilter("All");
  };

  const addRecurringExpense = () => {
    const nextId = Math.max(...expenses.map((expense) => expense.id), 0) + 1;
    setExpenses((current) => [
      { id: nextId, item: "New Recurring Expense", employee: "Admin", price: "$0.00", frequency: "Monthly", nextExpense: new Date().toISOString().slice(0, 10), status: "Active" },
      ...current,
    ]);
  };

  const deleteExpense = () => {
    if (!deletingExpense) return;
    setExpenses((current) => current.filter((expense) => expense.id !== deletingExpense.id));
    setDeletingExpense(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Recurring Expenses</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Recurring Expenses</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-800 text-white border-none text-[10px] h-8 px-3"
            >
              <Sliders className="h-3 w-3" />
              <span>Filter Results</span>
            </Button>
            <Button onClick={addRecurringExpense} className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white border-none text-[10px] h-8 px-3">
              <Plus className="h-3 w-3" />
              <span>Add Recurring Expense</span>
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="p-6 bg-gray-50/50 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">From Date</label>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">To Date</label>
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Employee</label>
                <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  {employeeOptions.map((employee) => <option key={employee}>{employee}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end space-x-2">
                <Button onClick={resetFilters} className="bg-gray-200 text-gray-600 text-[10px] h-9 px-6">Reset</Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2 border border-gray-100 rounded px-3 py-1.5 bg-gray-50/50 w-64 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="search" placeholder="Search..." className="bg-transparent border-none text-xs w-full focus:outline-none text-gray-600" />
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Next Expense</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense, i) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-700">{expense.item}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">{expense.employee}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-800">{expense.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <RefreshCw className="h-3 w-3 text-primary" />
                      <span className="font-medium">{expense.frequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{expense.nextExpense}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      expense.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingExpense(expense)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded transition-all" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setExpenses((current) => current.map((item) => item.id === expense.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item))} className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-500 rounded transition-all" title="Toggle Status">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeletingExpense(expense)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    No recurring expenses found for selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span>Showing {filteredExpenses.length} of {expenses.length} entries</span>
            <div className="flex items-center space-x-1">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-white transition-colors">Prev</button>
              <button className="px-3 py-1 bg-primary text-white rounded border border-primary">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-white transition-colors">Next</button>
            </div>
          </div>
        </Card>
      </div>
      <Modal isOpen={Boolean(viewingExpense)} onClose={() => setViewingExpense(null)} title="Recurring Expense Details" size="lg">
        {viewingExpense && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(viewingExpense).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{key}</p>
                <p className="mt-1 text-sm font-bold text-gray-800">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>
      <Modal isOpen={Boolean(deletingExpense)} onClose={() => setDeletingExpense(null)} title="Delete Recurring Expense" size="sm">
        <div className="py-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-6 text-xs font-bold text-gray-500">This removes the selected recurring expense from the local list.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingExpense(null)} className="flex-1 bg-gray-100 text-gray-500">Cancel</Button>
            <Button onClick={deleteExpense} className="flex-1 bg-red-500 text-white">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
