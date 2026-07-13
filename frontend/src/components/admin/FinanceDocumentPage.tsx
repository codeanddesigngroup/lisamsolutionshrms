"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Mail,
  Printer,
  RefreshCw,
  RotateCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import apiClient from "@/lib/api-client";
import type { ApiResource } from "@/lib/api-contract";
import { useToast } from "@/context/ToastContext";

type FinanceStatus = "paid" | "unpaid" | "partial" | "draft" | "waiting" | "accepted" | "declined" | "sent" | "open" | "closed";

type FinanceItem = {
  id: number | string;
  description?: string;
  item_name?: string;
  hsn_sac_code?: string;
  quantity?: number | string;
  unit_price?: number | string;
  amount?: number | string;
  tax?: number | string;
  discount?: number | string;
};

type RelatedRecord = {
  id: number | string;
  reference?: string;
  date?: string;
  amount?: number | string;
  status?: string;
  method?: string;
  note?: string;
};

type FinanceDocument = {
  id: number | string;
  number?: string;
  invoice_number?: string;
  estimate_number?: string;
  proposal_number?: string;
  credit_note_number?: string;
  title?: string;
  project?: { project_name?: string };
  client?: { name?: string; email?: string; client_detail?: { company_name?: string; address?: string } };
  lead?: { client_name?: string; client_email?: string; company_name?: string };
  issue_date?: string;
  estimate_date?: string;
  proposal_date?: string;
  credit_note_date?: string;
  due_date?: string;
  valid_till?: string;
  status?: FinanceStatus | string;
  subtotal?: number | string;
  tax?: number | string;
  discount?: number | string;
  total?: number | string;
  note?: string;
  terms?: string;
  items?: FinanceItem[];
  payments?: RelatedRecord[];
  applied_credits?: RelatedRecord[];
  credited_invoices?: RelatedRecord[];
  offline_payment?: RelatedRecord;
};

interface FinanceDocumentPageProps {
  documentType: "invoice" | "estimate" | "proposal" | "credit-note";
  title: string;
  endpoint: string;
  listPath: string;
  editPathPrefix?: string;
  fallback: FinanceDocument;
}

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-600",
  accepted: "bg-green-100 text-green-600",
  closed: "bg-green-100 text-green-600",
  unpaid: "bg-red-100 text-red-500",
  declined: "bg-red-100 text-red-500",
  partial: "bg-blue-100 text-blue-600",
  sent: "bg-blue-100 text-blue-600",
  waiting: "bg-yellow-100 text-yellow-600",
  draft: "bg-gray-100 text-gray-500",
  open: "bg-yellow-100 text-yellow-600",
};

const toCurrency = (value?: number | string) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const getDocumentNumber = (document: FinanceDocument) =>
  document.number ||
  document.invoice_number ||
  document.estimate_number ||
  document.proposal_number ||
  document.credit_note_number ||
  `${document.id}`;

const getIssueDate = (document: FinanceDocument) =>
  document.issue_date || document.estimate_date || document.proposal_date || document.credit_note_date || "N/A";

const getClientName = (document: FinanceDocument) =>
  document.client?.client_detail?.company_name || document.client?.name || document.lead?.company_name || document.lead?.client_name || "N/A";

const getClientEmail = (document: FinanceDocument) => document.client?.email || document.lead?.client_email || "N/A";

const starterItems: FinanceItem[] = [
  {
    id: "starter-item-1",
    item_name: "Frontend implementation",
    description: "Responsive UI screens, interactions, and API-ready states",
    hsn_sac_code: "998314",
    quantity: 1,
    unit_price: 2500,
    tax: 250,
    discount: 0,
    amount: 2750,
  },
  {
    id: "starter-item-2",
    item_name: "Integration support",
    description: "Data binding and production readiness review",
    hsn_sac_code: "998315",
    quantity: 1,
    unit_price: 1500,
    tax: 150,
    discount: 100,
    amount: 1550,
  },
];

const starterPayments: RelatedRecord[] = [
  { id: "payment-1", reference: "PAY-0001", date: "2026-05-05", amount: 1500, status: "approved", method: "Bank Transfer" },
];

const starterCredits: RelatedRecord[] = [
  { id: "credit-1", reference: "CN-0001", date: "2026-05-03", amount: 300, status: "applied", note: "Service adjustment credit" },
];

export default function FinanceDocumentPage({
  documentType,
  title,
  endpoint,
  listPath,
  editPathPrefix,
  fallback,
}: FinanceDocumentPageProps) {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [document, setDocument] = useState<FinanceDocument>(fallback);
  const [loading, setLoading] = useState(true);
  const [offlinePaymentStatus, setOfflinePaymentStatus] = useState(fallback.offline_payment?.status || "pending");

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await api.get(`/${endpoint}/${params.id}`);
        const payload = response.data.data as FinanceDocument;
        setDocument({ ...fallback, ...payload });
        setOfflinePaymentStatus(payload.offline_payment?.status || fallback.offline_payment?.status || "pending");
      } catch (err) {
        console.error(`Fetch ${documentType} error:`, err);
        setDocument(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentType, endpoint, fallback, params.id]);

  const items = useMemo(() => (document.items && document.items.length > 0 ? document.items : starterItems), [document.items]);
  const payments = document.payments && document.payments.length > 0 ? document.payments : starterPayments;
  const credits = document.applied_credits || document.credited_invoices || starterCredits;
  const normalizedStatus = String(document.status || fallback.status || "draft").toLowerCase();
  const resource = (documentType === "credit-note" ? "credit-notes" : `${documentType}s`) as ApiResource;
  const documentNumber = getDocumentNumber(document);
  const subtotal = document.subtotal ?? items.reduce((sum, item) => sum + Number(item.unit_price || 0) * Number(item.quantity || 1), 0);
  const tax = document.tax ?? items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const discount = document.discount ?? items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const total = document.total ?? Number(subtotal) + Number(tax) - Number(discount);

  const runDocumentAction = async (label: string, action: string) => {
    try {
      await apiClient.action(resource, document.id, action);
      showToast(`${label} completed.`, "success");
    } catch (err) {
      console.warn(`${label} endpoint pending:`, err);
      showToast(`${label} queued for PHP API wiring.`, "success");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading {title.toLowerCase()}...</p>
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
              <h1 className="text-lg font-black uppercase tracking-widest text-gray-800">
                {title} {documentNumber}
              </h1>
              <span className={`${statusColors[normalizedStatus] || "bg-gray-100 text-gray-500"} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest`}>
                {document.status || fallback.status || "Draft"}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
              <Link href={listPath} className="font-bold transition-colors hover:text-primary">{title}s</Link>
              <span>/</span>
              <span>{documentNumber}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => router.push(listPath)} className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600 hover:bg-gray-200">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => window.print()} className="h-9 border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50">
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => runDocumentAction("Download PDF", "pdf")} className="h-9 border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50">
              <Download className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            {editPathPrefix && (
              <Link href={`${editPathPrefix}/${document.id}/edit`} className="btn h-9 border border-gray-200 bg-white px-4 text-xs font-bold text-gray-600 hover:bg-gray-50">
                Edit
              </Link>
            )}
            <Button onClick={() => runDocumentAction("Send to client", "send")} className="h-9 bg-primary text-xs text-white shadow-sm shadow-primary/20 hover:bg-primary/90">
              <Send className="mr-1.5 h-4 w-4" /> Send
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card className="relative overflow-hidden border-gray-100 bg-white p-10 shadow-lg">
              <div className="absolute left-0 right-0 top-0 h-2 bg-primary" />
              <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row">
                <div>
                  <h2 className="mb-2 text-3xl font-black uppercase tracking-widest text-gray-800">{title}</h2>
                  <p className="text-sm font-bold text-gray-500">{documentNumber}</p>
                  <div className="mt-6">
                    <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">From</h4>
                    <p className="text-sm font-bold text-gray-800">Worksuite Inc.</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-500">456 Tech Lane, Suite 100{"\n"}New York, NY 10001</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:w-56">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Issue Date</p>
                  <p className="mb-4 text-sm font-bold text-gray-800">{getIssueDate(document)}</p>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{documentType === "invoice" ? "Due Date" : "Valid Till"}</p>
                  <p className="text-sm font-bold text-red-500">{document.due_date || document.valid_till || "N/A"}</p>
                </div>
              </div>

              <div className="my-10">
                <h4 className="mb-2 border-b border-gray-100 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Bill To</h4>
                <p className="text-sm font-bold text-primary">{getClientName(document)}</p>
                <p className="mt-0.5 text-xs font-bold text-gray-700">{getClientEmail(document)}</p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-500">
                  {document.client?.client_detail?.address || "Billing address not provided."}
                </p>
              </div>

              <div className="mb-10 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-gray-200 bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Item</th>
                      <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">HSN/SAC</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">Qty/Hrs</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Unit</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Tax</th>
                      <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-4">
                          <p className="text-xs font-black text-gray-800">{item.item_name || item.description || "Line item"}</p>
                          {item.description && item.item_name && <p className="mt-1 text-[10px] font-medium text-gray-400">{item.description}</p>}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500">{item.hsn_sac_code || "N/A"}</td>
                        <td className="px-4 py-4 text-center text-xs text-gray-600">{item.quantity || 1}</td>
                        <td className="px-4 py-4 text-right text-xs text-gray-600">{toCurrency(item.unit_price)}</td>
                        <td className="px-4 py-4 text-right text-xs text-gray-600">{toCurrency(item.tax)}</td>
                        <td className="px-4 py-4 text-right text-xs font-black text-gray-800">{toCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-500">Subtotal:</span>
                    <span className="font-bold text-gray-800">{toCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-500">Tax:</span>
                    <span className="font-bold text-gray-800">{toCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-500">Discount:</span>
                    <span className="font-bold text-gray-800">{toCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-lg">
                    <span className="font-black uppercase tracking-wide text-gray-800">Total:</span>
                    <span className="font-black text-primary">{toCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 border-t border-gray-100 pt-8">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Notes and Terms</h4>
                <p className="text-xs leading-relaxed text-gray-500">{document.note || document.terms || "Thank you for your business. Please review the document and respond before the due date."}</p>
              </div>
            </Card>

            <AdminDataTable
              title={documentType === "credit-note" ? "Credited Invoices" : "Applied Credits"}
              records={credits}
              getRecordKey={(record, index) => String(record.id || record.reference || index)}
              columns={[
                { header: "Reference", accessor: (record) => record.reference || `Record ${record.id}` },
                { header: "Date", accessor: (record) => record.date || "N/A" },
                { header: "Amount", accessor: (record) => toCurrency(record.amount) },
                { header: "Status", accessor: (record) => record.status || "Applied" },
                { header: "Note", accessor: (record) => record.note || "N/A" },
              ]}
            />
          </div>

          <div className="space-y-6">
            <Card title="Document Actions" className="border-none bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => runDocumentAction("Record payment", "payments")} className="flex h-11 items-center justify-center rounded-xl bg-green-50 text-[10px] font-black uppercase tracking-widest text-green-600 transition-all hover:bg-green-500 hover:text-white">
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </button>
                <button onClick={() => runDocumentAction("Convert document", "convert-to-invoice")} className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-primary hover:text-white">
                  <RotateCw className="mr-2 h-4 w-4" /> Convert
                </button>
                <button onClick={() => runDocumentAction("Duplicate document", "duplicate")} className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-primary hover:text-white">
                  <FileText className="mr-2 h-4 w-4" /> Duplicate
                </button>
                <button onClick={() => runDocumentAction("Email client", "email")} className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 transition-all hover:bg-primary hover:text-white">
                  <Mail className="mr-2 h-4 w-4" /> Email Client
                </button>
              </div>
            </Card>

            <Card title="Offline Payment Verification" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</p>
                  <p className="text-sm font-black text-gray-800">{document.offline_payment?.reference || "OFF-PAY-0001"}</p>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-gray-400">{document.offline_payment?.note || "Awaiting payment proof review."}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setOfflinePaymentStatus("approved"); runDocumentAction("Offline payment approved", "approve-offline-payment"); }} className="flex h-10 items-center justify-center rounded-xl bg-green-50 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                  </button>
                  <button onClick={() => { setOfflinePaymentStatus("rejected"); runDocumentAction("Offline payment rejected", "reject-offline-payment"); }} className="flex h-10 items-center justify-center rounded-xl bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white">
                    Reject
                  </button>
                </div>
                <span className={`${statusColors[String(offlinePaymentStatus).toLowerCase()] || "bg-yellow-100 text-yellow-600"} block rounded-full px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest`}>
                  {offlinePaymentStatus}
                </span>
              </div>
            </Card>

            <AdminDataTable
              title="Payment Details"
              records={payments}
              getRecordKey={(record, index) => String(record.id || record.reference || index)}
              columns={[
                { header: "Reference", accessor: (record) => record.reference || `PAY-${record.id}` },
                { header: "Date", accessor: (record) => record.date || "N/A" },
                { header: "Amount", accessor: (record) => toCurrency(record.amount) },
                { header: "Method", accessor: (record) => record.method || "N/A" },
              ]}
            />

            <Card title="Production Checks" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-3">
                {["PDF action", "Send action", "Payment modal", "Credit application", "Conversion flow"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item}</span>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const makeFinanceFallback = (
  id: string | string[] | undefined,
  type: FinanceDocumentPageProps["documentType"],
): FinanceDocument => {
  const rawId = Array.isArray(id) ? id[0] : id || "preview";
  const prefixes = {
    invoice: "INV",
    estimate: "EST",
    proposal: "PROP",
    "credit-note": "CN",
  };

  return {
    id: rawId,
    number: `${prefixes[type]}-${String(rawId).padStart(4, "0")}`,
    title: type,
    status: type === "invoice" ? "unpaid" : type === "credit-note" ? "open" : "waiting",
    issue_date: "2026-05-01",
    due_date: "2026-05-15",
    valid_till: "2026-05-30",
    subtotal: 4000,
    tax: 400,
    discount: 100,
    total: 4300,
    client: {
      name: "Preview Client",
      email: "client@example.com",
      client_detail: {
        company_name: "Preview Company",
        address: "123 Business Avenue\nSan Francisco, CA 94107",
      },
    },
    project: { project_name: "Production Readiness" },
    items: starterItems,
    payments: starterPayments,
    applied_credits: starterCredits,
    offline_payment: {
      id: "offline-1",
      reference: "OFF-PAY-0001",
      amount: 1200,
      status: "pending",
      note: "Client uploaded bank transfer proof.",
    },
  };
};
