"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Zap, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";

export default function PusherSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Pusher Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Pusher</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-primary" /> 
                  Pusher Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1">Configure Pusher credentials for real-time notifications and chat.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pusher App ID <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter Pusher App ID" className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                </div>
                
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pusher App Key <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input type="text" placeholder="Enter Pusher App Key" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pusher App Secret <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input type="password" placeholder="••••••••••••••••" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pusher App Cluster <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input type="text" placeholder="e.g. ap2" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5 flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="text-primary focus:ring-primary h-4 w-4 rounded" />
                    <span className="text-xs font-bold text-gray-700">Use TLS (SSL)</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
