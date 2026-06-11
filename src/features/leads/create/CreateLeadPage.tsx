"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type LeadOption = {
  id: number | string;
  type: string;
};

type CreateLeadPayload = {
  client_name: string;
  client_email: string;
  company_name: string;
  mobile?: string;
  website?: string;
  address?: string;
  description?: string;
  value?: number;
  source_id?: string;
  status_id?: string;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
};

export default function CreateLeadPage() {
  const router = useRouter();
  const [sources, setSources] = useState<LeadOption[]>([]);
  const [statuses, setStatuses] = useState<LeadOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    company_name: "",
    mobile: "",
    website: "",
    address: "",
    description: "",
    source_id: "",
    status_id: "",
    value: "",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [sourceRes, statusRes] = await Promise.all([
          api.get("/lead-source"),
          api.get("/lead-status")
        ]);
        setSources(sourceRes.data.data || []);
        setStatuses(statusRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch lead options, using mock fallback:", err);
        setSources([{ id: 1, type: "Website" }, { id: 2, type: "Referral" }]);
        setStatuses([{ id: 1, type: "New Lead" }, { id: 2, type: "In Process" }]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: CreateLeadPayload = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        company_name: formData.company_name,
      };
      
      if (formData.mobile) payload.mobile = formData.mobile;
      if (formData.website) payload.website = formData.website;
      if (formData.address) payload.address = formData.address;
      if (formData.description) payload.description = formData.description;
      if (formData.value) payload.value = parseFloat(formData.value);
      if (formData.source_id) payload.source_id = formData.source_id;
      if (formData.status_id) payload.status_id = formData.status_id;

      await api.post("/lead", payload);
      router.push("/leads");
      router.refresh();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error("Create Lead Error:", err);
      setError(apiError.response?.data?.message || apiError.response?.data?.error || "Failed to create lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Lead</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/leads" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Leads</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Lead</span>
            </div>
          </div>
          <Link href="/leads">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100 relative min-h-[400px]">
          {loadingOptions && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
               <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading options...</p>
             </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500 animate-in slide-in-from-top-2">
                  {error}
               </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                <input 
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  type="text" 
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Email <span className="text-red-500">*</span></label>
                <input 
                  name="client_email"
                  value={formData.client_email}
                  onChange={handleChange}
                  type="email" 
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
                <input 
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  type="text" 
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  type="text"
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Website</label>
                <input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  type="url"
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Source</label>
                <select 
                  name="source_id"
                  value={formData.source_id}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Source</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>{src.type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Status</label>
                <select 
                  name="status_id"
                  value={formData.status_id}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Status</option>
                  {statuses.map((stat) => (
                    <option key={stat.id} value={stat.id}>{stat.type}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lead Value</label>
                <input 
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  type="number" 
                  step="0.01"
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  type="text"
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Requirements</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all min-h-28"
                />
              </div>

            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/leads">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving || loadingOptions} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Lead"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
