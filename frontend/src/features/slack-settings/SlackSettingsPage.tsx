"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, MessageSquare, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export default function SlackSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Slack Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Slack</span>
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
                    <MessageSquare className="h-4 w-4 mr-2 text-primary" /> 
                    Slack Integration
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Receive system notifications directly in your Slack channels.</p>
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
                    <Save className="h-3.5 w-3.5 mr-2" /> Save Settings
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="h-12 w-12 bg-white rounded p-2 flex items-center justify-center border border-gray-100">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" alt="Slack" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Slack Webhook Configuration</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Incoming Webhooks are a simple way to post messages from external sources into Slack.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Slack Webhook URL <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input type="text" placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 space-y-4">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Notification Events</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["Project Created", "Task Assigned", "Payment Received", "Leave Request", "Attendance Alert"].map((event) => (
                        <div key={event} className="flex items-center justify-between p-3 bg-gray-50/50 rounded border border-gray-50">
                          <span className="text-xs font-bold text-gray-700">{event}</span>
                          <label className="relative inline-flex items-center cursor-pointer scale-75">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      ))}
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
                  <h3 className="text-sm font-bold text-blue-800 mb-2">How to get Webhook?</h3>
                  <p className="text-xs text-blue-700 leading-relaxed mb-4">
                    1. Go to your Slack App Dashboard.<br/>
                    2. Select your App.<br/>
                    3. Click on "Incoming Webhooks".<br/>
                    4. Activate Incoming Webhooks.<br/>
                    5. Click "Add New Webhook to Workspace".
                  </p>
                  <Button className="w-full bg-blue-500 text-white text-[10px] font-bold h-9 uppercase tracking-widest hover:bg-blue-600 border-none transition-all">
                    Slack Documentation
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
