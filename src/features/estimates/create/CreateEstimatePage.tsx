"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface EstimateItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

type OptionRecord = {
  id: number | string;
  name?: string;
  currency_symbol?: string;
  currency_code?: string;
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
};

export default function CreateEstimatePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [clients, setClients] = useState<OptionRecord[]>([]);
  const [currencies, setCurrencies] = useState<OptionRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const validTill = "2026-06-07";

  const [formData, setFormData] = useState({
    client_id: "",
    currency_id: "",
    valid_till: validTill,
    discount: "0",
    note: "",
  });

  const [items, setItems] = useState<EstimateItem[]>([
    { item_name: "", quantity: 1, unit_price: 0, amount: 0 }
  ]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [clientRes, currRes] = await Promise.all([
          api.get("/client"),
          api.get("/currency"),
        ]);
        setClients(clientRes.data.data || []);
        setCurrencies(currRes.data.data || []);
      } catch (err) {
        console.error("Fetch Estimate Options Error:", err);
        showToast("Failed to load estimate options", "error");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index: number, field: keyof EstimateItem, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === "item_name" ? value : parseFloat(value) || 0,
    };
    updated[index].amount = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { item_name: "", quantity: 1, unit_price: 0, amount: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const subTotal = items.reduce((acc, i) => acc + i.amount, 0);
  const discount = parseFloat(formData.discount) || 0;
  const total = subTotal - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        client_id: formData.client_id,
        currency_id: formData.currency_id,
        valid_till: formData.valid_till,
        sub_total: subTotal,
        total: total,
        discount: discount,
        note: formData.note,
        estimate_items: items.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
      };

      await api.post("/estimate", payload);
      showToast("Estimate created successfully", "success");
      router.push("/estimates");
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create estimate."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Create Estimate</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span>/</span>
              <Link href="/estimates" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Estimates</Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Create</span>
            </div>
          </div>
          <Link href="/estimates">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" /><span>Back</span>
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">
              {error}
            </div>
          )}

          {/* Meta */}
          <Card className="p-6 shadow-sm border-gray-100 relative">
            {loadingOptions && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
            )}
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Estimate Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client <span className="text-red-500">*</span></label>
                <select name="client_id" value={formData.client_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer" required>
                  <option value="">Select Client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Currency <span className="text-red-500">*</span></label>
                <select name="currency_id" value={formData.currency_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer" required>
                  <option value="">Select Currency</option>
                  {currencies.map((c) => <option key={c.id} value={c.id}>{c.currency_symbol} {c.currency_code}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valid Till <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="valid_till" value={formData.valid_till} onChange={handleChange} type="date"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Discount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input name="discount" value={formData.discount} onChange={handleChange} type="number" step="0.01"
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                </div>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6 shadow-sm border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Line Items</h3>
              <Button type="button" onClick={addItem} className="bg-primary/10 text-primary text-[10px] font-black h-7 px-3 hover:bg-primary/20 transition-all">
                <Plus className="h-3 w-3 mr-1" />Add Item
              </Button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 mb-1">
                <span className="col-span-5 text-[9px] font-black text-gray-400 uppercase tracking-wider">Item</span>
                <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider">Qty</span>
                <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider">Unit Price</span>
                <span className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider">Amount</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.item_name} onChange={e => handleItemChange(i, "item_name", e.target.value)}
                    placeholder="Description" required
                    className="col-span-5 border-gray-200 rounded p-2 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                  <input value={item.quantity} onChange={e => handleItemChange(i, "quantity", e.target.value)} type="number" min="1"
                    className="col-span-2 border-gray-200 rounded p-2 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                  <input value={item.unit_price} onChange={e => handleItemChange(i, "unit_price", e.target.value)} type="number" step="0.01"
                    className="col-span-2 border-gray-200 rounded p-2 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                  <span className="col-span-2 text-xs font-black text-gray-600 pl-2">{item.amount.toFixed(2)}</span>
                  <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-600 transition-colors flex justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-60 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Subtotal</span><span>${subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Discount</span><span>-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-800 border-t pt-2">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Note */}
          <Card className="p-6 shadow-sm border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Note</h3>
            <textarea name="note" value={formData.note} onChange={handleChange}
              className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-24"
              placeholder="Additional notes..." />
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pb-6">
            <Link href="/estimates">
              <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || loadingOptions}
              className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
              {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              {saving ? "Saving..." : "Save Estimate"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
