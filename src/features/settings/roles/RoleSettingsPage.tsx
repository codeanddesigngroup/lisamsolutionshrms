"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsLayout from "@/components/layout/SettingsLayout";
import Link from "next/link";
import { Users, Key, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

const roles = [
  { id: 1, name: "Admin", members: 1 },
  { id: 2, name: "Employee", members: 12 },
  { id: 3, name: "Client", members: 8 },
];

const modules = [
  { name: "Projects", permissions: ["Add", "View", "Update", "Delete"] },
  { name: "Tasks", permissions: ["Add", "View", "Update", "Delete"] },
  { name: "Attendance", permissions: ["Add", "View", "Update", "Delete"] },
  { name: "Leaves", permissions: ["Add", "View", "Update", "Delete"] },
  { name: "Invoices", permissions: ["Add", "View", "Update", "Delete"] },
  { name: "Time Logs", permissions: ["Add", "View", "Update", "Delete"] },
];

export default function RolesPermissionPage() {
  const [expandedRole, setExpandedRole] = useState<number | null>(1);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-0 gap-3">
          <h1 className="text-base font-semibold text-gray-700">Roles & Permission</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <span>Add Role</span><Plus className="h-3.5 w-3.5" />
            </button>
            <ol className="flex text-sm text-gray-500 space-x-1">
              <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
              <li>/</li>
              <li className="text-gray-700">Roles & Permission</li>
            </ol>
          </div>
        </div>

        <SettingsLayout>
          <div className="p-6">
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-800 p-4 flex flex-wrap items-center justify-between gap-4">
                    <h5 className="text-white font-bold text-sm">{role.name}</h5>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 bg-red-500/20 text-red-100 text-[10px] px-3 py-1 rounded-full border border-red-500/30 hover:bg-red-500/40 transition-colors">
                        <Users className="h-3 w-3" />
                        <span>{role.members} Member(s)</span>
                      </button>
                      <button 
                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                        className="flex items-center space-x-1 bg-white/10 text-white text-[10px] px-3 py-1 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                      >
                        <Key className="h-3 w-3" />
                        <span>Permissions</span>
                        {expandedRole === role.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {expandedRole === role.id && (
                    <div className="p-0 animate-in fade-in slide-in-from-top-2 duration-300">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 font-bold text-gray-600 uppercase w-1/3">Module</th>
                            <th className="px-4 py-4 font-bold text-gray-600 uppercase text-center">Add</th>
                            <th className="px-4 py-4 font-bold text-gray-600 uppercase text-center">View</th>
                            <th className="px-4 py-4 font-bold text-gray-600 uppercase text-center">Update</th>
                            <th className="px-4 py-4 font-bold text-gray-600 uppercase text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {modules.map((mod) => (
                            <tr key={mod.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-700">{mod.name}</td>
                              {mod.permissions.map((p) => (
                                <td key={p} className="px-4 py-4 text-center">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={role.id === 1} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                  </label>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SettingsLayout>
      </div>
    </DashboardLayout>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
