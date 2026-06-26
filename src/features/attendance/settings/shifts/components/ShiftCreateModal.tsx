"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

export type ShiftTypeOption = {
  id: number | string;
  type: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_grace_minutes: number;
  shift_hours: number;
};

type ShiftCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (shift: ShiftTypeOption) => void;
  companyId?: string;
};

export default function ShiftCreateModal({
  isOpen,
  onClose,
  onCreated,
  companyId = "",
}: ShiftCreateModalProps) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    type: "morning",
    start_time: "",
    end_time: "",
    break_minutes: 0,
    late_grace_minutes: 0,
    shift_hours: 0,
  });

  const [loading, setLoading] = useState(false);

  const closeAndReset = () => {
    setFormData({
      type: "morning",
      start_time: "",
      end_time: "",
      break_minutes: 0,
      late_grace_minutes: 0,
      shift_hours: 0,
    });

    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.type === "number"
          ? Number(e.target.value)
          : e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) {
      showToast("No company is assigned to this login. Shift cannot be created.", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, company_id: companyId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create shift");
      }

      const createdShift = result.data || result.shift || result;
      if (createdShift?.id !== undefined && createdShift?.id !== null) {
        onCreated?.({
          id: createdShift.id,
          type: String(createdShift.type ?? formData.type),
          start_time: String(createdShift.start_time ?? formData.start_time),
          end_time: String(createdShift.end_time ?? formData.end_time),
          break_minutes: Number(createdShift.break_minutes ?? formData.break_minutes),
          late_grace_minutes: Number(createdShift.late_grace_minutes ?? formData.late_grace_minutes),
          shift_hours: Number(createdShift.shift_hours ?? formData.shift_hours),
        });
      }

      showToast("Shift created successfully", "success");
      closeAndReset();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Failed to create shift", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAndReset}
      title="Create Shift"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Shift Type
            </span>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-control"
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Start Time
            </span>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className="form-control"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              End Time
            </span>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className="form-control"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Break Minutes
            </span>
            <input
              type="number"
              min="0"
              name="break_minutes"
              value={formData.break_minutes}
              onChange={handleChange}
              className="form-control"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Late Grace Minutes
            </span>
            <input
              type="number"
              min="0"
              name="late_grace_minutes"
              value={formData.late_grace_minutes}
              onChange={handleChange}
              className="form-control"
            />
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
              Shift Hours
            </span>
            <input
              type="number"
              min="0"
              name="shift_hours"
              value={formData.shift_hours}
              onChange={handleChange}
              className="form-control"
            />
          </label>
        </div>

        <div className="flex gap-4 border-t border-gray-50 pt-4">
          <Button
            type="button"
            onClick={closeAndReset}
            className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 flex-1 bg-primary text-[10px] font-black uppercase tracking-widest text-white"
          >
            {loading ? "Saving..." : "Save Shift"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
