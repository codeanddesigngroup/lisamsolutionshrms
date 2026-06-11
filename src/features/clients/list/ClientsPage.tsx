"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Edit, Trash2, Eye, AlertTriangle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { Client, ApiResponse } from "@/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingClientId, setDeletingClientId] = useState<number | string | null>(null);
  const { showToast } = useToast();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchClients = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Client[]>>(`/client?include=client_detail&page=${page}`);
      setClients(response.data.data);
      if (response.data.meta) {
        setCurrentPage(response.data.meta.current_page);
        setLastPage(response.data.meta.last_page);
        setTotal(response.data.meta.total);
      }
    } catch (err) {
      console.error("Fetch Clients Error:", err);
      showToast("Failed to fetch clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleDelete = async () => {
    if (deletingClientId) {
      try {
        await api.delete(`/client/${deletingClientId}`);
        setClients(prev => prev.filter(c => c.id !== deletingClientId));
        setDeletingClientId(null);
        showToast("Client deleted successfully");
      } catch (err) {
        console.error("Delete Client Error:", err);
        showToast("Failed to delete client", "error");
      }
    }
  };

  const filteredClients = clients.filter(c => {
    const query = searchTerm.trim().toLowerCase();
    const searchText = [
      c.name,
      c.email,
      c.status,
      c.client_detail?.company_name,
      c.client_detail?.mobile,
      c.client_detail?.address,
    ].filter(Boolean).join(" ").toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    const statusMatch = statusFilter === "All" || c.status.toLowerCase() === statusFilter.toLowerCase();
    return searchMatch && statusMatch;
  });

  const activeCount = clients.filter(c => c.status === "active").length;
  const deactiveCount = clients.filter(c => c.status === "deactive").length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Clients</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchClients(currentPage)}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/clients/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Add Client</span><Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <Card className="p-0 border-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-50 text-center">
            <div className="p-4">
              <h4 className="text-2xl font-black text-blue-500">{clients.length}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total Clients</p>
            </div>
            <div className="p-4">
              <h4 className="text-2xl font-black text-green-500">{activeCount}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Active Clients</p>
            </div>
            <div className="p-4">
              <h4 className="text-2xl font-black text-red-500">{deactiveCount}</h4>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Deactive Clients</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-xs font-bold outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  placeholder="Search client, company, email"
                  type="search"
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
                <option value="active">Active</option>
                <option value="deactive">Deactive</option>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Clients...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.length > 0 ? filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{client.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary text-[10px] font-black flex-shrink-0">
                          {client.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </div>
                        <Link href={`/clients/${client.id}`} className="text-xs font-bold text-gray-700 hover:text-primary transition-colors">{client.name}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-primary/70 uppercase tracking-tight">{client.client_detail?.company_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{client.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${client.status === "active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Link href={`/clients/${client.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></Link>
                        <Link href={`/clients/${client.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                        <button onClick={() => setDeletingClientId(client.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            lastPage={lastPage} 
            onPageChange={setCurrentPage} 
            total={total} 
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClientId}
        onClose={() => setDeletingClientId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Client?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This will remove the client and all their data. Projects and invoices associated with this client will remain in the system but will be unlinked.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingClientId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete Client</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
