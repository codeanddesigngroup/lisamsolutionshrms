"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { AlertTriangle, ArrowLeft, Edit, FileText, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

type TaxRate = {
  id: number;
  name: string;
  rate: string;
};

const initialTaxes: TaxRate[] = [
  { id: 1, name: "VAT", rate: "10" },
  { id: 2, name: "GST", rate: "18" },
  { id: 3, name: "Sales Tax", rate: "5" },
];

export default function TaxesSettingsPage() {
  const { showToast } = useToast();
  const [taxes, setTaxes] = useState(initialTaxes);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rate: "" });

  const openEditor = (tax?: TaxRate) => {
    setEditingTax(tax || null);
    setForm(tax ? { name: tax.name, rate: tax.rate } : { name: "", rate: "" });
    setIsEditorOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingTax) {
      setTaxes((prev) => prev.map((tax) => tax.id === editingTax.id ? { ...tax, ...form } : tax));
      showToast("Tax rate updated locally. PHP endpoint should persist it.", "success");
    } else {
      setTaxes((prev) => [...prev, { id: Date.now(), ...form }]);
      showToast("Tax rate added locally. PHP endpoint should persist it.", "success");
    }
    setIsEditorOpen(false);
  };

  const deleteTax = () => {
    if (!deletingTaxId) return;
    setTaxes((prev) => prev.filter((tax) => tax.id !== deletingTaxId));
    setDeletingTaxId(null);
    showToast("Tax rate deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Tax Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Taxes</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Tax Rates
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Manage the tax rates applied to your invoices and estimates.</p>
                </div>
                <Button onClick={() => openEditor()} className="bg-primary/10 text-primary border-none text-[10px] font-bold px-4 h-8 uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Tax
                </Button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Tax Name</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Rate (%)</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {taxes.map((tax) => (
                      <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{tax.name}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-600">{tax.rate}%</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => openEditor(tax)} className="text-blue-400 hover:text-blue-600 transition-colors p-1" title="Edit tax"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setDeletingTaxId(tax.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="Delete tax"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-blue-200 bg-blue-50/50 shadow-sm">
              <h3 className="text-sm font-bold text-blue-800 mb-2">How Taxes Work</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Taxes added here will be available to select when creating new invoices, estimates, or expenses. You can add multiple tax rates to a single item.
              </p>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingTax ? "Edit Tax" : "Add Tax"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Tax name" />
          <input required type="number" min="0" step="0.01" value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Rate percentage" />
          <div className="flex gap-3 pt-3">
            <Button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingTaxId} onClose={() => setDeletingTaxId(null)} title="Delete Tax" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium text-gray-500">This tax rate will no longer be available for new billing documents.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingTaxId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={deleteTax} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
