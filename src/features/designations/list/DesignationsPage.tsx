"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Plus, Settings, X, MoreHorizontal, RefreshCw, Users, AlertTriangle, Briefcase, Save } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function DesignationPage() {
  const { showToast } = useToast();
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDesignation, setEditingDesignation] = useState<any | null>(null);
  const [deletingDesignationId, setDeletingDesignationId] = useState<number | string | null>(null);
  const [designationForm, setDesignationForm] = useState({ name: "" });

  const fetchDesignations = useCallback(async () => {
    setLoading(true);
    try {
      const [designationResponse, employeeResponse] = await Promise.all([
        api.get("/designation"),
        api.get("/employee"),
      ]);
      setDesignations(designationResponse.data.data || []);
      setEmployees(employeeResponse.data.data || []);
    } catch (err: any) {
      console.error("Fetch Designations Error:", err);
      // Fallback data if API is down for UI design purposes
      setDesignations([
        { id: 1, name: "Senior Developer", members: [{ user: { name: "John Doe" } }, { user: { name: "Jane Smith" } }] },
        { id: 2, name: "Marketing Lead", members: [{ user: { name: "Sarah Connor" } }] },
      ]);
      showToast("Using fallback data. Failed to connect to API.", "info");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDesignations();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDesignations]);

  const openDesignationEditor = (designation: any) => {
    setEditingDesignation(designation);
    setDesignationForm({ name: designation.name || "" });
  };

  const getAssignedEmployees = (designation: any) => {
    const designationId = String(designation.id);
    const designationName = String(designation.name || "");
    const relationMembers = (designation.member || designation.members || []).map((member: any) => member.user || member);
    const computedMembers = employees.filter((employee) => {
      const detailDesignation = employee.employee_detail?.designation;
      return String(employee.employee_detail?.designation_id || detailDesignation?.id || "") === designationId ||
        detailDesignation?.name === designationName;
    });

    const map = new Map<string, any>();
    [...relationMembers, ...computedMembers].forEach((employee: any) => {
      const key = String(employee.id || employee.name);
      if (key) map.set(key, employee);
    });
    return Array.from(map.values());
  };

  const handleUpdateDesignation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingDesignation) return;

    try {
      await api.put(`/designation/${editingDesignation.id}`, designationForm);
      showToast("Designation updated successfully", "success");
    } catch (err) {
      console.warn("Update Designation Error:", err);
      showToast("Designation updated locally. PHP endpoint should persist this payload.", "error");
    } finally {
      setDesignations((prev) =>
        prev.map((designation) =>
          designation.id === editingDesignation.id ? { ...designation, name: designationForm.name } : designation
        )
      );
      setEditingDesignation(null);
    }
  };

  const handleDeleteDesignation = async () => {
    if (!deletingDesignationId) return;
    const designation = designations.find((item) => String(item.id) === String(deletingDesignationId));
    const assignedEmployees = designation ? getAssignedEmployees(designation) : [];
    if (assignedEmployees.length > 0) {
      showToast(`Reassign ${assignedEmployees.length} employee(s) before deleting this designation.`, "error");
      return;
    }

    try {
      await api.delete(`/designation/${deletingDesignationId}`);
      showToast("Designation deleted successfully", "success");
    } catch (err) {
      console.warn("Delete Designation Error:", err);
      showToast("Designation removed locally. PHP endpoint should persist deletion.", "error");
    } finally {
      setDesignations((prev) => prev.filter((designation) => designation.id !== deletingDesignationId));
      setDeletingDesignationId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex flex-wrap items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Designations</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Manage company roles and job titles</p>
           </div>
           <div className="flex items-center space-x-3">
              <button onClick={fetchDesignations} className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all">
                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/designation/create">
                 <Button className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 transition-colors">
                    <Plus className="h-4 w-4 mr-2" /> Add Designation
                 </Button>
              </Link>
           </div>
        </div>

        {/* Content Area */}
        <Card className="border-none shadow-sm bg-white overflow-hidden p-0 min-h-[400px] relative">
           {loading && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Designations...</p>
             </div>
           )}
           
           <div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Roles Directory</h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-50">
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16">#</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Designation</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employees</th>
                       <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {designations.length > 0 ? (
                       designations.map((des, i) => {
                        const assignedEmployees = getAssignedEmployees(des);
                        return (
                          <tr key={des.id} className="hover:bg-gray-50/50 transition-colors group">
                             <td className="px-8 py-5 text-xs font-bold text-gray-400">{i + 1}</td>
                             <td className="px-8 py-5">
                                <div className="flex items-center space-x-3">
                                   <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-black text-[10px] uppercase group-hover:rotate-12 transition-transform">
                                      <Briefcase className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-gray-800 group-hover:text-primary transition-colors uppercase tracking-tight">{des.name}</p>
                                      <span className="inline-flex mt-1 items-center bg-green-50 text-green-600 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">
                                         {assignedEmployees.length} Members
                                      </span>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex -space-x-3">
                                   {assignedEmployees.map((m: any, idx: number) => {
                                      const memberName = m.user?.name || m.name || "?";
                                      return (
                                        <div key={idx} className="h-9 w-9 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm hover:z-10 hover:-translate-y-1 transition-all" title={memberName}>
                                           {memberName.charAt(0).toUpperCase()}
                                        </div>
                                      );
                                   })}
                                   {assignedEmployees.length === 0 && (
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Members</span>
                                   )}
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => openDesignationEditor(des)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all" title="Manage Designation">
                                      <Settings className="h-4 w-4" />
                                   </button>
                                   <button onClick={() => setDeletingDesignationId(des.id)} className={`p-2 rounded-xl transition-all ${assignedEmployees.length > 0 ? "text-gray-300 hover:bg-gray-50" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`} title={assignedEmployees.length > 0 ? "Reassign employees before deleting" : "Delete"}>
                                      <X className="h-4 w-4" />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        );
                       })
                    ) : !loading && (
                       <tr>
                          <td colSpan={4} className="px-8 py-24 text-center">
                             <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="h-8 w-8 text-gray-200" />
                             </div>
                             <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">No Designations Found</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Create a designation to start adding roles</p>
                             <Link href="/designation/create">
                                <Button className="mt-6 bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                                   Add Designation
                                </Button>
                             </Link>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>

      <Modal isOpen={!!editingDesignation} onClose={() => setEditingDesignation(null)} title="Edit Designation" size="sm">
        <form onSubmit={handleUpdateDesignation} className="space-y-4">
          <input required value={designationForm.name} onChange={(event) => setDesignationForm({ name: event.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Designation name" />
          <div className="flex gap-3 pt-3">
            <Button type="button" onClick={() => setEditingDesignation(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingDesignationId} onClose={() => setDeletingDesignationId(null)} title="Delete Designation" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium text-gray-500">
            {(() => {
              const designation = designations.find((item) => String(item.id) === String(deletingDesignationId));
              const assignedCount = designation ? getAssignedEmployees(designation).length : 0;
              return assignedCount > 0
                ? `${assignedCount} employee(s) are still assigned. Reassign them before deleting.`
                : "This removes the designation from the roles directory.";
            })()}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingDesignationId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button
              onClick={handleDeleteDesignation}
              disabled={Boolean(designations.find((item) => String(item.id) === String(deletingDesignationId)) && getAssignedEmployees(designations.find((item) => String(item.id) === String(deletingDesignationId))).length > 0)}
              className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
