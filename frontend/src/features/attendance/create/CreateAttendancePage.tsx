"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { ArrowLeft, RefreshCw, Check, Users, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

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
  employee_detail?: {
    designation?: { name?: string };
    shift_type_id?: number | string;
    shift_type?: ShiftSummary;
  };
};

type AttendanceDraft = {
  clock_in: string;
  clock_out: string;
  clock_in_ip: string;
  clock_out_ip: string;
  working_from: string;
  late: boolean;
  half_day: boolean;
  absent: boolean;
};

const defaultDraft: AttendanceDraft = {
  clock_in: "09:00",
  clock_out: "18:00",
  clock_in_ip: "192.168.1.1",
  clock_out_ip: "192.168.1.1",
  working_from: "office",
  late: false,
  half_day: false,
  absent: false,
};

const timeToMinutes = (value?: string) => {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const normalizeShiftMinute = (value?: string, shift?: ShiftSummary) => {
  const minutes = timeToMinutes(value);
  const start = timeToMinutes(shift?.start_time);
  const end = timeToMinutes(shift?.end_time);
  if (minutes === null) return null;
  if (start !== null && end !== null && end <= start && minutes < start) return minutes + 24 * 60;
  return minutes;
};

const calculateDraftFlags = (draft: AttendanceDraft, shift?: ShiftSummary) => {
  if (draft.absent) return { late: false, half_day: false };

  const clockIn = normalizeShiftMinute(draft.clock_in, shift);
  const shiftStart = normalizeShiftMinute(shift?.start_time, shift);
  const halfDayMark = normalizeShiftMinute(shift?.half_day_mark_time, shift);

  const halfDay = clockIn !== null && halfDayMark !== null && clockIn >= halfDayMark;
  const late =
    !halfDay &&
    clockIn !== null &&
    shiftStart !== null &&
    clockIn > shiftStart + Number(shift?.late_grace_minutes || 0);

  return { late, half_day: halfDay };
};

const getDefaultDraft = (employee: EmployeeRecord): AttendanceDraft => {
  const shift = employee.employee_detail?.shift_type;
  const draft = {
    ...defaultDraft,
    clock_in: shift?.start_time || defaultDraft.clock_in,
    clock_out: shift?.end_time || defaultDraft.clock_out,
  };

  return { ...draft, ...calculateDraftFlags(draft, shift) };
};

const getShiftLabel = (shift?: ShiftSummary) => {
  if (!shift) return "No shift assigned";
  const code = shift.code ? `${shift.code} ` : "";
  return `${code}${shift.start_time || "--:--"}-${shift.end_time || "--:--"}`;
};

export default function MarkAttendancePage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const canManageAttendance =
    user?.role === "admin" ||
    hasPermission("attendance.manage") ||
    hasPermission("attendance.edit") ||
    hasPermission("attendance.approve");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await api.get("/employee");
        const employeeList = (response.data.data || []) as EmployeeRecord[];
        const selfEmployee = employeeList.find((employee) =>
          String(employee.id) === String(user?.id) ||
          employee.email === user?.email ||
          employee.name === user?.name
        );
        const visibleEmployees = canManageAttendance ? employeeList : employeeList.filter((employee) => String(employee.id) === String(selfEmployee?.id || user?.id));
        setEmployees(visibleEmployees);
        setDrafts(
          Object.fromEntries(visibleEmployees.map((employee) => [String(employee.id), getDefaultDraft(employee)])),
        );
      } catch (err) {
        console.error("Fetch Attendance Employees Error:", err);
        showToast("Failed to load employees", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageAttendance, user?.email, user?.id, user?.name]);

  const updateDraft = (employeeId: number | string, patch: Partial<AttendanceDraft>) => {
    const employee = employees.find((item) => String(item.id) === String(employeeId));
    const shift = employee?.employee_detail?.shift_type;

    setDrafts((prev) => ({
      ...prev,
      [String(employeeId)]: (() => {
        const nextDraft = {
          ...(prev[String(employeeId)] || (employee ? getDefaultDraft(employee) : defaultDraft)),
          ...patch,
        };
        const isManualStatusChange = "late" in patch || "half_day" in patch;
        if (isManualStatusChange) return nextDraft;
        return { ...nextDraft, ...calculateDraftFlags(nextDraft, shift) };
      })(),
    }));
  };

  const saveAttendance = async (employee: EmployeeRecord) => {
    const draft = drafts[String(employee.id)] || defaultDraft;
    const status = draft.absent ? "absent" : draft.late ? "late" : draft.half_day ? "half-day" : "present";

    setSavingId(String(employee.id));
    try {
      await api.post("/attendance", {
        employee_id: employee.id,
        date,
        status,
        clock_in: draft.absent ? "" : draft.clock_in,
        clock_out: draft.absent ? "" : draft.clock_out,
        clock_in_ip: draft.absent ? "-" : draft.clock_in_ip,
        clock_out_ip: draft.absent ? "-" : draft.clock_out_ip,
        working_from: draft.absent ? "" : draft.working_from,
        late: draft.late,
        half_day: draft.half_day,
        shift_type_id: employee.employee_detail?.shift_type_id || employee.employee_detail?.shift_type?.id || null,
        shift_type: employee.employee_detail?.shift_type,
      });
      showToast(`Attendance saved for ${employee.name}`, "success");
    } catch (err) {
      console.error("Save Attendance Error:", err);
      showToast("Failed to save attendance", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Users className="h-5 w-5 mr-2 inline-block text-primary" />
              Attendance
            </h4>
          </div>
          <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
            <Link href="/attendance">
              <Button className="btn-default btn-sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </Link>
          </div>
        </div>

        <div className="white-box">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label className="block text-[12px] font-bold text-gray-600 mb-2">Attendance Date</label>
                <input type="date" className="form-control" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading employees...</p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {employees.map((employee) => {
                const shift = employee.employee_detail?.shift_type;
                const draft = drafts[String(employee.id)] || getDefaultDraft(employee);
                return (
                  <div key={employee.id} className="border border-[#f2f2f3] rounded overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-[#f2f2f3] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px] mr-3">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-gray-700 uppercase">{employee.name}</span>
                          <div className="text-[10px] text-gray-400 font-medium uppercase">{employee.employee_detail?.designation?.name || "Staff"}</div>
                        </div>
                      </div>
                      <div className="flex items-center rounded border border-[#dfe4ea] bg-white px-3 py-2 text-[11px] font-bold uppercase text-gray-600">
                        <Clock className="mr-2 h-3.5 w-3.5 text-primary" />
                        <span>{shift?.shift_name || "Unassigned"} - {getShiftLabel(shift)}</span>
                        {shift?.late_grace_minutes !== undefined && (
                          <span className="ml-2 text-gray-400">Grace {shift.late_grace_minutes}m</span>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Clock In Time</label>
                          <input type="time" className="form-control" value={draft.clock_in} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { clock_in: event.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Clock In IP</label>
                          <input type="text" className="form-control" value={draft.clock_in_ip} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { clock_in_ip: event.target.value })} />
                        </div>
                        <div className="col-span-2 flex items-center pt-6 space-x-8">
                          <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="mr-2" checked={draft.late} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { late: event.target.checked })} />
                            <span className="text-[12px] font-bold text-gray-700 uppercase">Late Entry</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="mr-2" checked={draft.half_day} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { half_day: event.target.checked })} />
                            <span className="text-[12px] font-bold text-gray-700 uppercase">Half Day</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="mr-2" checked={draft.absent} onChange={(event) => updateDraft(employee.id, { absent: event.target.checked })} />
                            <span className="text-[12px] font-bold text-gray-700 uppercase">Absent</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Clock Out Time</label>
                          <input type="time" className="form-control" value={draft.clock_out} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { clock_out: event.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Clock Out IP</label>
                          <input type="text" className="form-control" value={draft.clock_out_ip} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { clock_out_ip: event.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Working From</label>
                          <input type="text" className="form-control" value={draft.working_from} disabled={draft.absent} onChange={(event) => updateDraft(employee.id, { working_from: event.target.value })} />
                        </div>
                        <div className="flex items-end">
                          <Button className="btn-success btn-block" disabled={savingId === String(employee.id)} onClick={() => saveAttendance(employee)}>
                            {savingId === String(employee.id) ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
