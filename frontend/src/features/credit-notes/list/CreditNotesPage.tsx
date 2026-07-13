"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Sliders, Calendar, Search, Eye, Edit, Trash2, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const initialCreditNotes = [
  { id: 1, number: "CN-001", client: "Acme Corp", project: "Website Redesign", amount: "$500.00", date: "2026-05-01", status: "Open" },
  { id: 2, number: "CN-002", client: "Globex Corp", project: "Mobile App", amount: "$1,200.00", date: "2026-05-03", status: "Closed" },
];

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState(initialCreditNotes);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [deletingNote, setDeletingNote] = useState<(typeof initialCreditNotes)[number] | null>(null);

  const filteredCreditNotes = creditNotes.filter((note) => {
    const query = searchTerm.trim().toLowerCase();
    const searchMatch = !query || `${note.number} ${note.client} ${note.project} ${note.status}`.toLowerCase().includes(query);
    const startMatch = !dateFrom || note.date >= dateFrom;
    const endMatch = !dateTo || note.date <= dateTo;
    const projectMatch = projectFilter === "All" || note.project === projectFilter;
    const clientMatch = clientFilter === "All" || note.client === clientFilter;
    return searchMatch && startMatch && endMatch && projectMatch && clientMatch;
  });
  const projectOptions = Array.from(new Set(creditNotes.map((note) => note.project)));
  const clientOptions = Array.from(new Set(creditNotes.map((note) => note.client)));

  const resetFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setProjectFilter("All");
    setClientFilter("All");
  };

  const addCreditNote = () => {
    const nextId = Math.max(...creditNotes.map((note) => note.id), 0) + 1;
    setCreditNotes((current) => [
      { id: nextId, number: `CN-${String(nextId).padStart(3, "0")}`, client: "New Client", project: "General", amount: "$0.00", date: new Date().toISOString().slice(0, 10), status: "Open" },
      ...current,
    ]);
  };

  const downloadCreditNote = (note: (typeof initialCreditNotes)[number]) => {
    const blob = new Blob([JSON.stringify(note, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${note.number}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const deleteCreditNote = () => {
    if (!deletingNote) return;
    setCreditNotes((current) => current.filter((note) => note.id !== deletingNote.id));
    setDeletingNote(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Credit Notes</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Credit Notes</span>
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
            <Button onClick={addCreditNote} className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white border-none text-[10px] h-8 px-3">
              <Plus className="h-3 w-3" />
              <span>Add Credit Note</span>
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
                <label className="text-[10px] font-bold text-gray-400 uppercase">Project</label>
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  {projectOptions.map((project) => <option key={project}>{project}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Client</label>
                <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="w-full text-xs border-gray-200 rounded p-2 bg-white">
                  <option>All</option>
                  {clientOptions.map((client) => <option key={client}>{client}</option>)}
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
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Credit Note #</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Credit Note Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCreditNotes.map((note, i) => (
                <tr key={note.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-4 text-xs font-bold text-primary hover:underline cursor-pointer">
                    <Link href={`/credit-notes/${note.id}`}>{note.number}</Link>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-700">{note.client}</td>
                  <td className="px-6 py-4 text-xs font-black text-gray-800">{note.amount}</td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">{note.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      note.status === "Open" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    }`}>
                      {note.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/credit-notes/${note.id}`} className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded transition-all" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button onClick={() => setCreditNotes((current) => current.map((item) => item.id === note.id ? { ...item, status: item.status === "Open" ? "Closed" : "Open" } : item))} className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-500 rounded transition-all" title="Toggle Status">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => downloadCreditNote(note)} className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-500 rounded transition-all" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeletingNote(note)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCreditNotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    No credit notes found for selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span>Showing {filteredCreditNotes.length} of {creditNotes.length} entries</span>
            <div className="flex items-center space-x-1">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-white transition-colors">Prev</button>
              <button className="px-3 py-1 bg-primary text-white rounded border border-primary">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-white transition-colors">Next</button>
            </div>
          </div>
        </Card>
      </div>
      <Modal isOpen={Boolean(deletingNote)} onClose={() => setDeletingNote(null)} title="Delete Credit Note" size="sm">
        <div className="py-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-6 text-xs font-bold text-gray-500">This removes the selected credit note from the local list.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingNote(null)} className="flex-1 bg-gray-100 text-gray-500">Cancel</Button>
            <Button onClick={deleteCreditNote} className="flex-1 bg-red-500 text-white">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
