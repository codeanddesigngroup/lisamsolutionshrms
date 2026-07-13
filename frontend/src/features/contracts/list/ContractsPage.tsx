"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, RefreshCw, Edit, Trash2, Eye, FileText, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type ContractRecord = {
  id: number;
  subject: string;
  client: string;
  amount: string;
  startDate: string;
  endDate: string;
  type: string;
  description?: string;
};

type ApiContract = {
  id: number;
  subject: string;
  client_id: number;
  contract_type_id?: number | null;
  amount: number | string;
  start_date: string;
  end_date: string;
  description?: string;
};

type ApiClient = { id: number; name: string };
type ApiContractType = { id: number; name: string };

export default function ContractsPage() {
  const [records, setRecords] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateWindow] = useState(() => ({
    today: new Date().toISOString().slice(0, 10),
    soon: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
  }));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewingContract, setViewingContract] = useState<ContractRecord | null>(null);
  const [deletingContract, setDeletingContract] = useState<ContractRecord | null>(null);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const [contractResponse, clientResponse, typeResponse] = await Promise.all([
          api.get("/contract"),
          api.get("/client?per_page=100"),
          api.get("/contract-type"),
        ]);
        const clients = (clientResponse.data.data || []) as ApiClient[];
        const clientNames = new Map(clients.map((client) => [Number(client.id), client.name]));
        const types = (typeResponse.data.data || []) as ApiContractType[];
        const typeNames = new Map(types.map((type) => [Number(type.id), type.name]));
        const contracts = (contractResponse.data.data || []) as ApiContract[];
        setRecords(contracts.map((contract) => ({
          id: contract.id,
          subject: contract.subject,
          client: clientNames.get(Number(contract.client_id)) || `Client #${contract.client_id}`,
          amount: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(contract.amount || 0)),
          startDate: contract.start_date,
          endDate: contract.end_date,
          type: contract.contract_type_id ? (typeNames.get(Number(contract.contract_type_id)) || "Unspecified") : "Unspecified",
          description: contract.description,
        })));
      } catch (err) {
        console.error("Fetch Contracts Error:", err);
        setError("Failed to load contracts from the database.");
      } finally {
        setLoading(false);
      }
    };
    loadContracts();
  }, []);

  const filteredContracts = records.filter((contract) => {
    const startMatch = !dateFrom || contract.startDate >= dateFrom;
    const endMatch = !dateTo || contract.endDate <= dateTo;
    const clientMatch = clientFilter === "all" || contract.client === clientFilter;
    const typeMatch = typeFilter === "all" || contract.type === typeFilter;
    return startMatch && endMatch && clientMatch && typeMatch;
  });
  const clientOptions = Array.from(new Set(records.map((contract) => contract.client)));
  const typeOptions = Array.from(new Set(records.map((contract) => contract.type)));
  const expiringSoon = records.filter((contract) => contract.endDate >= dateWindow.today && contract.endDate <= dateWindow.soon).length;
  const expired = records.filter((contract) => contract.endDate < dateWindow.today).length;

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setClientFilter("all");
    setTypeFilter("all");
  };

  const deleteContract = async () => {
    if (!deletingContract) return;
    try {
      await api.delete(`/contract/${deletingContract.id}`);
      setRecords((current) => current.filter((contract) => contract.id !== deletingContract.id));
      setDeletingContract(null);
    } catch (err) {
      console.error("Delete Contract Error:", err);
      setError("Failed to delete contract.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700">Contracts</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/contracts/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Create Contract</span><Plus className="h-3.5 w-3.5" />
            </Link>
            <ol className="flex text-sm text-gray-500 space-x-1">
              <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
              <li>/</li>
              <li className="text-gray-700">Contracts</li>
            </ol>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-gray-200 text-center gap-y-4 sm:gap-y-0">
            <div>
              <h4 className="text-xl font-bold text-gray-800">{records.length}</h4>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">Total Contracts</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-yellow-500">{expiringSoon}</h4>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">About To Expire</p>
            </div>
            <div>
              <h4 className="text-xl font-bold text-red-500">{expired}</h4>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">Expired</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start From</label>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Before</label>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
              <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {clientOptions.map((client) => <option key={client} value={client}>{client}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contract Type</label>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button onClick={resetFilters} className="flex-1 flex items-center justify-center space-x-1 rounded bg-gray-600 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700">
                <RefreshCw className="h-3.5 w-3.5" /><span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error && <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{error}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Start Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">End Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Loading contracts...
                    </td>
                  </tr>
                )}
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{contract.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        <button onClick={() => setViewingContract(contract)} className="text-left text-xs font-medium text-primary hover:underline">{contract.subject}</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-800">{contract.client}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-700">{contract.amount}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{contract.startDate}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{contract.endDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button onClick={() => setViewingContract(contract)} className="text-gray-400 hover:text-primary" title="View"><Eye className="h-4 w-4" /></button>
                        <Link href={`/contracts/create?edit=${contract.id}`} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit className="h-4 w-4" /></Link>
                        <button onClick={() => setDeletingContract(contract)} className="text-red-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No contracts found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal isOpen={Boolean(viewingContract)} onClose={() => setViewingContract(null)} title="Contract Details" size="lg">
        {viewingContract && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(viewingContract).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{key}</p>
                <p className="mt-1 text-sm font-bold text-gray-800">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(deletingContract)} onClose={() => setDeletingContract(null)} title="Delete Contract" size="sm">
        <div className="py-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-6 text-xs font-bold text-gray-500">This will permanently remove the selected contract from the database.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingContract(null)} className="flex-1 bg-gray-100 text-gray-500">Cancel</Button>
            <Button onClick={deleteContract} className="flex-1 bg-red-500 text-white">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
