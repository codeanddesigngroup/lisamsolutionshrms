"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, CreditCard, DollarSign, Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type OptionRecord = {
  id: number | string;
  project_name?: string;
  invoice_number?: string;
  total?: number;
  project?: { id?: number | string; project_name?: string };
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
};

export default function CreatePaymentPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<OptionRecord[]>([]);
  const [invoices, setInvoices] = useState<OptionRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    project_id: "",
    invoice_id: "",
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    payment_gateway: "offline",
    status: "pending",
    remarks: "",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [projectResponse, invoiceResponse] = await Promise.all([
          api.get("/project"),
          api.get("/invoice"),
        ]);
        setProjects(projectResponse.data.data || []);
        setInvoices(invoiceResponse.data.data || []);
      } catch (err) {
        console.error("Fetch Payment Options Error:", err);
        showToast("Failed to load payment options", "error");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const invoice = invoices.find((item) => String(item.id) === formData.invoice_id);
      const projectId = formData.project_id || invoice?.project?.id || "";
      await api.post("/payment", {
        invoice: formData.invoice_id ? { id: formData.invoice_id } : undefined,
        project: projectId ? { id: projectId } : undefined,
        payment_date: formData.payment_date,
        date: formData.payment_date,
        amount: Number(formData.amount),
        payment_gateway: formData.payment_gateway,
        status: formData.status,
        remarks: formData.remarks,
      });
      showToast("Payment created successfully", "success");
      router.push("/payments");
      router.refresh();
    } catch (err) {
      console.error("Create Payment Error:", err);
      setError(getApiErrorMessage(err, "Failed to create payment."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Add Payment</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/payments" className="hover:text-primary transition-colors font-bold">Payments</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Add Payment</span>
            </div>
          </div>
          <Link href="/payments">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Payments</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100 relative">
          {loadingOptions && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>}
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project</label>
                <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                  <option value="">Select Project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoice</label>
                <select name="invoice_id" value={formData.invoice_id} onChange={handleChange} className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                  <option value="">Select Invoice</option>
                  {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number || `Invoice ${invoice.id}`}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Paid On <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="payment_date" value={formData.payment_date} onChange={handleChange} type="date" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="amount" value={formData.amount} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0.00" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment Gateway</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <select name="payment_gateway" value={formData.payment_gateway} onChange={handleChange} className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                    <option value="offline">Offline</option>
                    <option value="paypal">Paypal</option>
                    <option value="stripe">Stripe</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none h-24 transition-all" placeholder="Enter payment remarks..." />
            </div>
            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/payments"><Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-bold px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</Button></Link>
              <Button type="submit" disabled={saving || loadingOptions} className="bg-primary text-white text-[10px] font-bold px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                {saving ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
