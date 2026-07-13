"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  ShieldCheck, 
  RefreshCw, 
  Save, 
  Check, 
  Info,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Download
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GDPRPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [enableGdpr, setEnableGdpr] = useState("1");
  const [showLink, setShowLink] = useState("1");
  const [showFooter, setShowFooter] = useState("0");

  const menu = [
    { id: 'general', label: 'General Settings', icon: ShieldCheck },
    { id: 'consent', label: 'Consent Settings', icon: UserCheck },
    { id: 'right_of_access', label: 'Right of Access', icon: Eye },
    { id: 'right_to_erasure', label: 'Right to Erasure', icon: Download },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-12">
                <h4 className="page-title m-0">
                    <ShieldCheck className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    GDPR Settings
                </h4>
            </div>
        </div>

        <div className="panel panel-inverse white-box">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 border-r border-[#f2f2f3]">
                    <nav className="flex flex-col">
                        {menu.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center px-6 py-4 text-[12px] font-bold uppercase tracking-wider border-b border-[#f2f2f3] transition-all ${
                                    activeTab === item.id 
                                    ? 'bg-[#03a9f3] text-white' 
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                <item.icon className="h-4 w-4 mr-3" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 px-4 py-2">
                    <h3 className="box-title mb-8 border-b border-[#f2f2f3] pb-4">{menu.find(m => m.id === activeTab)?.label}</h3>
                    
                    {activeTab === 'general' && (
                        <div className="space-y-8 max-w-2xl">
                            <div className="form-group">
                                <label className="block text-[12px] font-bold text-gray-700 mb-4 uppercase">Enable GDPR</label>
                                <div className="flex space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="enable" checked={enableGdpr === "1"} onChange={() => setEnableGdpr("1")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="enable" checked={enableGdpr === "0"} onChange={() => setEnableGdpr("0")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">No</span>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-[#f2f2f3]" />

                            <div className="form-group">
                                <label className="block text-[12px] font-bold text-gray-700 mb-4 uppercase">Show GDPR Link in Customer Area</label>
                                <div className="flex space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="showLink" checked={showLink === "1"} onChange={() => setShowLink("1")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="showLink" checked={showLink === "0"} onChange={() => setShowLink("0")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">No</span>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-[#f2f2f3]" />

                            <div className="form-group">
                                <label className="block text-[12px] font-bold text-gray-700 mb-4 uppercase">Show GDPR Link in Footer</label>
                                <div className="flex space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="showFooter" checked={showFooter === "1"} onChange={() => setShowFooter("1")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="showFooter" checked={showFooter === "0"} onChange={() => setShowFooter("0")} className="mr-2" />
                                        <span className="text-[12px] font-bold uppercase">No</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group pt-4">
                                <label className="block text-[12px] font-bold text-gray-700 mb-2 uppercase">Information Block (Top)</label>
                                <textarea className="form-control min-h-[150px] py-4" defaultValue="GDPR is important for data privacy and security."></textarea>
                            </div>

                            <div className="form-actions pt-6 flex justify-start">
                                <Button className="btn-primary px-8">
                                    <Check className="h-4 w-4 mr-2" /> Submit
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'general' && (
                        <div className="py-20 text-center text-gray-400">
                            <Info className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">Configuration for {menu.find(m => m.id === activeTab)?.label} coming soon.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
