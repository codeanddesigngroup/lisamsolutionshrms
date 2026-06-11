"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { Plus, Calendar, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { calculateAttendanceStatus, ShiftDefinition } from "@/lib/hr-utils";

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

type IclockTransaction = {
  id?: number | string;
  emp?: number | string;
  emp_code?: number | string;
  employee_id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  department?: string | null;
  position?: string | null;
  punch_time?: string;
  timestamp?: string;
  terminal_sn?: string;
  terminal_alias?: string;
  terminal_id?: number | string;
  area_alias?: string;
};

type IclockEmployee = {
  id?: number | string;
  emp_code?: number | string;
  employee_id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  department?: unknown;
  position?: unknown;
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

const normalizePunchDateTime = (value?: string) => {
  if (!value) return null;
  const normalized = value.replace(" ", "T");
  const [datePart, timePart = ""] = normalized.split("T");
  if (!datePart || !timePart) return null;
  return {
    date: datePart.slice(0, 10),
    time: timePart.slice(0, 8),
    sortable: `${datePart.slice(0, 10)}T${timePart.slice(0, 8)}`,
  };
};

const getTransactionEmployeeCode = (transaction: IclockTransaction) =>
  String(transaction.emp_code ?? transaction.employee_id ?? transaction.emp ?? "").trim();

const getEmployeeMatchCodes = (employee: EmployeeOption) =>
  [
    employee.id,
    employee.employee_id,
    employee.employee_detail?.employee_id,
  ]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value).trim());

const getIclockEmployeeName = (transaction: IclockTransaction, employeeCode: string) => {
  const name = [transaction.first_name, transaction.last_name].filter(Boolean).join(" ").trim();
  return name || employeeCode;
};

const getObjectLabel = (value: unknown, keys: string[]) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      const label = record[key];
      if (typeof label === "string" || typeof label === "number") return String(label);
    }
  }
  return "";
};

const getPersonnelEmployeeCode = (employee: IclockEmployee) =>
  String(employee.emp_code ?? employee.employee_id ?? employee.id ?? "").trim();

const buildPersonnelEmployeeOptions = (employees: IclockEmployee[]): EmployeeOption[] =>
  employees
    .map((employee) => {
      const employeeCode = getPersonnelEmployeeCode(employee);
      if (!employeeCode) return null;
      const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() || employee.nickname || employeeCode;
      const designation = getObjectLabel(employee.position, ["position_name", "name", "alias"]);
      const department = getObjectLabel(employee.department, ["dept_name", "department_name", "name", "alias"]);

      return {
        id: employeeCode,
        employee_id: employeeCode,
        name,
        email: "",
        role: "employee",
        employee_detail: {
          employee_id: employeeCode,
          designation: designation ? { name: designation } : undefined,
          department: department ? { name: department, team_name: department } : undefined,
        },
      };
    })
    .filter(Boolean) as EmployeeOption[];

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

const buildIclockEmployeeOptions = (
  transactions: IclockTransaction[],
  employeeList: EmployeeOption[],
): EmployeeOption[] => {
  const existingCodes = new Set(employeeList.flatMap(getEmployeeMatchCodes));
  const virtualEmployees = new Map<string, EmployeeOption>();

  transactions.forEach((transaction) => {
    const employeeCode = getTransactionEmployeeCode(transaction);
    if (!employeeCode || existingCodes.has(employeeCode) || virtualEmployees.has(employeeCode)) return;

    virtualEmployees.set(employeeCode, {
      id: employeeCode,
      employee_id: employeeCode,
      name: getIclockEmployeeName(transaction, employeeCode),
      email: "",
      role: "employee",
      employee_detail: {
        employee_id: employeeCode,
        designation: transaction.position ? { name: transaction.position } : undefined,
        department: transaction.department ? { name: transaction.department, team_name: transaction.department } : undefined,
      },
    });
  });

  return Array.from(virtualEmployees.values());
};

const buildIclockAttendanceRecords = (
  transactions: IclockTransaction[],
  employeeList: EmployeeOption[],
  selectedDate: string,
): AttendanceRecord[] => {
  const grouped = new Map<string, { employee: EmployeeOption; punches: Array<IclockTransaction & { punchTime: string; sortable: string }> }>();

  transactions.forEach((transaction) => {
    const punchDateTime = normalizePunchDateTime(transaction.punch_time || transaction.timestamp);
    if (!punchDateTime || punchDateTime.date !== selectedDate) return;

    const transactionEmployeeCode = getTransactionEmployeeCode(transaction);
    if (!transactionEmployeeCode) return;

    const employee = employeeList.find((item) => getEmployeeMatchCodes(item).includes(transactionEmployeeCode));
    if (!employee) return;

    const key = String(employee.id);
    const existing = grouped.get(key);
    const punch = { ...transaction, punchTime: punchDateTime.time, sortable: punchDateTime.sortable };

    if (existing) {
      existing.punches.push(punch);
    } else {
      grouped.set(key, { employee, punches: [punch] });
    }
  });

  return Array.from(grouped.values()).map(({ employee, punches }) => {
    const sortedPunches = punches.sort((first, second) => first.sortable.localeCompare(second.sortable));
    const firstPunch = sortedPunches[0];
    const lastPunch = sortedPunches[sortedPunches.length - 1];
    const deviceId = firstPunch.terminal_id || firstPunch.terminal_sn || firstPunch.terminal_alias || "iclock";

    return {
      id: `iclock-${selectedDate}-${employee.id}`,
      employee_id: employee.id,
      user_id: employee.id,
      employee,
      date: selectedDate,
      clock_in: firstPunch.punchTime,
      clock_out: sortedPunches.length > 1 ? lastPunch.punchTime : "",
      clock_in_ip: firstPunch.terminal_sn || firstPunch.terminal_alias || firstPunch.area_alias || "iClock",
      clock_out_ip: sortedPunches.length > 1 ? lastPunch.terminal_sn || lastPunch.terminal_alias || lastPunch.area_alias || "iClock" : "",
      source_type: "machine",
      source: "iclock",
      device_id: deviceId,
      attendance_device_id: deviceId,
      status: "present",
    };
  });
};

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
      let attendanceList: AttendanceRecord[] = [];
      let deviceEmployees: EmployeeOption[] = [];

      try {
        const [employeeApiResponse, deviceResponse] = await Promise.all([
          fetch("/api/iclock-employees?page_size=10000", { cache: "no-store" }),
          fetch(`/api/iclock-transactions?date=${encodeURIComponent(date)}`, { cache: "no-store" }),
        ]);
        const [employeePayload, devicePayload] = await Promise.all([
          employeeApiResponse.json(),
          deviceResponse.json(),
        ]);

        if (!employeeApiResponse.ok || !Array.isArray(employeePayload.data)) {
          showToast(employeePayload.message || "Could not load biometric employees", "error");
        }

        const personnelEmployees = employeeApiResponse.ok && Array.isArray(employeePayload.data)
          ? buildPersonnelEmployeeOptions(employeePayload.data as IclockEmployee[])
          : [];
        deviceEmployees = personnelEmployees;

        if (deviceResponse.ok && Array.isArray(devicePayload.data)) {
          const deviceTransactions = devicePayload.data as IclockTransaction[];
          const fallbackEmployees = buildIclockEmployeeOptions(deviceTransactions, personnelEmployees);
          deviceEmployees = [...personnelEmployees, ...fallbackEmployees];
          attendanceList = buildIclockAttendanceRecords(deviceTransactions, deviceEmployees, date);
        } else {
          showToast(devicePayload.message || "Could not load biometric attendance", "error");
        }
      } catch (deviceError) {
        console.error("Fetch iClock Transactions Error:", deviceError);
        showToast("Could not load biometric attendance.", "error");
      }

      const employeesWithAttendance = canManageAttendance
        ? deviceEmployees.filter((employee) =>
            attendanceList.some((row) => String(row.employee_id || row.user_id || row.employee?.id || "") === String(employee.id))
          )
        : deviceEmployees.filter((employee) => isCurrentUserEmployee(employee, user));
      setEmployees(employeesWithAttendance);
      setAttendance(attendanceList.filter((row) =>
        canManageAttendance ||
        isCurrentUserEmployee(row.employee as EmployeeOption | undefined, user)
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
