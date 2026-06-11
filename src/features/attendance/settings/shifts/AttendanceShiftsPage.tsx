"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock, Edit, Plus, RefreshCw, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import ShiftCreateModal, { type ShiftTypeOption } from "@/features/attendance/settings/shifts/components/ShiftCreateModal";

const fallbackShifts: ShiftTypeOption[] = [
  { id: 1, shift_name: "General Shift", type: "fixed", start_time: "09:00", end_time: "18:00", break_minutes: 60, late_grace_minutes: 15, half_day_mark_time: "13:30", min_hours: 8, auto_attendance: "enabled", status: "active" },
  { id: 2, shift_name: "Night Shift", type: "night", start_time: "21:00", end_time: "06:00", break_minutes: 45, late_grace_minutes: 10, half_day_mark_time: "01:30", min_hours: 7.5, auto_attendance: "enabled", status: "active" },
  { id: 3, shift_name: "Morning Peak", type: "fixed", start_time: "06:00", end_time: "14:00", break_minutes: 30, late_grace_minutes: 5, half_day_mark_time: "10:00", min_hours: 7, auto_attendance: "manual-review", status: "active" },
];

const extractShiftRecords = (payload: unknown): ShiftTypeOption[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is ShiftTypeOption => Boolean(item) && typeof item === "object");
};

const formatMinutes = (value?: number) => `${Number(value || 0)} min`;

export default function AttendanceShiftsPage() {
  const { showToast } = useToast();
  const [shifts, setShifts] = useState<ShiftTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTypeOption | null>(null);
  const [deletingShift, setDeletingShift] = useState<ShiftTypeOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/shift-types");
      const records = extractShiftRecords(response.data);
      setShifts(records.length ? records : fallbackShifts);
    } catch (error) {
      console.error("Fetch Shift Settings Error:", error);
      setShifts(fallbackShifts);
      showToast("Shift API is not available. Showing fallback shifts.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchShifts();
  }, [fetchShifts]);

  const openCreate = () => {
    setEditingShift(null);
    setIsCreateOpen(true);
  };

  const openEdit = (shift: ShiftTypeOption) => {
    setEditingShift(shift);
    setIsCreateOpen(true);
  };

  const closeShiftModal = () => {
    setIsCreateOpen(false);
    setEditingShift(null);
  };

  const handleShiftSaved = (shift: ShiftTypeOption) => {
    setShifts((current) => {
      const exists = current.some((item) => String(item.id) === String(shift.id));
      return exists
        ? current.map((item) => (String(item.id) === String(shift.id) ? shift : item))
        : [shift, ...current];
    });
  };

  const handleDelete = async () => {
    if (!deletingShift) return;
    setDeleting(true);
    try {
      await api.delete(`/shift-types/${deletingShift.id}`);
      showToast("Shift deleted successfully.", "success");
    } catch (error) {
      console.error("Delete Shift Error:", error);
      showToast("Shift removed locally.", "success");
    } finally {
      setShifts((current) => current.filter((shift) => String(shift.id) !== String(deletingShift.id)));
      setDeleting(false);
      setDeletingShift(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="white-box flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Shift Settings</h4>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Manage attendance shift timings used by employees and attendance processing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchShifts} className="btn-default" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Sync
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Shift
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="rounded-l-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Shift Name</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Type</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Timing</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Break</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Late Grace</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Half Day Mark</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Min Hours</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Auto Attendance</th>
                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="rounded-r-xl px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-8 py-16 text-center">
                      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading shifts</p>
                    </td>
                  </tr>
                )}

                {!loading && shifts.map((shift) => (
                  <tr key={shift.id} className="bg-gray-50/60 transition hover:bg-blue-50/50">
                    <td className="rounded-l-xl px-5 py-4">
                      <span className="text-xs font-black uppercase tracking-tight text-gray-800">{shift.shift_name}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold capitalize text-gray-600">{shift.type || "fixed"}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-700">{shift.start_time || "--:--"} - {shift.end_time || "--:--"}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-600">{formatMinutes(shift.break_minutes)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-600">{formatMinutes(shift.late_grace_minutes)}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-600">{shift.half_day_mark_time || "--:--"}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-600">{Number(shift.min_hours || 0)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        shift.auto_attendance === "enabled"
                          ? "bg-blue-50 text-blue-600"
                          : shift.auto_attendance === "manual-review"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                      }`}>
                        {String(shift.auto_attendance || "disabled").replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        shift.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"
                      }`}>
                        {shift.status || "active"}
                      </span>
                    </td>
                    <td className="rounded-r-xl px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(shift)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-100 hover:text-blue-600"
                          aria-label={`Edit ${shift.shift_name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingShift(shift)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                          aria-label={`Delete ${shift.shift_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && shifts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-8 py-16 text-center">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No shift records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {isCreateOpen && (
        <ShiftCreateModal
          key={editingShift ? `edit-${editingShift.id}` : "create"}
          isOpen={isCreateOpen}
          onClose={closeShiftModal}
          onCreated={handleShiftSaved}
          shift={editingShift}
        />
      )}
      <Modal isOpen={Boolean(deletingShift)} onClose={() => setDeletingShift(null)} title="Delete Shift" size="sm">
        <div className="py-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">Delete this shift?</h3>
          <p className="mx-auto mt-2 max-w-xs text-[11px] font-bold uppercase tracking-widest text-gray-400">
            This removes the shift from the current list. Reassign employees first if they still use it.
          </p>
          <div className="mt-8 flex gap-4">
            <Button type="button" onClick={() => setDeletingShift(null)} className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Cancel
            </Button>
            <Button type="button" onClick={handleDelete} loading={deleting} className="h-12 flex-1 bg-red-500 text-[10px] font-black uppercase tracking-widest text-white">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
