"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import RosterCalendar from "@/components/attendance/roster/RosterCalendar";
import { CalendarDays, Filter, Download, Plus, Users } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function RosterManagementPage() {
  const [shifts] = useState([
    { id: 1, shift_name: "General", code: "GS" },
    { id: 2, shift_name: "Night", code: "NS" }
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Workforce Roster</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">Attendance / Shift Scheduling</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button className="btn-default">
                <Filter className="h-4 w-4 mr-2" /> Filter
             </Button>
             <Button className="btn-default">
                <Download className="h-4 w-4 mr-2" /> Export
             </Button>
             <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" /> Assign Shift
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
           {/* Sidebar: Roster Stats */}
           <div className="space-y-6">
              <div className="white-box p-6 border-l-4 border-primary">
                 <div className="flex items-center justify-between mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Coverage</span>
                 </div>
                 <div className="text-2xl font-black text-gray-800">42 / 50</div>
                 <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Active Staff Assigned</p>
              </div>

              <div className="white-box p-6">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-800 mb-4">Shift Distribution</h5>
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span>General Shift</span>
                          <span>80%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '80%' }}></div>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span>Night Shift</span>
                          <span>20%</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-warning rounded-full" style={{ width: '20%' }}></div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="white-box p-6 bg-gray-900 text-white">
                 <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Quick Actions</h5>
                 <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-primary"></div> Auto-Generate Roster
                    </button>
                    <button className="w-full text-left p-2 hover:bg-white/10 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-success"></div> Sync with Devices
                    </button>
                 </div>
              </div>
           </div>

           {/* Main Content: Calendar */}
           <div className="xl:col-span-3">
              <RosterCalendar shifts={shifts as any} employees={[]} />
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
