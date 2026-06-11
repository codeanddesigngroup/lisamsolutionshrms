"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, FileText, Info, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function InvoiceSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Invoice Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Invoice Settings</span>
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
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" /> 
                    Invoice Configuration
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Customize the appearance and data on your invoices.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Save className="h-3.5 w-3.5 mr-2" /> Save Settings
                </Button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoice Prefix</label>
                    <input type="text" defaultValue="INV" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoice Digit Separator</label>
                    <input type="text" defaultValue="#" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoice Look Ahead</label>
                    <input type="number" defaultValue="0" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Due After (Days)</label>
                    <input type="number" defaultValue="15" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5 md:col-span-2 pt-4">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Invoice Terms</label>
                     <textarea className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all" defaultValue="Thank you for your business. Please process payment within the due date."></textarea>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Invoice Logo</h3>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-100 hover:border-primary transition-all group">
                   <div className="text-center group-hover:scale-110 transition-transform">
                     <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upload</span>
                   </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Recommended size: 250x50px.<br/>This logo will appear on PDF invoices.
                </p>
              </div>
            </Card>

            <Card className="p-6 border-blue-200 bg-blue-50/50 shadow-sm">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">Prefix Example:</h3>
                  <p className="text-xs text-blue-700 font-bold">INV#001</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
