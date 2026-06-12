"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, Layout, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ModuleSettingsPage() {
  const [activeTab, setActiveTab] = useState("admin");

  const modules = [
    { id: "clients", name: "Clients", description: "Manage your client base and contacts." },
    { id: "employees", name: "Employees", description: "Track employee profiles and attendance." },
    { id: "projects", name: "Projects", description: "Project management and tracking." },
    { id: "tasks", name: "Tasks", description: "Task assignment and management." },
    { id: "leads", name: "Leads", description: "Sales lead management and CRM." },
    { id: "finance", name: "Finance", description: "Invoices, estimates, and payments." },
    { id: "attendance", name: "Attendance", description: "Track employee daily attendance." },
    { id: "leaves", name: "Leaves", description: "Manage employee leave requests." },
    { id: "messages", name: "Messages", description: "Internal communication system." },
    { id: "events", name: "Events", description: "Company event calendar." },
    { id: "products", name: "Products", description: "Manage products and inventory." },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Module Settings</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Modules</span>
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
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">User Roles</h3>
              </div>
              <div className="p-2 space-y-1">
                {["admin", "employee", "client"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveTab(role)}
                    className={`w-full text-left px-4 py-3 rounded text-sm font-bold transition-colors flex items-center justify-between capitalize ${
                      activeTab === role
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{role} Modules</span>
                    {activeTab === role && <CheckCircle className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Module List */}
          <div className="lg:col-span-3">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <Layout className="h-4 w-4 mr-2 text-primary" /> 
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Modules
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Enable or disable features accessible to {activeTab} users.</p>
                </div>
                <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                  <Save className="h-3.5 w-3.5 mr-2" /> Save Changes
                </Button>
              </div>

              <div className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-50 border-t border-gray-50">
                  {modules.map((module) => (
                    <div key={module.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-800">{module.name}</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                        {module.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
