"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { Lead } from "@/types";

type LeadOption = {
  id: number | string;
  type: string;
};

type LeadFormState = {
  client_name: string;
  client_email: string;
  company_name: string;
  mobile: string;
  website: string;
  source_id: string;
  status_id: string;
  value: string;
  address: string;
  description: string;
};

const getOptionId = (value: unknown) => {
  if (value && typeof value === "object" && "id" in value) return String((value as { id?: string | number }).id || "");
  return "";
};

const emptyForm: LeadFormState = {
  client_name: "",
  client_email: "",
  company_name: "",
  mobile: "",
  website: "",
  source_id: "",
  status_id: "",
  value: "",
  address: "",
  description: "",
};

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [sources, setSources] = useState<LeadOption[]>([]);
  const [statuses, setStatuses] = useState<LeadOption[]>([]);
  const [formData, setFormData] = useState<LeadFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadRes, sourceRes, statusRes] = await Promise.all([
          api.get(`/lead/${params.id}`),
          api.get("/lead-source"),
          api.get("/lead-status"),
        ]);
        const fetchedLead = leadRes.data.data as Lead;
        setLead(fetchedLead);
        setSources(sourceRes.data.data || []);
        setStatuses(statusRes.data.data || []);
        setFormData({
          client_name: fetchedLead.client_name || fetchedLead.name || "",
          client_email: fetchedLead.client_email || fetchedLead.email || "",
          company_name: fetchedLead.company_name || fetchedLead.company || "",
          mobile: fetchedLead.mobile || fetchedLead.phone || "",
          website: fetchedLead.website || "",
          source_id: getOptionId(fetchedLead.source),
          status_id: getOptionId(fetchedLead.status),
          value: fetchedLead.value ? String(fetchedLead.value) : "",
          address: fetchedLead.address || "",
          description: fetchedLead.description || fetchedLead.message || "",
        });
      } catch (err) {
        console.error("Fetch Lead Edit Error:", err);
        setError("Failed to load lead data.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [params.id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.put(`/lead/${params.id}`, {
        ...formData,
        value: formData.value ? Number(formData.value) : 0,
      });
      router.push(`/leads/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("Update Lead Error:", err);
      setError("Failed to update lead.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading lead...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 opacity-20" />
          <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-gray-800">Lead Not Found</h2>
          <Button onClick={() => router.push("/leads")} className="h-10 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white">
            Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between rounded-2xl border border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/leads" className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Edit Lead</h1>
              <p className="mt-0.5 text-[10px] font-bold text-gray-400">Update details for {formData.client_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => router.back()} className="h-10 border-none bg-gray-50 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Updating..." : "Update Lead"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {error && <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}

            <Card title="Lead Information" className="border-none bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Name</label>
                  <input name="client_name" required value={formData.client_name} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Company Name</label>
                  <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
                  <input name="client_email" required type="email" value={formData.client_email} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone Number</label>
                  <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Website</label>
                  <input name="website" type="url" value={formData.website} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </Card>

            <Card title="Deal Details" className="border-none bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Value</label>
                  <input name="value" type="number" step="0.01" value={formData.value} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source</label>
                  <select name="source_id" value={formData.source_id} onChange={handleChange} className="w-full cursor-pointer appearance-none rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Select Source</option>
                    {sources.map((source) => <option key={source.id} value={source.id}>{source.type}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Requirements</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="min-h-28 w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Lead Status" className="border-none bg-white p-8 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
                <select name="status_id" value={formData.status_id} onChange={handleChange} className="w-full cursor-pointer appearance-none rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select Status</option>
                  {statuses.map((status) => <option key={status.id} value={status.id}>{status.type}</option>)}
                </select>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
