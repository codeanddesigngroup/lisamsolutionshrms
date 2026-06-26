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
  Layers,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export default function TeamsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [deletingDept, setDeletingDept] = useState<any | null>(null);
  const [name, setName] = useState("");

  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await api.get("/departments");
      const data = response.data;

      setDepartments(data.data || []);
    } catch (err: any) {
      setDepartments([]);
      showToast(err.message || "API Error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleUpdateDepartment = async () => {
    const trimmedName = name.trim();

    if (!editingDept || !trimmedName) {
      showToast("Department name is required", "error");
      return;
    }

    if (!user?.company_id) {
      showToast("Company is required", "error");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/departments/${editingDept.id}`, {
        name: trimmedName,
        company_id: user.company_id,
      });
      showToast("Department updated successfully", "success");
      setEditingDept(null);
      setName("");
      await fetchDepartments();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to update department", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDept) return;

    if (!user?.company_id) {
      showToast("Company is required", "error");
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/departments/${deletingDept.id}`, {
        data: { company_id: user.company_id },
      });
      showToast("Department deleted successfully", "success");
      setDeletingDept(null);
      await fetchDepartments();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to delete department", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-lg font-black uppercase tracking-widest text-gray-800">
              Departments
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Manage company departments & teams
            </p>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={fetchDepartments}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
            >
              <RefreshCw
                className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <Link href="/teams/create">
              <Button className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </Link>
          </div>
        </div>

        {/* TABLE CARD */}
        <Card className="p-0 overflow-hidden border border-gray-100">

          {/* HEADER ROW */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-600">
              Department List
            </h2>
            <span className="text-[10px] text-gray-400 font-bold">
              Total: {departments.length}
            </span>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <RefreshCw className="h-7 w-7 text-primary animate-spin mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Loading departments...
              </p>
            </div>
          ) : departments.length === 0 ? (
            <div className="p-16 text-center">
              <AlertTriangle className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase">
                No departments found
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Create your first department to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b bg-white">
                    <th className="p-4 text-[10px] uppercase font-black text-gray-400">
                      #
                    </th>
                    <th className="p-4 text-[10px] uppercase font-black text-gray-400">
                      Department
                    </th>
                    <th className="p-4 text-right text-[10px] uppercase font-black text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((dept, i) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="p-4 text-xs font-bold text-gray-400">
                        {i + 1}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>

                          <span className="font-black uppercase text-gray-800 text-xs tracking-wide">
                            {dept.name}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDept(dept);
                              setName(dept.name);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                          >
                            <Settings className="h-4 w-4 text-gray-500" />
                          </button>

                          <button
                            onClick={() => setDeletingDept(dept)}
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
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        title="Edit Department"
      >
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Department name"
          />

          <Button className="w-full bg-primary text-white h-11" loading={saving} onClick={handleUpdateDepartment}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        title="Delete Department"
      >
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" />

          <p className="text-sm text-gray-600">
            Delete <b>{deletingDept?.name}</b>?
          </p>

          <Button className="bg-red-500 text-white w-full h-11" loading={deleting} onClick={handleDeleteDepartment}>
            Delete
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
