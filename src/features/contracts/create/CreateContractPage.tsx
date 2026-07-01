"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, FileSignature, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateContractPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

    return {
    subject: "",
    client_id: "",
    contract_type_id: "",
    amount: "",
    start_date: today,
    end_date: nextYear,
    description: "",
    };
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [clientRes, typeRes] = await Promise.all([
          api.get("/client"),
          api.get("/contract-type"),
        ]);
        setClients(clientRes.data.data || []);
        setContractTypes(typeRes.data.data || []);
      } catch {
        setClients([{ id: 1, name: "Acme Corp" }]);
        setContractTypes([{ id: 1, name: "Fixed Price" }, { id: 2, name: "Hourly" }]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        subject: formData.subject,
        client: { id: formData.client_id },
        contract_type: { id: formData.contract_type_id },
        amount: parseFloat(formData.amount),
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description,
      };

      if (localStorage.getItem("token") === "mock_token_12345") {
        setTimeout(() => { router.push("/contracts"); router.refresh(); }, 800);
        return;
      }
      await api.post("/contract", payload);
      router.push("/contracts");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create contract.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Create Contract</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span>/</span>
              <Link href="/contracts" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Contracts</Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Create</span>
            </div>
          </div>
          <Link href="/contracts">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" /><span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100 relative">
          {loadingOptions && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Subject <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FileSignature className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="subject" value={formData.subject} onChange={handleChange}
                    type="text" placeholder="e.g. Annual Maintenance Contract"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client <span className="text-red-500">*</span></label>
                <select name="client_id" value={formData.client_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer" required>
                  <option value="">Select Client</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contract Type <span className="text-red-500">*</span></label>
                <select name="contract_type_id" value={formData.contract_type_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer" required>
                  <option value="">Select Type</option>
                  {contractTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="amount" value={formData.amount} onChange={handleChange}
                    type="number" step="0.01" placeholder="0.00"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="start_date" value={formData.start_date} onChange={handleChange} type="date"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="end_date" value={formData.end_date} onChange={handleChange} type="date"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-28"
                  placeholder="Contract terms and details..." />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/contracts">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving || loadingOptions}
                className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                {saving ? "Saving..." : "Save Contract"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
