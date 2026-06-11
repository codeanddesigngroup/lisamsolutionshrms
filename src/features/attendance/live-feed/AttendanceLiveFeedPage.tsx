"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import LiveScanCard from "@/components/attendance/live/LiveScanCard";
import { Activity, Radio, PlayCircle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useState, useCallback } from "react";
import { AttendanceScanEvent, useAttendanceScanListener, simulateScan } from "@/lib/realtime/attendance-events";

export default function LiveAttendanceFeed() {
  const [events, setEvents] = useState<AttendanceScanEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  const handleNewScan = useCallback((event: AttendanceScanEvent) => {
    if (!isLive) return;
    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50
  }, [isLive]);

  useAttendanceScanListener(handleNewScan);

  const clearFeed = () => setEvents([]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
               <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-6 w-6" />
               </div>
               {isLive && (
                 <span className="absolute top-0 right-0 h-3 w-3 bg-danger rounded-full border-2 border-white animate-pulse"></span>
               )}
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Attendance Live Stream</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">
                {isLive ? 'Real-time monitoring active' : 'Stream paused'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={simulateScan} className="btn-default">
                <PlayCircle className="h-4 w-4 mr-2" /> Simulate Scan
             </Button>
             <Button onClick={() => setIsLive(!isLive)} variant={isLive ? "secondary" : "primary"}>
                {isLive ? 'Pause Stream' : 'Resume Stream'}
             </Button>
             <Button onClick={clearFeed} className="btn-default text-danger border-danger/20 hover:bg-danger/10">
                <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* Live Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="white-box p-6 bg-primary text-white">
            <div className="text-3xl font-black">{events.length}</div>
            <div className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-80">Scans in session</div>
          </div>
          <div className="white-box p-6 border-l-4 border-success">
            <div className="text-3xl font-black text-success">
               {events.filter(e => e.type === 'check_in').length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Total Clock-In</div>
          </div>
          <div className="white-box p-6 border-l-4 border-warning">
            <div className="text-3xl font-black text-warning">
               {events.filter(e => e.type === 'check_out').length}
            </div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Total Clock-Out</div>
          </div>
          <div className="white-box p-6 border-l-4 border-info">
             <div className="flex items-center gap-2">
               <Radio className="h-5 w-5 text-info animate-pulse" />
               <span className="text-sm font-black text-gray-800">ADMS Sync Active</span>
             </div>
             <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Status: Stable</div>
          </div>
        </div>

        {/* Live Feed List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event, index) => (
            <LiveScanCard key={`${event.timestamp}-${index}`} event={event} />
          ))}
          
          {events.length === 0 && (
            <div className="col-span-full py-20 white-box flex flex-col items-center justify-center text-center">
               <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
                  <Radio className="h-8 w-8 text-gray-200" />
               </div>
               <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Waiting for hardware events...</h3>
               <p className="text-[10px] text-gray-400 uppercase font-bold mt-2">Try clicking "Simulate Scan" to test the realtime UI</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
