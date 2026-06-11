"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Ticket, Plus, Edit, Trash2, Users, MessageSquare, Layers, Radio } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TicketSettingsPage() {
  const [activeTab, setActiveTab] = useState("types");

  const configRecords = {
    types: [
      { id: 1, name: "Question", detail: "General support question", status: "active" },
      { id: 2, name: "Incident", detail: "Break/fix support issue", status: "active" },
      { id: 3, name: "Problem", detail: "Recurring product issue", status: "active" },
      { id: 4, name: "Feature Request", detail: "Enhancement request", status: "active" },
    ],
    channels: [
      { id: 1, name: "Email", detail: "support@example.com", status: "active" },
      { id: 2, name: "Phone", detail: "Manual phone intake", status: "active" },
      { id: 3, name: "Facebook", detail: "Social support inbox", status: "inactive" },
      { id: 4, name: "Website Form", detail: "Ticket form submissions", status: "active" },
    ],
    groups: [
      { id: 1, name: "Technical Support", detail: "Dashboard, hosting, integrations", status: "active" },
      { id: 2, name: "Billing Support", detail: "Invoices, payment proof, credits", status: "active" },
      { id: 3, name: "HR Support", detail: "Attendance, leaves, payroll", status: "active" },
    ],
    agents: [
      { id: 1, name: "Admin User", detail: "Technical Support, Billing Support", status: "active" },
      { id: 2, name: "HR Manager", detail: "HR Support", status: "active" },
      { id: 3, name: "Finance Lead", detail: "Billing Support", status: "active" },
    ],
    replies: [
      { id: 1, name: "Initial Response", detail: "Acknowledges receipt and sets expectations", status: "active" },
      { id: 2, name: "Need More Information", detail: "Requests logs, screenshots, and steps", status: "active" },
      { id: 3, name: "Resolved", detail: "Confirms fix and next steps", status: "active" },
    ],
  };

  const tabMeta = {
    types: { label: "Ticket Types", icon: Ticket, singular: "type" },
    channels: { label: "Ticket Channels", icon: Radio, singular: "channel" },
    groups: { label: "Ticket Groups", icon: Layers, singular: "group" },
    agents: { label: "Ticket Agents", icon: Users, singular: "agent" },
    replies: { label: "Reply Templates", icon: MessageSquare, singular: "template" },
  };

  const currentMeta = tabMeta[activeTab as keyof typeof tabMeta];
  const records = configRecords[activeTab as keyof typeof configRecords];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Ticket Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Ticket Settings</span>
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
                {[
                  { id: "types", label: "Ticket Types" },
                  { id: "channels", label: "Ticket Channels" },
                  { id: "groups", label: "Ticket Groups" },
                  { id: "agents", label: "Ticket Agents" },
                  { id: "replies", label: "Reply Templates" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded text-sm font-bold transition-colors flex items-center justify-between ${
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Config List */}
          <div className="lg:col-span-3">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <Ticket className="h-4 w-4 mr-2 text-primary" /> 
                    Manage {currentMeta.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure {currentMeta.label.toLowerCase()} for the support ticketing system.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Plus className="h-3.5 w-3.5 mr-2" /> Add {currentMeta.singular}
                </Button>
              </div>

              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Detail</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{item.name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{item.detail}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${item.status === "active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            {item.status}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
