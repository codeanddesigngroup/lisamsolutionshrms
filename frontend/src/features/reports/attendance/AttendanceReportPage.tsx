"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import {
  calculateAttendanceStatus,
  dateRange,
  formatDuration,
  getAttendanceEmployeeId,
  getEmployeeDisplayId,
  getHolidayDate,
  minutesBetween,
  parseOfficeOpenDays,
  toDateString,
  type HRRecord,
} from "@/lib/hr-utils";

const current = new Date();

const getMonthRange = (month: number, year: number) => {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = toDateString(new Date(year, month, 0));
  return { start, end };
};

export default function AttendanceReportPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<HRRecord[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<HRRecord[]>([]);
  const [holidays, setHolidays] = useState<HRRecord[]>([]);
  const [officeOpenDays, setOfficeOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [month, setMonth] = useState(current.getMonth() + 1);
  const [year, setYear] = useState(current.getFullYear());

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeResponse, attendanceResponse, holidayResponse, settingsResponse] = await Promise.all([
        api.get("/employee"),
        api.get("/attendance"),
        api.get("/holidays"),
        api.get("/attendance-settings"),
      ]);
      const settingsRecords = settingsResponse.data.data;
      const settings = Array.isArray(settingsRecords) ? settingsRecords[0] : settingsRecords;
      setEmployees(employeeResponse.data.data || []);
      setAttendanceRows(attendanceResponse.data.data || []);
      setHolidays(holidayResponse.data.data || []);
      setOfficeOpenDays(parseOfficeOpenDays(settings?.office_open_days));
    } catch (error) {
      console.error("Fetch Attendance Report Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReport();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReport]);

  const reportRows = useMemo(() => {
    const { start, end } = getMonthRange(month, year);
    const holidayDates = new Set(holidays.map(getHolidayDate));
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const workingDates = dateRange(start, end)
      .filter((date) => date <= today)
      .map((date) => ({ date, key: toDateString(date) }))
      .filter(({ date, key }) => officeOpenDays.includes(date.getDay()) && !holidayDates.has(key));

    return employees
      .filter((employee) => selectedEmployee === "all" || String(employee.id) === selectedEmployee)
      .map((employee) => {
        const employeeId = String(employee.id);
        const rows = attendanceRows.filter((row) => {
          const date = String(row.date || row.clock_in_date || "").slice(0, 10);
          return getAttendanceEmployeeId(row) === employeeId && date >= start && date <= end;
        });
        const presentDates = new Set<string>();
        let late = 0;
        let halfDay = 0;
        let minutes = 0;

        rows.forEach((row) => {
          const status = calculateAttendanceStatus(row, row.shift_type || employee.employee_detail?.shift_type);
          const rowDate = String(row.date || row.clock_in_date || "").slice(0, 10);
          if (["present", "late", "half-day"].includes(status)) presentDates.add(rowDate);
          if (status === "late") late += 1;
          if (status === "half-day") halfDay += 1;
          minutes += Number(row.total_minutes || minutesBetween(row.clock_in || row.clock_in_time, row.clock_out || row.clock_out_time));
        });

        const present = presentDates.size;
        const totalWorking = workingDates.length;
        const absent = Math.max(0, totalWorking - present);
        return {
          id: employee.id,
          employee,
          present,
          absent,
          late,
          halfDay,
          totalWorking,
          hoursClocked: formatDuration(minutes),
        };
      });
  }, [attendanceRows, employees, holidays, month, officeOpenDays, selectedEmployee, year]);

  const totals = useMemo(() => {
    const totalWorking = reportRows.reduce((sum, row) => sum + row.totalWorking, 0);
    const present = reportRows.reduce((sum, row) => sum + row.present, 0);
    const absent = reportRows.reduce((sum, row) => sum + row.absent, 0);
    const late = reportRows.reduce((sum, row) => sum + row.late, 0);
    const halfDay = reportRows.reduce((sum, row) => sum + row.halfDay, 0);
    const presence = totalWorking > 0 ? Math.round((present / totalWorking) * 100) : 0;
    return { totalWorking, present, absent, late, halfDay, presence };
  }, [reportRows]);

  const handleReset = () => {
    setMonth(current.getMonth() + 1);
    setYear(current.getFullYear());
    setSelectedEmployee("all");
  };

  const handleExport = () => {
    const rows = [
      ["Employee", "Employee ID", "Present", "Absent", "Late", "Half Day", "Working Days", "Hours Clocked"],
      ...reportRows.map((row) => [
        row.employee.name || "",
        getEmployeeDisplayId(row.employee),
        String(row.present),
        String(row.absent),
        String(row.late),
        String(row.halfDay),
        String(row.totalWorking),
        row.hoursClocked,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${year}-${String(month).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="flex items-center text-base font-black uppercase tracking-widest text-gray-800">
              <Clock className="mr-3 h-5 w-5 text-primary" />
              Attendance Report
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-wider text-gray-400">Reports / Staff Attendance Summary</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={fetchReport} className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition-all hover:text-primary" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={handleExport} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-none bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Select Month</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="form-control pl-11">
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>{new Date(0, index).toLocaleString("default", { month: "long" })}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Select Year</label>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="form-control">
                {[current.getFullYear(), current.getFullYear() - 1, current.getFullYear() - 2, current.getFullYear() - 3].map((yearOption) => (
                  <option key={yearOption} value={yearOption}>{yearOption}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Select Employee</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)} className="form-control pl-11">
                  <option value="all">All Staff Members</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-end space-x-2 md:col-span-2">
              <Button onClick={fetchReport} className="h-11 flex-1 bg-primary text-[10px] font-black uppercase tracking-widest text-white">Generate</Button>
              <Button onClick={handleReset} className="h-11 border-none bg-gray-100 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Reset</Button>
            </div>
          </div>
        </Card>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            { label: "Avg Presence", value: `${totals.presence}%`, color: "text-green-500", icon: CheckCircle2, bg: "bg-green-50" },
            { label: "Total Absents", value: `${totals.absent} Days`, color: "text-red-500", icon: XCircle, bg: "bg-red-50" },
            { label: "Late Entries", value: String(totals.late).padStart(2, "0"), color: "text-orange-500", icon: Clock, bg: "bg-orange-50" },
            { label: "Half Days", value: String(totals.halfDay).padStart(2, "0"), color: "text-yellow-600", icon: FileText, bg: "bg-yellow-50" },
          ].map((stat) => (
            <Card key={stat.label} className="flex items-center space-x-4 border-none bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <h3 className="text-sm font-black tracking-tight text-gray-800">{stat.value}</h3>
              </div>
            </Card>
          ))}
        </div>

        <Card className="relative min-h-[400px] overflow-hidden border-none bg-white p-0 shadow-sm">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-5">
            <h3 className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Search className="mr-2 h-4 w-4 text-primary" />
              Staff Attendance Details
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  {["#", "Employee", "Present", "Absent", "Late", "Half Day", "Working", "Hours Clocked"].map((heading) => (
                    <th key={heading} className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 first:text-left">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportRows.map((row, index) => (
                  <tr key={row.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-8 py-5 text-center text-xs font-bold text-gray-300">{index + 1}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 to-primary/5 text-[10px] font-black uppercase text-primary transition-transform group-hover:rotate-3">
                          {String(row.employee.name || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-gray-800">{row.employee.name}</p>
                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">{getEmployeeDisplayId(row.employee)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center"><Badge value={row.present} color="green" /></td>
                    <td className="px-8 py-5 text-center"><Badge value={row.absent} color="red" /></td>
                    <td className="px-8 py-5 text-center"><Badge value={row.late} color="orange" /></td>
                    <td className="px-8 py-5 text-center"><Badge value={row.halfDay} color="yellow" /></td>
                    <td className="px-8 py-5 text-center text-xs font-black text-gray-700">{row.totalWorking}</td>
                    <td className="px-8 py-5 text-center text-xs font-black text-gray-700">{row.hoursClocked}</td>
                  </tr>
                ))}
                {!loading && reportRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-8 py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No attendance records found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Badge({ value, color }: { value: number; color: "green" | "red" | "orange" | "yellow" }) {
  const classes = {
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-500 border-red-100",
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${classes[color]}`}>{value}</span>;
}
