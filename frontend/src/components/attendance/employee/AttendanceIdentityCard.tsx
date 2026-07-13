"use client";

import { Cpu, Fingerprint, Activity, Clock } from "lucide-react";

interface AttendanceIdentityCardProps {
  biometricId: string | number;
  status: "active" | "inactive";
  lastScan?: string;
  assignedDevices?: string[];
}

export default function AttendanceIdentityCard({ 
  biometricId, 
  status, 
  lastScan, 
  assignedDevices = ["Main Gate", "Production Floor"] 
}: AttendanceIdentityCardProps) {
  const isActive = status === "active";

  return (
    <div className="white-box p-6 relative overflow-hidden group">
      {/* Background Icon Decor */}
      <div className="absolute -right-4 -bottom-4 text-gray-50 group-hover:text-primary/5 transition-colors duration-500">
        <Fingerprint className="h-32 w-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
              isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-gray-100 border-gray-200 text-gray-400"
            }`}>
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-sm font-black text-gray-800">Biometric Identity</h5>
              <div className="flex items-center gap-1.5">
                 <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-danger'}`}></span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">System ID</p>
             <p className="text-xl font-black text-gray-800 leading-none">#{biometricId}</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                 <Activity className="h-3 w-3" /> Assigned Infrastructure
              </p>
              <div className="flex flex-wrap gap-2">
                 {assignedDevices.map(device => (
                    <span key={device} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600">
                       {device}
                    </span>
                 ))}
              </div>
           </div>

           <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400">
                 <Clock className="h-4 w-4" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Last Activity</span>
              </div>
              <span className="text-[10px] font-black text-gray-800">{lastScan || "Never"}</span>
           </div>
        </div>
      </div>
    </div>
  );
}
