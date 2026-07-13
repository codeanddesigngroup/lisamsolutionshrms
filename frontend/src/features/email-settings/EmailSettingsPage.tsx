"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Mail, ShieldCheck, Server, Send, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EmailSettingsPage() {
  const [driver, setDriver] = useState("smtp");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Email Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Email</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="bg-blue-500 text-white border-none text-[10px] h-8 px-3 hover:bg-blue-600 shadow-sm shadow-blue-200 uppercase tracking-widest font-bold">
              <Send className="h-3 w-3 mr-1.5" />
              <span>Send Test Email</span>
            </Button>
            <Link href="/settings">
              <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span>Back to Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary" /> 
                    SMTP / Mail Configuration
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure how the system sends emails to users and clients.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Save className="h-3.5 w-3.5 mr-2" /> Save Settings
                </Button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Driver</label>
                    <select 
                      value={driver} 
                      onChange={(e) => setDriver(e.target.value)}
                      className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="smtp">SMTP</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                      <option value="sendmail">Sendmail</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail From Name <span className="text-red-500">*</span></label>
                    <input type="text" defaultValue="Worksuite" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail From Email <span className="text-red-500">*</span></label>
                    <input type="email" defaultValue="notifications@worksuite.com" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Host</label>
                    <div className="relative">
                      <Server className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="text" defaultValue="smtp.mailtrap.io" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Port</label>
                    <input type="number" defaultValue="2525" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Username</label>
                    <input type="text" placeholder="Enter username" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="password" placeholder="••••••••" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mail Encryption</label>
                    <select className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all">
                      <option>None</option>
                      <option>SSL</option>
                      <option selected>TLS</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-blue-200 bg-blue-50/50 shadow-sm">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-2">SMTP Setup</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    If you are using Gmail for SMTP, you must create an "App Password" in your Google Account security settings.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
