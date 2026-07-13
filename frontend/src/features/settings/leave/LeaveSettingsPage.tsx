"use client";

import SettingsLayout from "@/components/layout/SettingsLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, Plus, Trash2, Edit } from "lucide-react";
import { useState } from "react";

const initialLeaveTypes = [
  { id: 1, name: "Casual Leave", count: 12, color: "bg-blue-500" },
  { id: 2, name: "Sick Leave", count: 8, color: "bg-red-500" },
  { id: 3, name: "Earned Leave", count: 15, color: "bg-green-500" },
];

export default function LeaveSettingsPage() {
  const [leaveTypes, setLeaveTypes] = useState(initialLeaveTypes);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Leave Settings</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Manage leave types and annual quotas</p>
           </div>
           <div className="flex space-x-3">
              <Button className="bg-white text-primary border border-primary/20 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-primary/5 transition-all">
                 <Plus className="h-4 w-4 mr-2" /> Add Type
              </Button>
              <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                 <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
           <Card title="Leave Types" className="border-none shadow-sm">
              <div className="overflow-x-auto -mx-6">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-y border-gray-50">
                       <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type Name</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Annual Count</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {leaveTypes.map((type) => (
                          <tr key={type.id} className="hover:bg-gray-50/30 transition-colors group">
                             <td className="px-6 py-4">
                                <span className="text-xs font-bold text-gray-700">{type.name}</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-xs font-black text-gray-900">{type.count} Days</span>
                             </td>
                             <td className="px-6 py-4">
                                <div className={`h-4 w-12 rounded-full ${type.color}`} />
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit className="h-4 w-4" /></button>
                                   <button className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>

           <Card title="Leave Policies" className="border-none shadow-sm">
              <div className="space-y-6 pt-2">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-bold text-gray-700">Auto-approve Leave Requests</p>
                       <p className="text-[10px] text-gray-400 font-medium">Requests will be approved automatically if no conflict</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-gray-200 relative transition-colors">
                       <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all" />
                    </button>
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-bold text-gray-700">Carry Forward Remaining Leaves</p>
                       <p className="text-[10px] text-gray-400 font-medium">Unused leaves will be added to next year's quota</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-primary relative transition-colors">
                       <div className="absolute top-1 left-7 w-4 h-4 rounded-full bg-white transition-all" />
                    </button>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
