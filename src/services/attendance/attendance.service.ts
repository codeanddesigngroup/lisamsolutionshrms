import axios from "axios";
import api from "../../lib/api";
import { ApiEnvelope } from "../../lib/api-contract";
import { AttendanceStatus } from "../../lib/hr-utils";

const NODE_API_URL =
  process.env.NEXT_PUBLIC_NODE_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const nodeApi = axios.create({
  baseURL: NODE_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 5000),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

type NodeShift = {
  id?: number | string;
  type?: string;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  late_grace_minutes?: number;
  shift_hours?: number | string;
};

type NodeEmployee = {
  id: number | string;
  company_id?: number | string;
  employee_id: number | string;
  name: string;
  email?: string;
  status?: string;
  designation?: { id?: number | string; name?: string };
  department?: { id?: number | string; name?: string; team_name?: string };
  shift_type?: NodeShift;
  shift_type_id?: number | string;
  joining_date?: string;
  mobile?: string;
};

type NodeAttendanceRecord = {
  id: number | string;
  companyId?: number | string;
  company_id?: number | string;
  employeeId?: number | string;
  employee_id?: number | string;
  workDate?: string;
  work_date?: string;
  checkIn?: string | null;
  check_in?: string | null;
  checkOut?: string | null;
  check_out?: string | null;
  deviceSerial?: string | null;
  device_serial?: string | null;
  workedHours?: number | string;
  worked_hours?: number | string;
  manualOverride?: boolean;
  manual_override?: boolean;
};

export type AttendanceEmployee = NodeEmployee & {
  employee_detail?: {
    employee_id?: number | string;
    designation?: { id?: number | string; name?: string };
    department?: { id?: number | string; name?: string; team_name?: string };
    shift_type_id?: number | string;
    shift_type?: {
      id?: number | string;
      shift_name?: string;
      type?: string;
      start_time?: string;
      end_time?: string;
      break_minutes?: number;
      late_grace_minutes?: number;
      min_hours?: number;
    };
    joining_date?: string;
    mobile?: string;
  };
};

export type AttendanceRecord = {
  id: number | string;
  company_id?: number | string;
  employee_id?: number | string;
  employee_code?: number | string;
  user_id?: number | string;
  employee?: AttendanceEmployee;
  date: string;
  status: "present" | "absent";
  clock_in?: string;
  clock_out?: string;
  worked_hours?: number;
  manual_override?: boolean;
  source?: string;
  source_type?: string;
  device_id?: string | number | null;
  attendance_device_id?: string | number | null;
  device_serial?: string | null;
};

export interface RawPunch {
  id: string | number;
  employee_id: string | number;
  device_id: string | number;
  timestamp: string;
  type: "check_in" | "check_out";
  status: "processed" | "pending" | "ignored";
  metadata?: Record<string, any>;
}

export interface AttendanceAuditLog {
  id: string | number;
  date: string;
  punches: RawPunch[];
  processed_attendance?: {
    clock_in: string;
    clock_out: string;
    status: AttendanceStatus;
  };
}

const toClockTime = (value?: string | null) => {
  if (!value) return "";
  const rawTimeMatch = value.match(/^\d{4}-\d{2}-\d{2}[ T](\d{2}):(\d{2})/);

  if (rawTimeMatch) {
    return `${rawTimeMatch[1]}:${rawTimeMatch[2]}`;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  }

  return value.includes("T") ? value.slice(11, 16) : value.slice(0, 5);
};

const normalizeShift = (shift?: NodeShift) => {
  if (!shift) return undefined;

  return {
    ...shift,
    shift_name: shift.shift_name || shift.type || "Shift",
    min_hours: Number(shift.shift_hours || 0),
  };
};

const normalizeEmployee = (employee: NodeEmployee): AttendanceEmployee => ({
  ...employee,
  employee_detail: {
    employee_id: employee.employee_id,
    designation: employee.designation,
    department: employee.department,
    shift_type_id: employee.shift_type_id || employee.shift_type?.id,
    shift_type: normalizeShift(employee.shift_type),
    joining_date: employee.joining_date,
    mobile: employee.mobile,
  },
});

const findEmployeeForAttendance = (employees: AttendanceEmployee[], employeeCode: string) =>
  employees.find((employee) => String(employee.employee_id) === employeeCode || String(employee.id) === employeeCode);

const hasCompanyScope = (companyId?: string | number) => companyId !== undefined && companyId !== null && String(companyId).trim() !== "";

const belongsToCompany = (value: string | number | undefined, companyId?: string | number) =>
  !hasCompanyScope(companyId) || String(value || "") === String(companyId);

const normalizeAttendanceRecord = (
  record: NodeAttendanceRecord,
  employees: AttendanceEmployee[] = [],
): AttendanceRecord => {
  const employeeCode = String(record.employeeId ?? record.employee_id ?? "");
  const employee = findEmployeeForAttendance(employees, employeeCode);
  const companyId = record.companyId ?? record.company_id ?? employee?.company_id;
  const checkIn = record.checkIn ?? record.check_in ?? null;
  const checkOut = record.checkOut ?? record.check_out ?? null;
  const deviceSerial = record.deviceSerial ?? record.device_serial ?? null;

  return {
    id: record.id,
    company_id: companyId,
    employee_id: employee?.id ?? employeeCode,
    employee_code: employeeCode,
    user_id: employee?.id,
    employee,
    date: String(record.workDate ?? record.work_date ?? ""),
    status: checkIn ? "present" : "absent",
    clock_in: toClockTime(checkIn),
    clock_out: toClockTime(checkOut),
    worked_hours: Number(record.workedHours ?? record.worked_hours ?? 0),
    manual_override: record.manualOverride ?? record.manual_override ?? false,
    source: "machine",
    source_type: "machine",
    device_id: deviceSerial,
    attendance_device_id: deviceSerial,
    device_serial: deviceSerial,
  };
};

export const attendanceService = {
  getEmployees: async (query: { companyId?: string | number; company_id?: string | number } = {}): Promise<AttendanceEmployee[]> => {
    const companyId = query.companyId ?? query.company_id;
    const response = await nodeApi.get<ApiEnvelope<NodeEmployee[]> & { count?: number }>("/employees", {
      params: companyId ? { company_id: companyId } : undefined,
    });
    return (response.data.data || [])
      .map(normalizeEmployee)
      .filter((employee) => belongsToCompany(employee.company_id, companyId));
  },

  getRecords: async (
    query: { employeeId?: string | number; companyId?: string | number; company_id?: string | number; workDate?: string; startDate?: string; endDate?: string; limit?: number } = {},
    employees: AttendanceEmployee[] = [],
  ): Promise<AttendanceRecord[]> => {
    const { companyId, company_id, ...restQuery } = query;
    const response = await nodeApi.get<ApiEnvelope<NodeAttendanceRecord[]> & { count?: number }>("/attendance", {
      params: {
        ...restQuery,
        ...(companyId || company_id ? { company_id: companyId ?? company_id } : {}),
      },
    });
    return (response.data.data || [])
      .map((record) => normalizeAttendanceRecord(record, employees))
      .filter((record) => belongsToCompany(record.company_id, companyId ?? company_id));
  },

  getTodayRecords: async (
    query: { employeeId?: string | number; companyId?: string | number; company_id?: string | number } = {},
    employees: AttendanceEmployee[] = [],
  ): Promise<AttendanceRecord[]> => {
    const { companyId, company_id, ...restQuery } = query;
    const response = await nodeApi.get<ApiEnvelope<NodeAttendanceRecord[]> & { count?: number }>("/attendance/today", {
      params: {
        ...restQuery,
        ...(companyId || company_id ? { company_id: companyId ?? company_id } : {}),
      },
    });
    return (response.data.data || [])
      .map((record) => normalizeAttendanceRecord(record, employees))
      .filter((record) => belongsToCompany(record.company_id, companyId ?? company_id));
  },

  /**
   * Get all raw punches for a specific employee on a specific date
   */
  getAuditLogs: async (employeeId: string | number, date: string): Promise<ApiEnvelope<AttendanceAuditLog>> => {
    const response = await api.get<ApiEnvelope<AttendanceAuditLog>>(`/v1/attendance/audit/${employeeId}/${date}`);
    return response.data;
  },

  /**
   * Manually override or correct an attendance record
   */
  overrideAttendance: async (payload: {
    employee_id: string | number;
    company_id: string | number;
    date: string;
    status: string;
    clock_in?: string;
    clock_out?: string;
  }): Promise<ApiEnvelope<NodeAttendanceRecord>> => {
    const response = await nodeApi.post<ApiEnvelope<NodeAttendanceRecord>>("/attendance/override", payload);
    return response.data;
  }
};
