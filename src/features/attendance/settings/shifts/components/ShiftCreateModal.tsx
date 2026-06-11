"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export type ShiftTypeOption = {
  id: number | string;
  shift_name: string;
  type?: "fixed" | "flexible" | "night" | "rotating" | "split";
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  late_grace_minutes?: number;
  early_clock_in_minutes?: number;
  half_day_mark_time?: string;
  min_hours?: number;
  auto_attendance?: "enabled" | "disabled" | "manual-review";
  status?: "active" | "inactive";
  device_sync_enabled?: boolean;
  device_sync_mode?: "manual" | "auto" | "disabled";
  attendance_machine_payload?: Record<string, unknown>;
};

type ShiftFormValues = {
  shift_name: string;
  type: NonNullable<ShiftTypeOption["type"]>;
  start_time: string;
  end_time: string;
  break_minutes: string;
  late_grace_minutes: string;
  early_clock_in_minutes: string;
  half_day_mark_time: string;
  min_hours: string;
  auto_attendance: NonNullable<ShiftTypeOption["auto_attendance"]>;
  status: NonNullable<ShiftTypeOption["status"]>;
};

type ShiftCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (shift: ShiftTypeOption) => void;
  shift?: ShiftTypeOption | null;
};

const emptyForm: ShiftFormValues = {
  shift_name: "",
  type: "fixed",
  start_time: "09:00",
  end_time: "18:00",
  break_minutes: "60",
  late_grace_minutes: "15",
  early_clock_in_minutes: "30",
  half_day_mark_time: "13:00",
  min_hours: "8",
  auto_attendance: "enabled",
  status: "active",
};

const shiftTypeOptions: Array<{ label: string; value: ShiftFormValues["type"] }> = [
  { label: "Fixed", value: "fixed" },
  { label: "Flexible", value: "flexible" },
  { label: "Night", value: "night" },
  { label: "Rotating", value: "rotating" },
  { label: "Split", value: "split" },
];

const autoAttendanceOptions: Array<{ label: string; value: ShiftFormValues["auto_attendance"] }> = [
  { label: "Enabled", value: "enabled" },
  { label: "Manual Review", value: "manual-review" },
  { label: "Disabled", value: "disabled" },
];

const toFormValues = (shift?: ShiftTypeOption | null): ShiftFormValues => ({
  shift_name: shift?.shift_name || "",
  type: shift?.type || "fixed",
  start_time: shift?.start_time || "09:00",
  end_time: shift?.end_time || "18:00",
  break_minutes: String(shift?.break_minutes ?? 60),
  late_grace_minutes: String(shift?.late_grace_minutes ?? 15),
  early_clock_in_minutes: String(shift?.early_clock_in_minutes ?? 30),
  half_day_mark_time: shift?.half_day_mark_time || "13:00",
  min_hours: String(shift?.min_hours ?? 8),
  auto_attendance: shift?.auto_attendance || "enabled",
  status: shift?.status || "active",
});

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractCreatedShift = (payload: unknown): ShiftTypeOption | null => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return data && typeof data === "object" ? (data as ShiftTypeOption) : null;
};

const normalizeShiftPayload = (form: ShiftFormValues): Omit<ShiftTypeOption, "id"> => {
  const shiftName = form.shift_name.trim();
  const lateGraceMinutes = toNumber(form.late_grace_minutes);
  const minHours = toNumber(form.min_hours);

  return {
    shift_name: shiftName,
    type: form.type,
    start_time: form.start_time,
    end_time: form.end_time,
    break_minutes: toNumber(form.break_minutes),
    late_grace_minutes: lateGraceMinutes,
    early_clock_in_minutes: toNumber(form.early_clock_in_minutes),
    half_day_mark_time: form.half_day_mark_time,
    min_hours: minHours,
    auto_attendance: form.auto_attendance,
    status: form.status,
    device_sync_enabled: false,
    device_sync_mode: "disabled",
    attendance_machine_payload: {
      enabled: false,
      sync_mode: "disabled",
      shift_name: shiftName,
      start_time: form.start_time,
      end_time: form.end_time,
      late_grace_minutes: lateGraceMinutes,
      half_day_mark_time: form.half_day_mark_time,
      min_hours: minHours,
    },
  };
};

export default function ShiftCreateModal({ isOpen, onClose, onCreated, shift }: ShiftCreateModalProps) {
  const { showToast } = useToast();
  const [formValues, setFormValues] = useState<ShiftFormValues>(() => toFormValues(shift));
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(shift);

  const updateField = (field: keyof ShiftFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const closeAndReset = () => {
    setFormValues(emptyForm);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = normalizeShiftPayload(formValues);

    if (!payload.shift_name) {
      showToast("Shift name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const response = isEditing && shift
        ? await api.put(`/shift-types/${shift.id}`, payload)
        : await api.post("/shift-types", payload);
      const saved = extractCreatedShift(response.data) ?? { id: shift?.id || Date.now(), ...payload };
      onCreated(saved);
      showToast(isEditing ? "Shift updated successfully." : "Shift created successfully.", "success");
      closeAndReset();
    } catch (error) {
      console.error("Create Shift Error:", error);
      const saved = { id: shift?.id || Date.now(), ...payload };
      onCreated(saved);
      showToast(isEditing ? "Shift updated locally." : "Shift saved locally.", "success");
      closeAndReset();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={closeAndReset} title={isEditing ? "Edit Shift" : "Create Shift"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Shift Name</span>
            <input value={formValues.shift_name} onChange={(event) => updateField("shift_name", event.target.value)} className="form-control" placeholder="General Day Shift" required />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Shift Type</span>
            <select value={formValues.type} onChange={(event) => updateField("type", event.target.value)} className="form-control">
              {shiftTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Start Time</span>
            <input type="time" value={formValues.start_time} onChange={(event) => updateField("start_time", event.target.value)} className="form-control" required />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">End Time</span>
            <input type="time" value={formValues.end_time} onChange={(event) => updateField("end_time", event.target.value)} className="form-control" required />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Break Minutes</span>
            <input type="number" min="0" value={formValues.break_minutes} onChange={(event) => updateField("break_minutes", event.target.value)} className="form-control" />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Late Grace Minutes</span>
            <input type="number" min="0" value={formValues.late_grace_minutes} onChange={(event) => updateField("late_grace_minutes", event.target.value)} className="form-control" />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Early Clock-In Window</span>
            <input type="number" min="0" value={formValues.early_clock_in_minutes} onChange={(event) => updateField("early_clock_in_minutes", event.target.value)} className="form-control" />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Half Day Mark Time</span>
            <input type="time" value={formValues.half_day_mark_time} onChange={(event) => updateField("half_day_mark_time", event.target.value)} className="form-control" />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Minimum Paid Hours</span>
            <input type="number" min="0" step="0.5" value={formValues.min_hours} onChange={(event) => updateField("min_hours", event.target.value)} className="form-control" />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Auto Attendance</span>
            <select value={formValues.auto_attendance} onChange={(event) => updateField("auto_attendance", event.target.value)} className="form-control">
              {autoAttendanceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Status</span>
            <select value={formValues.status} onChange={(event) => updateField("status", event.target.value)} className="form-control">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="flex gap-4 border-t border-gray-50 pt-4">
          <Button type="button" onClick={closeAndReset} className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="h-12 flex-1 bg-primary text-[10px] font-black uppercase tracking-widest text-white">
            {isEditing ? "Update Shift" : "Save Shift"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
