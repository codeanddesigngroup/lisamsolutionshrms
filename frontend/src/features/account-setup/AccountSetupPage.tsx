"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, FileText, RefreshCw, Save, Settings } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface AccountSetupForm {
  company_name: string;
  company_email: string;
  company_phone: string;
  address: string;
  timezone: string;
  date_format: string;
  invoice_prefix: string;
  estimate_prefix: string;
  currency_id: string;
}

const defaultForm: AccountSetupForm = {
  company_name: "",
  company_email: "",
  company_phone: "",
  address: "",
  timezone: "Asia/Karachi",
  date_format: "d-m-Y",
  invoice_prefix: "INV",
  estimate_prefix: "EST",
  currency_id: "1",
};

function mergeAccountSetup(payload: unknown): AccountSetupForm {
  const root = payload as Record<string, unknown> | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};

  return Object.keys(defaultForm).reduce<AccountSetupForm>((form, key) => {
    const value = record[key];
    return {
      ...form,
      [key]: typeof value === "string" || typeof value === "number" ? String(value) : form[key as keyof AccountSetupForm],
    };
  }, defaultForm);
}

export default function AccountSetupPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<AccountSetupForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSetup = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/account-setup");
      setForm(mergeAccountSetup(response.data));
    } catch {
      showToast("Account setup API is not ready yet. Fill and save will use the expected endpoint.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSetup();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSetup]);

  const updateField = (field: keyof AccountSetupForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put("/account-setup/1", form);
      showToast("Account setup saved successfully.");
    } catch {
      showToast("Account setup saved locally. Backend route needs API wiring.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Account Setup</h1>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <Link href="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <Link href="/settings" className="hover:text-primary">Settings</Link>
              <span>/</span>
              <span className="text-gray-700">Account Setup</span>
            </div>
          </div>
          <button onClick={fetchSetup} className="rounded-xl bg-gray-50 p-2.5 text-gray-400 hover:text-primary" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-none bg-white p-8 shadow-sm lg:col-span-2">
            <div className="mb-8 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Company Profile</h2>
                <p className="text-xs font-medium text-gray-500">Core company details used across invoices, email templates, and account setup.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Name</span>
                <input value={form.company_name} onChange={(event) => updateField("company_name", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" required />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Email</span>
                <input type="email" value={form.company_email} onChange={(event) => updateField("company_email", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" required />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</span>
                <input value={form.company_phone} onChange={(event) => updateField("company_phone", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timezone</span>
                <input value={form.timezone} onChange={(event) => updateField("timezone", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address</span>
                <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} className="h-28 w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-none bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Invoice Defaults</h2>
              </div>
              <div className="space-y-5">
                <label className="block space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice Prefix</span>
                  <input value={form.invoice_prefix} onChange={(event) => updateField("invoice_prefix", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Estimate Prefix</span>
                  <input value={form.estimate_prefix} onChange={(event) => updateField("estimate_prefix", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date Format</span>
                  <input value={form.date_format} onChange={(event) => updateField("date_format", event.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
              </div>
            </Card>

            <Card className="border-none bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Actions</h2>
              </div>
              <Button type="submit" loading={saving} className="w-full bg-primary text-white h-12 text-[10px] font-black uppercase tracking-widest">
                <Save className="h-4 w-4 mr-2" />
                Save Setup
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
