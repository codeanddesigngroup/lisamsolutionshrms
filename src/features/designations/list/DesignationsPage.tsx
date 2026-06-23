"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Plus,
  Settings,
  X,
  RefreshCw,
  AlertTriangle,
  Briefcase,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function DesignationPage() {
  const { showToast } = useToast();

  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingDesignation, setEditingDesignation] = useState<any | null>(null);
  const [deletingDesignationId, setDeletingDesignationId] = useState<number | string | null>(null);
  const [designationForm, setDesignationForm] = useState({ name: "" });

  const fetchDesignations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/designations`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load designations");

      setDesignations(data.data || []);
    } catch (err: any) {
      setDesignations([]);
      showToast(err.message || "API Error", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-white to-gray-50 px-6 py-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-800">
              Designations
            </h1>
            <p className="text-[11px] text-gray-400 mt-1">
              Manage company roles and job titles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDesignations}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin text-primary" : "text-gray-500"
                }`}
              />
            </button>

            <Link href="/designation/create">
              <Button className="bg-primary text-white text-[11px] font-black px-5 h-10 uppercase tracking-widest shadow-md hover:shadow-lg transition">
                <Plus className="h-4 w-4 mr-2" />
                Add Designation
              </Button>
            </Link>
          </div>
        </div>

        {/* TABLE CARD */}
        <Card className="p-0 overflow-hidden border border-gray-100 shadow-sm">

          {/* LOADING */}
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-3" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Loading designations...
              </p>
            </div>
          ) : designations.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-24 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500 uppercase">
                No Designations Found
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Start by creating your first job role
              </p>

              <Link href="/designation/create">
                <Button className="mt-6 bg-primary text-white text-[11px] font-black px-6 h-10 uppercase">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Role
                </Button>
              </Link>
            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-[11px] font-black text-gray-500 uppercase tracking-widest w-16">
                      #
                    </th>
                    <th className="p-4 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                      Designation
                    </th>
                    <th className="p-4 text-[11px] font-black text-gray-500 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {designations.map((item, i) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition group"
                    >
                      <td className="p-4 text-xs font-semibold text-gray-400">
                        {i + 1}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">

                          {/* ICON BADGE */}
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>

                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-800 group-hover:text-primary transition">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Job Role
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition">

                          <button
                            onClick={() => {
                              setEditingDesignation(item);
                              setDesignationForm({ name: item.name });
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Settings className="h-4 w-4 text-gray-500" />
                          </button>

                          <button
                            onClick={() =>
                              setDeletingDesignationId(item.id)
                            }
                            className="p-2 rounded-lg hover:bg-red-50 transition"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </Card>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingDesignation}
        onClose={() => setEditingDesignation(null)}
        title="Edit Designation"
      >
        <input
          value={designationForm.name}
          onChange={(e) =>
            setDesignationForm({ name: e.target.value })
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
        />

        <Button className="w-full mt-4 bg-primary text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!deletingDesignationId}
        onClose={() => setDeletingDesignationId(null)}
        title="Delete Designation"
      >
        <div className="text-center py-2">
          <AlertTriangle className="mx-auto text-red-500 mb-3" />

          <p className="mb-6 text-sm text-gray-600">
            This action cannot be undone. Delete this designation?
          </p>

          <div className="flex gap-3">
            <Button
              onClick={() => setDeletingDesignationId(null)}
              className="flex-1 bg-gray-100 text-gray-600"
            >
              Cancel
            </Button>

            <Button className="flex-1 bg-red-500 text-white">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}