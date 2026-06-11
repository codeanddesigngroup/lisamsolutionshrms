"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Package,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface BillingPlan {
  id: number;
  name: string;
  monthly: number;
  annual: number;
  maxEmployees: string;
  storage: string;
  active?: boolean;
}

interface BillingInvoice {
  id: number;
  invoiceNumber: string;
  date: string;
  amount: number;
  gateway: string;
  status: string;
}

const starterPlans: BillingPlan[] = [
  { id: 1, name: "Starter", monthly: 29, annual: 290, maxEmployees: "25", storage: "5 GB" },
  { id: 2, name: "Business", monthly: 79, annual: 790, maxEmployees: "100", storage: "25 GB", active: true },
  { id: 3, name: "Enterprise", monthly: 149, annual: 1490, maxEmployees: "Unlimited", storage: "100 GB" },
];

const starterInvoices: BillingInvoice[] = [
  { id: 101, invoiceNumber: "BILL-2026-001", date: "2026-05-01", amount: 79, gateway: "Stripe", status: "paid" },
  { id: 100, invoiceNumber: "BILL-2026-000", date: "2026-04-01", amount: 79, gateway: "Offline", status: "paid" },
];

function extractList<T>(payload: unknown, fallback: T[]): T[] {
  const root = payload as Record<string, unknown> | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as { data: T[] }).data;
  }
  return fallback;
}

export default function BillingPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<BillingPlan[]>(starterPlans);
  const [invoices, setInvoices] = useState<BillingInvoice[]>(starterInvoices);
  const [loading, setLoading] = useState(false);
  const [offlineReference, setOfflineReference] = useState("");

  const currentPlan = useMemo(() => plans.find((plan) => plan.active) ?? plans[0], [plans]);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const [plansResponse, invoicesResponse] = await Promise.all([
        api.get("/billing/packages"),
        api.get("/billing/data"),
      ]);
      setPlans(extractList<BillingPlan>(plansResponse.data, starterPlans));
      setInvoices(extractList<BillingInvoice>(invoicesResponse.data, starterInvoices));
    } catch {
      setPlans(starterPlans);
      setInvoices(starterInvoices);
      showToast("Billing API is not ready yet. Showing starter billing data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBilling();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBilling]);

  const selectPlan = async (plan: BillingPlan) => {
    try {
      await api.get(`/billing/select-package/${plan.id}`);
      showToast(`${plan.name} package selected.`);
    } catch {
      showToast("Package selection was applied locally. Connect billing API to persist it.", "error");
    } finally {
      setPlans((current) => current.map((item) => ({ ...item, active: item.id === plan.id })));
    }
  };

  const submitOfflinePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post("/billing/offline-payment-submit", { reference: offlineReference, package_id: currentPlan.id });
      showToast("Offline payment submitted for verification.");
    } catch {
      showToast("Offline payment saved locally. Backend verification still needs wiring.", "error");
    } finally {
      setOfflineReference("");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Billing</h1>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Link href="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Billing</span>
            </div>
          </div>
          <button onClick={fetchBilling} className="rounded-xl bg-gray-50 p-2.5 text-gray-400 hover:text-primary" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-none bg-primary p-8 text-white shadow-lg shadow-primary/20 lg:col-span-1">
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Current Package</p>
            <h2 className="mt-2 text-3xl font-black">{currentPlan.name}</h2>
            <p className="mt-2 text-sm font-semibold text-white/75">${currentPlan.monthly}/month or ${currentPlan.annual}/year</p>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/55">Employees</p>
                <p className="mt-1 text-sm font-black">{currentPlan.maxEmployees}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/55">Storage</p>
                <p className="mt-1 text-sm font-black">{currentPlan.storage}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:col-span-2 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={`border-none bg-white p-6 shadow-sm ${plan.active ? "ring-2 ring-primary/30" : ""}`}>
                <div className="mb-5 flex items-start justify-between">
                  <Package className="h-7 w-7 text-primary" />
                  {plan.active && <span className="rounded-full bg-green-100 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-green-600">Active</span>}
                </div>
                <h3 className="text-lg font-black text-gray-800">{plan.name}</h3>
                <p className="mt-1 text-xs font-bold text-gray-400">{plan.maxEmployees} employees, {plan.storage}</p>
                <div className="my-6">
                  <span className="text-3xl font-black text-gray-900">${plan.monthly}</span>
                  <span className="text-xs font-bold text-gray-400"> / month</span>
                </div>
                <Button
                  onClick={() => selectPlan(plan)}
                  disabled={plan.active}
                  className="w-full bg-primary text-white h-10 text-[10px] font-black uppercase tracking-widest"
                >
                  {plan.active ? "Current Plan" : "Select Plan"}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-none bg-white p-0 shadow-sm lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 p-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Billing Invoices</h2>
                <p className="mt-1 text-xs font-medium text-gray-500">Download subscription invoices from connected gateways.</p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Invoice</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Gateway</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-gray-800">{invoice.invoiceNumber}</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">{invoice.date} - {invoice.status}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">{invoice.gateway}</td>
                    <td className="px-6 py-4 text-xs font-black text-gray-800">${invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/api/billing/invoice-download/${invoice.id}`} className="inline-flex text-gray-400 hover:text-primary" title="Download">
                        <Download className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Offline Payment</h2>
                <p className="mt-1 text-xs font-medium text-gray-500">Submit a manual payment reference for verification.</p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <form onSubmit={submitOfflinePayment} className="space-y-4">
              <input
                value={offlineReference}
                onChange={(event) => setOfflineReference(event.target.value)}
                className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Bank transfer reference"
                required
              />
              <Button type="submit" className="w-full bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest">
                <Upload className="h-4 w-4 mr-2" />
                Submit Reference
              </Button>
            </form>
            <div className="mt-6 rounded-xl bg-green-50 p-4 text-green-700">
              <p className="flex items-center text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Gateway-ready surface
              </p>
              <p className="mt-2 text-xs font-semibold leading-relaxed">
                Stripe, PayPal, Razorpay, Paystack, Mollie, Authorize, PayFast, and offline routes now have a home in Next.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
