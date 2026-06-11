"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { AlertTriangle, Clock, Download, FileCheck, RefreshCw, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import StableResponsiveContainer from "@/components/charts/StableResponsiveContainer";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import BiometricRealtimeWidgets from "@/components/attendance/dashboard/BiometricRealtimeWidgets";

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
};

type EmployeeRecord = {
  id: number | string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  created_at?: string;
  gender?: string;
  employee_detail?: {
    joining_date?: string;
    gender?: string;
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
  status?: string;
  late?: boolean;
  clock_in?: string;
  employee?: { id?: number | string; name?: string };
};

type LeaveRecord = {
  id: number | string;
  user_id?: number | string;
  status?: string;
  user?: { id?: number | string; name?: string };
  employee?: { id?: number | string; name?: string };
};

type ShiftType = ShiftSummary & {
  id: number | string;
  shift_name: string;
  status?: string;
  color?: string;
};

type ChartDatum = {
  name: string;
  value: number;
  color: string;
};

type RankingRow = {
  id: number | string;
  name: string;
  count: number;
  avatar: string;
};

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

const chartPalette = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#ef4444", "#6366f1"];

function extractRecords<T>(payload: unknown): T[] {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
}

function initials(name?: string) {
  return (name || "NA")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getEmployeeShiftId(employee: EmployeeRecord) {
  return employee.employee_detail?.shift_type_id || employee.employee_detail?.shift_type?.id || null;
}

function getDepartment(employee: EmployeeRecord) {
  return employee.employee_detail?.department?.team_name || employee.employee_detail?.department?.name || "Unassigned";
}

function getDesignation(employee: EmployeeRecord) {
  return employee.employee_detail?.designation?.name || "Staff";
}

function getStatus(value?: string) {
  return (value || "active").toLowerCase();
}

function isActiveEmployee(employee: EmployeeRecord) {
  return !["deactive", "inactive", "terminated", "exit", "exited"].includes(getStatus(employee.status));
}

function isCurrentMonth(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function minutesFromTime(time?: string) {
  if (!time) return null;
  const [hours = "0", minutes = "0"] = time.split(":");
  const total = Number(hours) * 60 + Number(minutes);
  return Number.isFinite(total) ? total : null;
}

function isOvernightShift(shift: ShiftSummary) {
  const start = minutesFromTime(shift.start_time);
  const end = minutesFromTime(shift.end_time);
  return start !== null && end !== null && end <= start;
}

function getAttendanceEmployeeId(row: AttendanceRecord) {
  return row.employee_id || row.user_id || row.employee?.id || "unknown";
}

function getLeaveEmployeeId(row: LeaveRecord) {
  return row.user?.id || row.employee?.id || row.user_id || "unknown";
}

function getLeaveEmployeeName(row: LeaveRecord) {
  return row.user?.name || row.employee?.name || "Unknown Employee";
}

function buildDistribution<T>(items: T[], getLabel: (item: T) => string): ChartDatum[] {
  const counts = items.reduce<Record<string, number>>((accumulator, item) => {
    const label = getLabel(item) || "Unassigned";
    accumulator[label] = (accumulator[label] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).map(([name, value], index) => ({
    name,
    value,
    color: chartPalette[index % chartPalette.length],
  }));
}

function chartDataOrEmpty(data: ChartDatum[]) {
  return data.length > 0 ? data : [{ name: "No Data", value: 1, color: "#e5e7eb" }];
}

function downloadCsv(fileName: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-lg">
        <p className="text-xs font-bold text-gray-800">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

function DistributionChart({ title, data, fileName }: { title: string; data: ChartDatum[]; fileName: string }) {
  const displayData = chartDataOrEmpty(data);

  return (
    <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-6 py-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">{title}</h3>
        <button
          type="button"
          onClick={() => downloadCsv(fileName, [["Name", "Count"], ...data.map((item) => [item.name, String(item.value)]),])}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-primary"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
      <div className="p-6">
        <StableResponsiveContainer height={256}>
          <PieChart>
            <Pie data={displayData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {displayData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#6b7280" }}
            />
          </PieChart>
        </StableResponsiveContainer>
      </div>
    </Card>
  );
}

export default function HRDashboard() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [employeeResponse, attendanceResponse, leaveResponse, shiftResponse] = await Promise.all([
        api.get("/employee"),
        api.get("/attendance"),
        api.get("/leave"),
        api.get("/shift-types"),
      ]);
      setEmployees(extractRecords<EmployeeRecord>(employeeResponse.data));
      setAttendance(extractRecords<AttendanceRecord>(attendanceResponse.data));
      setLeaves(extractRecords<LeaveRecord>(leaveResponse.data));
      setShiftTypes(extractRecords<ShiftType>(shiftResponse.data));
    } catch {
      showToast("Failed to load HR dashboard data from the API.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDashboardData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeEmployees = useMemo(() => employees.filter(isActiveEmployee), [employees]);
  const exitedEmployees = useMemo(() => employees.filter((employee) => !isActiveEmployee(employee)), [employees]);

  const approvedLeaves = useMemo(
    () => leaves.filter((leave) => getStatus(leave.status) === "approved").length,
    [leaves],
  );

  const newEmployees = useMemo(
    () => employees.filter((employee) => isCurrentMonth(employee.created_at || employee.employee_detail?.joining_date)).length,
    [employees],
  );

  const averageAttendance = useMemo(() => {
    const measurableRows = attendance.filter((row) => !["holiday", "weekend"].includes(getStatus(row.status)));
    if (measurableRows.length === 0) return 0;
    const presentRows = measurableRows.filter((row) => {
      const status = getStatus(row.status);
      return ["present", "late", "half-day", "half day"].includes(status) || Boolean(row.clock_in);
    });
    return Math.round((presentRows.length / measurableRows.length) * 100);
  }, [attendance]);

  const statCards = useMemo(
    () => [
      { label: "Total Leaves Approved", value: String(approvedLeaves), icon: FileCheck, color: "text-green-500", bg: "bg-green-50", href: "/leaves" },
      { label: "Total New Employee", value: String(newEmployees), icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50", href: "/employees" },
      { label: "Total Employee Exits", value: String(exitedEmployees.length), icon: UserMinus, color: "text-red-500", bg: "bg-red-50", href: "/employees" },
      { label: "Average Attendance", value: `${averageAttendance}%`, icon: UserCheck, color: "text-purple-500", bg: "bg-purple-50", href: "/attendance" },
    ],
    [approvedLeaves, averageAttendance, exitedEmployees.length, newEmployees],
  );

  const assignedEmployees = useMemo(
    () => activeEmployees.filter((employee) => Boolean(getEmployeeShiftId(employee))).length,
    [activeEmployees],
  );

  const unassignedEmployees = activeEmployees.length - assignedEmployees;

  const shiftCoverage = useMemo(
    () =>
      shiftTypes.map((shift) => ({
        shift,
        count: activeEmployees.filter((employee) => String(getEmployeeShiftId(employee)) === String(shift.id)).length,
      })),
    [activeEmployees, shiftTypes],
  );

  const departmentData = useMemo(() => buildDistribution(activeEmployees, getDepartment), [activeEmployees]);
  const designationData = useMemo(() => buildDistribution(activeEmployees, getDesignation), [activeEmployees]);
  const genderData = useMemo(
    () => buildDistribution(activeEmployees, (employee) => employee.gender || employee.employee_detail?.gender || "Not Set"),
    [activeEmployees],
  );
  const roleData = useMemo(
    () => buildDistribution(employees, (employee) => (employee.role === "admin" ? "Admin" : "Employee")),
    [employees],
  );

  const leavesTaken = useMemo<RankingRow[]>(() => {
    const counts = leaves
      .filter((leave) => !["rejected", "cancelled"].includes(getStatus(leave.status)))
      .reduce<Record<string, RankingRow>>((accumulator, leave) => {
        const id = String(getLeaveEmployeeId(leave));
        const current = accumulator[id] || { id, name: getLeaveEmployeeName(leave), count: 0, avatar: initials(getLeaveEmployeeName(leave)) };
        accumulator[id] = { ...current, count: current.count + 1 };
        return accumulator;
      }, {});

    return Object.values(counts).sort((first, second) => second.count - first.count).slice(0, 5);
  }, [leaves]);

  const lateAttendance = useMemo<RankingRow[]>(() => {
    const counts = attendance
      .filter((row) => row.late || getStatus(row.status) === "late")
      .reduce<Record<string, RankingRow>>((accumulator, row) => {
        const id = String(getAttendanceEmployeeId(row));
        const employee = employees.find((item) => String(item.id) === id);
        const name = row.employee?.name || employee?.name || "Unknown Employee";
        const current = accumulator[id] || { id, name, count: 0, avatar: initials(name) };
        accumulator[id] = { ...current, count: current.count + 1 };
        return accumulator;
      }, {});

    return Object.values(counts).sort((first, second) => second.count - first.count).slice(0, 5);
  }, [attendance, employees]);

  const shiftReadiness = [
    { label: "Staff Assigned", value: `${assignedEmployees}/${activeEmployees.length}`, icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
    { label: "Unassigned Staff", value: String(unassignedEmployees), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Active Shift Types", value: String(shiftTypes.filter((shift) => getStatus(shift.status) === "active").length), icon: Clock, color: "text-green-600", bg: "bg-green-50" },
    { label: "Overnight Shifts", value: String(shiftTypes.filter(isOvernightShift).length), icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const renderRankingRows = (rows: RankingRow[], emptyLabel: string, badgeClass: string) => (
    <tbody className="divide-y divide-gray-50">
      {rows.map((employee) => (
        <tr key={employee.id} className="transition-colors hover:bg-gray-50/50">
          <td className="px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {employee.avatar}
              </div>
              <Link href={employee.id === "unknown" ? "/employees" : `/employees/${employee.id}`} className="text-xs font-bold text-gray-800 transition-colors hover:text-primary">
                {employee.name}
              </Link>
            </div>
          </td>
          <td className="px-6 py-4 text-right">
            <span className={`rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>
              {employee.count}
            </span>
          </td>
        </tr>
      ))}
      {rows.length === 0 && (
        <tr>
          <td colSpan={2} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
            {emptyLabel}
          </td>
        </tr>
      )}
    </tbody>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between border-b border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="flex items-center font-black uppercase tracking-widest text-gray-800">HR Dashboard</h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workforce, leave, attendance, and shift readiness
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-colors hover:text-primary"
              aria-label="Refresh HR dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <ol className="flex space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <li><Link href="/dashboard" className="transition-colors hover:text-primary">Home</Link></li>
              <li>/</li>
              <li className="text-gray-700">HR Dashboard</li>
            </ol>
          </div>
        </div>

        <BiometricRealtimeWidgets />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="group border-none bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} shadow-sm transition-colors group-hover:bg-primary group-hover:text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-none bg-white p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Shift Coverage</h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Employee assignment coverage used by attendance defaults
                </p>
              </div>
              <Link href="/attendance/settings/shifts" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                Manage Shifts
              </Link>
            </div>
            <div className="space-y-4 p-6">
              {shiftCoverage.map(({ shift, count }) => {
                const percentage = activeEmployees.length > 0 ? Math.min(100, Math.round((count / activeEmployees.length) * 100)) : 0;
                return (
                  <div key={shift.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-800">{shift.shift_name}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {shift.start_time || "--:--"} to {shift.end_time || "--:--"}
                          {isOvernightShift(shift) ? " - Overnight" : ""}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{count} staff</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}

              {shiftCoverage.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No shift types configured</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-none bg-white p-0 shadow-sm">
            <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Shift Readiness</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-1">
              {shiftReadiness.map((item) => (
                <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                    <p className="text-lg font-black text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DistributionChart title="Department Wise Employee" data={departmentData} fileName="department-wise-employees.csv" />
          <DistributionChart title="Designation Wise Employee" data={designationData} fileName="designation-wise-employees.csv" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DistributionChart title="Gender Wise Employee" data={genderData} fileName="gender-wise-employees.csv" />
          <DistributionChart title="Role Wise Employee" data={roleData} fileName="role-wise-employees.csv" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
            <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Leaves Taken</h3>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-gray-50 bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-[9px] font-black uppercase text-gray-400">Employee</th>
                  <th className="px-6 py-3 text-right text-[9px] font-black uppercase text-gray-400">Leaves Taken</th>
                </tr>
              </thead>
              {renderRankingRows(leavesTaken, "No leave records found", "bg-green-100 text-green-700")}
            </table>
          </Card>

          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
            <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Late Attendance Mark</h3>
            </div>
            <table className="w-full text-left">
              <thead className="border-b border-gray-50 bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-[9px] font-black uppercase text-gray-400">Employee</th>
                  <th className="px-6 py-3 text-right text-[9px] font-black uppercase text-gray-400">Late Mark</th>
                </tr>
              </thead>
              {renderRankingRows(lateAttendance, "No late attendance found", "bg-orange-100 text-orange-700")}
            </table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
