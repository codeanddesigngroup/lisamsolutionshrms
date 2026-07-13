"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, FileText, Trash2, Eye, Send, Calendar, DollarSign, Briefcase, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type ProposalRecord = {
  id: number | string;
  proposal_number?: string;
  lead?: { client_name?: string; company_name?: string };
  client?: { name?: string; client_detail?: { company_name?: string } };
  total?: number;
  valid_till?: string;
  status?: string;
};

export default function ProposalsPage() {
  const { showToast } = useToast();
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const response = await api.get("/proposal?include=lead,client");
      setProposals(response.data.data || []);
    } catch (err) {
      console.error("Fetch Proposals Error:", err);
      showToast("Failed to load proposals", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProposals = useMemo(
    () => proposals.filter((proposal) => statusFilter === "all" || proposal.status === statusFilter),
    [proposals, statusFilter],
  );

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/proposal/${deletingId}`);
      setProposals((prev) => prev.filter((proposal) => proposal.id !== deletingId));
      setDeletingId(null);
      showToast("Proposal deleted successfully", "success");
    } catch (err) {
      console.error("Delete Proposal Error:", err);
      showToast("Failed to delete proposal", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><FileText className="h-5 w-5 mr-2 inline-block text-primary" /> Proposals</h4>
          </div>
          <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
            <button onClick={fetchProposals} className="btn-default btn-outline btn-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            <Link href="/proposals/create"><Button className="btn-success btn-outline btn-sm">Create Proposal <Plus className="h-4 w-4 ml-1 inline-block" /></Button></Link>
          </div>
        </div>

        <div className="white-box">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="form-control">
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="waiting">Waiting</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={() => setStatusFilter("all")} className="btn-inverse btn-sm"><RefreshCw className="h-4 w-4 mr-1" /> Reset</Button>
            </div>
          </div>
        </div>

        <div className="white-box p-0 relative">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Lead / Client</th>
                  <th><DollarSign className="h-4 w-4 inline-block mr-1" /> Total</th>
                  <th><Calendar className="h-4 w-4 inline-block mr-1" /> Valid Till</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((proposal) => {
                  const name = proposal.lead?.company_name || proposal.lead?.client_name || proposal.client?.client_detail?.company_name || proposal.client?.name || "N/A";
                  return (
                    <tr key={proposal.id}>
                      <td>{proposal.proposal_number || proposal.id}</td>
                      <td className="font-bold text-primary hover:underline cursor-pointer">
                        <Link href={`/proposals/${proposal.id}`} className="flex items-center"><Briefcase className="h-3 w-3 mr-2 opacity-50" />{name}</Link>
                      </td>
                      <td>${Number(proposal.total || 0).toLocaleString()}</td>
                      <td>{proposal.valid_till || "N/A"}</td>
                      <td><span className={`label ${proposal.status === "accepted" ? "label-success" : proposal.status === "waiting" ? "label-warning" : "label-danger"}`}>{proposal.status || "open"}</span></td>
                      <td className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Link href={`/proposals/${proposal.id}`} className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all"><Eye className="h-4 w-4" /></Link>
                          <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Send className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingId(proposal.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredProposals.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-xs text-gray-500">No proposals found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Proposal" size="sm">
        <div className="text-center py-4">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">This will permanently delete the proposal.</p>
          <div className="flex space-x-3">
            <Button onClick={() => setDeletingId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
