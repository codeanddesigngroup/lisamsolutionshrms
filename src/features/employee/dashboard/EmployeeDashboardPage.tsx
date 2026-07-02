"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Coffee,
  FileText,
  MapPin,
  RefreshCw,
  Timer,
  UserCheck,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { isTaskAssignedToUser } from "@/lib/task-visibility";
import { filterEmployeeScopedRecords } from "@/lib/employee-scope";

type ShiftSummary = {
  id?: number | string;
  shift_name?: string;
  code?: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  late_grace_minutes?: number;
  half_day_mark_time?: string;
  min_hours?: number;
  shift_hours?: number | string;
};

type EmployeeRecord = {
  id: number | string;
  name: string;
  email?: string;
  employee_id?: number | string;
  gender?: string;
  joining_date?: string;
  mobile?: string;
  status?: string;
  role?: string;
  designation?: { name?: string };
  department?: { name?: string; team_name?: string };
  employee_detail?: {
    employee_id?: number | string;
    joining_date?: string;
    mobile?: string;
    designation?: { name?: string };
    department?: { name?: string; team_name?: string };
    shift_type_id?: number | string | null;
    shift_type?: ShiftSummary;
  };
};

type AttendanceRecord = {
  id: number | string;
  employee_id?: number | string;
  user_id?: number | string;
  date?: string;
  status?: string;
  clock_in?: string;
  clock_out?: string;
};

type LeaveRecord = {
  id: number | string;
  user_id?: number | string;
  status?: string;
  user?: { id?: number | string; name?: string };
  employee?: { id?: number | string; name?: string };
};

type TaskRecord = {
  id: number | string;
  heading?: string;
  title?: string;
  priority?: string;
  status?: string;
  project?: { project_name?: string; name?: string };
  users?: Array<{ id?: number | string; name?: string }>;
};

type EventRecord = {
  id: number | string;
  title?: string;
  event_name?: string;
  name?: string;
  date?: string;
  event_date?: string;
  start_date?: string;
  time?: string;
  start_time?: string;
  employee_id?: number | string;
  user_id?: number | string;
  employee?: { id?: number | string; name?: string } | string;
  user?: { id?: number | string; name?: string };
  users?: Array<{ id?: number | string; name?: string; email?: string }>;
  attendees?: Array<{ id?: number | string; name?: string; email?: string }>;
  audience?: string;
  category?: string;
  location?: string;
};

function extractRecords<T>(payload: unknown): T[] {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
}

function extractRecord<T>(payload: unknown): T | null {
  const records = extractRecords<T>(payload);
  if (records[0]) return records[0];
  const root = payload as { data?: unknown } | null;
  return root?.data && typeof root.data === "object" ? (root.data as T) : null;
}

function localDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function payloadTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function displayTime(value?: string) {
  if (!value) return "--:--";
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function minutesFromTime(value?: string) {
  if (!value) return null;
  const [hours = "0", minutes = "0"] = value.split(":");
  const total = Number(hours) * 60 + Number(minutes);
  return Number.isFinite(total) ? total : null;
}

function normalizedShiftMinute(value?: string, shift?: ShiftSummary) {
  const minutes = minutesFromTime(value);
  const start = minutesFromTime(shift?.start_time);
  const end = minutesFromTime(shift?.end_time);
  if (minutes === null) return null;
  if (start !== null && end !== null && end <= start && minutes < start) return minutes + 1440;
  return minutes;
}

function calculateAttendanceFlags(clockIn: string, shift?: ShiftSummary) {
  const clockMinute = normalizedShiftMinute(clockIn, shift);
  const shiftStart = normalizedShiftMinute(shift?.start_time, shift);
  const halfDayMark = normalizedShiftMinute(shift?.half_day_mark_time, shift);
  const halfDay = clockMinute !== null && halfDayMark !== null && clockMinute >= halfDayMark;
  const late =
    !halfDay &&
    clockMinute !== null &&
    shiftStart !== null &&
    clockMinute > shiftStart + Number(shift?.late_grace_minutes || 0);

  return { late, half_day: halfDay };
}

function statusText(value?: string) {
  return (value || "").toLowerCase();
}

function getAttendanceEmployeeId(row: AttendanceRecord) {
  return row.employee_id || row.user_id || "unknown";
}

function getLeaveEmployeeId(row: LeaveRecord) {
  return row.user?.id || row.employee?.id || row.user_id || "unknown";
}

function getShiftLabel(shift?: ShiftSummary) {
  if (!shift) return "No shift assigned";
  return `${getShiftName(shift)} - ${shift.start_time || "--:--"} to ${shift.end_time || "--:--"}`;
}

function getShiftName(shift?: ShiftSummary) {
  const name = shift?.shift_name || shift?.type || shift?.code;
  if (!name) return "Assigned Shift";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getEventDate(event: EventRecord) {
  return event.date || event.event_date || event.start_date || "";
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [time, setTime] = useState("");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [activeAttendanceId, setActiveAttendanceId] = useState<number | string | null>(null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id === undefined || user?.id === null || String(user.id).trim() === "") {
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const userScope = user?.id ? `user_id=${encodeURIComponent(String(user.id))}` : "";
        const employeeResponse = await api.get(`/employee/${encodeURIComponent(String(user.id))}`);
        const employee = extractRecord<EmployeeRecord>(employeeResponse.data);
        setEmployees(employee ? [employee] : []);

        const [attendanceResponse, leaveResponse, taskResponse, eventResponse] = await Promise.allSettled([
          api.get("/attendance"),
          api.get("/leave"),
          api.get(user?.id ? `/task?include=project,users&user_id=${encodeURIComponent(String(user.id))}` : "/task?include=project,users"),
          api.get(userScope ? `/event?${userScope}` : "/event"),
        ]);

        if (attendanceResponse.status === "fulfilled") setAttendance(extractRecords<AttendanceRecord>(attendanceResponse.value.data));
        if (leaveResponse.status === "fulfilled") setLeaves(extractRecords<LeaveRecord>(leaveResponse.value.data));
        if (taskResponse.status === "fulfilled") setTasks(extractRecords<TaskRecord>(taskResponse.value.data));
        if (eventResponse.status === "fulfilled") setEvents(extractRecords<EventRecord>(eventResponse.value.data));
      } catch {
        showToast("Failed to load your employee profile.", "error");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void fetchDashboardData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [showToast, user?.id]);

  const currentEmployee = useMemo(() => {
    const userId = String(user?.id || "");
    const userEmail = user?.email?.toLowerCase();
    const userName = user?.name?.toLowerCase();

    return (
      employees.find((employee) => String(employee.id) === userId) ||
      employees.find((employee) => employee.email?.toLowerCase() === userEmail) ||
      employees.find((employee) => employee.name.toLowerCase() === userName) ||
      employees.find((employee) => employee.role === "employee") ||
      null
    );
  }, [employees, user?.email, user?.id, user?.name]);

  const assignedShift = currentEmployee?.employee_detail?.shift_type;
  const employeeId = currentEmployee?.id ? String(currentEmployee.id) : "";
  const employeeDetail = currentEmployee?.employee_detail;
  const designation = currentEmployee?.designation?.name || employeeDetail?.designation?.name || "Not assigned";
  const department = currentEmployee?.department?.name || currentEmployee?.department?.team_name || employeeDetail?.department?.name || employeeDetail?.department?.team_name || "Not assigned";

  const myAttendance = useMemo(
    () => attendance.filter((row) => String(getAttendanceEmployeeId(row)) === employeeId),
    [attendance, employeeId],
  );

  const myLeaves = useMemo(
    () => leaves.filter((leave) => String(getLeaveEmployeeId(leave)) === employeeId || leave.user?.name === currentEmployee?.name || leave.employee?.name === currentEmployee?.name),
    [currentEmployee?.name, employeeId, leaves],
  );

  const assignedTasks = useMemo(() => {
    return tasks
      .filter((task) => task.users?.some((item) => String(item.id) === employeeId) || isTaskAssignedToUser(task, user))
      .slice(0, 4);
  }, [employeeId, tasks, user]);

  const upcomingEvents = useMemo(() => {
    const today = localDateString();
    return filterEmployeeScopedRecords(events, user, { includePublic: true })
      .filter((event) => {
        const eventDate = getEventDate(event);
        return !eventDate || eventDate >= today;
      })
      .sort((a, b) => getEventDate(a).localeCompare(getEventDate(b)))
      .slice(0, 4);
  }, [events, user]);

  useEffect(() => {
    if (!currentEmployee) return;

    const todaysOpenRecord = myAttendance.find(
      (row) => row.date === localDateString() && Boolean(row.clock_in) && !row.clock_out,
    );

    if (todaysOpenRecord) {
      const timeoutId = window.setTimeout(() => {
      setIsClockedIn(true);
      setClockInTime(displayTime(todaysOpenRecord.clock_in));
      setActiveAttendanceId(todaysOpenRecord.id);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [currentEmployee, myAttendance]);

  const attendanceRate = useMemo(() => {
    const measurableRows = myAttendance.filter((row) => !["holiday", "weekend"].includes(statusText(row.status)));
    if (measurableRows.length === 0) return 0;
    const presentRows = measurableRows.filter((row) => ["present", "late", "half-day", "half day"].includes(statusText(row.status)) || Boolean(row.clock_in));
    return Math.round((presentRows.length / measurableRows.length) * 100);
  }, [myAttendance]);

  const pendingLeaves = myLeaves.filter((leave) => statusText(leave.status) === "pending").length;
  const activeLeaves = myLeaves.filter((leave) => !["rejected", "cancelled"].includes(statusText(leave.status))).length;

  const summaryStats = [
    { label: "My Leaves", value: String(activeLeaves), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Attendance", value: `${attendanceRate}%`, icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "My Shift", value: assignedShift ? getShiftName(assignedShift) : "None", icon: Timer, color: "text-green-600", bg: "bg-green-50" },
    { label: "Events", value: String(upcomingEvents.length), icon: Calendar, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Pending Requests", value: String(pendingLeaves), icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const handleClockToggle = async () => {
    if (!currentEmployee) {
      showToast("Employee profile was not found for this login.", "error");
      return;
    }

    const now = new Date();
    const clockTime = payloadTime(now);
    const { late, half_day: halfDay } = calculateAttendanceFlags(clockTime, assignedShift);
    const status = late ? "late" : halfDay ? "half-day" : "present";

    setAttendanceSaving(true);
    try {
      if (!isClockedIn) {
        const response = await api.post("/attendance", {
          employee_id: currentEmployee.id,
          user_id: currentEmployee.id,
          date: localDateString(now),
          status,
          clock_in: clockTime,
          clock_in_ip: "browser",
          working_from: "remote",
          late,
          half_day: halfDay,
          shift_type_id: currentEmployee.employee_detail?.shift_type_id || assignedShift?.id || null,
          shift_type: assignedShift,
          source: "employee-dashboard",
        });
        const created = extractRecord<AttendanceRecord>(response.data);
        setActiveAttendanceId(created?.id || null);
        setIsClockedIn(true);
        setClockInTime(displayTime(clockTime));
        showToast(late ? "Clock-in recorded with late mark." : "Clock-in recorded successfully.", "success");
      } else {
        const payload = {
          employee_id: currentEmployee.id,
          user_id: currentEmployee.id,
          date: localDateString(now),
          clock_out: clockTime,
          clock_out_ip: "browser",
          action: "clock_out",
          source: "employee-dashboard",
        };

        if (activeAttendanceId) {
          await api.patch(`/attendance/${activeAttendanceId}`, payload);
        } else {
          await api.post("/attendance", payload);
        }

        setIsClockedIn(false);
        setIsOnBreak(false);
        setClockInTime(null);
        setActiveAttendanceId(null);
        showToast("Clock-out recorded successfully.", "success");
      }
    } catch {
      showToast("Attendance endpoint is not ready. Your action stayed local for now.", "error");
      setIsClockedIn((current) => !current);
      setClockInTime(!isClockedIn ? displayTime(clockTime) : null);
    } finally {
      setAttendanceSaving(false);
    }
  };

  const toggleBreak = () => {
    if (!isClockedIn) return;
    setIsOnBreak((current) => !current);
    showToast(isOnBreak ? "Break ended." : "Break started.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-col justify-between gap-6 border-b border-gray-50 bg-white px-6 py-8 shadow-sm lg:flex-row lg:items-center">
          <div className="flex items-center space-x-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <span className="text-2xl font-black">{(currentEmployee?.name || user?.name || "U").charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"}, {(currentEmployee?.name || user?.name || "User").split(" ")[0]}!
                </h1>
                {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
              </div>
              <p className="mt-1 flex items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                <MapPin className="mr-1.5 h-3 w-3 text-primary" />
                {department} · {designation} - {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary">{getShiftLabel(assignedShift)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden border-r border-gray-100 pr-4 text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Time</p>
              <p className="text-xl font-black text-gray-800">{time || "--:--:--"}</p>
            </div>
            <button
              type="button"
              onClick={handleClockToggle}
              disabled={attendanceSaving}
              className={`flex items-center space-x-3 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
                isClockedIn
                  ? "bg-red-500 text-white shadow-red-200 hover:bg-red-600"
                  : "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
              }`}
            >
              {attendanceSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Timer className={`h-4 w-4 ${isClockedIn ? "animate-pulse" : ""}`} />}
              <span>{isClockedIn ? "Clock Out" : "Clock In"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-6">
          {summaryStats.map((stat) => (
            <Card key={stat.label} className="flex items-center space-x-4 border-none bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">
                  <UserCheck className="mr-2 h-4 w-4 text-primary" />
                  My Profile
                </h3>
                <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${currentEmployee?.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  {currentEmployee?.status || "Unknown"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Employee ID", String(employeeDetail?.employee_id || currentEmployee?.employee_id || currentEmployee?.id || "--")],
                  ["Email", currentEmployee?.email || user?.email || "--"],
                  ["Mobile", employeeDetail?.mobile || currentEmployee?.mobile || "--"],
                  ["Department", department],
                  ["Designation", designation],
                  ["Joining Date", currentEmployee?.joining_date || employeeDetail?.joining_date || "--"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-1 break-words text-xs font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
                <h3 className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  My Tasks
                </h3>
                <Link href="/tasks" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {assignedTasks.length > 0 ? assignedTasks.map((task) => {
                  const priority = task.priority || "Low";
                  const status = task.status || "Pending";
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="block p-6 transition-colors hover:bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`mt-1 h-2 w-2 rounded-full ${priority.toLowerCase() === "high" ? "bg-red-500" : priority.toLowerCase() === "medium" ? "bg-orange-500" : "bg-blue-500"}`} />
                          <div>
                            <h4 className="text-sm font-bold text-gray-800 transition-colors hover:text-primary">{task.heading || task.title}</h4>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <Briefcase className="mr-1 h-3 w-3" />
                                {task.project?.project_name || task.project?.name || "Internal"}
                              </span>
                              <span className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${status.toLowerCase().includes("progress") ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                                {status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300" />
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="px-6 py-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    No assigned tasks yet
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
              <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
                <h3 className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  Recent Notices
                </h3>
              </div>
              <div className="space-y-4 p-6">
                {[
                  { title: "Quarterly Performance Review Schedule", date: "2 days ago", tag: "HR" },
                  { title: "New Remote Work Policy Guidelines", date: "1 week ago", tag: "Policy" },
                ].map((item) => (
                  <div key={item.title} className="flex cursor-default items-start space-x-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{item.title}</p>
                      <div className="mt-1.5 flex items-center space-x-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.date}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{item.tag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="group relative overflow-hidden border-none bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-sm">
              <div className="absolute -bottom-8 -right-8 opacity-10 transition-transform duration-700 group-hover:scale-110">
                <Timer size={160} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Shift Status</h3>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black">{isClockedIn ? (isOnBreak ? "ON BREAK" : "ON DUTY") : "OFF DUTY"}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {isClockedIn ? `Clocked in at ${clockInTime}` : "You have not clocked in yet"}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white/20 ${isClockedIn ? "animate-pulse" : ""}`}>
                    <div className={`h-4 w-4 rounded-full ${isClockedIn ? "bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]" : "bg-white/40"}`} />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Shift</p>
                    <p className="text-sm font-black">{assignedShift ? getShiftName(assignedShift) : "None"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Timing</p>
                    <p className="text-sm font-black">{assignedShift ? `${assignedShift.start_time}-${assignedShift.end_time}` : "--"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Grace</p>
                    <p className="text-sm font-black">{assignedShift?.late_grace_minutes ?? 0} min</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Min Hours</p>
                    <p className="text-sm font-black">{assignedShift?.min_hours ?? assignedShift?.shift_hours ?? 0} hrs</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleBreak}
                  disabled={!isClockedIn}
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-white/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Coffee className="mr-2 h-3 w-3" />
                  {isOnBreak ? "End Break" : "Take a Break"}
                </button>
              </div>
            </Card>

            <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Upcoming Events</h3>
                <Link href="/event-calendar" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Calendar</Link>
              </div>
              <div className="space-y-4 p-6">
                {upcomingEvents.length > 0 ? upcomingEvents.map((event) => {
                  const eventDate = getEventDate(event);
                  return (
                    <Link key={event.id} href="/event-calendar" className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all hover:bg-white hover:shadow-md">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-gray-100 bg-white transition-all group-hover:border-primary/30 group-hover:bg-primary/5">
                          <span className="text-[8px] font-black uppercase leading-none text-primary">{formatDate(eventDate).split(" ")[0]}</span>
                          <span className="text-sm font-black text-gray-800">{formatDate(eventDate).split(" ")[1] || "--"}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{event.title || event.event_name || event.name || "Untitled event"}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{event.time || event.start_time || event.location || "Scheduled"}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-pink-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-pink-600">{event.category || "Event"}</span>
                    </Link>
                  );
                }) : (
                  <div className="px-2 py-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    No upcoming events
                  </div>
                )}
              </div>
            </Card>

            <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Upcoming Holidays</h3>
              </div>
              <div className="space-y-4 p-6">
                {[
                  { name: "Eid-ul-Adha", date: "May 15", day: "Friday" },
                  { name: "Global HR Day", date: "May 20", day: "Wednesday" },
                ].map((holiday) => (
                  <div key={holiday.name} className="group flex cursor-default items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50 transition-all group-hover:border-primary/30 group-hover:bg-primary/5">
                        <span className="text-[8px] font-black uppercase leading-none text-primary">{holiday.date.split(" ")[0]}</span>
                        <span className="text-sm font-black text-gray-800">{holiday.date.split(" ")[1]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{holiday.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{holiday.day}</p>
                      </div>
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/30 transition-transform group-hover:scale-150" />
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/holidays" className="flex w-full items-center justify-center rounded-xl border border-dashed border-gray-200 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all hover:border-primary hover:text-primary">
                    View Holiday Calendar
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
