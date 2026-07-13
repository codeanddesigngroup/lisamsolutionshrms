"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, ShoppingBag, DollarSign } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    purchase_allow: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        purchase_allow: formData.purchase_allow,
        taxes: "[]" // Default empty taxes for now
      };

      // Mock testing bypass
      if (localStorage.getItem("token") === "mock_token_12345") {
        setTimeout(() => {
          router.push("/products");
          router.refresh();
        }, 800);
        return;
      }

      await api.post("/product", payload);
      router.push("/products");
      router.refresh();
    } catch (err: any) {
      console.error("Create Product Error:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Product</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/products" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Products</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Product</span>
            </div>
          </div>
          <Link href="/products">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500 animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Product Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="e.g. Website Hosting (1 Year)"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 flex items-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="purchase_allow"
                    checked={formData.purchase_allow}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary/20"
                  />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Allow client to purchase</span>
                </label>
              </div>

            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description <span className="text-red-500">*</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all"
                placeholder="Product description..."
                required
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/products">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
