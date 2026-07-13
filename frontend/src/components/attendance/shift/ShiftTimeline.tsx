"use client";

import { ShiftDefinition } from "@/lib/hr-utils";

interface ShiftTimelineProps {
  shift: ShiftDefinition;
}

export default function ShiftTimeline({ shift }: ShiftTimelineProps) {
  // Convert times to percentage for visual bar (assuming 24hr day)
  const getTimePercent = (time?: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  };

  const start = getTimePercent(shift.start_time);
  const end = getTimePercent(shift.end_time);
  const duration = end > start ? end - start : (100 - start) + end; // Handle overnight

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:59</span>
      </div>
      
      <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        {/* Grid Markers */}
        <div className="absolute inset-0 flex justify-between px-[2%]">
           {[...Array(24)].map((_, i) => (
             <div key={i} className="h-full w-px bg-white/20"></div>
           ))}
        </div>

        {/* Shift Bar */}
        <div 
          className="absolute h-full bg-primary rounded-full shadow-lg transition-all duration-1000"
          style={{ 
            left: `${start}%`, 
            width: `${duration}%`,
            opacity: 0.8
          }}
        >
          {/* Grace Period Marker (approximate) */}
          <div className="h-full w-2 bg-warning/60"></div>
        </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Shift</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Grace Period</span>
         </div>
      </div>
    </div>
  );
}
