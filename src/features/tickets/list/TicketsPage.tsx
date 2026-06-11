"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { 
  Plus, 
  RefreshCw, 
  Ticket, 
  Calendar,
  MessageSquare,
  Check,
  Trash2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getStoredRole } from "@/lib/session";

type TicketPerson = string | { id?: number | string; name?: string };

type TicketRecord = {
  id: number | string;
  subject: string;
  requester?: TicketPerson;
  priority: "urgent" | "high" | "medium" | "low" | string;
  status: "open" | "pending" | "resolved" | "closed" | string;
  agent?: TicketPerson;
  date?: string;
  created_at?: string;
};

const getPersonName = (person: TicketPerson | undefined, fallback = "N/A") => {
  if (!person) return fallback;
  if (typeof person === "string") return person;
  return person.name || fallback;
};

const getTicketDate = (ticket: TicketRecord) => ticket.date || ticket.created_at?.slice(0, 10) || "N/A";

export default function TicketsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deletingTicketId, setDeletingTicketId] = useState<number | string | null>(null);
  const [userRole] = useState(() => getStoredRole());
  const canDeleteTickets = userRole === "admin";

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get("/ticket");
      setTickets(response.data.data || []);
    } catch (err) {
      console.error("Fetch Tickets Error:", err);
      showToast("Failed to fetch tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const ticketDate = getTicketDate(ticket);
    const startMatch = !dateFrom || (ticketDate !== "N/A" && ticketDate >= dateFrom);
    const endMatch = !dateTo || (ticketDate !== "N/A" && ticketDate <= dateTo);
    const statusMatch = statusFilter === "all" || ticket.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || ticket.priority === priorityFilter;
    return startMatch && endMatch && statusMatch && priorityMatch;
  });

  const handleDelete = async () => {
    if (!deletingTicketId) return;

    try {
      await api.delete(`/ticket/${deletingTicketId}`);
      setTickets((prev) => prev.filter((ticket) => ticket.id !== deletingTicketId));
      setDeletingTicketId(null);
      showToast("Ticket deleted successfully", "success");
    } catch (err) {
      console.error("Delete Ticket Error:", err);
      showToast("Failed to delete ticket", "error");
    }
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <Ticket className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Support Tickets
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
                <Link href="/tickets/create">
                    <Button className="btn-success btn-outline btn-sm">
                        Add Ticket <Plus className="h-4 w-4 ml-1 inline-block" />
                    </Button>
                </Link>
                <ol className="breadcrumb hidden-xs">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li className="active">Support Tickets</li>
                </ol>
            </div>
        </div>

        {/* Filter Section (Legacy Pattern) */}
        <div className="white-box">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From Date</label>
                    <div className="relative">
                        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="form-control pl-8" />
                        <Calendar className="h-3 w-3 absolute left-3 top-2.5 text-gray-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To Date</label>
                    <div className="relative">
                        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="form-control pl-8" />
                        <Calendar className="h-3 w-3 absolute left-3 top-2.5 text-gray-400" />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="form-control">
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Priority</label>
                    <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="form-control">
                        <option value="all">All</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={fetchTickets} className="btn-success btn-sm flex-1"><Check className="h-4 w-4 mr-1" /> Apply</Button>
                    <Button onClick={resetFilters} className="btn-inverse btn-sm flex-1"><RefreshCw className="h-4 w-4 mr-1" /> Reset</Button>
                </div>
            </div>
        </div>

        {/* Tickets Table */}
        <div className="white-box p-0">
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th className="w-16 text-center">ID</th>
                            <th>Subject</th>
                            <th>Requester</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Agent</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map((ticket) => {
                            const requesterName = getPersonName(ticket.requester);
                            return (
                            <tr key={ticket.id}>
                                <td className="text-center font-bold text-primary">#{ticket.id}</td>
                                <td>
                                    <div className="font-bold text-[13px]">{ticket.subject}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">Created: {getTicketDate(ticket)}</div>
                                </td>
                                <td>
                                    <div className="flex items-center">
                                        <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 text-[10px] font-bold text-gray-500 border border-gray-200">
                                            {requesterName.charAt(0)}
                                        </div>
                                        <span className="font-medium">{requesterName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        ticket.priority === 'urgent' ? 'bg-red-500 text-white' :
                                        ticket.priority === 'high' ? 'bg-orange-400 text-white' : 'bg-blue-400 text-white'
                                    }`}>
                                        {ticket.priority}
                                    </span>
                                </td>
                                <td>
                                    <span className={`label ${
                                        ticket.status === 'open' ? 'label-success' :
                                        ticket.status === 'pending' ? 'label-warning' : 'label-inverse'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </td>
                                <td>{getPersonName(ticket.agent)}</td>
                                <td className="text-right">
                                    <div className="flex justify-end space-x-1">
                                        <Link href={`/tickets/${ticket.id}`} className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all">
                                            <MessageSquare className="h-4 w-4" />
                                        </Link>
                                        {canDeleteTickets && (
                                            <button onClick={() => setDeletingTicketId(ticket.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {!loading && filteredTickets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    No tickets found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {loading && (
                <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Loading tickets...
                </div>
            )}
        </div>

      </div>

      <Modal
        isOpen={!!deletingTicketId}
        onClose={() => setDeletingTicketId(null)}
        title="Delete Ticket"
        size="sm"
      >
        <div className="px-4 py-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-8 text-xs font-bold leading-relaxed text-gray-500">
            This removes the ticket from the shared frontend API store.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingTicketId(null)} className="btn-default flex-1">Cancel</Button>
            <Button onClick={handleDelete} className="btn-danger flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
