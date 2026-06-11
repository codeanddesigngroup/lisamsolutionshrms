"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { RefreshCw } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type ShiftSummary = {
  id?: number | string;
  shift_name?: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  late_grace_minutes?: number;
  half_day_mark_time?: string;
  min_hours?: number;
};

export type AttendanceEmployeeOption = {
  id: number | string;
  name: string;
  email?: string;
  employee_detail?: {
    designation?: { name?: string };
    shift_type_id?: number | string;
    shift_type?: ShiftSummary;
  };
};

export type AttendanceRecordForOverride = {
  id?: number | string;
  employee_id?: number | string;
  user_id?: number | string;
  date?: string;
  status?: string;
  clock_in?: string;
  clock_out?: string;
  clock_in_ip?: string;
  clock_out_ip?: string;
  working_from?: string;
  late?: boolean;
  half_day?: boolean;
  shift_type_id?: number | string;
  shift_type?: ShiftSummary;
  source?: string;
  source_type?: string;
  device_id?: number | string | null;
  attendance_device_id?: number | string | null;
};

type AttendanceOverrideModalProps = {
  isOpen: boolean;
  date: string;
  employee: AttendanceEmployeeOption;
  attendance?: AttendanceRecordForOverride;
  contextLabel?: string;
  onClose: () => void;
  onSaved: (record: AttendanceRecordForOverride) => void;
};

type OverrideForm = {
  status: "present" | "late" | "absent" | "half-day";
  clock_in: string;
  clock_out: string;
  clock_in_ip: string;
  clock_out_ip: string;
  working_from: string;
  device_id: string;
  reason: string;
};

const getInitialForm = (attendance: AttendanceRecordForOverride | undefined, employee: AttendanceEmployeeOption): OverrideForm => {
  const shift = employee.employee_detail?.shift_type;
  const status = String(attendance?.status || "present").toLowerCase();
  const normalizedStatus = status === "late" || status === "absent" || status === "half-day" ? status : "present";

  return {
    status: normalizedStatus,
    clock_in: attendance?.clock_in || (normalizedStatus === "absent" ? "" : shift?.start_time || "09:00"),
    clock_out: attendance?.clock_out || (normalizedStatus === "absent" ? "" : shift?.end_time || "18:00"),
    clock_in_ip: attendance?.clock_in_ip || "192.168.1.1",
    clock_out_ip: attendance?.clock_out_ip || "192.168.1.1",
    working_from: attendance?.working_from || "office",
    device_id: String(attendance?.attendance_device_id || attendance?.device_id || ""),
    reason: "",
  };
};

export default function AttendanceOverrideModal({
  isOpen,
  date,
  employee,
  attendance,
  contextLabel,
  onClose,
  onSaved,
}: AttendanceOverrideModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<OverrideForm>(() => getInitialForm(attendance, employee));
  const [saving, setSaving] = useState(false);

  const shift = employee.employee_detail?.shift_type;
  const title = attendance?.id ? "Edit Attendance" : "Create Attendance";
  const isAbsent = form.status === "absent";
  const reasonRequired = attendance?.id || contextLabel;

  const shiftLabel = useMemo(() => {
    if (!shift) return "No shift assigned";
    return `${shift.shift_name || "Shift"} / ${shift.start_time || "--:--"}-${shift.end_time || "--:--"}`;
  }, [shift]);

  const updateForm = (patch: Partial<OverrideForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleStatusChange = (status: OverrideForm["status"]) => {
    setForm((current) => ({
      ...current,
      status,
      clock_in: status === "absent" ? "" : current.clock_in || shift?.start_time || "09:00",
      clock_out: status === "absent" ? "" : current.clock_out || shift?.end_time || "18:00",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (reasonRequired && !form.reason.trim()) {
      showToast("Add an override reason before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/attendance/override", {
        attendance_id: attendance?.id,
        employee_id: employee.id,
        user_id: employee.id,
        date,
        status: form.status,
        clock_in: isAbsent ? "" : form.clock_in,
        clock_out: isAbsent ? "" : form.clock_out,
        clock_in_ip: isAbsent ? "-" : form.clock_in_ip,
        clock_out_ip: isAbsent ? "-" : form.clock_out_ip,
        working_from: isAbsent ? "" : form.working_from,
        late: form.status === "late",
        half_day: form.status === "half-day",
        shift_type_id: employee.employee_detail?.shift_type_id || shift?.id || attendance?.shift_type_id || null,
        shift_type: shift || attendance?.shift_type,
        source: "manual_override",
        source_type: "manual_override",
        device_id: form.device_id || null,
        attendance_device_id: form.device_id || null,
        reason: form.reason.trim() || "Manual attendance entry",
        override_reason: form.reason.trim() || "Manual attendance entry",
        override_context: contextLabel || "daily_attendance",
      });

      onSaved(response.data.data as AttendanceRecordForOverride);
      showToast(attendance?.id ? "Attendance updated." : "Attendance created.");
      onClose();
    } catch (error) {
      console.error("Attendance override error:", error);
      showToast("Could not save attendance override.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-gray-800">{employee.name}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {date} / {shiftLabel}{contextLabel ? ` / ${contextLabel}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Final Status</label>
            <select
              value={form.status}
              onChange={(event) => handleStatusChange(event.target.value as OverrideForm["status"])}
              className="form-control"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Working From</label>
            <select
              value={form.working_from}
              disabled={isAbsent}
              onChange={(event) => updateForm({ working_from: event.target.value })}
              className="form-control disabled:bg-gray-100"
            >
              <option value="office">Office</option>
              <option value="home">Home</option>
              <option value="remote">Remote</option>
              <option value="field">Field</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Check In</label>
            <input
              type="time"
              value={form.clock_in}
              disabled={isAbsent}
              onChange={(event) => updateForm({ clock_in: event.target.value })}
              className="form-control disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Check Out</label>
            <input
              type="time"
              value={form.clock_out}
              disabled={isAbsent}
              onChange={(event) => updateForm({ clock_out: event.target.value })}
              className="form-control disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Check In IP</label>
            <input
              type="text"
              value={form.clock_in_ip}
              disabled={isAbsent}
              onChange={(event) => updateForm({ clock_in_ip: event.target.value })}
              className="form-control disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Check Out IP</label>
            <input
              type="text"
              value={form.clock_out_ip}
              disabled={isAbsent}
              onChange={(event) => updateForm({ clock_out_ip: event.target.value })}
              className="form-control disabled:bg-gray-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Attendance Machine / Device ID</label>
            <input
              type="text"
              value={form.device_id}
              onChange={(event) => updateForm({ device_id: event.target.value })}
              placeholder="Optional now, required when machine sync is connected"
              className="form-control"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-500">Reason</label>
            <textarea
              value={form.reason}
              onChange={(event) => updateForm({ reason: event.target.value })}
              rows={3}
              placeholder="Example: Missing machine punch, approved weekend work, HR correction"
              className="form-control min-h-24"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
          <Button type="button" variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
            Save Attendance
          </Button>
        </div>
      </form>
    </Modal>
  );
}
