"use client";

import SettingsLayout from "@/components/layout/SettingsLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, Plus, Trash2, Edit, DollarSign, Percent } from "lucide-react";
import { useState } from "react";

const initialCurrencies = [
  { id: 1, name: "US Dollar", code: "USD", symbol: "$" },
  { id: 2, name: "Euro", code: "EUR", symbol: "€" },
  { id: 3, name: "Indian Rupee", code: "INR", symbol: "₹" },
];

const initialTaxes = [
  { id: 1, name: "VAT", rate: 15 },
  { id: 2, name: "GST", rate: 18 },
];

export default function FinanceSettingsPage() {
  const [currencies] = useState(initialCurrencies);
  const [taxes] = useState(initialTaxes);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Finance Settings</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Manage currencies, tax rates, and payment terms</p>
           </div>
           <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" /> Save Changes
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card title="Currencies" className="border-none shadow-sm">
              <div className="space-y-4 pt-2">
                 <div className="divide-y divide-gray-50">
                    {currencies.map(c => (
                       <div key={c.id} className="flex items-center justify-between py-3 group">
                          <div className="flex items-center space-x-3">
                             <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs">
                                {c.symbol}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-gray-700">{c.name}</p>
                                <p className="text-[9px] font-black text-gray-300 uppercase">{c.code}</p>
                             </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-1.5 text-gray-400 hover:text-blue-500"><Edit className="h-3.5 w-3.5" /></button>
                             <button className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                    ))}
                 </div>
                 <Button className="w-full bg-gray-50 text-gray-400 border border-gray-100 border-dashed hover:border-primary/50 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest h-10">
                    <Plus className="h-3 w-3 mr-2" /> Add Currency
                 </Button>
              </div>
           </Card>

           <Card title="Tax Rates" className="border-none shadow-sm">
              <div className="space-y-4 pt-2">
                 <div className="divide-y divide-gray-50">
                    {taxes.map(t => (
                       <div key={t.id} className="flex items-center justify-between py-3 group">
                          <div className="flex items-center space-x-3">
                             <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                <Percent className="h-4 w-4" />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-gray-700">{t.name}</p>
                                <p className="text-[9px] font-black text-primary uppercase">{t.rate}%</p>
                             </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="p-1.5 text-gray-400 hover:text-blue-500"><Edit className="h-3.5 w-3.5" /></button>
                             <button className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                       </div>
                    ))}
                 </div>
                 <Button className="w-full bg-gray-50 text-gray-400 border border-gray-100 border-dashed hover:border-primary/50 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest h-10">
                    <Plus className="h-3 w-3 mr-2" /> Add Tax Rate
                 </Button>
              </div>
           </Card>
        </div>

        <Card title="Invoice Settings" className="border-none shadow-sm">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Prefix</label>
                 <input type="text" defaultValue="INV-" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Invoice Number</label>
                 <input type="number" defaultValue="1001" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due After (Days)</label>
                 <input type="number" defaultValue="30" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
              </div>
           </div>
        </Card>
      </div>
    </SettingsLayout>
  );
}
