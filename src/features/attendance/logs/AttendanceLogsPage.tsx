"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AttendanceTimeline from "@/components/attendance/audit/AttendanceTimeline";
import { History, Calendar, FileCheck, Edit3, Cpu } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import { attendanceService, RawPunch } from "@/services/attendance/attendance.service";
import { useParams, useSearchParams } from "next/navigation";

export default function AttendanceAuditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const initialDate = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  
  const [date, setDate] = useState(initialDate);
  const [punches, setPunches] = useState<RawPunch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await attendanceService.getAuditLogs(employeeId, date);
      // For mock: provide raw data
      setPunches(response.data?.punches || [
        { id: 'p1', employee_id: employeeId, device_id: 'DEV-99', timestamp: `${date}T09:05:22`, type: 'check_in', status: 'processed', metadata: { ip: '192.168.1.50', auth_mode: 'Fingerprint' } },
        { id: 'p2', employee_id: employeeId, device_id: 'DEV-99', timestamp: `${date}T09:07:11`, type: 'check_in', status: 'ignored', metadata: { ip: '192.168.1.50', auth_mode: 'Face' } },
        { id: 'p3', employee_id: employeeId, device_id: 'DEV-44', timestamp: `${date}T18:15:45`, type: 'check_out', status: 'processed', metadata: { ip: '192.168.1.55', auth_mode: 'Card' } },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [date, employeeId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLogs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLogs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Punch Audit Log</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">
                Employee #{employeeId} / Raw Device Transactions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="form-control pl-10"
                />
             </div>
             <Button variant="primary">
                <Edit3 className="h-4 w-4 mr-2" /> Manual Override
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left Column: Timeline */}
           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Daily Timeline</h3>
              {loading ? (
                <div className="white-box py-20 flex flex-col items-center justify-center">
                   <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                <AttendanceTimeline punches={punches} />
              )}
           </div>

           {/* Right Column: Processing Summary */}
           <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Processed Record</h3>
              <div className="white-box p-6 border-l-4 border-success">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Final Decision</span>
                    <span className="label label-success">Present</span>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Approved Clock-In</p>
                       <p className="text-lg font-black text-gray-800">09:05 AM</p>
                    </div>
                    <div>
                       <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Approved Clock-Out</p>
                       <p className="text-lg font-black text-gray-800">06:15 PM</p>
                    </div>
                    <hr className="border-gray-50" />
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                       <FileCheck className="h-4 w-4 text-success" />
                       Synced to Payroll successfully
                    </div>
                 </div>
              </div>

              <div className="white-box p-6 bg-gray-900 text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Cpu className="h-16 w-16" />
                 </div>
                 <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-3">Processor Stats</h5>
                 <div className="space-y-2 text-xs font-medium">
                    <p>Total raw scans: {punches.length}</p>
                    <p>Ignored duplicates: {punches.filter(p => p.status === 'ignored').length}</p>
                    <p>Calculation engine: V2.1-ADMS</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
