"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Calendar, ShieldCheck, Info, Globe } from "lucide-react";
import Link from "next/link";

export default function GoogleCalendarSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Google Calendar Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Google Calendar</span>
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
                    <Calendar className="h-4 w-4 mr-2 text-primary" /> 
                    Google Calendar Integration
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Sync your company events and tasks with Google Calendar.</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                    <Save className="h-3.5 w-3.5 mr-2" /> Save Config
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="h-12 w-12 bg-white rounded p-2 flex items-center justify-center border border-gray-100">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Google API Configuration</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Enter your Google Console project credentials to enable sync.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Client ID <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="text" placeholder="Enter Client ID" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Client Secret <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="password" placeholder="••••••••••••••••" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2 pt-4">
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                       <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         <Globe className="h-3 w-3 mr-1.5" /> Authorized Redirect URI
                       </h5>
                       <div className="flex items-center justify-between">
                         <code className="text-[11px] text-primary font-bold">https://yourdomain.com/google-auth/callback</code>
                         <button className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Copy URL</button>
                       </div>
                    </div>
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
                  <h3 className="text-sm font-bold text-blue-800 mb-2">Instructions:</h3>
                  <p className="text-xs text-blue-700 leading-relaxed mb-4">
                    1. Create a project in Google Cloud Console.<br/>
                    2. Enable Google Calendar API.<br/>
                    3. Create OAuth 2.0 Credentials.<br/>
                    4. Add the redirect URI shown here.<br/>
                    5. Copy the Client ID and Secret back here.
                  </p>
                  <Button className="w-full bg-blue-500 text-white text-[10px] font-bold h-9 uppercase tracking-widest hover:bg-blue-600 border-none transition-all">
                    Help Center Article
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
