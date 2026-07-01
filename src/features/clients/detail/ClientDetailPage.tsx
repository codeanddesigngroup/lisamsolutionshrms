"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Edit,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminCommentThread from "@/components/admin/AdminCommentThread";
import AdminDataTable from "@/components/admin/AdminDataTable";
import AdminFileManager from "@/components/admin/AdminFileManager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { Client } from "@/types";
import { useToast } from "@/context/ToastContext";

type LooseRecord = {
  id?: number | string;
  name?: string;
  project_name?: string;
  deadline?: string;
  due_date?: string;
  issue_date?: string;
  created_at?: string;
  status?: string;
  total?: number | string;
  amount?: number | string;
  price?: number | string;
  members?: unknown[];
  invoice_number?: string;
  invoice?: { invoice_number?: string };
  paid_on?: string;
  gateway?: string;
  method?: string;
  contact_name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  designation?: string;
  title?: string;
  body?: string;
  note?: string;
  description?: string;
  filename?: string;
  file_url?: string;
  url?: string;
  external_link?: string | null;
  size?: number | string;
  uploaded_by?: string;
  user?: { name?: string };
  added_by?: string;
  purpose?: string;
  date?: string;
  ip_address?: string;
  ip?: string;
  staff?: string;
  [key: string]: unknown;
};

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "projects", label: "Projects", icon: Layers },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "gdpr", label: "GDPR", icon: ShieldCheck },
];

const starterProjects = [
  {
    id: "starter-project-1",
    project_name: "Website Retainer",
    deadline: "2026-06-15",
    status: "in progress",
    members: [{ name: "Project Lead" }],
  },
  {
    id: "starter-project-2",
    project_name: "HR Portal Rollout",
    deadline: "2026-07-01",
    status: "not started",
    members: [{ name: "Implementation" }],
  },
];

const starterInvoices = [
  {
    id: "starter-invoice-1",
    invoice_number: "INV-0001",
    issue_date: "2026-05-01",
    due_date: "2026-05-15",
    total: 2400,
    status: "unpaid",
  },
  {
    id: "starter-invoice-2",
    invoice_number: "INV-0002",
    issue_date: "2026-04-01",
    due_date: "2026-04-15",
    total: 5200,
    status: "paid",
  },
];

const starterPayments = [
  {
    id: "starter-payment-1",
    paid_on: "2026-04-12",
    invoice_number: "INV-0002",
    amount: 5200,
    gateway: "Bank Transfer",
    status: "approved",
  },
];

const starterContacts = [
  {
    id: "starter-contact-1",
    name: "Accounts Manager",
    email: "accounts@example.com",
    mobile: "+1 555 0101",
    designation: "Billing",
  },
  {
    id: "starter-contact-2",
    name: "Project Sponsor",
    email: "sponsor@example.com",
    mobile: "+1 555 0102",
    designation: "Approver",
  },
];

const starterNotes = [
  {
    id: "starter-note-1",
    body: "Kickoff notes, delivery preferences, and invoice instructions live here.",
    created_at: "2026-05-01T09:00:00.000Z",
    user: { name: "Admin" },
  },
];

const starterDocuments = [
  {
    id: "starter-doc-1",
    filename: "signed-service-agreement.pdf",
    size: "280 KB",
    created_at: "2026-05-01T10:00:00.000Z",
    uploaded_by: "Admin",
  },
];

const starterConsents = [
  {
    id: "starter-consent-1",
    purpose: "Marketing communication",
    status: "agree",
    date: "2026-05-01",
    ip_address: "127.0.0.1",
    staff: "Admin",
    additional_description: "Accepted during onboarding.",
  },
  {
    id: "starter-consent-2",
    purpose: "Data processing for project delivery",
    status: "agree",
    date: "2026-05-01",
    ip_address: "127.0.0.1",
    staff: "Admin",
    additional_description: "Required for service fulfillment.",
  },
];

const getCollection = (value: unknown, fallback: LooseRecord[]): LooseRecord[] => {
  return Array.isArray(value) && value.length > 0 ? (value as LooseRecord[]) : fallback;
};

const getStatusBadge = (status?: string) => {
  const normalized = (status || "pending").toLowerCase();
  if (["paid", "approved", "active", "finished", "agree"].includes(normalized)) {
    return "bg-green-100 text-green-600";
  }
  if (["unpaid", "rejected", "deactive", "lost", "disagree"].includes(normalized)) {
    return "bg-red-100 text-red-500";
  }
  if (["partial", "in progress", "pending"].includes(normalized)) {
    return "bg-blue-100 text-blue-600";
  }
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

const getAmount = (record: LooseRecord) => Number(record.total || record.amount || record.price || 0);

const getRecordKey = (record: LooseRecord, fallback: string) => String(record.id || record.invoice_number || record.name || record.project_name || fallback);

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/client/${params.id}`);
        setClient(response.data.data);
        setError(null);
      } catch (err: unknown) {
        console.error("Fetch Client Error:", err);
        setError(getApiErrorMessage(err, "Failed to load client details."));
        showToast("Error loading client details.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id, showToast]);

  const collections = useMemo(() => {
    const source = (client || {}) as LooseRecord;
    const invoices = getCollection(source.invoices, starterInvoices);
    const payments = getCollection(source.payments, starterPayments);

    return {
      projects: getCollection(source.projects, starterProjects),
      invoices,
      payments,
      contacts: getCollection(source.contacts, starterContacts),
      notes: getCollection(source.notes, starterNotes),
      documents: getCollection(source.documents, starterDocuments),
      consents: getCollection(source.gdpr_consents || source.consents, starterConsents),
      totalBilled: invoices.reduce((sum, invoice) => sum + getAmount(invoice), 0),
      totalPaid: payments.reduce((sum, payment) => sum + getAmount(payment), 0),
      outstanding: invoices
        .filter((invoice) => String(invoice.status || "").toLowerCase() !== "paid")
        .reduce((sum, invoice) => sum + getAmount(invoice), 0),
    };
  }, [client]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading client details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 opacity-20" />
          <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-gray-800">Client details unavailable</h2>
          <p className="mb-6 max-w-md text-sm text-gray-500">{error || "Client not found."}</p>
          <Button onClick={() => router.push("/clients")} className="h-10 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
            Go Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const clientName = client.name;
  const companyName = client.client_detail?.company_name || client.name;
  const initial = companyName.charAt(0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-50 bg-white px-6 py-8 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-50 bg-blue-50 text-2xl font-black uppercase text-blue-500 shadow-inner">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-gray-800">{companyName}</h1>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                Primary Contact: <span className="text-primary">{clientName}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                {client.client_detail?.website && (
                  <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Globe className="mr-2 h-3.5 w-3.5 text-primary/40" /> {client.client_detail.website}
                  </span>
                )}
                <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <Mail className="mr-2 h-3.5 w-3.5 text-primary/40" /> {client.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`${getStatusBadge(client.status)} rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest`}>
              {client.status || "Active"}
            </span>
            <Link href={`/clients/${client.id}/edit`}>
              <Button className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-colors hover:text-primary">
                <Edit className="h-5 w-5" />
              </Button>
            </Link>
            <Button onClick={() => router.push("/clients")} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-gray-400 shadow-sm transition-colors hover:text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Projects</p>
              <Layers className="h-4 w-4 text-primary/30" />
            </div>
            <p className="text-2xl font-black text-gray-800">{collections.projects.length}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Client project workspace</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Billed</p>
              <TrendingUp className="h-4 w-4 text-green-500/30" />
            </div>
            <p className="text-2xl font-black text-gray-800">{toCurrency(collections.totalBilled)}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Invoice summary</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Outstanding</p>
              <CreditCard className="h-4 w-4 text-red-500/30" />
            </div>
            <p className="text-2xl font-black text-red-500">{toCurrency(collections.outstanding)}</p>
            <p className="mt-1 text-[9px] font-bold uppercase text-gray-300">Due balance</p>
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
              <Card title="Company Profile" className="border-none bg-white p-8 shadow-sm">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">Company Name</p>
                      <p className="text-sm font-bold text-gray-700">{companyName}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">Website</p>
                      <p className="text-sm font-bold text-primary">{client.client_detail?.website || "N/A"}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">Contact Mobile</p>
                      <p className="text-sm font-bold text-gray-700">{client.client_detail?.mobile || "N/A"}</p>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-300">Login Email</p>
                      <p className="text-sm font-bold text-gray-700">{client.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 border-t border-gray-50 pt-8 md:grid-cols-2">
                    <div>
                      <p className="mb-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                        <MapPin className="mr-2 h-3 w-3" /> Office Address
                      </p>
                      <p className="max-w-md text-sm font-bold leading-relaxed text-gray-600">{client.client_detail?.address || "No address provided."}</p>
                    </div>
                    <div>
                      <p className="mb-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                        <MapPin className="mr-2 h-3 w-3" /> Shipping Address
                      </p>
                      <p className="max-w-md text-sm font-bold leading-relaxed text-gray-600">{client.client_detail?.shipping_address || "No shipping address provided."}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "projects" && (
              <AdminDataTable
                title="Client Projects"
                records={collections.projects}
                getRecordKey={(record, index) => getRecordKey(record, `project-${index}`)}
                columns={[
                  {
                    header: "Project",
                    accessor: (record) => (
                      <Link href={`/projects/${record.id}`} className="font-black text-gray-800 transition-colors hover:text-primary">
                        {record.project_name || record.name || "Untitled Project"}
                      </Link>
                    ),
                  },
                  { header: "Deadline", accessor: (record) => record.deadline || record.due_date || "N/A" },
                  {
                    header: "Members",
                    accessor: (record) => `${Array.isArray(record.members) ? record.members.length : 0} members`,
                  },
                  {
                    header: "Status",
                    accessor: (record) => (
                      <span className={`${getStatusBadge(record.status)} rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest`}>
                        {record.status || "Pending"}
                      </span>
                    ),
                  },
                ]}
              />
            )}

            {activeTab === "invoices" && (
              <AdminDataTable
                title="Client Invoices"
                records={collections.invoices}
                getRecordKey={(record, index) => getRecordKey(record, `invoice-${index}`)}
                columns={[
                  {
                    header: "Invoice",
                    accessor: (record) => (
                      <Link href={`/invoices/${record.id}`} className="font-black text-gray-800 transition-colors hover:text-primary">
                        {record.invoice_number || `INV-${record.id}`}
                      </Link>
                    ),
                  },
                  { header: "Issue Date", accessor: (record) => record.issue_date || record.created_at || "N/A" },
                  { header: "Due Date", accessor: (record) => record.due_date || "N/A" },
                  { header: "Total", accessor: (record) => toCurrency(record.total) },
                  {
                    header: "Status",
                    accessor: (record) => (
                      <span className={`${getStatusBadge(record.status)} rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest`}>
                        {record.status || "Unpaid"}
                      </span>
                    ),
                  },
                ]}
              />
            )}

            {activeTab === "contacts" && (
              <AdminDataTable
                title="Client Contacts"
                records={collections.contacts}
                getRecordKey={(record, index) => getRecordKey(record, `contact-${index}`)}
                columns={[
                  { header: "Name", accessor: (record) => record.name || record.contact_name || "N/A" },
                  { header: "Email", accessor: (record) => record.email || "N/A" },
                  { header: "Mobile", accessor: (record) => record.mobile || record.phone || "N/A" },
                  { header: "Role", accessor: (record) => record.designation || record.title || "Contact" },
                ]}
              />
            )}

            {activeTab === "payments" && (
              <AdminDataTable
                title="Client Payments"
                records={collections.payments}
                getRecordKey={(record, index) => getRecordKey(record, `payment-${index}`)}
                columns={[
                  { header: "Paid On", accessor: (record) => record.paid_on || record.created_at || "N/A" },
                  { header: "Invoice", accessor: (record) => record.invoice_number || record.invoice?.invoice_number || "N/A" },
                  { header: "Amount", accessor: (record) => toCurrency(record.amount || record.total) },
                  { header: "Gateway", accessor: (record) => record.gateway || record.method || "N/A" },
                  {
                    header: "Status",
                    accessor: (record) => (
                      <span className={`${getStatusBadge(record.status)} rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest`}>
                        {record.status || "Approved"}
                      </span>
                    ),
                  },
                ]}
              />
            )}

            {activeTab === "notes" && (
              <AdminCommentThread
                title="Client Notes"
                placeholder="Add a private client note..."
                emptyText="No client notes yet."
                comments={collections.notes.map((note) => ({
                  id: note.id || note.title || note.created_at || "client-note",
                  body: note.body || note.note || note.description || note.title || "",
                  created_at: note.created_at,
                  user: note.user || { name: note.added_by || "Admin" },
                }))}
              />
            )}

            {activeTab === "documents" && (
              <AdminFileManager
                title="Client Documents"
                description="Matches the Laravel documents tab with upload, preview, download, and delete controls."
                files={collections.documents}
                emptyText="No client documents uploaded yet."
              />
            )}

            {activeTab === "gdpr" && (
              <div className="space-y-6">
                <AdminDataTable
                  title="GDPR Consent Log"
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
                  {["Export Data", "Erase Request", "Consent Update"].map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="rounded-2xl border border-gray-50 bg-white p-5 text-left shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/5"
                    >
                      <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                      <span className="block text-xs font-black uppercase tracking-widest text-gray-800">{action}</span>
                      <span className="mt-1 block text-xs font-medium leading-relaxed text-gray-400">Frontend action state ready for backend GDPR endpoints.</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card title="Contact Snapshot" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-primary/40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company</p>
                    <p className="text-sm font-black text-gray-800">{companyName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-primary/40" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile</p>
                    <p className="text-sm font-black text-gray-800">{client.client_detail?.mobile || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {client.status === "active" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" /> : <XCircle className="mt-0.5 h-4 w-4 text-red-500" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Status</p>
                    <p className="text-sm font-black capitalize text-gray-800">{client.status || "active"}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Financial Snapshot" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Billed</span>
                  <span className="text-sm font-black text-gray-800">{toCurrency(collections.totalBilled)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Paid</span>
                  <span className="text-sm font-black text-green-600">{toCurrency(collections.totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Due Balance</span>
                  <span className="text-sm font-black text-red-500">{toCurrency(collections.outstanding)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
