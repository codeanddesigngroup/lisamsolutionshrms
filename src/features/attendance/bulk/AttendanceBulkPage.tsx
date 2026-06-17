"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  ArrowLeft, 
  Save, 
  Users, 
  Building2, 
  Clock, 
  MapPin,
  ChevronDown,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type TeamRecord = {
  id: number | string;
  team_name?: string;
  name?: string;
};

type EmployeeRecord = {
  id: number | string;
  name: string;
  employee_detail?: {
    department?: { id?: number | string; team_name?: string };
    shift_type_id?: number | string;
    shift_type?: {
      id?: number | string;
      shift_name?: string;
      code?: string;
      start_time?: string;
      end_time?: string;
      late_grace_minutes?: number;
      half_day_mark_time?: string;
      min_hours?: number;
    };
  };
};

type HolidayRecord = {
  date: string;
};

type AttendanceSettingsRecord = {
  office_open_days?: number[] | string;
};

const toDateString = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const parseOfficeOpenDays = (value: unknown) => {
  if (Array.isArray(value)) return value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [1, 2, 3, 4, 5];
    } catch {
      return [1, 2, 3, 4, 5];
    }
  }
  return [1, 2, 3, 4, 5];
};

export default function BulkAttendancePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [officeOpenDays, setOfficeOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  
  // Form State
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [clockIn, setClockIn] = useState("09:00");
  const [clockOut, setClockOut] = useState("18:00");
  const [isLate, setIsLate] = useState(false);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [workingFrom, setWorkingFrom] = useState("Office");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, empRes, holidayRes, settingsRes] = await Promise.all([
          api.get("/team"),
          api.get("/employee"),
          api.get("/holidays"),
          api.get("/attendance-settings"),
        ]);
        
        setTeams(teamsRes.data.data || []);
        setEmployees(empRes.data.data || []);
        setHolidays(holidayRes.data.data || []);
        const settingsRecords = settingsRes.data.data;
        const settings = (Array.isArray(settingsRecords) ? settingsRecords[0] : settingsRecords) as AttendanceSettingsRecord | undefined;
        setOfficeOpenDays(parseOfficeOpenDays(settings?.office_open_days));
      } catch (err) {
        console.error("Fetch Data Error:", err);
        showToast("Failed to load attendance options", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (selectedTeams.length === 0 && selectedEmployees.length === 0) {
      showToast("Please select at least one department or employee.", "error");
      return;
    }
    
    setLoading(true);
    try {
      const selectedTeamSet = new Set(selectedTeams);
      const employeeIds = new Set(selectedEmployees);
      employees.forEach((employee) => {
        const departmentId = employee.employee_detail?.department?.id;
        if (departmentId && selectedTeamSet.has(String(departmentId))) {
          employeeIds.add(String(employee.id));
        }
      });
      const selectedEmployeeIds = Array.from(employeeIds);
      if (selectedEmployeeIds.length === 0) {
        showToast("No employees matched the selected departments.", "error");
        return;
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const holidayDates = new Set(holidays.map((holiday) => holiday.date));
      const openDays = officeOpenDays.length > 0 ? officeOpenDays : [1, 2, 3, 4, 5];
      const eligibleDates = Array.from({ length: daysInMonth }, (_, index) => new Date(year, month - 1, index + 1))
        .filter((date) => {
          const dateString = toDateString(date);
          const day = date.getDay();
          return date <= today && openDays.includes(day) && !holidayDates.has(dateString);
        })
        .map(toDateString);

      if (eligibleDates.length === 0) {
        showToast("No working dates are available for the selected month.", "error");
        return;
      }

      await Promise.all(
        selectedEmployeeIds.flatMap((employeeId) => {
          const employee = employees.find((item) => String(item.id) === employeeId);
          return eligibleDates.map((date) =>
            api.post("/attendance", {
              employee_id: employeeId,
              user_id: employeeId,
              date,
              status: isLate ? "late" : isHalfDay ? "half-day" : "present",
              clock_in: clockIn,
              clock_out: clockOut,
              working_from: workingFrom,
              late: isLate,
              half_day: isHalfDay,
              shift_type_id: employee?.employee_detail?.shift_type_id || employee?.employee_detail?.shift_type?.id || null,
              shift_type: employee?.employee_detail?.shift_type,
              days_in_month: daysInMonth,
              source: "bulk-attendance",
            }),
          );
        }),
      );
      showToast(`Bulk attendance processed for ${selectedEmployeeIds.length} employee(s) across ${eligibleDates.length} working day(s).`, "success");
    } catch (err) {
      console.error("Bulk Attendance Error:", err);
      showToast("Failed to process bulk attendance.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        
        {/* Header Section Parity - Refined Responsive */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">
                Bulk Attendance Entr
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Attendance / Batch Entry</p>
            </div>
          </div>
          <Link href="/attendance">
            <Button className="bg-gray-100 text-gray-500 border-none text-[9px] md:text-[10px] font-black h-10 md:h-11 px-4 md:px-6 hover:bg-gray-200 uppercase tracking-widest transition-all rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Logs
            </Button>
          </Link>
        </div>

        <Card className="p-8 border-none shadow-sm bg-white">
           <div className="space-y-8">
              {/* Selection Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                       <Building2 className="h-3 w-3 mr-2 text-primary" /> Select Departments
                    </label>
                    <div className="relative group">
                       <select 
                         multiple
                         className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 text-[11px] font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none min-h-[160px] transition-all scrollbar-thin scrollbar-thumb-gray-200 cursor-pointer"
                         onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedTeams(values);
                         }}
                       >
                          {teams.map(team => (
                             <option key={team.id} value={team.id} className="py-2.5 px-3 rounded-xl mb-1.5 hover:bg-white checked:bg-primary checked:text-white transition-colors">{team.team_name || team.name}</option>
                          ))}
                       </select>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold italic mt-2 uppercase tracking-widest flex items-center">
                       <Info className="h-2.5 w-2.5 mr-1.5" /> Hold CMD/CTRL for multiple
                    </p>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                       <Users className="h-3 w-3 mr-2 text-primary" /> Select Employees
                    </label>
                    <div className="relative group">
                       <select 
                         multiple
                         className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 text-[11px] font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none min-h-[160px] transition-all scrollbar-thin scrollbar-thumb-gray-200 cursor-pointer"
                         onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedEmployees(values);
                         }}
                       >
                          {employees.map(emp => (
                             <option key={emp.id} value={emp.id} className="py-2.5 px-3 rounded-xl mb-1.5 hover:bg-white checked:bg-primary checked:text-white transition-colors">{emp.name}</option>
                          ))}
                       </select>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold italic mt-2 uppercase tracking-widest flex items-center">
                       <Info className="h-2.5 w-2.5 mr-1.5" /> Specific overrides
                    </p>
                 </div>
              </div>

              <hr className="border-gray-50" />

              {/* Timing Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Month</label>
                    <div className="relative">
                       <select 
                         value={month}
                         onChange={(e) => setMonth(parseInt(e.target.value))}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                       >
                          {Array.from({ length: 12 }, (_, i) => (
                             <option key={i + 1} value={i + 1}>
                               {new Date(0, i).toLocaleString('default', { month: 'long' })}
                             </option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Year</label>
                    <div className="relative">
                       <select 
                         value={year}
                         onChange={(e) => setYear(parseInt(e.target.value))}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                       >
                          {[2026, 2025, 2024, 2023].map(y => (
                             <option key={y} value={y}>{y}</option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Clock In</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                       <input 
                         type="time" 
                         value={clockIn}
                         onChange={(e) => setClockIn(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" 
                       />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Clock Out</label>
                    <div className="relative">
                       <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                       <input 
                         type="time" 
                         value={clockOut}
                         onChange={(e) => setClockOut(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" 
                       />
                    </div>
                 </div>
              </div>

              {/* Options Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                       <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <Clock className="h-4 w-4 text-orange-500" />
                       </div>
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mark Late</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={isLate} onChange={(e) => setIsLate(e.target.checked)} />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                 </div>

                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center space-x-3">
                       <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <Info className="h-4 w-4 text-blue-500" />
                       </div>
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Half Day</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" className="sr-only peer" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Working From</label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                       <input 
                         type="text" 
                         value={workingFrom}
                         onChange={(e) => setWorkingFrom(e.target.value)}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" 
                       />
                    </div>
                 </div>
              </div>

              <div className="pt-6 flex justify-end">
                 <Button 
                   onClick={handleSave}
                   disabled={loading}
                   className="w-full sm:w-auto bg-primary text-white text-[9px] sm:text-[10px] font-black px-6 sm:px-12 h-12 sm:h-14 uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center"
                 >
                    {loading ? <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-3 animate-spin" /> : <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />}
                    {loading ? "Processing..." : "Process Bulk Attendance"}
                 </Button>
              </div>
           </div>
        </Card>

        {/* Info Box */}
        <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-start space-x-4">
           <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">Processing Note</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-relaxed">
                 This action will mark attendance for all selected employees for the selected month, excluding holidays and closed office days from attendance settings.
              </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
