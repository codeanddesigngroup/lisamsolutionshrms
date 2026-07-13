"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Settings as SettingsIcon, Globe, Clock, Languages, Calendar } from "lucide-react";
import Link from "next/link";

export default function AppSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">App Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">App Settings</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                  <SettingsIcon className="h-4 w-4 mr-2 text-primary" /> 
                  General Application Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1">Configure global application settings like timezone, date format, and language.</p>
              </div>
              <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                <Save className="h-3.5 w-3.5 mr-2" /> Save Settings
              </Button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timezone</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <select className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white">
                      <option>UTC (Coordinated Universal Time)</option>
                      <option selected>Asia/Kolkata (IST)</option>
                      <option>America/New_York (EST)</option>
                      <option>Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date Format</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <select className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white">
                      <option selected>Y-m-d (2026-05-04)</option>
                      <option>d-m-Y (04-05-2026)</option>
                      <option>m/d/Y (05/04/2026)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Default Language</label>
                  <div className="relative">
                    <Languages className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <select className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white">
                      <option selected>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Currency Position</label>
                  <select className="w-full border-gray-200 rounded p-2.5 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white">
                    <option selected>Left ($ 100)</option>
                    <option>Right (100 $)</option>
                    <option>Left with space ($ 100)</option>
                    <option>Right with space (100 $)</option>
                  </select>
                </div>

                <div className="flex items-start justify-between pt-4 md:col-span-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-700">Enable Google Calendar Sync</h4>
                    <p className="text-xs text-gray-500">Allow users to sync their tasks and events with Google Calendar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
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
