"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Reply,
  Send,
  User,
  UserCog,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import AdminFileManager, { ManagedFile } from "@/components/admin/AdminFileManager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import apiClient from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

type TicketReply = {
  id: number | string;
  sender?: string;
  type?: "agent" | "requester" | "note";
  created_at?: string;
  time?: string;
  message?: string;
  reply?: string;
  files?: ManagedFile[];
};

type TicketRecord = {
  id: number | string;
  subject: string;
  requester?: string;
  requester_email?: string;
  agent?: string;
  status?: string;
  priority?: string;
  channel?: string;
  type?: string;
  group?: string;
  created_at?: string;
  description?: string;
  replies?: TicketReply[];
  files?: ManagedFile[];
  history?: Array<{
    id: number | string;
    date?: string;
    action?: string;
    details?: string;
    user?: string;
  }>;
};

const fallbackTicket: TicketRecord = {
  id: "preview",
  subject: "Cannot access the dashboard after recent update",
  requester: "Jane Smith",
  requester_email: "jane@example.com",
  agent: "Admin User",
  status: "Open",
  priority: "High",
  channel: "Email",
  type: "Incident",
  group: "Technical Support",
  created_at: "2026-05-04 10:30 AM",
  description:
    "Since the update, the admin dashboard returns an error. Employee login works fine. Please help because payroll needs to be processed today.",
  replies: [
    {
      id: 1,
      sender: "Admin User",
      type: "agent",
      created_at: "2026-05-04 11:15 AM",
      message: "We are checking the dashboard error and will update you shortly.",
    },
    {
      id: 2,
      sender: "Jane Smith",
      type: "requester",
      created_at: "2026-05-04 11:45 AM",
      message: "Thank you. I am standing by.",
    },
  ],
  files: [{ id: "ticket-file-1", filename: "error-screenshot.png", size: "340 KB", created_at: "2026-05-04T10:35:00.000Z" }],
  history: [
    { id: "history-1", date: "2026-05-04 10:30 AM", action: "Ticket created", details: "Requester submitted the ticket.", user: "Jane Smith" },
    { id: "history-2", date: "2026-05-04 11:00 AM", action: "Agent assigned", details: "Ticket assigned to Admin User.", user: "System" },
  ],
};

const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  pending: "bg-blue-100 text-blue-600",
  resolved: "bg-green-100 text-green-600",
  closed: "bg-green-100 text-green-600",
};

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-600",
  high: "bg-orange-100 text-orange-600",
  medium: "bg-blue-100 text-blue-600",
  low: "bg-gray-100 text-gray-500",
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState<TicketRecord>({ ...fallbackTicket, id: String(params.id || "preview") });
  const [replyDraft, setReplyDraft] = useState("");
  const [internalNoteDraft, setInternalNoteDraft] = useState("");
  const [activeTab, setActiveTab] = useState("conversation");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await api.get(`/ticket/${params.id}`);
        setTicket({ ...fallbackTicket, ...(response.data.data as TicketRecord) });
      } catch (err: unknown) {
        console.error("Fetch ticket error:", err);
        showToast(getApiErrorMessage(err, "Ticket API unavailable. Preview data loaded."), "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [params.id, showToast]);

  const replies = useMemo(() => ticket.replies || [], [ticket.replies]);
  const statusKey = String(ticket.status || "open").toLowerCase();
  const priorityKey = String(ticket.priority || "medium").toLowerCase();

  const addReply = (type: TicketReply["type"]) => {
    const message = type === "note" ? internalNoteDraft.trim() : replyDraft.trim();
    if (!message) return;

    const nextReply: TicketReply = {
      id: `local-${Date.now()}`,
      sender: type === "note" ? "Internal note" : ticket.agent || "Admin User",
      type,
      created_at: new Date().toLocaleString(),
      message,
    };

    setTicket((current) => ({
      ...current,
      replies: [...(current.replies || []), nextReply],
    }));
    setReplyDraft("");
    setInternalNoteDraft("");

    apiClient
      .action("tickets", ticket.id, type === "note" ? "internal-notes" : "replies", { message })
      .catch((err) => {
        console.warn("Ticket reply endpoint pending:", err);
      });
  };

  const updateStatus = (status: string) => {
    setTicket((current) => ({ ...current, status }));
    apiClient
      .action("tickets", ticket.id, status.toLowerCase(), {})
      .then(() => showToast(`Ticket marked as ${status}.`, "success"))
      .catch((err) => {
        console.warn("Ticket status endpoint pending:", err);
        showToast(`Ticket marked as ${status}. PHP endpoint pending.`, "success");
      });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading ticket...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-black uppercase tracking-widest text-gray-800">#{ticket.id} - {ticket.subject}</h1>
              <span className={`${statusColors[statusKey] || "bg-gray-100 text-gray-500"} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest`}>
                {ticket.status || "Open"}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <Link href="/tickets" className="font-bold transition-colors hover:text-primary">Tickets</Link>
              <span>/</span>
              <span>Ticket #{ticket.id}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => router.push("/tickets")} className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600 hover:bg-gray-200">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => updateStatus("Closed")} className="h-9 bg-green-500 text-xs text-white shadow-sm shadow-green-500/20 hover:bg-green-600">
              <CheckCircle className="mr-1.5 h-4 w-4" /> Close Ticket
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-1.5 shadow-sm scrollbar-hide">
          {[
            { id: "conversation", label: "Conversation", icon: MessageCircle },
            { id: "files", label: "Files", icon: Paperclip },
            { id: "history", label: "History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 whitespace-nowrap rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {activeTab === "conversation" && (
              <>
                <Card className="overflow-hidden border-gray-100 bg-white p-0 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold uppercase text-blue-600">
                        {(ticket.requester || "R").charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{ticket.requester || "Requester"}</p>
                        <p className="flex items-center text-[10px] text-gray-500"><Clock className="mr-1 h-3 w-3" /> {ticket.created_at || "N/A"}</p>
                      </div>
                    </div>
                    <span className="rounded border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-blue-500">Original Request</span>
                  </div>
                  <div className="p-6">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{ticket.description || "No description provided."}</p>
                  </div>
                </Card>

                {replies.map((reply) => {
                  const isAgent = reply.type === "agent";
                  const isNote = reply.type === "note";
                  return (
                    <div key={reply.id} className={`flex ${isAgent || isNote ? "justify-end" : "justify-start"}`}>
                      <Card className={`w-[90%] overflow-hidden border-gray-100 p-0 shadow-sm ${isNote ? "bg-yellow-50" : isAgent ? "bg-primary/5" : "bg-white"}`}>
                        <div className={`flex items-center justify-between border-b p-3 ${isNote ? "border-yellow-100 bg-yellow-100/50" : isAgent ? "border-primary/10 bg-primary/10" : "border-gray-100 bg-gray-50/80"}`}>
                          <div className="flex items-center space-x-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase ${isAgent ? "bg-primary text-white" : isNote ? "bg-yellow-500 text-white" : "bg-blue-100 text-blue-600"}`}>
                              {(reply.sender || "U").charAt(0)}
                            </div>
                            <p className="text-xs font-bold text-gray-800">{reply.sender || "User"}</p>
                          </div>
                          <p className="text-[10px] text-gray-500">{reply.created_at || reply.time || "Just now"}</p>
                        </div>
                        <div className="p-5">
                          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{reply.message || reply.reply}</p>
                        </div>
                      </Card>
                    </div>
                  );
                })}

                <Card className="mt-8 border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 border-b border-gray-50 pb-2 text-xs font-black uppercase tracking-widest text-gray-400">Post a Reply</h3>
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    className="mb-4 h-36 w-full rounded-lg border border-gray-200 p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                    placeholder="Type your reply here..."
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button className="h-9 border border-gray-200 bg-gray-50 text-xs text-gray-600 hover:bg-gray-100">
                      <Paperclip className="mr-1.5 h-4 w-4" /> Attach File
                    </Button>
                    <Button onClick={() => addReply("agent")} className="h-10 bg-primary px-8 text-xs font-bold uppercase tracking-widest text-white shadow-sm shadow-primary/20 hover:bg-primary/90">
                      <Reply className="mr-2 h-4 w-4" /> Send Reply
                    </Button>
                  </div>
                </Card>

                <Card className="border-yellow-100 bg-yellow-50 p-6 shadow-sm">
                  <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-yellow-700">Internal Note</h3>
                  <textarea
                    value={internalNoteDraft}
                    onChange={(event) => setInternalNoteDraft(event.target.value)}
                    className="mb-4 h-24 w-full rounded-lg border border-yellow-100 bg-white p-4 text-sm outline-none transition-all focus:ring-2 focus:ring-yellow-300/40"
                    placeholder="Private note for support agents..."
                  />
                  <Button onClick={() => addReply("note")} className="h-10 bg-yellow-500 px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-yellow-600">
                    <Send className="mr-2 h-4 w-4" /> Save Note
                  </Button>
                </Card>
              </>
            )}

            {activeTab === "files" && (
              <AdminFileManager
                title="Ticket Attachments"
                description="Upload, preview, download, and remove ticket attachments."
                files={ticket.files || []}
                emptyText="No ticket files uploaded yet."
              />
            )}

            {activeTab === "history" && (
              <AdminDataTable
                title="Ticket History"
                records={ticket.history || []}
                getRecordKey={(record, index) => String(record.id || index)}
                columns={[
                  { header: "Date", accessor: (record) => record.date || "N/A" },
                  { header: "Action", accessor: (record) => record.action || "Updated" },
                  { header: "Details", accessor: (record) => record.details || "N/A" },
                  { header: "User", accessor: (record) => record.user || "System" },
                ]}
              />
            )}
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-gray-100 bg-white p-0 shadow-sm">
              <div className="border-b border-gray-50 bg-gray-50/50 p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Ticket Properties</h3>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Status</span>
                  <span className={`${statusColors[statusKey] || "bg-gray-100 text-gray-500"} flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                    <AlertCircle className="mr-1 h-3 w-3" /> {ticket.status || "Open"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Priority</span>
                  <span className={`${priorityColors[priorityKey] || "bg-gray-100 text-gray-500"} rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                    {ticket.priority || "Medium"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <span className="text-xs font-bold text-gray-800">{ticket.type || "Question"}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Channel</span>
                  <span className="text-xs font-bold text-gray-800">{ticket.channel || "Email"}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Group</span>
                  <span className="text-xs font-bold text-gray-800">{ticket.group || "Support"}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-xs font-medium text-gray-500">Agent</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="cursor-pointer text-xs font-bold text-primary hover:underline">{ticket.agent || "Unassigned"}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 border-b border-gray-50 pb-2 text-xs font-black uppercase tracking-widest text-gray-400">Requester Details</h3>
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-50 text-xl font-black text-blue-500">
                  {(ticket.requester || "R").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{ticket.requester || "Requester"}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-gray-500">{ticket.requester_email || "No email"}</p>
                </div>
              </div>
              <Button className="h-9 w-full border border-gray-200 bg-gray-50 text-xs text-gray-600 hover:bg-gray-100">
                <UserCog className="mr-2 h-4 w-4" /> Manage Requester
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
