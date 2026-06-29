/**
 * Enterprise HR and Attendance Logic Engine
 * This file contains the single source of truth for all HR-related calculations.
 */

export type HRRecord = Record<string, any>;

export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "holiday" | "leave";

export interface ShiftDefinition {
  id?: number | string;
  shift_name?: string;
  code?: string;
  start_time?: string;
  end_time?: string;
  late_grace_minutes?: number;
  half_day_mark_time?: string;
  min_hours?: number;
}

export const toDateString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const timeToMinutes = (value?: string) => {
  if (!value) return null;
  // Handle both "HH:mm" and "YYYY-MM-DDTHH:mm:ss" formats
  const clean = value.includes("T") ? value.slice(11, 16) : value.slice(0, 5);
  const [hours, minutes] = clean.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

/**
 * Normalizes minutes for overnight shifts.
 * Times in the after-midnight portion of an overnight shift need to be moved
 * onto the following day. A time just before shift start is an early check-in,
 * not a check-in on the following day.
 */
export const normalizeShiftMinute = (value?: string, shift?: ShiftDefinition) => {
  const minutes = timeToMinutes(value);
  const start = timeToMinutes(shift?.start_time);
  const end = timeToMinutes(shift?.end_time);
  
  if (minutes === null) return null;
  
  // For a 22:00-06:00 shift, 02:00 belongs to the following day, while 21:55
  // must remain on the shift-start day so it is correctly treated as on time.
  if (start !== null && end !== null && end <= start && minutes <= end) {
    return minutes + 24 * 60; // Treat as next day
  }
  
  return minutes;
};

/**
 * Calculates the attendance status based on raw punch data and shift rules.
 */
export const calculateAttendanceStatus = (
  record: { 
    status?: string; 
    clock_in?: string; 
    half_day?: boolean; 
    late?: boolean;
    is_holiday?: boolean;
    is_leave?: boolean;
  }, 
  shift?: ShiftDefinition
): AttendanceStatus => {
  const explicit = String(record.status || "").toLowerCase();
  
  if (record.is_holiday) return "holiday";
  if (record.is_leave) return "leave";
  if (explicit === "absent") return "absent";
  if (record.half_day || explicit === "half-day" || explicit === "half day") return "half-day";

  const clockIn = normalizeShiftMinute(record.clock_in, shift);
  const shiftStart = normalizeShiftMinute(shift?.start_time, shift);
  const halfDayMark = normalizeShiftMinute(shift?.half_day_mark_time, shift);

  // 1. Half Day Check (if clocked in after the half-day mark)
  if (clockIn !== null && halfDayMark !== null && clockIn >= halfDayMark) return "half-day";
  
  // 2. Late Check
  if (record.late || explicit === "late") return "late";
  if (clockIn !== null && shiftStart !== null) {
    const grace = Number(shift?.late_grace_minutes || 0);
    if (clockIn > shiftStart + grace) return "late";
  }

  return (explicit as AttendanceStatus) || "present";
};

/**
 * Calculates how many minutes late an employee is.
 */
export const calculateLateMinutes = (clockInTime?: string, shift?: ShiftDefinition): number => {
  const clockIn = normalizeShiftMinute(clockInTime, shift);
  const shiftStart = normalizeShiftMinute(shift?.start_time, shift);
  
  if (clockIn === null || shiftStart === null) return 0;
  return Math.max(0, clockIn - shiftStart);
};

export const calculateLateAfterGraceMinutes = (clockInTime?: string, shift?: ShiftDefinition): number => {
  const lateMinutes = calculateLateMinutes(clockInTime, shift);
  return Math.max(0, lateMinutes - Number(shift?.late_grace_minutes || 0));
};

/**
 * Calculates the numeric units for a leave record (e.g., 0.5 for half day).
 */
export const leaveUnits = (record: HRRecord): number => {
  const duration = String(record.duration || record.leave_type?.duration || "").toLowerCase();
  if (duration.includes("half") || record.half_day === true) return 0.5;
  return 1;
};

/**
 * Calculates minutes between two time strings.
 */
export const minutesBetween = (start?: string, end?: string): number => {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null) return 0;
  
  // Handle overnight
  if (endMin < startMin) {
    return (endMin + 24 * 60) - startMin;
  }
  return endMin - startMin;
};

/**
 * Formats minutes into human-readable duration.
 */
export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} mins`;
  return remainder > 0 ? `${hours} hrs ${remainder} mins` : `${hours} hrs`;
};

export const getEmployeeDisplayId = (employee: HRRecord) =>
  String(employee.employee_detail?.employee_id || employee.employee_id || `EMP-${employee.id}`);

export const getEmployeeId = (record: HRRecord) =>
  String(record.employee_id || record.user_id || record.employee?.id || record.user?.id || record.id || "");

export const getAttendanceEmployeeId = (record: HRRecord) =>
  String(record.employee_id || record.user_id || record.employee?.id || "");

export const getLeaveEmployeeId = (record: HRRecord) =>
  String(record.user_id || record.employee_id || record.user?.id || record.employee?.id || "");

export const getLeaveDate = (record: HRRecord) => String(record.leave_date || record.date || "");

export const getHolidayDate = (record: HRRecord) => String(record.holiday_date || record.date || "");

export const parseOfficeOpenDays = (value: unknown, fallback = [1, 2, 3, 4, 5]) => {
  if (Array.isArray(value)) return value.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export const dateRange = (start: string, end: string) => {
  const days: Date[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};
