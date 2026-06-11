"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Target,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import AdminFileManager, { ManagedFile } from "@/components/admin/AdminFileManager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { Lead } from "@/types";
import { useToast } from "@/context/ToastContext";

type LooseRecord = {
  id?: number | string;
  proposal_number?: string;
  valid_till?: string;
  due_date?: string;
  total?: number | string;
  amount?: number | string;
  status?: string;
  filename?: string;
  file_url?: string;
  url?: string;
  external_link?: string | null;
  size?: number | string;
  created_at?: string;
  uploaded_by?: string;
  next_follow_up_date?: string;
  remark?: string;
  user?: { name?: string };
  purpose?: string;
  name?: string;
  date?: string;
  ip_address?: string;
  ip?: string;
  staff?: string;
  action?: string;
  type?: string;
  details?: string;
  description?: string;
  message?: string;
  created_by?: string;
  files?: ManagedFile[];
  [key: string]: unknown;
};

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "proposals", label: "Proposals", icon: FileText },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "followups", label: "Follow-Ups", icon: Calendar },
  { id: "gdpr", label: "GDPR", icon: ShieldCheck },
  { id: "activity", label: "Activity", icon: Activity },
];

const starterProposals = [
  {
    id: "starter-proposal-1",
    proposal_number: "PROP-0001",
    valid_till: "2026-06-01",
    total: 5000,
    status: "sent",
  },
];

const starterFiles = [
  {
    id: "starter-lead-file-1",
    filename: "requirements-summary.pdf",
    size: "240 KB",
    created_at: "2026-05-01T09:00:00.000Z",
    uploaded_by: "Sales",
  },
];

const starterFollowups = [
  {
    id: "starter-followup-1",
    created_at: "2026-05-01T09:00:00.000Z",
    next_follow_up_date: "2026-05-09T10:30",
    remark: "Send proposal revisions and confirm budget owner.",
    user: { name: "Sales Manager" },
  },
];

const starterConsents = [
  {
    id: "starter-consent-1",
    purpose: "Lead communication",
    status: "agree",
    date: "2026-05-01",
    ip_address: "127.0.0.1",
    staff: "Sales Manager",
    additional_description: "Lead agreed to receive follow-up communication.",
  },
];

const starterActivities = [
  {
    id: "starter-activity-1",
    created_at: "2026-05-01T09:00:00.000Z",
    action: "Lead created",
    details: "Lead imported from sales form.",
    user: { name: "Sales Manager" },
  },
  {
    id: "starter-activity-2",
    created_at: "2026-05-02T11:15:00.000Z",
    action: "Follow-up scheduled",
    details: "Next call scheduled with the client contact.",
    user: { name: "Sales Manager" },
  },
];

const getCollection = (value: unknown, fallback: LooseRecord[]): LooseRecord[] => {
  return Array.isArray(value) && value.length > 0 ? (value as LooseRecord[]) : fallback;
};

const getLabel = (value: unknown, fallback = "N/A") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "type" in value) return String((value as { type?: string }).type || fallback);
  return fallback;
};

const getStatusBadge = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  if (["converted", "accepted", "approved", "agree", "won"].includes(normalized)) return "bg-green-100 text-green-600";
  if (["lost", "rejected", "disagree", "expired"].includes(normalized)) return "bg-red-100 text-red-500";
  if (["in process", "sent", "pending"].includes(normalized)) return "bg-blue-100 text-blue-600";
  return "bg-gray-100 text-gray-600";
};

const toCurrency = (value?: number | string) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const createStarterLead = (id: string | string[] | undefined): Lead => ({
  id: Array.isArray(id) ? id[0] : id || "preview",
  client_name: "Lead Contact",
  company_name: "Prospect Company",
  client_email: "lead@example.com",
  mobile: "+1 555 987 654",
  website: "https://example.com",
  source: { type: "Website" },
  status: { type: "In Process" },
  value: 5000,
  description: "Lead details will be replaced by the API response when the backend is available.",
  address: "123 Business Way, Metro City",
});

const getRecordKey = (record: LooseRecord, fallback: string) => String(record.id || record.proposal_number || record.name || record.created_at || fallback);

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [lead, setLead] = useState<Lead | null>(null);
  const [followups, setFollowups] = useState<LooseRecord[]>([]);
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [followUpRemark, setFollowUpRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await api.get(`/lead/${params.id}`);
        const fetchedLead = response.data.data as Lead;
        setLead(fetchedLead);
        setFollowups(getCollection((fetchedLead as LooseRecord).followups || (fetchedLead as LooseRecord).follow, starterFollowups));
        setError(null);
      } catch (err: unknown) {
        console.error("Fetch Lead Error:", err);
        const previewLead = createStarterLead(params.id);
        setLead(previewLead);
        setFollowups(starterFollowups);
        setError(getApiErrorMessage(err, "Backend lead details are unavailable. Showing frontend-ready preview data."));
        showToast("Lead API unavailable. Preview data loaded.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [params.id, showToast]);

  const collections = useMemo(() => {
    const source = (lead || {}) as LooseRecord;
    return {
      proposals: getCollection(source.proposals, starterProposals),
      files: getCollection(source.files, starterFiles),
      consents: getCollection(source.gdpr_consents || source.consents, starterConsents),
      activities: getCollection(source.activities || source.history, starterActivities),
    };
  }, [lead]);

  const updateLead = async (patch: Record<string, unknown>, successMessage: string) => {
    if (!lead) return;
    try {
      const response = await api.put(`/lead/${lead.id}`, { ...lead, ...patch });
      setLead(response.data.data as Lead);
      showToast(successMessage, "success");
    } catch (err) {
      console.error("Update Lead Detail Error:", err);
      showToast("Lead change saved locally but backend persistence failed.", "error");
    }
  };

  const addFollowUp = () => {
    if (!nextFollowUpDate && !followUpRemark.trim()) return;
    const nextFollowUp = {
      id: `local-followup-${Date.now()}`,
      created_at: new Date().toISOString(),
      next_follow_up_date: nextFollowUpDate,
      remark: followUpRemark.trim() || "No remark added.",
      user: { name: "Current user" },
    };
    const nextFollowups = [nextFollowUp, ...followups];
    setFollowups(nextFollowups);
    setNextFollowUpDate("");
    setFollowUpRemark("");
    void updateLead({ followups: nextFollowups }, "Follow-up added");
  };

  const removeFollowUp = (followUpId: number | string) => {
    const nextFollowups = followups.filter((followUp) => (followUp.id || followUp.created_at || followUp.remark) !== followUpId);
    setFollowups(nextFollowups);
    void updateLead({ followups: nextFollowups }, "Follow-up removed");
  };

  const handleLeadAction = (action: string) => {
    if (action.toLowerCase().includes("convert")) {
      void updateLead({ status: "Converted" }, "Lead marked as converted");
      return;
    }
    if (action.toLowerCase().includes("accept")) {
      void updateLead({ status: "In Process" }, "Lead accepted");
      return;
    }
    showToast(`${action} is ready for backend integration.`, "success");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading lead details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 opacity-20" />
          <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-gray-800">Lead details unavailable</h2>
          <p className="mb-6 max-w-md text-sm text-gray-500">Lead not found.</p>
          <Button onClick={() => router.push("/leads")} className="h-10 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
            Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const leadName = lead.client_name || lead.name || "Lead Contact";
  const companyName = lead.company_name || lead.company || "N/A";
  const leadEmail = lead.client_email || lead.email || "N/A";
  const leadPhone = lead.mobile || lead.phone || "N/A";
  const sourceLabel = getLabel(lead.source, "Organic");
  const statusLabel = getLabel(lead.status, "New Lead");
  const leadValue = toCurrency(lead.value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-50 bg-white px-6 py-8 shadow-sm">
          <div className="flex items-center space-x-6">
            <Link href="/leads" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/5 bg-primary/10 text-primary shadow-sm transition-colors hover:bg-primary/20">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-gray-800">{leadName}</h1>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                Company: <span className="text-primary">{companyName}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <Mail className="mr-2 h-3.5 w-3.5 text-primary/40" /> {leadEmail}
                </span>
                <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <Phone className="mr-2 h-3.5 w-3.5 text-primary/40" /> {leadPhone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`${getStatusBadge(statusLabel)} rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest`}>{statusLabel}</span>
            <Link href={`/leads/${lead.id}/edit`}>
              <Button className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 transition-colors hover:text-primary">
                <Edit className="h-5 w-5" />
              </Button>
            </Link>
            <Button onClick={() => handleLeadAction("Convert lead to client")} className="h-12 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              Convert to Client
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-xs font-bold leading-relaxed text-orange-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Value</p>
              <DollarSign className="h-4 w-4 text-green-500/30" />
            </div>
            <p className="text-2xl font-black text-gray-800">{leadValue}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Potential deal amount</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source</p>
              <Target className="h-4 w-4 text-primary/30" />
            </div>
            <p className="text-2xl font-black text-gray-800">{sourceLabel}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Acquisition channel</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Follow-Ups</p>
              <Calendar className="h-4 w-4 text-blue-500/30" />
            </div>
            <p className="text-2xl font-black text-gray-800">{followups.length}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Scheduled touchpoints</p>
          </Card>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-1.5 shadow-sm scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 whitespace-nowrap rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {activeTab === "profile" && (
              <Card title="Lead Details" className="border-none bg-white p-8 shadow-sm">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Email Address</p>
                      <p className="text-sm font-bold text-gray-700">{leadEmail}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Phone Number</p>
                      <p className="text-sm font-bold text-gray-700">{leadPhone}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Website</p>
                      <p className="text-sm font-bold text-primary">{lead.website || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Source</p>
                      <p className="text-sm font-bold text-gray-700">{sourceLabel}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Lead Value</p>
                      <p className="text-sm font-black text-green-600">{leadValue}</p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Status</p>
                      <span className={`${getStatusBadge(statusLabel)} rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest`}>{statusLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 border-t border-gray-50 pt-8">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-300">Requirements</p>
                  <p className="text-sm font-bold leading-relaxed text-gray-600">{lead.description || lead.message || "No requirements captured yet."}</p>
                </div>
                <div className="mt-8 border-t border-gray-50 pt-8">
                  <p className="mb-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                    <MapPin className="mr-2 h-3 w-3" /> Address
                  </p>
                  <p className="text-sm font-bold leading-relaxed text-gray-600">{lead.address || "No address provided."}</p>
                </div>
              </Card>
            )}

            {activeTab === "proposals" && (
              <AdminDataTable
                title="Lead Proposals"
                records={collections.proposals}
                getRecordKey={(record, index) => getRecordKey(record, `proposal-${index}`)}
                columns={[
                  {
                    header: "Proposal",
                    accessor: (record) => (
                      <Link href={`/proposals/${record.id}`} className="font-black text-gray-800 transition-colors hover:text-primary">
                        {record.proposal_number || `PROP-${record.id}`}
                      </Link>
                    ),
                  },
                  { header: "Valid Till", accessor: (record) => record.valid_till || record.due_date || "N/A" },
                  { header: "Total", accessor: (record) => toCurrency(record.total || record.amount) },
                  {
                    header: "Status",
                    accessor: (record) => (
                      <span className={`${getStatusBadge(record.status)} rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest`}>
                        {record.status || "Draft"}
                      </span>
                    ),
                  },
                ]}
              />
            )}

            {activeTab === "files" && (
              <AdminFileManager
                title="Lead Files"
                description="Lead file upload, thumbnail-ready listing, preview, download, and delete controls."
                files={collections.files}
                emptyText="No lead files uploaded yet."
              />
            )}

            {activeTab === "followups" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">New Follow-Up</h3>
                      <p className="mt-1 text-xs font-medium text-gray-400">Schedule the next sales touchpoint for this lead.</p>
                    </div>
                    <button onClick={addFollowUp} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      <span>Add Follow-Up</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Next Follow-Up</label>
                      <input
                        type="datetime-local"
                        value={nextFollowUpDate}
                        onChange={(event) => setNextFollowUpDate(event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 text-xs font-bold text-gray-600 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Remark</label>
                      <input
                        value={followUpRemark}
                        onChange={(event) => setFollowUpRemark(event.target.value)}
                        placeholder="Follow-up remark"
                        className="h-11 w-full rounded-xl border border-gray-100 bg-gray-50 px-3 text-xs font-bold text-gray-600 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {followups.map((followUp, index) => {
                    const followUpKey = getRecordKey(followUp, `followup-${index}`);
                    return (
                    <div key={followUpKey} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-50 bg-white p-5 shadow-sm">
                      <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Created: {followUp.created_at ? new Date(followUp.created_at).toLocaleString() : "Just now"}
                        </p>
                        <p className="text-sm font-black text-gray-800">{followUp.remark || "Empty follow-up"}</p>
                        <p className="mt-2 flex items-center text-[10px] font-bold uppercase tracking-widest text-primary">
                          <Clock className="mr-2 h-3.5 w-3.5" />
                          Next: {followUp.next_follow_up_date || "Not scheduled"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFollowUp(followUp.id || followUpKey)}
                        className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete follow-up"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                  })}
                  {followups.length === 0 && (
                    <div className="rounded-2xl border border-gray-50 bg-white p-10 text-center shadow-sm">
                      <Calendar className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">No follow-ups found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "gdpr" && (
              <div className="space-y-6">
                <AdminDataTable
                  title="Lead GDPR Consent Log"
                  records={collections.consents}
                  getRecordKey={(record, index) => getRecordKey(record, `consent-${index}`)}
                  columns={[
                    { header: "Purpose", accessor: (record) => record.purpose || record.name || "Data processing" },
                    { header: "Date", accessor: (record) => record.date || record.created_at || "N/A" },
                    {
                      header: "Action",
                      accessor: (record) => (
                        <span className={`${getStatusBadge(record.status)} rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest`}>
                          {record.status === "disagree" ? "Opt Out" : "Opt In"}
                        </span>
                      ),
                    },
                    { header: "IP Address", accessor: (record) => record.ip_address || record.ip || "N/A" },
                    { header: "Staff", accessor: (record) => record.staff || record.user?.name || "System" },
                  ]}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {["Public Edit Link", "View Consent", "Update Consent"].map((action) => (
                    <button
                      key={action}
                      onClick={() => handleLeadAction(action)}
                      className="rounded-2xl border border-gray-50 bg-white p-5 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
                    >
                      <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                      <span className="block text-xs font-black uppercase tracking-widest text-gray-800">{action}</span>
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-gray-400">Ready for Laravel GDPR lead endpoints.</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "activity" && (
              <AdminDataTable
                title="Lead Activity"
                records={collections.activities}
                getRecordKey={(record, index) => getRecordKey(record, `activity-${index}`)}
                columns={[
                  { header: "Date", accessor: (record) => record.created_at || record.date || "N/A" },
                  { header: "Action", accessor: (record) => record.action || record.type || "Updated" },
                  { header: "Details", accessor: (record) => record.details || record.description || record.message || "N/A" },
                  { header: "User", accessor: (record) => record.user?.name || record.created_by || "System" },
                ]}
              />
            )}
          </div>

          <div className="space-y-6">
            <Card title="Quick Actions" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <button onClick={() => handleLeadAction("Send email")} className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-primary hover:text-white">
                  <Mail className="mr-2 h-4 w-4" /> Send Email
                </button>
                <button onClick={() => setActiveTab("followups")} className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-blue-500 hover:text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Follow-Up
                </button>
                <button onClick={() => handleLeadAction("Accept lead")} className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-green-500 hover:text-white">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Accept Lead
                </button>
                <button onClick={() => handleLeadAction("Convert lead")} className="flex h-11 w-full items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-primary hover:text-white">
                  <UserPlus className="mr-2 h-4 w-4" /> Convert
                </button>
              </div>
            </Card>

            <Card title="Lead Snapshot" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-primary/40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company</p>
                    <p className="text-sm font-black text-gray-800">{companyName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-primary/40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Website</p>
                    <p className="break-all text-sm font-black text-gray-800">{lead.website || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Send className="mt-0.5 h-4 w-4 text-primary/40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source</p>
                    <p className="text-sm font-black text-gray-800">{sourceLabel}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
