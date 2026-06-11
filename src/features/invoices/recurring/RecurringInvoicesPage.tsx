"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { AlertTriangle, Calendar, Edit, Eye, Plus, RefreshCw, Save, Search, Sliders, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

type RecurringInvoice = {
  id: number;
  client: string;
  project: string;
  total: string;
  frequency: string;
  nextInvoice: string;
  status: "Active" | "Inactive";
};

const initialInvoices: RecurringInvoice[] = [
  { id: 1, client: "Acme Corp", project: "Website Redesign", total: "$1,500.00", frequency: "Monthly", nextInvoice: "2026-06-01", status: "Active" },
  { id: 2, client: "Globex Corp", project: "Retainer Support", total: "$2,200.00", frequency: "Weekly", nextInvoice: "2026-05-15", status: "Inactive" },
  { id: 3, client: "Initech", project: "Mobile App", total: "$800.00", frequency: "Monthly", nextInvoice: "2026-06-10", status: "Active" },
];

const blankForm = {
  client: "",
  project: "",
  total: "",
  frequency: "Monthly",
  nextInvoice: "",
  status: "Active" as RecurringInvoice["status"],
};

export default function InvoiceRecurringPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewingInvoice, setViewingInvoice] = useState<RecurringInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<RecurringInvoice | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(blankForm);

  const projects = Array.from(new Set(invoices.map((invoice) => invoice.project)));

  const filteredInvoices = invoices.filter((invoice) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm
      ? [invoice.client, invoice.project, invoice.total, invoice.frequency, invoice.status]
        .some((value) => value.toLowerCase().includes(search))
      : true;
    const matchesProject = projectFilter === "All" || invoice.project === projectFilter;
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    const matchesFrom = !dateFrom || invoice.nextInvoice >= dateFrom;
    const matchesTo = !dateTo || invoice.nextInvoice <= dateTo;
    return matchesSearch && matchesProject && matchesStatus && matchesFrom && matchesTo;
  });

  const openEditor = (invoice?: RecurringInvoice) => {
    setEditingInvoice(invoice || null);
    setInvoiceForm(invoice ? { ...invoice } : blankForm);
    setIsEditorOpen(true);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setProjectFilter("All");
    setStatusFilter("All");
    setSearchTerm("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingInvoice) {
      setInvoices((prev) => prev.map((invoice) => invoice.id === editingInvoice.id ? { ...invoice, ...invoiceForm } : invoice));
      showToast("Recurring invoice updated locally. PHP endpoint should persist this payload.", "success");
    } else {
      setInvoices((prev) => [...prev, { id: Date.now(), ...invoiceForm }]);
      showToast("Recurring invoice created locally. PHP endpoint should persist this payload.", "success");
    }
    setIsEditorOpen(false);
  };

  const handleDelete = () => {
    if (!deletingInvoiceId) return;
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== deletingInvoiceId));
    setDeletingInvoiceId(null);
    showToast("Recurring invoice deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Recurring Invoices</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Recurring Invoices</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowFilters((value) => !value)}
              className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-800 text-white border-none text-[10px] h-8 px-3"
            >
              <Sliders className="h-3 w-3" />
              <span>Filter Results</span>
            </Button>
            <Button onClick={() => openEditor()} className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white border-none text-[10px] h-8 px-3">
              <Plus className="h-3 w-3" />
              <span>Add Recurring Invoice</span>
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="p-6 bg-gray-50/50 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">From Next Invoice</label>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full text-xs border border-gray-200 rounded p-2 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">To Next Invoice</label>
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full text-xs border border-gray-200 rounded p-2 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Project</label>
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full text-xs border border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  {projects.map((project) => <option key={project}>{project}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full text-xs border border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={resetFilters} className="bg-gray-200 text-gray-600 text-[10px] h-9 px-4 w-full">Reset</Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2 border border-gray-200 rounded px-3 py-1.5 bg-gray-50/50 w-64 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search..." className="bg-transparent border-none text-xs w-full focus:outline-none text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">{filteredInvoices.length} of {invoices.length} recurring invoices</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Next Invoice</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice, i) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-700">{invoice.client}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{invoice.project}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-800">{invoice.total}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <RefreshCw className="h-3 w-3 text-primary" />
                      <span className="font-medium">{invoice.frequency}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium"><Calendar className="mr-1 inline h-3 w-3" />{invoice.nextInvoice}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${invoice.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingInvoice(invoice)} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded transition-all" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openEditor(invoice)} className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-500 rounded transition-all" title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeletingInvoiceId(invoice.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No recurring invoices match the filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={!!viewingInvoice} onClose={() => setViewingInvoice(null)} title="Recurring Invoice Details" size="md">
        {viewingInvoice && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            {Object.entries(viewingInvoice).filter(([key]) => key !== "id").map(([key, value]) => (
              <div key={key} className="rounded border border-gray-100 bg-gray-50 p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">{key.replace(/([A-Z])/g, " $1")}</div>
                <div className="mt-1 font-bold text-gray-700">{value}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingInvoice ? "Edit Recurring Invoice" : "Add Recurring Invoice"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={invoiceForm.client} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, client: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Client" />
            <input required value={invoiceForm.project} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, project: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Project" />
            <input required value={invoiceForm.total} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, total: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="$0.00" />
            <select value={invoiceForm.frequency} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, frequency: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold">
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Yearly</option>
            </select>
            <input required type="date" value={invoiceForm.nextInvoice} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, nextInvoice: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" />
            <select value={invoiceForm.status} onChange={(event) => setInvoiceForm((prev) => ({ ...prev, status: event.target.value as RecurringInvoice["status"] }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingInvoiceId} onClose={() => setDeletingInvoiceId(null)} title="Delete Recurring Invoice" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium text-gray-500">This recurring invoice will be removed from the current list.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingInvoiceId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
