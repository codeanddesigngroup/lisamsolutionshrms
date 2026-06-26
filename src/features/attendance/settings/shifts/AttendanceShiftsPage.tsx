"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Edit,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ShiftCreateModal from "@/features/attendance/settings/shifts/components/ShiftCreateModal";

interface Shift {
  id: number;
  type: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_grace_minutes: number;
  shift_hours: string;
}

export default function AttendanceShiftsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState(false);
  const companyId = user?.company_id ? String(user.company_id) : "";
  const shiftsUrl = companyId
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts?company_id=${encodeURIComponent(companyId)}`
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/shifts`;

  const getShifts = async () => {
    try {
      setLoading(true);

      const response = await fetch(shiftsUrl);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch shifts");
      }

      setShifts(result.data || []);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to load shifts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getShifts();
  }, [companyId]);

  const openCreate = () => {
    setEditingShift(null);
    setIsCreateOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingShift(shift);
    setIsCreateOpen(true);
  };

  const closeShiftModal = () => {
    setEditingShift(null);
    setIsCreateOpen(false);
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
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">
                Shift Settings
              </h4>

              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Manage attendance shift timings used by employees and
                attendance processing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              className="btn-default"
              disabled={loading}
              onClick={getShifts}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Sync
            </Button>

            <Button variant="primary" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Shift
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-none bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="rounded-l-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Shift
                  </th>

                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Timing
                  </th>

                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Break
                  </th>

                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Late Grace
                  </th>

                  <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Shift Hours
                  </th>

                  <th className="rounded-r-xl px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Loading shifts
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  shifts.map((shift) => (
                    <tr
                      key={shift.id}
                      className="bg-gray-50/60 transition hover:bg-blue-50/50"
                    >
                      <td className="rounded-l-xl px-5 py-4">
                        <span className="text-xs font-black uppercase tracking-tight text-gray-800">
                          {shift.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-gray-700">
                        {shift.start_time} - {shift.end_time}
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {shift.break_minutes} min
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {shift.late_grace_minutes} min
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {shift.shift_hours} hrs
                      </td>

                      <td className="rounded-r-xl px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(shift)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingShift(shift)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && shifts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        No shift records found
                      </p>
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
          onClose={() => {
            closeShiftModal();
            getShifts();
          }}
          companyId={companyId}
        />
      )}

      <Modal
        isOpen={Boolean(deletingShift)}
        onClose={() => setDeletingShift(null)}
        title="Delete Shift"
        size="sm"
      >
        <div className="py-6 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-black uppercase tracking-tight text-gray-800">
            Delete this shift?
          </h3>

          <p className="mx-auto mt-2 max-w-xs text-[11px] font-bold uppercase tracking-widest text-gray-400">
            This removes the shift from the current list. Reassign employees
            first if they still use it.
          </p>

          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              onClick={() => setDeletingShift(null)}
              className="h-12 flex-1 border-none bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500"
            >
              Cancel
            </Button>

            <Button
              type="button"
              loading={deleting}
              className="h-12 flex-1 bg-red-500 text-[10px] font-black uppercase tracking-widest text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
