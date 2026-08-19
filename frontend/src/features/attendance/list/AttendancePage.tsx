"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AttendanceOverrideModal, {
  AttendanceEmployeeOption,
  AttendanceRecordForOverride,
} from "@/features/attendance/components/AttendanceOverrideModal";
import {
  calculateAttendanceStatus,
  calculateLateAfterGraceMinutes,
  calculateLateMinutes,
  formatDuration,
  getHolidayDate,
  getLeaveDate,
  getLeaveEmployeeId,
  minutesBetween,
  parseOfficeOpenDays,
  ShiftDefinition,
} from "@/lib/hr-utils";
import { attendanceService } from "@/services/attendance/attendance.service";
import { Activity, AlertTriangle, BadgeCheck, CalendarDays, Clock, Cpu, Edit3, RefreshCw, RotateCcw, ShieldCheck, TimerReset, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ShiftSummary = {
  id?: number | string;
  shift_name?: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  late_grace_minutes?: number;
  half_day_mark_time?: string;
  min_hours?: number;
};

type EmployeeOption = AttendanceEmployeeOption & {
  employee_id?: string | number;
  role?: string;
  status?: string;
  employee_detail?: AttendanceEmployeeOption["employee_detail"] & {
    employee_id?: string | number;
    department?: { name?: string; team_name?: string };
  };
};

type AttendanceRecord = AttendanceRecordForOverride & {
  id: number | string;
  employee_code?: string | number;
  employee?: EmployeeOption;
  manual_override?: boolean;
  override_reason?: string;
  override_history?: unknown[];
  device_serial?: string | null;
  late_waived?: boolean;
  late_waiver_reason?: string | null;
  late_waiver_note?: string | null;
  late_waived_by?: string | null;
  late_waived_at?: string | null;
};

type HolidayRecord = { date?: string; holiday_date?: string; name?: string; occassion?: string };
type LeaveRecord = {
  user_id?: number | string;
  employee_id?: number | string;
  user?: { id?: number | string; name?: string };
  employee?: { id?: number | string; name?: string };
  leave_date?: string;
  date?: string;
  status?: string;
  reason?: string;
  leave_type?: { type_name?: string };
};

type DailyStatus = "present" | "early" | "late" | "absent" | "half-day" | "holiday" | "leave" | "weekly-off" | "future" | "missing-checkout";

type DailyAttendanceRow = {
  employee: EmployeeOption;
  attendance?: AttendanceRecord;
  shift?: ShiftSummary;
  holiday?: HolidayRecord;
  leave?: LeaveRecord;
  status: DailyStatus;
  contextLabel: string;
  lateMinutes: number;
  lateAfterGraceMinutes: number;
  workingMinutes: number;
  isException: boolean;
  isLateWaived: boolean;
  waiverReason?: string;
};


const todayString = () => new Date().toISOString().slice(0, 10);
const DEFAULT_ATTENDANCE_DATE = todayString();
const isValidDateParam = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const formatTime = (value?: string) => value || "--:--";
const statusLabel = (status: DailyStatus) => {
  if (status === "present") return "On Time";
  if (status === "early") return "Early";
  if (status === "half-day") return "Half Day";
  if (status === "weekly-off") return "Weekly Off";
  if (status === "missing-checkout") return "Missing Checkout";
  return status.replace("-", " ");
};

const getShiftForEmployee = (employee: EmployeeOption, attendance?: AttendanceRecord): ShiftSummary | undefined =>
  attendance?.shift_type || employee.employee_detail?.shift_type;

const getStatusClass = (status: DailyStatus) => {
  if (status === "present") return "bg-green-50 text-green-700 border-green-100";
  if (status === "early") return "bg-cyan-50 text-cyan-700 border-cyan-100";
  if (status === "late") return "bg-orange-50 text-orange-700 border-orange-100";
  if (status === "half-day") return "bg-yellow-50 text-yellow-700 border-yellow-100";
  if (status === "absent" || status === "missing-checkout") return "bg-red-50 text-red-700 border-red-100";
  if (status === "holiday") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "leave") return "bg-purple-50 text-purple-700 border-purple-100";
  return "bg-gray-50 text-gray-600 border-gray-100";
};

const getSourceLabel = (attendance?: AttendanceRecord) => {
  const source = String(attendance?.source_type || attendance?.source || "").toLowerCase();
  if (!attendance) return "Not recorded";
  if (source.includes("machine") || source.includes("device")) return "Machine";
  if (source.includes("override")) return "Manual override";
  if (source.includes("import")) return "Imported";
  return "Manual";
};

const getDeviceLabel = (attendance?: AttendanceRecord) => {
  const deviceSerial = attendance?.device_serial || attendance?.attendance_device_id || attendance?.device_id;
  return deviceSerial ? `${deviceSerial}` : "No device";
};

const isPastDate = (date: string) => date < todayString();
const isFutureDate = (date: string) => date > todayString();

const getDateDay = (date: string) => new Date(`${date}T00:00:00`).getDay();

const getEmployeeMatchCodes = (employee: EmployeeOption) =>
  [
    employee.id,
    employee.employee_id,
    employee.employee_detail?.employee_id,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value).trim());

const isCurrentUserEmployee = (employee: EmployeeOption | undefined, user: { id?: number | string; name?: string; email?: string } | null) => {
  if (!employee || !user) return false;
  return String(employee.id) === String(user.id || "");
};

const isCurrentUserAttendance = (attendance: AttendanceRecord, user: { id?: number | string; name?: string; email?: string } | null) =>
  isCurrentUserEmployee(attendance.employee, user);


type AttendancePageProps = {
  mode?: "daily" | "date-wise";
};

export default function AttendancePage({ mode = "daily" }: AttendancePageProps) {
  const isDateWise = mode === "date-wise";
  const searchParams = useSearchParams();
  const queryDate = searchParams.get("date");
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const hydratedUser = hasHydrated ? user : null;
  const isEmployeeSession = hydratedUser?.role === "employee";
  const canManageAttendance =
    hasHydrated && !isEmployeeSession && (
      hydratedUser?.role === "admin" ||
      hasPermission("attendance.manage") ||
      hasPermission("attendance.edit") ||
      hasPermission("attendance.approve") ||
      hasPermission("attendance.export")
    );
  const isSelfServiceAttendance = isEmployeeSession;

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [officeOpenDays, setOfficeOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [date, setDate] = useState(() => (isDateWise && isValidDateParam(queryDate) ? String(queryDate) : DEFAULT_ATTENDANCE_DATE));
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [editingRow, setEditingRow] = useState<DailyAttendanceRow | null>(null);
  const [waiverRow, setWaiverRow] = useState<DailyAttendanceRow | null>(null);
  const [waiverReason, setWaiverReason] = useState("Manager discretion");
  const [waiverNote, setWaiverNote] = useState("");
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const companyId = hydratedUser?.company_id ? String(hydratedUser.company_id) : "";
      const employeeRecords = await attendanceService.getEmployees({ companyId });
      const employeeList = employeeRecords as EmployeeOption[];
      const currentEmployee = isEmployeeSession
        ? employeeList.find((employee) => String(employee.id) === String(hydratedUser?.id || ""))
        : undefined;
      const attendanceDeviceEmployeeId =
        currentEmployee?.employee_detail?.employee_id ?? currentEmployee?.employee_id;
      const attendanceList = (await attendanceService.getRecords(
        {
          companyId,
          workDate: date,
          limit: 500,
          ...(isEmployeeSession && attendanceDeviceEmployeeId !== undefined
            ? { employeeId: attendanceDeviceEmployeeId }
            : {}),
        },
        employeeRecords,
      )) as AttendanceRecord[];
      const holidayList: HolidayRecord[] = [];
      const leaveList: LeaveRecord[] = [];

      const visibleEmployees = isEmployeeSession
        ? (currentEmployee ? [currentEmployee] : [])
        : employeeList;
      setEmployees(visibleEmployees);
      setAttendance(
        isEmployeeSession
          ? attendanceList.filter((row) => isCurrentUserAttendance(row, hydratedUser))
          : attendanceList,
      );
      setHolidays(holidayList);
      setLeaves(
        isEmployeeSession
          ? leaveList.filter((leave) => getLeaveEmployeeId(leave) === String(hydratedUser?.id || ""))
          : leaveList,
      );
      setOfficeOpenDays(parseOfficeOpenDays(undefined));
    } catch (err) {
      console.error("Fetch Daily Attendance Error:", err);
      showToast("Failed to load attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasHydrated(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isDateWise || !isValidDateParam(queryDate) || queryDate === date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(String(queryDate));
  }, [date, isDateWise, queryDate]);

  useEffect(() => {
    if (!hasHydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, hasHydrated]);

  const dailyRows = useMemo<DailyAttendanceRow[]>(() => {
    const holiday = holidays.find((item) => getHolidayDate(item) === date);
    const isOfficeOpen = officeOpenDays.includes(getDateDay(date));

    return employees.map((employee) => {
      const employeeId = String(employee.id);
      const deviceEmployeeId = String(
        employee.employee_detail?.employee_id ?? employee.employee_id ?? "",
      );
      const attendanceRecord = attendance.find((row) =>
        String(row.date) === date &&
        (
          String(row.employee?.id ?? row.employee_id ?? row.user_id ?? "") === employeeId ||
          (
            deviceEmployeeId !== "" &&
            String(row.employee_code ?? row.employee?.employee_id ?? row.employee?.employee_detail?.employee_id ?? "") === deviceEmployeeId
          )
        )
      );
      const displayedAttendance = isOfficeOpen ? attendanceRecord : undefined;
      const approvedLeave = leaves.find((leave) => getLeaveEmployeeId(leave) === employeeId && getLeaveDate(leave) === date && String(leave.status || "").toLowerCase() === "approved");
      const shift = getShiftForEmployee(employee, displayedAttendance);
      const calculatedStatus = displayedAttendance
        ? calculateAttendanceStatus(displayedAttendance, shift as ShiftDefinition)
        : undefined;
      const hasMissingCheckout = Boolean(displayedAttendance?.clock_in && !displayedAttendance?.clock_out && isPastDate(date));

      let status: DailyStatus;
      if (!isOfficeOpen) {
        status = "weekly-off";
      } else if (hasMissingCheckout) {
        status = "missing-checkout";
      } else if (displayedAttendance && calculatedStatus) {
        status = calculatedStatus as DailyStatus;
      } else if (holiday) {
        status = "holiday";
      } else if (approvedLeave) {
        status = "leave";
      } else if (isFutureDate(date)) {
        status = "future";
      } else {
        status = "absent";
      }

      const contextParts = [
        holiday ? holiday.name || holiday.occassion || "Holiday" : "",
        approvedLeave ? approvedLeave.leave_type?.type_name || approvedLeave.reason || "Approved leave" : "",
        !isOfficeOpen ? "Weekly off" : "",
      ].filter(Boolean);
      const lateMinutes = displayedAttendance ? calculateLateMinutes(displayedAttendance.clock_in, shift as ShiftDefinition) : 0;
      const lateAfterGraceMinutes = displayedAttendance ? calculateLateAfterGraceMinutes(displayedAttendance.clock_in, shift as ShiftDefinition) : 0;
      const workingMinutes = displayedAttendance ? minutesBetween(displayedAttendance.clock_in, displayedAttendance.clock_out) : 0;
      const isLateWaived = Boolean(displayedAttendance?.late_waived && lateAfterGraceMinutes > 0);
      if (isLateWaived && status === "late") status = "present";
      const hasCalendarOverrideContext = Boolean(displayedAttendance && contextParts.length > 0);
      const isException =
        (!isLateWaived && ["late", "absent", "half-day", "missing-checkout"].includes(status)) ||
        hasCalendarOverrideContext ||
        Boolean(displayedAttendance?.manual_override);

      return {
        employee,
        attendance: displayedAttendance,
        shift,
        holiday,
        leave: approvedLeave,
        status,
        contextLabel: contextParts.join(" / "),
        lateMinutes,
        lateAfterGraceMinutes,
        workingMinutes,
        isException,
        isLateWaived,
        waiverReason: displayedAttendance?.late_waiver_reason || undefined,
      };
    });
  }, [attendance, date, employees, holidays, leaves, officeOpenDays]);

  const filteredRows = useMemo(() => {
    if (isSelfServiceAttendance) return dailyRows;

    return dailyRows.filter((row) => {
      const employeeMatch = employeeFilter === "all" || getEmployeeMatchCodes(row.employee).includes(employeeFilter);
      const statusMatch = statusFilter === "all" || row.status === statusFilter;
      const exceptionMatch = !exceptionsOnly || row.isException;
      return employeeMatch && statusMatch && exceptionMatch;
    });
  }, [dailyRows, employeeFilter, exceptionsOnly, isSelfServiceAttendance, statusFilter]);

  const stats = useMemo(() => {
    const present = dailyRows.filter((row) => row.status === "present" || row.status === "early").length;
    const late = dailyRows.filter((row) => row.status === "late").length;
    const halfDay = dailyRows.filter((row) => row.status === "half-day").length;
    const absent = dailyRows.filter((row) => row.status === "absent").length;
    const review = dailyRows.filter((row) => row.isException).length;
    return { total: dailyRows.length, present, late, halfDay, absent, review };
  }, [dailyRows]);

  const resetFilters = () => {
    if (isDateWise) setDate(DEFAULT_ATTENDANCE_DATE);
    setEmployeeFilter("all");
    setStatusFilter("all");
    setExceptionsOnly(false);
  };


  const handleSyncMissingAttendance = async () => {
    setIsSyncingAttendance(true);
    try {
      const endDate = new Date().toISOString().slice(0, 10);
      const response = await attendanceService.processMissingRecords({
        startDate: "2026-03-01",
        endDate,
      });
      const data = response.data;
      await fetchAttendance();
      showToast(`Attendance synced: ${data.synced || 0} synced, ${data.skipped || 0} skipped.`, "success");
    } catch (err) {
      console.error("Sync missing attendance error:", err);
      showToast("Failed to sync attendance", "error");
    } finally {
      setIsSyncingAttendance(false);
    }
  };
  const handleAttendanceSaved = () => {
    void fetchAttendance();
  };

  const openLateWaiver = (row: DailyAttendanceRow) => {
    setWaiverRow(row);
    setWaiverReason("Manager discretion");
    setWaiverNote("");
  };

  const confirmLateWaiver = async () => {
    if (!waiverRow?.attendance?.id) return;
    try {
      await attendanceService.waiveLate(waiverRow.attendance.id, {
        reason: waiverReason,
        note: waiverNote.trim(),
        waivedBy: hydratedUser?.name || "Admin",
      });
      setWaiverRow(null);
      await fetchAttendance();
      showToast(`Late arrival waived for ${waiverRow.employee.name}.`, "success");
    } catch (err) {
      console.error("Late waiver error:", err);
      showToast("Could not waive late attendance.", "error");
    }
  };

  const revokeLateWaiver = async (row: DailyAttendanceRow) => {
    if (!row.attendance?.id) return;
    try {
      await attendanceService.revokeLateWaiver(row.attendance.id);
      await fetchAttendance();
      showToast(`Late waiver removed for ${row.employee.name}.`);
    } catch (err) {
      console.error("Late waiver revoke error:", err);
      showToast("Could not remove late waiver.", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-4 col-md-5 col-sm-5 col-xs-12">
            <h4 className="page-title m-0">
              <Users className="mr-2 inline-block h-5 w-5 text-primary" />
              {isSelfServiceAttendance ? (isDateWise ? "My Date Wise Attendance" : "My Daily Attendance") : isDateWise ? "Date Wise Attendance" : "Daily Attendance"}
            </h4>
          </div>
          <div className="col-sm-8 flex items-center justify-end space-x-2 text-right">
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li className="active">Attendance</li>
            </ol>
          </div>
        </div>

        <div className="row mb-6">
          <div className="col-md-12">
            <div className="white-box border-b border-[#eee] p-0">
              <nav className="flex flex-wrap gap-6 px-6">
                <Link href="/attendance/summary" className="border-b-2 border-transparent py-4 text-[13px] font-bold text-gray-400 transition-all hover:text-primary">Summary</Link>
                <Link href="/attendance" className={`border-b-2 py-4 text-[13px] font-bold transition-all ${isDateWise ? "border-transparent text-gray-400 hover:text-primary" : "border-primary text-primary"}`}>Daily Attendance</Link>
                <Link href="/attendance/date" className={`border-b-2 py-4 text-[13px] font-bold transition-all ${isDateWise ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-primary"}`}>Date Wise Attendance</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="white-box">
          <div className={`grid grid-cols-1 gap-4 md:items-end ${canManageAttendance ? "md:grid-cols-5" : "md:grid-cols-1"}`}>
            {isDateWise ? (
              <div>
                <label className="mb-2 block text-[12px] font-bold text-gray-600">Attendance Date</label>
                <input type="date" className="form-control" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            ) : (
              <div className="rounded border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today</p>
                <p className="mt-1 text-xs font-bold text-gray-700">{date}</p>
              </div>
            )}
            {canManageAttendance && (
              <>
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-gray-600">Employee</label>
                  <select className="form-control" value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                    <option value="all">All Employees</option>
                    {employees.map((employee) => {
                      const employeeCode = getEmployeeMatchCodes(employee)[0] || String(employee.id);
                      return (
                        <option key={String(employee.id)} value={employeeCode}>
                          {employee.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-gray-600">Status</label>
                  <select className="form-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="present">On Time / Full Day</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="absent">Absent</option>
                    <option value="holiday">Holiday</option>
                    <option value="leave">Leave</option>
                    <option value="weekly-off">Weekly Off</option>
                    <option value="missing-checkout">Missing Checkout</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2">
                  <input id="exceptionsOnly" type="checkbox" checked={exceptionsOnly} onChange={(event) => setExceptionsOnly(event.target.checked)} />
                  <label htmlFor="exceptionsOnly" className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Exceptions only</label>
                </div>
              </>
            )}
            {canManageAttendance && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleSyncMissingAttendance}
                  loading={isSyncingAttendance}
                  className="h-[34px] whitespace-nowrap px-4 text-[10px] font-black uppercase tracking-widest"
                >
                  {!isSyncingAttendance && <RefreshCw className="h-4 w-4" />}
                  Sync Attendance
                </Button>
                <Button onClick={resetFilters} className="btn-default h-[34px]">
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="white-box overflow-hidden p-0">
          <div className="flex flex-wrap divide-x divide-[#eee]">
            <div className="min-w-[150px] flex-1 p-6 text-center">
              <h4 className="m-0 text-xl font-bold">{stats.total}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">{canManageAttendance ? "Employees" : "My Record"}</p>
            </div>
            <div className="min-w-[150px] flex-1 p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-success">{stats.present}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">On Time / Full Day</p>
            </div>
            <div className="min-w-[150px] flex-1 border-l border-[#eee] p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-warning">{stats.late}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">Late</p>
            </div>
            <div className="min-w-[150px] flex-1 border-l border-[#eee] p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-warning">{stats.halfDay}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">Half Day</p>
            </div>
            <div className="min-w-[150px] flex-1 border-l border-[#eee] p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-danger">{stats.absent}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">Absent</p>
            </div>
            <div className="min-w-[150px] flex-1 border-l border-[#eee] p-6 text-center">
              <h4 className="m-0 text-xl font-bold text-info">{stats.review}</h4>
              <p className="mt-1 text-[10px] font-bold uppercase text-gray-400">{canManageAttendance ? "Needs Review" : "Exceptions"}</p>
            </div>
          </div>
        </div>

        <div className="white-box relative overflow-hidden p-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="table-responsive">
            <table className={`${canManageAttendance ? "min-w-[1180px]" : "min-w-[1040px]"} border-separate border-spacing-y-2 px-3 text-left`}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="rounded-l-lg px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Employee</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Check In</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Check Out</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Late Time</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Work Hours</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Source</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Context</th>
                  {canManageAttendance && (
                    <th className="rounded-r-lg px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                    <tr key={`${row.employee.id}-${date}`} className="bg-gray-50/60 transition hover:bg-blue-50/60">
                      <td className="rounded-l-lg px-4 py-4">
                        <div className="font-bold text-[13px] text-gray-800">{row.employee.name}</div>
                        <div className="mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                          {row.employee.employee_detail?.designation?.name || row.employee.email || "Staff"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusClass(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-gray-700">{formatTime(row.attendance?.clock_in)}</div>
                        <div className="mt-1 text-[10px] text-gray-400">{row.attendance?.clock_in_ip || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold text-gray-700">{formatTime(row.attendance?.clock_out)}</div>
                        <div className="mt-1 text-[10px] text-gray-400">{row.attendance?.clock_out_ip || "-"}</div>
                      </td>
                      <td className="px-4 py-4">
                        {row.lateMinutes > 0 ? (
                          <div>
                            <div className={`flex items-center gap-1 text-xs font-black ${row.isLateWaived ? "text-green-600" : "text-orange-600"}`}>
                              {row.isLateWaived ? <BadgeCheck className="h-3.5 w-3.5" /> : <TimerReset className="h-3.5 w-3.5" />}
                              {formatDuration(row.lateMinutes)}
                            </div>
                            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              {row.isLateWaived ? "Late impact waived" : `After grace ${formatDuration(row.lateAfterGraceMinutes)}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">On time / N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {row.workingMinutes > 0 ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-primary" /> {formatDuration(row.workingMinutes)}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Not complete</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                          <Cpu className="h-3.5 w-3.5 text-primary" /> {getSourceLabel(row.attendance)}
                        </div>
                        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{getDeviceLabel(row.attendance)}</div>
                      </td>
                      <td className={`${canManageAttendance ? "" : "rounded-r-lg"} px-4 py-4`}>
                        {row.isLateWaived ? (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                              <BadgeCheck className="h-3.5 w-3.5" /> Late waived
                            </div>
                            <div className="mt-1 max-w-[150px] truncate text-[9px] font-semibold text-gray-400" title={row.waiverReason}>
                              {row.waiverReason}
                            </div>
                          </div>
                        ) : row.attendance?.manual_override ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                            <ShieldCheck className="h-3.5 w-3.5" /> Override
                          </div>
                        ) : row.contextLabel ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
                            <CalendarDays className="h-3.5 w-3.5 text-primary" /> {row.contextLabel}
                          </div>
                        ) : row.isException ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Needs review
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                            <Activity className="h-3.5 w-3.5" /> Normal
                          </div>
                        )}
                      </td>
                      {canManageAttendance && (
                        <td className="rounded-r-lg px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {(row.lateAfterGraceMinutes > 0 || row.isLateWaived) && (
                              <button
                                type="button"
                                onClick={() => row.isLateWaived ? revokeLateWaiver(row) : openLateWaiver(row)}
                                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[10px] font-black shadow-sm transition ${
                                  row.isLateWaived
                                    ? "border border-green-100 bg-green-50 text-green-700 hover:bg-green-100"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                                title={row.isLateWaived ? "Remove late waiver" : "Mark this late arrival as waived"}
                              >
                                {row.isLateWaived ? <RotateCcw className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                                {row.isLateWaived ? "Undo" : "Waive Late"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditingRow(row)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm transition hover:text-blue-600"
                              title={row.attendance ? "Edit attendance" : "Create attendance"}
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                ))}
                {!loading && filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={canManageAttendance ? 10 : 9} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {canManageAttendance ? "No API attendance found for selected filters" : "No attendance record found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingRow && (
          <AttendanceOverrideModal
            key={`${editingRow.employee.id}-${date}-${editingRow.attendance?.id || "new"}-${editingRow.status}`}
            isOpen={Boolean(editingRow)}
            mode="edit"
            date={date}
            employee={editingRow.employee}
            attendance={editingRow.attendance}
            currentStatus={editingRow.status}
            contextLabel={editingRow.contextLabel || (editingRow.status === "absent" ? "Absent correction" : "")}
            onClose={() => setEditingRow(null)}
            onSaved={handleAttendanceSaved}
          />
        )}

        <Modal
          isOpen={Boolean(waiverRow)}
          onClose={() => setWaiverRow(null)}
          title="Waive Late Arrival"
          size="sm"
        >
          {waiverRow && (
            <div className="space-y-5">
              <div className="flex gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800">{waiverRow.employee.name}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-5 text-gray-500">
                    Recorded {formatDuration(waiverRow.lateAfterGraceMinutes)} late after the shift grace period on {date}.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] leading-5 text-gray-500">
                The original check-in time will remain unchanged. This waiver marks the attendance as on time and removes this instance from late totals.
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Waiver Reason
                </label>
                <select value={waiverReason} onChange={(event) => setWaiverReason(event.target.value)}>
                  <option>Manager discretion</option>
                  <option>Approved official work</option>
                  <option>Transport disruption</option>
                  <option>Medical circumstances</option>
                  <option>System or device issue</option>
                  <option>Other approved exception</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Internal Note <span className="font-semibold normal-case text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={waiverNote}
                  onChange={(event) => setWaiverNote(event.target.value)}
                  rows={3}
                  maxLength={250}
                  placeholder="Add context for the attendance record..."
                />
                <p className="mt-1 text-right text-[9px] text-gray-400">{waiverNote.length}/250</p>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <Button type="button" variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={() => setWaiverRow(null)}>
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={confirmLateWaiver}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-green-600 px-5 text-xs font-bold text-white transition hover:bg-green-700"
                >
                  <BadgeCheck className="h-4 w-4" /> Confirm Waiver
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
