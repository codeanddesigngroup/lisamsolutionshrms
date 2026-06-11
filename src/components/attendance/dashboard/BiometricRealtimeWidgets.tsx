"use client";

import { useEffect, useState } from "react";
import { Cpu, Users, Activity, AlertCircle, CheckCircle2, Monitor } from "lucide-react";
import { useAttendanceEvents } from "@/lib/realtime/attendance-events";
import Card from "@/components/ui/Card";
import { devicesService, AttendanceDevice } from "@/services/attendance/devices.service";

export default function BiometricRealtimeWidgets() {
  const { latestScan, sessionStats } = useAttendanceEvents();
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devicesService.listDevices().then(response => {
      setDevices(response.data || []);
      setLoading(false);
    }).catch(() => {
      setDevices([]);
      setLoading(false);
    });
  }, []);

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Workforce Presence (Real-time) */}
      <Card className="border-none bg-white p-5 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Users className="h-16 w-16 text-primary" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Live Presence</p>
          <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-black text-gray-800">{sessionStats.clockIns}</h3>
             <span className="text-xs font-bold text-gray-400">Staff Present</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (sessionStats.clockIns / 50) * 100)}%` }}
                ></div>
             </div>
             <span className="text-[10px] font-black text-primary">Live</span>
          </div>
        </div>
      </Card>

      {/* Hardware Health */}
      <Card className="border-none bg-white p-5 shadow-sm group">
        <div className="flex items-start justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Hardware Health</p>
              <h3 className="text-2xl font-black text-gray-800">{onlineDevices}/{devices.length}</h3>
              <p className="text-[10px] font-bold text-success uppercase tracking-widest mt-1">Systems Online</p>
           </div>
           <div className={`p-3 rounded-xl ${offlineDevices > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
              <Cpu className="h-6 w-6" />
           </div>
        </div>
        {offlineDevices > 0 && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">
             <AlertCircle className="h-3 w-3" /> {offlineDevices} Device(s) Unreachable
          </div>
        )}
      </Card>

      {/* Latest Activity Ticker */}
      <Card className="border-none bg-white p-5 shadow-sm lg:col-span-2 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-800">Latest Gateway Activity</p>
           </div>
           <span className="flex h-2 w-2 rounded-full bg-success animate-ping"></span>
        </div>
        
        {latestScan ? (
          <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100 animate-in slide-in-from-right-4">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-primary shadow-sm">
                   {latestScan.employeeName.charAt(0)}
                </div>
                <div>
                   <p className="text-xs font-black text-gray-800">{latestScan.employeeName}</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{latestScan.deviceLocation}</p>
                </div>
             </div>
             <div className="text-right">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${latestScan.type === 'check_in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                   {latestScan.type.replace('_', ' ')}
                </span>
                <p className="text-[9px] font-bold text-gray-400 mt-1">{new Date(latestScan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-gray-50 rounded-2xl">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Listening for biometric pulses...</p>
          </div>
        )}
      </Card>
    </div>
  );
}
