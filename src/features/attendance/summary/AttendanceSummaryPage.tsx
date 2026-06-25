"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { Plus, Calendar, Check, X, Star, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { getHolidayDate, getLeaveDate, getLeaveEmployeeId, parseOfficeOpenDays, calculateAttendanceStatus, ShiftDefinition } from "@/lib/hr-utils";
import { attendanceService } from "@/services/attendance/attendance.service";

type ShiftSummary = {
  id?: number | string;
  shift_name?: string;
  code?: string;
  start_time?: string;
  end_time?: string;
  late_grace_minutes?: number;
  half_day_mark_time?: string;
};

type EmployeeOption = {
  id: number | string;
  name: string;
  email?: string;
  role?: string;
  employee_id?: number | string;
  status?: string;
  employee_detail?: {
    employee_id?: number | string;
    designation?: { name?: string };
    department?: { name?: string; team_name?: string };
    shift_type?: ShiftSummary;
  };
};

type AttendanceRecord = {
  id: number | string;
  employee_id?: number | string;
  user_id?: number | string;
  employee?: EmployeeOption;
  date: string;
  status: string;
  clock_in?: string;
  clock_out?: string;
  late?: boolean;
  half_day?: boolean;
  shift_type?: ShiftSummary;
  source?: string;
  source_type?: string;
  device_id?: number | string;
  attendance_device_id?: number | string;
};

type HolidayRecord = { date?: string; holiday_date?: string; name?: string; occassion?: string };
type LeaveRecord = { user_id?: number | string; employee_id?: number | string; user?: { id?: number | string; name?: string }; employee?: { id?: number | string; name?: string }; leave_date?: string; date?: string; status?: string; reason?: string; leave_type?: { type_name?: string } };
type DayDetail = { employee: EmployeeOption; day: number; date: string; status: string; attendance?: AttendanceRecord; holiday?: HolidayRecord; leave?: LeaveRecord };

const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth() + 1;
const getDateForDay = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getAttendanceDate = (value: string) => value.slice(0, 10);

const isCurrentUserEmployee = (employee: EmployeeOption | undefined, user: { id?: number | string; name?: string; email?: string } | null) => {
  if (!employee || !user) return false;
  const userId = String(user.id || "");
  return (
    String(employee.id) === userId ||
    String(employee.employee_id || employee.employee_detail?.employee_id || "") === userId ||
    Boolean(user.name && employee.name === user.name) ||
    Boolean(user.email && employee.email === user.email)
  );
};

const isCurrentUserAttendance = (attendance: AttendanceRecord, user: { id?: number | string; name?: string; email?: string } | null) =>
  isCurrentUserEmployee(attendance.employee, user) ||
  String(attendance.employee_id || attendance.user_id || "") === String(user?.id || "");

export default function AttendanceSummaryPage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const canManageAttendance =
    user?.role === "admin" ||
    hasPermission("attendance.manage") ||
    hasPermission("attendance.edit") ||
    hasPermission("attendance.approve") ||
    hasPermission("attendance.export");
  const isSelfServiceAttendance = user?.role === "employee" && !canManageAttendance;
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [officeOpenDays, setOfficeOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayDetail | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [month, setMonth] = useState(thisMonth);
  const [year, setYear] = useState(thisYear);

  const fetchData = async () => {
    setLoading(true);
    try {
      const employeeRecords = await attendanceService.getEmployees();
      const employeeList = employeeRecords as EmployeeOption[];
      const startDate = getDateForDay(year, month, 1);
      const endDate = getDateForDay(year, month, new Date(year, month, 0).getDate());
      const attendanceList = (await attendanceService.getRecords({ startDate, endDate, limit: 500 }, employeeRecords)) as AttendanceRecord[];
      const holidayList: HolidayRecord[] = [];
      const leaveList: LeaveRecord[] = [];

      const employeesWithAttendance = canManageAttendance
        ? employeeList
        : employeeList.filter((employee) => isCurrentUserEmployee(employee, user));
      setEmployees(employeesWithAttendance);
      setAttendance(attendanceList.filter((row) =>
        canManageAttendance ||
        isCurrentUserAttendance(row, user)
      ));
      setHolidays(holidayList);
      setLeaves(canManageAttendance ? leaveList : leaveList.filter((leave) => getLeaveEmployeeId(leave) === String(user?.id || "") || leave.user?.name === user?.name || leave.employee?.name === user?.name));
      setOfficeOpenDays(parseOfficeOpenDays(undefined));
    } catch (err) {
      console.error("Fetch Attendance Summary Error:", err);
      showToast("Failed to load attendance summary", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setSelectedEmployee("all");
    setMonth(thisMonth);
    setYear(thisYear);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const visibleEmployees = useMemo(
    () => employees.filter((employee) => selectedEmployee === "all" || String(employee.id) === selectedEmployee),
    [employees, selectedEmployee],
  );

  const attendanceByEmployeeDay = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((row) => {
      const rowDate = getAttendanceDate(row.date);
      const [, , rowDay] = rowDate.split("-").map(Number);
      if (!rowDate.startsWith(`${year}-${String(month).padStart(2, "0")}-`)) return;
      const employeeId = String(row.employee_id || row.user_id || row.employee?.id || "");
      map.set(`${employeeId}-${rowDay}`, row);
    });
    return map;
  }, [attendance, month, year]);

  const getDayStatus = (employeeId: number | string, day: number) => {
    const date = new Date(year, month - 1, day);
    const dateString = getDateForDay(year, month, day);
    const record = attendanceByEmployeeDay.get(`${employeeId}-${day}`);
    if (record) {
      const shift = record.shift_type || employees.find((employee) => String(employee.id) === String(employeeId))?.employee_detail?.shift_type;
      return calculateAttendanceStatus(record, shift as ShiftDefinition);
    }
    if (holidays.some((holiday) => getHolidayDate(holiday) === dateString)) return "holiday";
    if (leaves.some((leave) => getLeaveEmployeeId(leave) === String(employeeId) && getLeaveDate(leave) === dateString && leave.status === "approved")) return "leave";
    if (!officeOpenDays.includes(date.getDay())) return "closed";
    return "empty";
  };

  const getDayDetail = (employee: EmployeeOption, day: number): DayDetail => {
    const date = getDateForDay(year, month, day);
    const attendanceRecord = attendanceByEmployeeDay.get(`${employee.id}-${day}`);
    const holiday = holidays.find((item) => getHolidayDate(item) === date);
    const leave = leaves.find((item) => getLeaveEmployeeId(item) === String(employee.id) && getLeaveDate(item) === date && item.status === "approved");
    return { employee, day, date, status: getDayStatus(employee.id, day), attendance: attendanceRecord, holiday, leave };
  };

  const getTotal = (employeeId: number | string) =>
    daysArray.reduce((total, day) => {
      const status = getDayStatus(employeeId, day);
      if (status === "half-day") return total + 0.5;
      return ["present", "late"].includes(status) ? total + 1 : total;
    }, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Calendar className="h-5 w-5 mr-2 inline-block text-primary" />
              {isSelfServiceAttendance ? "My Attendance Summary" : "Attendance Summary"}
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/attendance">
              <Button className="btn-success btn-sm">
                {canManageAttendance ? "Open Daily Attendance" : "My Attendance"} <Plus className="h-4 w-4 ml-1 inline-block" />
              </Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li className="active">Attendance</li>
            </ol>
          </div>
        </div>

        <div className="row mb-6">
          <div className="col-md-12">
            <div className="white-box p-0 border-b border-[#eee]">
              <nav className="flex space-x-8 px-6">
                <Link href="/attendance/summary" className="py-4 text-[13px] font-bold text-primary border-b-2 border-primary transition-all">Summary</Link>
                <Link href="/attendance" className="py-4 text-[13px] font-bold text-gray-400 border-b-2 border-transparent hover:text-primary transition-all">Daily Attendance</Link>
                <Link href="/attendance/date" className="py-4 text-[13px] font-bold text-gray-400 border-b-2 border-transparent hover:text-primary transition-all">Date Wise Attendance</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="white-box">
          <div className={`grid grid-cols-1 gap-4 items-end ${canManageAttendance ? "md:grid-cols-5" : "md:grid-cols-3"}`}>
            {canManageAttendance && (
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-2">Employee Name</label>
                <select className="form-control" value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)}>
                  <option value="all">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[12px] font-bold text-gray-600 mb-2">Select Month</label>
              <select className="form-control" value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>{new Date(0, index).toLocaleString("default", { month: "long" })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-gray-600 mb-2">Select Year</label>
              <select className="form-control" value={year} onChange={(event) => setYear(Number(event.target.value))}>
                {[2026, 2025, 2024, 2023].map((yearOption) => (
                  <option key={yearOption} value={yearOption}>{yearOption}</option>
                ))}
              </select>
            </div>
            <div>
              <Button onClick={fetchData} className="btn-success btn-block h-[34px]">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Apply
              </Button>
            </div>
            <div>
              <Button onClick={resetFilters} className="btn-default btn-block h-[34px]">
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 px-2 mb-4">
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-[#00c292] rounded-sm flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div><span className="text-[11px] font-bold text-gray-500 uppercase">Present</span></div>
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-[#fec107] rounded-sm flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div><span className="text-[11px] font-bold text-gray-500 uppercase">Half Day</span></div>
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-[#fb9678] rounded-sm flex items-center justify-center"><X className="h-2.5 w-2.5 text-white" /></div><span className="text-[11px] font-bold text-gray-500 uppercase">Absent</span></div>
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-[#5475ed] rounded-sm flex items-center justify-center"><Star className="h-2.5 w-2.5 text-white" /></div><span className="text-[11px] font-bold text-gray-500 uppercase">Holiday</span></div>
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-[#7c3aed] rounded-sm flex items-center justify-center"><Star className="h-2.5 w-2.5 text-white" /></div><span className="text-[11px] font-bold text-gray-500 uppercase">Approved Leave</span></div>
          <div className="flex items-center space-x-2"><div className="h-4 w-4 bg-gray-200 rounded-sm" /><span className="text-[11px] font-bold text-gray-500 uppercase">Closed/Future</span></div>
        </div>

        <div className="white-box p-0 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="table-responsive">
            <table className="table-bordered min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-[180px] px-4 py-3 text-[11px] font-bold uppercase sticky left-0 z-10 bg-gray-50 border-r">Employee</th>
                  {daysArray.map((day) => (
                    <th key={day} className="w-10 text-center px-1 py-3 text-[10px] font-bold border-r">
                      <Link
                        href={`/attendance/date?date=${getDateForDay(year, month, day)}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded bg-white text-gray-600 transition hover:bg-primary hover:text-white"
                        title={`Open daily attendance for ${getDateForDay(year, month, day)}`}
                      >
                        {day}
                      </Link>
                    </th>
                  ))}
                  <th className="w-24 text-center px-4 py-3 text-[11px] font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-[13px] font-bold border-r sticky left-0 z-10 bg-white">{employee.name}</td>
                    {daysArray.map((day) => {
                      const status = getDayStatus(employee.id, day);
                      return (
                        <td key={day} className="p-1 border-r text-center">
                          <button type="button" onClick={() => setSelectedDayDetail(getDayDetail(employee, day))} className="mx-auto flex h-6 w-6 items-center justify-center rounded-sm transition-transform hover:scale-110" title={`${employee.name} - ${day}`}>
                            {(status === "present" || status === "late") && <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#00c292]"><Check className="h-2.5 w-2.5 text-white" /></span>}
                            {status === "half-day" && <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#fec107]"><Check className="h-2.5 w-2.5 text-white" /></span>}
                            {status === "absent" && <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#fb9678]"><X className="h-2.5 w-2.5 text-white" /></span>}
                            {status === "holiday" && <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#5475ed]"><Star className="h-2.5 w-2.5 text-white" /></span>}
                            {status === "leave" && <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-[#7c3aed]"><Star className="h-2.5 w-2.5 text-white" /></span>}
                            {(status === "empty" || status === "closed") && <span className="h-2 w-2 rounded-full bg-gray-200" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-success border-l">{getTotal(employee.id)} / {daysInMonth}</td>
                  </tr>
                ))}
                {!loading && visibleEmployees.length === 0 && (
                  <tr>
                    <td colSpan={daysInMonth + 2} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {selectedDayDetail && (
          <div className="white-box">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h4 className="m-0 text-sm font-black uppercase tracking-widest text-gray-800">{selectedDayDetail.employee.name} / {selectedDayDetail.date}</h4>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status: {selectedDayDetail.status}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/attendance/date?date=${selectedDayDetail.date}`}>
                  <Button className="btn-success h-9 text-[10px]">View Full Day</Button>
                </Link>
                <Button onClick={() => setSelectedDayDetail(null)} className="btn-default h-9 text-[10px]">Close</Button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attendance</p>
                <p className="mt-2 text-xs font-bold text-gray-700">
                  {selectedDayDetail.attendance
                    ? `${selectedDayDetail.attendance.clock_in || "--"} - ${selectedDayDetail.attendance.clock_out || "--"}`
                    : "No attendance record"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Holiday</p>
                <p className="mt-2 text-xs font-bold text-gray-700">{selectedDayDetail.holiday?.name || selectedDayDetail.holiday?.occassion || "No holiday"}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Leave</p>
                <p className="mt-2 text-xs font-bold text-gray-700">{selectedDayDetail.leave?.leave_type?.type_name || selectedDayDetail.leave?.reason || "No approved leave"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
