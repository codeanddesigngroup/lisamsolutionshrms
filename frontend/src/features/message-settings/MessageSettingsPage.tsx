"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, MessageSquare, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export default function MessageSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Message Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Messages</span>
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
                  <MessageSquare className="h-4 w-4 mr-2 text-primary" /> 
                  Chat & Communication Settings
                </h3>
                <p className="text-xs text-gray-500 mt-1">Manage how users communicate within the application.</p>
              </div>
              <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                <Save className="h-3.5 w-3.5 mr-2" /> Save Settings
              </Button>
            </div>

            <div className="p-8 space-y-8">
              {/* Allow Client Messaging */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 max-w-md">
                  <h4 className="text-sm font-bold text-gray-700">Allow Clients to Message Employees</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Enable this to allow direct communication between your clients and assigned project team members.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Chat Status */}
              <div className="flex items-start justify-between pt-8 border-t border-gray-50">
                <div className="space-y-1 max-w-md">
                  <h4 className="text-sm font-bold text-gray-700">Chat Status (Online/Offline)</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Show user presence status in the message module.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Max Attachment Size */}
              <div className="pt-8 border-t border-gray-50 space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Max File Attachment Size (MB)</h4>
                <p className="text-xs text-gray-500">Define the maximum file size users can send in messages.</p>
                <div className="relative max-w-xs">
                   <input type="number" defaultValue="5" className="w-full border-gray-200 rounded p-2.5 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
