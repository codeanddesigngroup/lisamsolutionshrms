"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { Plus, Calendar, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { calculateAttendanceStatus, ShiftDefinition } from "@/lib/hr-utils";
import api from "@/lib/api";

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
  employee_id?: number | string;
  role?: string;
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
  employee?: {
    id?: number | string;
    name?: string;
    employee_detail?: { designation?: { name?: string }; shift_type?: ShiftSummary };
  };
  date: string;
  status: string;
  clock_in?: string;
  clock_out?: string;
  clock_in_ip?: string;
  clock_out_ip?: string;
  late?: boolean;
  half_day?: boolean;
  shift_type?: ShiftSummary;
  source?: string;
  source_type?: string;
  device_id?: number | string;
  attendance_device_id?: number | string;
};

const getShiftForRow = (row: AttendanceRecord, employees: EmployeeOption[]): ShiftDefinition | undefined => {
  const employeeId = String(row.employee_id || row.user_id || row.employee?.id || "");
  const shift = (
    row.shift_type ||
    row.employee?.employee_detail?.shift_type ||
    employees.find((employee) => String(employee.id) === employeeId)?.employee_detail?.shift_type
  );
  return shift as ShiftDefinition;
};

const getStatusClass = (status: string) => {
  if (status === "present") return "label-success";
  if (status === "late" || status === "absent") return "label-danger";
  return "label-info";
};

const DEFAULT_ATTENDANCE_DATE = new Date().toISOString().slice(0, 10);

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
  isCurrentUserEmployee(attendance.employee as EmployeeOption | undefined, user) ||
  String(attendance.employee_id || attendance.user_id || "") === String(user?.id || "");

export default function AttendanceByDatePage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const canManageAttendance =
    user?.role === "admin" ||
    hasPermission("attendance.manage") ||
    hasPermission("attendance.edit") ||
    hasPermission("attendance.approve") ||
    hasPermission("attendance.export");
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(DEFAULT_ATTENDANCE_DATE);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [employeeResponse, attendanceResponse] = await Promise.all([
        api.get("/employee"),
        api.get("/attendance"),
      ]);
      const employeeList = (employeeResponse.data.data || []) as EmployeeOption[];
      const attendanceList = (attendanceResponse.data.data || []) as AttendanceRecord[];

      const employeesWithAttendance = canManageAttendance
        ? employeeList.filter((employee) =>
            attendanceList.some((row) => String(row.employee_id || row.user_id || row.employee?.id || "") === String(employee.id))
          )
        : employeeList.filter((employee) => isCurrentUserEmployee(employee, user));
      setEmployees(employeesWithAttendance);
      setAttendance(attendanceList.filter((row) =>
        canManageAttendance ||
        isCurrentUserAttendance(row, user)
      ));
    } catch (err) {
      console.error("Fetch Daily Attendance Error:", err);
      showToast("Failed to load daily attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilters = () => {
    setDate(DEFAULT_ATTENDANCE_DATE);
  };

  const dailyRows = useMemo(() => attendance.filter((row) => row.date === date), [attendance, date]);
  const presentCount = dailyRows.filter((row) => ["present", "late"].includes(calculateAttendanceStatus(row, getShiftForRow(row, employees)))).length;
  const absentCount = dailyRows.filter((row) => calculateAttendanceStatus(row, getShiftForRow(row, employees)) === "absent").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Clock className="h-5 w-5 mr-2 inline-block text-primary" />
              Daily Attendance
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/attendance/create">
              <Button className="btn-success btn-sm">
                {canManageAttendance ? "Mark Attendance" : "Clock In"} <Plus className="h-4 w-4 ml-1 inline-block" />
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
                <Link href="/attendance/summary" className="py-4 text-[13px] font-bold text-gray-400 border-b-2 border-transparent hover:text-primary transition-all">Summary</Link>
                <Link href="/attendance" className="py-4 text-[13px] font-bold text-gray-400 border-b-2 border-transparent hover:text-primary transition-all">Attendance By Member</Link>
                <Link href="/attendance/date" className="py-4 text-[13px] font-bold text-primary border-b-2 border-primary transition-all">Attendance By Date</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="white-box">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-gray-600 mb-2">Select Date</label>
              <input type="date" className="form-control" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <Button onClick={fetchAttendance} className="btn-success btn-block h-[34px]">
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

        <div className="white-box p-0 overflow-hidden">
          <div className="flex flex-wrap divide-x divide-[#eee]">
            <div className="flex-1 min-w-[150px] p-6 text-center">
              <h4 className="m-0 text-xl font-bold">{dailyRows.length}</h4>
              <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Total Entries</p>
            </div>
            <div className="flex-1 min-w-[150px] p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-success">{presentCount}</h4>
              <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Present/Late</p>
            </div>
            <div className="flex-1 min-w-[150px] p-6 text-center border-l border-[#eee]">
              <h4 className="m-0 text-xl font-bold text-danger">{absentCount}</h4>
              <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Absent</p>
            </div>
          </div>
        </div>

        <div className="white-box p-0 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="font-bold text-[13px]">{row.employee?.name || "Unknown"}</div>
                      <div className="text-[10px] text-gray-400 font-medium uppercase">{row.employee?.employee_detail?.designation?.name || "Staff"}</div>
                    </td>
                    <td><span className={`label ${getStatusClass(calculateAttendanceStatus(row, getShiftForRow(row, employees)))}`}>{calculateAttendanceStatus(row, getShiftForRow(row, employees))}</span></td>
                    <td>
                      <div className="font-medium">{row.clock_in || "--:--"}</div>
                      <div className="text-[10px] text-gray-400">IP: {row.clock_in_ip || "-"}</div>
                    </td>
                    <td>
                      <div className="font-medium">{row.clock_out || "--:--"}</div>
                      <div className="text-[10px] text-gray-400">IP: {row.clock_out_ip || "-"}</div>
                    </td>
                    <td><Calendar className="mr-2 inline h-3 w-3 text-primary" />{row.date}</td>
                  </tr>
                ))}
                {!loading && dailyRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No attendance marked for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
