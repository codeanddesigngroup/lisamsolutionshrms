"use client";

import SettingsLayout from "@/components/layout/SettingsLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, Clock, MapPin, Monitor } from "lucide-react";
import { useState } from "react";

export default function AttendanceSettingsPage() {
  const [allowIp, setAllowIp] = useState(false);
  const [allowGeo, setAllowGeo] = useState(true);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Attendance Settings</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Configure office timings and attendance policies</p>
           </div>
           <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" /> Save Changes
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card title="Timing Configurations" className="border-none shadow-sm">
              <div className="space-y-4 pt-2">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Start Time</label>
                       <input type="time" defaultValue="09:00" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office End Time</label>
                       <input type="time" defaultValue="18:00" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Late Mark After (Minutes)</label>
                    <input type="number" defaultValue="15" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                 </div>
              </div>
           </Card>

           <Card title="Restricted Attendance" className="border-none shadow-sm">
              <div className="space-y-6 pt-2">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                          <Monitor className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-700">Allow only specific IPs</p>
                          <p className="text-[10px] text-gray-400 font-medium">Restrict clock-in to office network</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => setAllowIp(!allowIp)}
                       className={`w-12 h-6 rounded-full transition-colors relative ${allowIp ? "bg-primary" : "bg-gray-200"}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowIp ? "left-7" : "left-1"}`} />
                    </button>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                          <MapPin className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-gray-700">Geofencing Attendance</p>
                          <p className="text-[10px] text-gray-400 font-medium">Clock-in based on user location</p>
                       </div>
                    </div>
                    <button 
                       onClick={() => setAllowGeo(!allowGeo)}
                       className={`w-12 h-6 rounded-full transition-colors relative ${allowGeo ? "bg-primary" : "bg-gray-200"}`}
                    >
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${allowGeo ? "left-7" : "left-1"}`} />
                    </button>
                 </div>
              </div>
           </Card>
        </div>

        <Card title="Working Days" className="border-none shadow-sm">
           <div className="flex flex-wrap gap-3 pt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                 <button 
                    key={day}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       day !== "Sun" ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 text-gray-300 border border-gray-100"
                    }`}
                 >
                    {day}
                 </button>
              ))}
           </div>
        </Card>
      </div>
    </SettingsLayout>
  );
}
