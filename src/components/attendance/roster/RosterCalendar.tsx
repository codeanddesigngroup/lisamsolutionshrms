"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Clock } from "lucide-react";
import { ShiftDefinition } from "@/lib/hr-utils";

interface RosterCalendarProps {
  shifts: ShiftDefinition[];
  employees: any[];
}

export default function RosterCalendar({ shifts, employees }: RosterCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="white-box p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-4">
           <h4 className="text-sm font-black uppercase tracking-widest text-gray-800">{monthName} {currentDate.getFullYear()}</h4>
           <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight className="h-4 w-4" /></button>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary/20 border border-primary/30"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Morning</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-warning/20 border border-warning/30"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evening</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-32 border-r border-b border-gray-50 bg-gray-50/20"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
          
          return (
            <div key={day} className={`h-32 border-r border-b border-gray-50 p-2 hover:bg-gray-50/50 transition-colors group relative ${isToday ? 'bg-primary/5' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-gray-400'}`}>{day}</span>
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>}
              </div>
              
              <div className="space-y-1">
                {/* Mock Roster Entries */}
                {day % 3 === 0 && (
                  <div className="px-1.5 py-1 bg-primary/10 border border-primary/20 rounded text-[9px] font-black text-primary uppercase tracking-tighter truncate">
                    GS - 12 Staff
                  </div>
                )}
                {day % 5 === 0 && (
                  <div className="px-1.5 py-1 bg-warning/10 border border-warning/20 rounded text-[9px] font-black text-warning uppercase tracking-tighter truncate">
                    NS - 4 Staff
                  </div>
                )}
              </div>

              <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white shadow-sm rounded-lg border border-gray-100 text-primary transition-all scale-90 group-hover:scale-100">
                 <Clock className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
