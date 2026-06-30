"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, FileText } from "lucide-react";
import Link from "next/link";

export default function ProjectSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Project Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Project Settings</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Configuration</h3>
              </div>
              <div className="p-2 space-y-1">
                <div className="w-full rounded bg-primary px-4 py-3 text-sm font-bold text-white">Project Reminders</div>
              </div>
            </Card>
          </div>

          {/* Config Content */}
          <div className="lg:col-span-3">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" /> 
                    Manage Project Reminders
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure reminders for your projects.</p>
                </div>
              </div>

              <div className="p-0">
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-sm font-bold text-gray-700">Send Project Reminders</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">Automatically send email reminders to project members before the deadline.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <Button className="bg-primary text-white text-[10px] font-bold px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
                        <Save className="h-4 w-4 mr-2" />
                        Save Reminders
                      </Button>
                    </div>
                  </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
