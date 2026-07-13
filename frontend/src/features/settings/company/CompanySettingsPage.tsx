"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Building, MapPin, Globe, Phone, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function CompanySettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Company Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Company</span>
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
                    <Building className="h-4 w-4 mr-2 text-primary" /> 
                    Company Details
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Manage your company's identity and contact information.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Save className="h-3.5 w-3.5 mr-2" /> Save Changes
                </Button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="text" defaultValue="Worksuite" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company Email <span className="text-red-500">*</span></label>
                    <input type="email" defaultValue="admin@worksuite.com" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="text" defaultValue="+1 234 567 890" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="url" defaultValue="https://worksuite.com" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400" />
                      <textarea className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none h-24 transition-all" defaultValue="123 Business Avenue, Tech District&#10;San Francisco, CA 94107"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Company Logo</h3>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-100 hover:border-primary transition-all group">
                   <div className="text-center group-hover:scale-110 transition-transform">
                     <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upload</span>
                   </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Recommended size: 250x50px.<br/>Formats: JPG, PNG, GIF.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
