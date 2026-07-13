"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Languages, Plus, Edit, Trash2, Globe } from "lucide-react";
import Link from "next/link";

export default function LanguageSettingsPage() {
  const languages = [
    { name: "English", code: "en", status: "Active" },
    { name: "Spanish", code: "es", status: "Active" },
    { name: "French", code: "fr", status: "Inactive" },
    { name: "Arabic", code: "ar", status: "Inactive" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Language Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Language Settings</span>
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
                    <Languages className="h-4 w-4 mr-2 text-primary" /> 
                    Manage Languages
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Enable or disable languages for the system interface.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-4 h-8 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Language
                </Button>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Language Name</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Code</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {languages.map((lang) => (
                      <tr key={lang.code} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{lang.name}</td>
                        <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{lang.code}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                             lang.status === "Active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                           }`}>
                             {lang.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-blue-400 hover:text-blue-600 transition-colors p-1"><Edit className="h-4 w-4" /></button>
                            <button className="text-red-400 hover:text-red-600 transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
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
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-2">Auto Translate</h3>
                  <p className="text-xs text-blue-700 leading-relaxed mb-4">
                    Use Google Translate API to automatically translate missing strings in your language files.
                  </p>
                  <Button className="w-full bg-blue-500 text-white text-[10px] font-bold h-9 uppercase tracking-widest hover:bg-blue-600 border-none transition-all">
                    Translate Missing Strings
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
