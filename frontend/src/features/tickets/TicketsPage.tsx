"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Inbox,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Ticket as TicketIcon,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

type TicketStatus = "Open" | "In Progress" | "Closed";
type TicketApprovalStatus = "Pending Review" | "Approved" | "Declined";
type TicketReply = {
  id: number;
  author: string;
  role: "Admin" | "Employee";
  message: string;
  createdAt: string;
};
type TicketRecord = {
  id: string;
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  mine?: boolean;
  status: TicketStatus;
  approvalStatus: TicketApprovalStatus;
  reviewedBy?: string;
  reviewNote?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
};

const AGENTS = ["Unassigned", "Adeel Khan", "Sarah Ahmed", "Usman Tariq", "Hira Malik"];

const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: "TKT-1048",
    title: "Unable to download June payslip",
    description: "The download button on my June payslip does not respond. I have tried again after refreshing the page, but the file still does not open.",
    requester: "Current Employee",
    requesterEmail: "employee@lisamsolutions.com",
    mine: true,
    status: "Open",
    approvalStatus: "Pending Review",
    assignedTo: "Unassigned",
    createdAt: "Jul 29, 2026 · 10:24 AM",
    updatedAt: "2 hours ago",
    replies: [],
  },
  {
    id: "TKT-1047",
    title: "Attendance check-in time needs correction",
    description: "My check-in for July 28 shows 10:18 AM, although I entered the office and used the attendance device at 9:02 AM.",
    requester: "Current Employee",
    requesterEmail: "employee@lisamsolutions.com",
    mine: true,
    status: "In Progress",
    approvalStatus: "Approved",
    reviewedBy: "Adeel Khan",
    assignedTo: "Sarah Ahmed",
    createdAt: "Jul 28, 2026 · 4:40 PM",
    updatedAt: "Yesterday",
    replies: [
      { id: 1, author: "Sarah Ahmed", role: "Admin", message: "Thanks for reporting this. I am checking the attendance device logs and will update the record shortly.", createdAt: "Jul 29, 2026 · 9:15 AM" },
    ],
  },
  {
    id: "TKT-1046",
    title: "Leave balance is not updated",
    description: "My annual leave balance still includes the two approved leave days from last week.",
    requester: "Bilal Hussain",
    requesterEmail: "bilal@lisamsolutions.com",
    status: "In Progress",
    approvalStatus: "Approved",
    reviewedBy: "Adeel Khan",
    assignedTo: "Adeel Khan",
    createdAt: "Jul 27, 2026 · 2:12 PM",
    updatedAt: "Jul 29",
    replies: [
      { id: 1, author: "Adeel Khan", role: "Admin", message: "The leave record is approved. We are reviewing the balance synchronization now.", createdAt: "Jul 28, 2026 · 11:05 AM" },
      { id: 2, author: "Bilal Hussain", role: "Employee", message: "Thank you. Please let me know when the balance is corrected.", createdAt: "Jul 28, 2026 · 11:34 AM" },
    ],
  },
  {
    id: "TKT-1045",
    title: "Update emergency contact details",
    description: "Please update the emergency contact number in my employee profile. The new number was provided to HR.",
    requester: "Nimra Ali",
    requesterEmail: "nimra@lisamsolutions.com",
    status: "Closed",
    approvalStatus: "Approved",
    reviewedBy: "Hira Malik",
    assignedTo: "Hira Malik",
    createdAt: "Jul 25, 2026 · 1:08 PM",
    updatedAt: "Jul 26",
    replies: [
      { id: 1, author: "Hira Malik", role: "Admin", message: "Your emergency contact details have been updated successfully.", createdAt: "Jul 26, 2026 · 10:02 AM" },
    ],
  },
  {
    id: "TKT-1044",
    title: "Project is missing from timesheet",
    description: "The Falcon website project does not appear in my project selection when I create a timesheet entry.",
    requester: "Hamza Rauf",
    requesterEmail: "hamza@lisamsolutions.com",
    status: "Open",
    approvalStatus: "Approved",
    reviewedBy: "Usman Tariq",
    assignedTo: "Usman Tariq",
    createdAt: "Jul 24, 2026 · 5:32 PM",
    updatedAt: "Jul 28",
    replies: [],
  },
];

const statusStyles: Record<TicketStatus, string> = {
  Open: "label-info",
  "In Progress": "label-warning",
  Closed: "label-success",
};

const approvalStyles: Record<TicketApprovalStatus, string> = {
  "Pending Review": "label-warning",
  Approved: "label-success",
  Declined: "label-danger",
};

export default function TicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "admin";
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [approvalFilter, setApprovalFilter] = useState<"All" | TicketApprovalStatus>("All");
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const roleTickets = useMemo(
    () => (isAdmin ? tickets : tickets.filter((ticket) => ticket.mine)),
    [isAdmin, tickets],
  );
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return roleTickets.filter((ticket) => {
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      const matchesApproval = approvalFilter === "All" || ticket.approvalStatus === approvalFilter;
      const matchesQuery = !normalizedQuery || [ticket.id, ticket.title, ticket.requester, ticket.assignedTo]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesApproval && matchesQuery;
    });
  }, [approvalFilter, query, roleTickets, statusFilter]);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || null;

  const counts = {
    all: roleTickets.length,
    open: roleTickets.filter((ticket) => ticket.approvalStatus === "Approved" && ticket.status === "Open").length,
    progress: roleTickets.filter((ticket) => ticket.approvalStatus === "Approved" && ticket.status === "In Progress").length,
    closed: roleTickets.filter((ticket) => ticket.approvalStatus === "Approved" && ticket.status === "Closed").length,
    pending: roleTickets.filter((ticket) => ticket.approvalStatus === "Pending Review").length,
  };

  const updateTicket = (id: string, patch: Partial<TicketRecord>) => {
    setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, ...patch, updatedAt: "Just now" } : ticket));
  };

  const submitReply = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    const newReply: TicketReply = {
      id: selectedTicket.replies.reduce((highestId, item) => Math.max(highestId, item.id), 0) + 1,
      author: user?.name || (isAdmin ? "Admin" : "Employee"),
      role: isAdmin ? "Admin" : "Employee",
      message: reply.trim(),
      createdAt: "Just now",
    };
    updateTicket(selectedTicket.id, { replies: [...selectedTicket.replies, newReply] });
    setReply("");
    showToast("Reply added to the ticket.", "success");
  };

  const reviewTicket = (decision: "Approved" | "Declined") => {
    if (!selectedTicket || !isAdmin) return;
    updateTicket(selectedTicket.id, {
      approvalStatus: decision,
      reviewedBy: user?.name || "Admin",
      reviewNote: reviewNote.trim(),
      ...(decision === "Declined" ? { assignedTo: "Unassigned" } : {}),
    });
    setReviewNote("");
    showToast(`Ticket ${decision.toLowerCase()}.`, decision === "Approved" ? "success" : "error");
  };

  const createTicket = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    const nextId = `TKT-${1049 + tickets.length - INITIAL_TICKETS.length}`;
    const ticket: TicketRecord = {
      id: nextId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      requester: user?.name || "Current Employee",
      requesterEmail: user?.email || "employee@lisamsolutions.com",
      mine: true,
      status: "Open",
      approvalStatus: "Pending Review",
      assignedTo: "Unassigned",
      createdAt: "Just now",
      updatedAt: "Just now",
      replies: [],
    };
    setTickets((current) => [ticket, ...current]);
    setNewTitle("");
    setNewDescription("");
    setShowCreate(false);
    setSelectedId(nextId);
    showToast("Ticket raised successfully.", "success");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
        <div className="white-box flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TicketIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0">Tickets</h4>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {isAdmin ? "Support / All employee requests" : "Support / My requests"}
              </p>
            </div>
          </div>
          {!isAdmin && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Raise New Ticket
            </Button>
          )}
        </div>

        {!selectedTicket ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: "Total Tickets", value: counts.all, icon: Inbox },
                { label: "Pending Review", value: counts.pending, icon: ShieldCheck },
                { label: "Open", value: counts.open, icon: MessageSquare },
                { label: "In Progress", value: counts.progress, icon: Clock3 },
                { label: "Closed", value: counts.closed, icon: CheckCircle2 },
              ].map((item) => (
                <Card key={item.label} className="mb-0 p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-secondary">{item.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="mb-0 p-0">
              <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h4 className="m-0">{isAdmin ? "All Tickets" : "My Tickets"}</h4>
                  <p className="mt-1 text-[10px] text-gray-400">Select a ticket to view its conversation and details</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-[230px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9!" placeholder="Search tickets..." />
                  </div>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="sm:w-[150px]">
                    <option>All</option>
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Closed</option>
                  </select>
                  {isAdmin && (
                    <select value={approvalFilter} onChange={(event) => setApprovalFilter(event.target.value as typeof approvalFilter)} className="sm:w-[165px]">
                      <option>All</option>
                      <option>Pending Review</option>
                      <option>Approved</option>
                      <option>Declined</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="m-0 min-w-[780px]">
                  <thead>
                    <tr>
                      <th className="pl-5">Ticket</th>
                      {isAdmin && <th>Requested By</th>}
                      <th>Approval</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Last Update</th>
                      <th className="pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => (
                      <tr key={ticket.id} onClick={() => setSelectedId(ticket.id)} className="cursor-pointer">
                        <td className="py-4 pl-5">
                          <p className="font-bold text-gray-800">{ticket.title}</p>
                          <p className="mt-1 text-[10px] font-semibold text-gray-400">{ticket.id}</p>
                        </td>
                        {isAdmin && (
                          <td>
                            <p className="font-semibold text-gray-700">{ticket.requester}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{ticket.requesterEmail}</p>
                          </td>
                        )}
                        <td><span className={`label ${approvalStyles[ticket.approvalStatus]}`}>{ticket.approvalStatus}</span></td>
                        <td><span className={`label ${statusStyles[ticket.status]}`}>{ticket.status}</span></td>
                        <td className="font-medium text-gray-600">{ticket.assignedTo}</td>
                        <td className="text-gray-500">{ticket.updatedAt}</td>
                        <td className="pr-5 text-right"><ChevronRight className="ml-auto h-4 w-4 text-gray-400" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTickets.length === 0 && (
                  <div className="py-14 text-center">
                    <Inbox className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 font-semibold text-gray-500">No tickets match your filters</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <div className="space-y-4">
            <button type="button" onClick={() => setSelectedId(null)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to tickets
            </button>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="mb-0 p-0">
                <div className="border-b border-gray-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400">{selectedTicket.id}</span>
                        <span className={`label ${approvalStyles[selectedTicket.approvalStatus]}`}>{selectedTicket.approvalStatus}</span>
                        <span className={`label ${statusStyles[selectedTicket.status]}`}>{selectedTicket.status}</span>
                      </div>
                      <h4 className="m-0 normal-case font-semibold">{selectedTicket.title}</h4>
                      <p className="mt-2 text-[10px] text-gray-400">Raised {selectedTicket.createdAt}</p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-3xl whitespace-pre-wrap text-[13px] leading-7 text-gray-600">{selectedTicket.description}</p>
                </div>

                <div className="space-y-5 bg-gray-50/60 p-5 sm:p-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Conversation ({selectedTicket.replies.length})
                  </p>
                  {selectedTicket.replies.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white py-8 text-center text-xs text-gray-400">
                      No replies yet. Add the first reply below.
                    </div>
                  )}
                  {selectedTicket.replies.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.role === "Admin" ? "bg-secondary text-white" : "bg-primary/10 text-primary"}`}>
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-lg border border-gray-100 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-gray-800">{item.author} <span className="ml-1 text-[9px] font-semibold uppercase text-gray-400">{item.role}</span></p>
                          <p className="text-[9px] text-gray-400">{item.createdAt}</p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap leading-6 text-gray-600">{item.message}</p>
                      </div>
                    </div>
                  ))}
                  {selectedTicket.status !== "Closed" && selectedTicket.approvalStatus !== "Declined" ? (
                    <form onSubmit={submitReply} className="rounded-lg border border-gray-100 bg-white p-4">
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Add reply</label>
                      <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} placeholder="Write a helpful reply..." />
                      <div className="mt-3 flex justify-end">
                        <Button type="submit" disabled={!reply.trim()}><Send className="h-4 w-4" /> Send Reply</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-4 text-xs font-semibold text-gray-500">
                      {selectedTicket.approvalStatus === "Declined" ? (
                        <><XCircle className="h-4 w-4 text-status-danger-text" /> This ticket was declined during review</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 text-status-success-text" /> This ticket is closed</>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <div className="space-y-4">
                {isAdmin && (
                  <Card className={`mb-0 border-l-3 ${
                    selectedTicket.approvalStatus === "Approved"
                      ? "border-l-status-success-text"
                      : selectedTicket.approvalStatus === "Declined"
                        ? "border-l-status-danger-text"
                        : "border-l-status-warning-text"
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Admin Review</p>
                        <p className="mt-2 font-bold text-gray-800">{selectedTicket.approvalStatus}</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-gray-400" />
                    </div>

                    {selectedTicket.approvalStatus === "Pending Review" ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-[10px] leading-5 text-gray-500">
                          Review the request before assigning it or starting support work.
                        </p>
                        <textarea
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                          rows={3}
                          maxLength={250}
                          placeholder="Optional review note..."
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => reviewTicket("Declined")}
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                          >
                            <XCircle className="h-4 w-4" /> Decline
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewTicket("Approved")}
                            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-[10px] font-bold text-white transition hover:bg-green-700"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-[10px] leading-5 text-gray-500">
                          Reviewed by {selectedTicket.reviewedBy || "Admin"}
                        </p>
                        {selectedTicket.reviewNote && <p className="mt-2 rounded-lg bg-gray-50 p-3 text-[10px] leading-5 text-gray-600">{selectedTicket.reviewNote}</p>}
                        <button
                          type="button"
                          onClick={() => updateTicket(selectedTicket.id, { approvalStatus: "Pending Review", reviewedBy: undefined, reviewNote: undefined })}
                          className="mt-3 text-[10px] font-bold text-gray-400 transition hover:text-primary"
                        >
                          Return to pending review
                        </button>
                      </div>
                    )}
                  </Card>
                )}
                <Card className="mb-0">
                  <h5 className="m-0 mb-5">Ticket Details</h5>
                  <dl className="space-y-5">
                    <div><dt className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Requested By</dt><dd className="mt-1 font-semibold text-gray-700">{selectedTicket.requester}</dd><dd className="text-[10px] text-gray-400">{selectedTicket.requesterEmail}</dd></div>
                    <div><dt className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Created</dt><dd className="mt-1 font-semibold text-gray-700">{selectedTicket.createdAt}</dd></div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Approval</dt>
                      <dd className="mt-2"><span className={`label ${approvalStyles[selectedTicket.approvalStatus]}`}>{selectedTicket.approvalStatus}</span></dd>
                      {!isAdmin && selectedTicket.reviewedBy && <dd className="mt-2 text-[10px] text-gray-400">Reviewed by {selectedTicket.reviewedBy}</dd>}
                      {!isAdmin && selectedTicket.reviewNote && <dd className="mt-2 rounded-lg bg-gray-50 p-3 text-[10px] leading-5 text-gray-600">{selectedTicket.reviewNote}</dd>}
                    </div>
                    <div>
                      <dt className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Status</dt>
                      {isAdmin ? (
                        <select disabled={selectedTicket.approvalStatus !== "Approved"} value={selectedTicket.status} onChange={(event) => {
                          updateTicket(selectedTicket.id, { status: event.target.value as TicketStatus });
                          showToast("Ticket status updated.", "success");
                        }}>
                          <option>Open</option><option>In Progress</option><option>Closed</option>
                        </select>
                      ) : <dd><span className={`label ${statusStyles[selectedTicket.status]}`}>{selectedTicket.status}</span></dd>}
                    </div>
                    <div>
                      <dt className="mb-2 text-[9px] font-bold uppercase tracking-wider text-gray-400">Assigned To</dt>
                      {isAdmin ? (
                        <select disabled={selectedTicket.approvalStatus !== "Approved"} value={selectedTicket.assignedTo} onChange={(event) => {
                          updateTicket(selectedTicket.id, { assignedTo: event.target.value });
                          showToast("Ticket assignment updated.", "success");
                        }}>
                          {AGENTS.map((agent) => <option key={agent}>{agent}</option>)}
                        </select>
                      ) : <dd className="font-semibold text-gray-700">{selectedTicket.assignedTo}</dd>}
                    </div>
                  </dl>
                </Card>
                <Card className="mb-0 border-l-3 border-l-primary">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Response note</p>
                  <p className="mt-2 leading-6 text-gray-600">
                    {isAdmin ? "Keep the employee informed when changing status or assignment." : "You will see replies and status changes here as the support team works on your request."}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-secondary/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div><h4 className="m-0">Raise New Ticket</h4><p className="mt-1 text-[10px] text-gray-400">Describe the issue clearly so the team can help quickly</p></div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={createTicket} className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Title <span className="text-red-500">*</span></label>
                <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={100} placeholder="Brief summary of your issue" autoFocus />
                <p className="mt-1 text-right text-[9px] text-gray-400">{newTitle.length}/100</p>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Description <span className="text-red-500">*</span></label>
                <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} rows={6} placeholder="Explain what happened and include any useful details..." />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="bg-gray-100! text-gray-600!">Cancel</Button>
                <Button type="submit" disabled={!newTitle.trim() || !newDescription.trim()}><TicketIcon className="h-4 w-4" /> Submit Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
