import api from "../../lib/api";
import { ApiEnvelope } from "../../lib/api-contract";
import { AttendanceStatus } from "../../lib/hr-utils";

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

export const attendanceService = {
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
    date: string;
    clock_in?: string;
    clock_out?: string;
    reason: string;
  }): Promise<ApiEnvelope<{ success: boolean }>> => {
    const response = await api.post<ApiEnvelope<{ success: boolean }>>("/v1/attendance/override", payload);
    return response.data;
  }
};
