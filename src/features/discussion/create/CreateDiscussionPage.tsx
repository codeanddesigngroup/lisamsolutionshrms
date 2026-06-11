"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateDiscussionPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category_id: "",
    description: "",
    is_private: false,
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get("/discussion-category");
        setCategories(res.data.data || []);
      } catch {
        setCategories([
          { id: 1, category_name: "General" },
          { id: 2, category_name: "Technical" },
        ]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        is_private: formData.is_private ? 1 : 0,
      };
      if (formData.category_id) payload.category_id = formData.category_id;

      if (localStorage.getItem("token") === "mock_token_12345") {
        setTimeout(() => { router.push("/discussion"); router.refresh(); }, 800);
        return;
      }
      await api.post("/discussion", payload);
      router.push("/discussion");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create discussion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Start Discussion</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span>/</span>
              <Link href="/discussion" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Discussions</Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">New</span>
            </div>
          </div>
          <Link href="/discussion">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" /><span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-3xl mx-auto shadow-sm border-gray-100 relative">
          {loadingOptions && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">{error}</div>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Title <span className="text-red-500">*</span></label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input name="title" value={formData.title} onChange={handleChange}
                  type="text" placeholder="Discussion topic..."
                  className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
              <select name="category_id" value={formData.category_id} onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                <option value="">Select Category (Optional)</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-36 transition-all"
                placeholder="Describe the topic in detail..." />
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="is_private" checked={formData.is_private} onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary/20" />
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Private discussion (visible to admins only)</span>
            </label>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/discussion">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving || loadingOptions}
                className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                {saving ? "Saving..." : "Post Discussion"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
