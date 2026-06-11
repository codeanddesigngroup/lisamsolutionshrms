"use client";

import { AttendanceScanEvent } from "@/lib/realtime/attendance-events";
import { User, Clock, Cpu } from "lucide-react";

interface LiveScanCardProps {
  event: AttendanceScanEvent;
}

export default function LiveScanCard({ event }: LiveScanCardProps) {
  const isCheckIn = event.type === "check_in";
  
  return (
    <div className="animate-in slide-in-from-right duration-500 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100 shrink-0 overflow-hidden">
          {event.employeeImage ? (
            <img src={event.employeeImage} alt={event.employeeName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-sm font-black text-gray-800 truncate">{event.employeeName}</h5>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
              isCheckIn ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}>
              {event.type.replace('_', ' ')}
            </span>
          </div>
          
          <div className="mt-1 flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Cpu className="h-3 w-3" />
              {event.deviceLocation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
