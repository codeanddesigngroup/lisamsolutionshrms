"use client";

import { RawPunch } from "@/services/attendance/attendance.service";
import { Clock, Cpu, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

interface AttendanceTimelineProps {
  punches: RawPunch[];
}

export default function AttendanceTimeline({ punches }: AttendanceTimelineProps) {
  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
      {punches.map((punch, index) => (
        <div key={punch.id} className="relative flex items-start gap-6 group">
          {/* Timeline Dot */}
          <div className={`mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-110 ${
            punch.type === 'check_in' ? 'bg-success text-white' : 'bg-warning text-white'
          }`}>
            <Clock className="h-4 w-4" />
          </div>

          {/* Punch Details */}
          <div className="flex-1 rounded-2xl border border-gray-50 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-black text-gray-800">
                    {punch.type === 'check_in' ? 'Clock In Scan' : 'Clock Out Scan'}
                  </h5>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    punch.status === 'processed' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {punch.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-gray-800">
                    <Clock className="h-3 w-3" />
                    {new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" />
                    Device ID: {punch.device_id}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {punch.status === 'processed' ? (
                   <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                   <AlertCircle className="h-5 w-5 text-gray-200" />
                )}
                <button className="p-2 text-gray-300 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors">
                   <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Metadata (IP, Location) */}
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Source IP</p>
                  <p className="text-[11px] font-bold text-gray-600">{punch.metadata?.ip || '192.168.1.50'}</p>
               </div>
               <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Recognition Type</p>
                  <p className="text-[11px] font-bold text-gray-600">{punch.metadata?.auth_mode || 'Fingerprint'}</p>
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
