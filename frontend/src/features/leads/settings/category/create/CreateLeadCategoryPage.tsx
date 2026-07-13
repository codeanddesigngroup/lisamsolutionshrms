"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateLeadCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/lead-category", { category_name: categoryName });
      router.push("/lead-settings");
      router.refresh();
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || "Failed to create lead category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add Lead Category</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span>/</span>
              <Link href="/lead-settings" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Lead Settings</Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Category</span>
            </div>
          </div>
          <Link href="/lead-settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" /><span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-2xl mx-auto shadow-sm border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">{error}</div>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input value={categoryName} onChange={e => setCategoryName(e.target.value)}
                  type="text" placeholder="e.g. Enterprise"
                  className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/lead-settings">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving}
                className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
