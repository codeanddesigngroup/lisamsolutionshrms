"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  Settings, 
  Check, 
  X, 
  Trash2, 
  RefreshCw,
  Palette,
  Calendar,
  Users,
  Info,
  ChevronDown
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const leaveColorClasses: Record<string, string> = {
  info: "bg-blue-500 shadow-blue-500/50",
  success: "bg-green-500 shadow-green-500/50",
  warning: "bg-yellow-500 shadow-yellow-500/50",
  danger: "bg-red-500 shadow-red-500/50",
  purple: "bg-purple-500 shadow-purple-500/50",
};

export default function LeaveSettingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const companyId = user?.company_id ? String(user.company_id) : "";
  
  // Settings parity with Laravel
  const [leaveStartFrom, setLeaveStartFrom] = useState("joining_date");
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  // New Leave Type Form
  const [newType, setNewType] = useState({
    type_name: "",
    color: "info",
    leave_number: "",
    all_employees: false
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/leaveType");
      setLeaveTypes(response.data.data || []);
    } catch (err) {
      console.error("Fetch Leave Types Error:", err);
      setLeaveTypes((current) =>
        current.length === 0 ? [
          { id: 1, type_name: "Casual", no_of_leaves: 12, paid: 1, color: "success" },
          { id: 2, type_name: "Sick", no_of_leaves: 10, paid: 1, color: "danger" }
        ] : current
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const updateLeaveTypeField = (id: number | string, patch: Record<string, string | number>) => {
    setLeaveTypes((current) => current.map((type) => type.id === id ? { ...type, ...patch } : type));
  };

  const handleUpdateType = async (id: number | string) => {
    const leaveType = leaveTypes.find((type) => type.id === id);
    if (!leaveType) return;
    const count = Number(leaveType.no_of_leaves || 0);
    const paid = Number(leaveType.paid ?? 1);
    if (!Number.isFinite(count) || count < 0) {
      showToast("Leave limit must be zero or greater.", "error");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/leaveType/${id}`, { 
        company_id: companyId,
        leaves: count,
        no_of_leaves: count,
        paid: paid
      });
      showToast("Leave type updated successfully", "success");
    } catch (err) {
      showToast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.type_name) return;
    if (!companyId) {
      showToast("Company is required to create a leave type", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/leaveType", {
        company_id: companyId,
        type_name: newType.type_name,
        color: newType.color,
        no_of_leaves: newType.leave_number,
        all_employees: newType.all_employees ? 1 : 0
      });
      showToast("New leave type created", "success");
      setNewType({ type_name: "", color: "info", leave_number: "", all_employees: false });
      fetchData();
    } catch (err) {
      showToast("Creation failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("Are you sure? This will remove this leave type.")) return;
    try {
      await api.delete(`/leaveType/${id}`);
      showToast("Leave type deleted", "success");
      fetchData();
    } catch (err) {
      showToast("Delete failed", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10 overflow-x-hidden">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">
                Leave Settings
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Policy Configuration / Leaves</p>
            </div>
          </div>
          <Link href="/leaves">
            <Button className="bg-gray-50 text-gray-500 border-none px-4 h-10 md:h-11 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all rounded-xl">
               Back to Calendar
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Left Column: General Configuration */}
           <div className="lg:col-span-4 space-y-8">
              <Card className="p-6 border-none shadow-sm bg-white rounded-2xl">
                 <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" /> Leave Cycle
                 </h3>
                 <div className="space-y-4">
                    <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                       <input 
                         type="radio" 
                         name="cycle" 
                         checked={leaveStartFrom === 'joining_date'}
                         onChange={() => setLeaveStartFrom('joining_date')}
                         className="mt-1 h-4 w-4 text-primary border-gray-300 focus:ring-primary" 
                       />
                       <div>
                          <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight group-hover:text-primary transition-colors">Joining Date</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Count leaves from date of joining</p>
                       </div>
                    </label>
                    
                    <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                       <input 
                         type="radio" 
                         name="cycle" 
                         checked={leaveStartFrom === 'year_start'}
                         onChange={() => setLeaveStartFrom('year_start')}
                         className="mt-1 h-4 w-4 text-primary border-gray-300 focus:ring-primary" 
                       />
                       <div>
                          <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight group-hover:text-primary transition-colors">Start of Year</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Count leaves from January 1st</p>
                       </div>
                    </label>
                 </div>
              </Card>

              <Card className="p-6 border-none shadow-sm bg-white rounded-2xl border-t-4 border-primary">
                 <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center">
                    <Plus className="h-4 w-4 mr-2 text-primary" /> Create Type
                 </h3>
                 <form onSubmit={handleCreateType} className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Type Name</label>
                       <input 
                         type="text" 
                         placeholder="E.G. STUDY LEAVE"
                         value={newType.type_name}
                         onChange={(e) => setNewType({...newType, type_name: e.target.value})}
                         className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Color</label>
                          <div className="relative">
                             <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                             <select 
                               value={newType.color}
                               onChange={(e) => setNewType({...newType, color: e.target.value})}
                               className="w-full bg-gray-50 border-none rounded-xl py-3 pl-8 pr-4 text-[10px] font-black uppercase appearance-none cursor-pointer"
                             >
                                <option value="info">Blue</option>
                                <option value="success">Green</option>
                                <option value="warning">Yellow</option>
                                <option value="danger">Red</option>
                                <option value="purple">Purple</option>
                             </select>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Limit</label>
                          <input 
                            type="number" 
                            placeholder="DAYS"
                            value={newType.leave_number}
                            onChange={(e) => setNewType({...newType, leave_number: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                          />
                       </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                       <input 
                         type="checkbox" 
                         id="toAll"
                         checked={newType.all_employees}
                         onChange={(e) => setNewType({...newType, all_employees: e.target.checked})}
                         className="rounded text-primary focus:ring-primary h-4 w-4" 
                       />
                       <label htmlFor="toAll" className="text-[9px] font-black text-primary uppercase tracking-widest cursor-pointer">Assign to all Employees</label>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full bg-primary text-white text-[10px] font-black h-12 uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl">
                       {saving ? "Saving..." : "Save Type"}
                    </Button>
                 </form>
              </Card>
           </div>

           {/* Right Column: Active Leave Types */}
           <div className="lg:col-span-8">
              <Card className="p-0 border-none shadow-sm bg-white rounded-2xl overflow-hidden min-h-[400px]">
                 <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center">
                       <Users className="h-4 w-4 mr-2 text-primary" /> Active Leave Categories
                    </h3>
                    <div className="flex items-center space-x-2">
                       <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Policies</span>
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full">
                       <thead>
                          <tr className="bg-gray-50/50">
                             <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Leave Type</th>
                             <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Annual Limit</th>
                             <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                             <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {leaveTypes.map((type) => (
                             <tr key={type.id} className="hover:bg-gray-50/30 transition-all group">
                                <td className="px-6 py-5">
                                   <div className="flex items-center space-x-3">
                                      <div className={`h-2 w-2 rounded-full shadow-sm ${leaveColorClasses[type.color] || leaveColorClasses.info}`}></div>
                                      <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{type.type_name}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="relative w-24">
                                      <input 
                                        type="number" 
                                        value={type.no_of_leaves ?? ""}
                                        onChange={(event) => updateLeaveTypeField(type.id, { no_of_leaves: event.target.value })}
                                        className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[10px] font-black text-gray-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                      />
                                   </div>
                                </td>
                                <td className="px-6 py-5">
                                   <select
                                     value={String(type.paid ?? 1)}
                                     onChange={(event) => updateLeaveTypeField(type.id, { paid: Number(event.target.value) })}
                                     className="bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-[9px] font-black text-gray-500 uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                   >
                                      <option value="1">PAID</option>
                                      <option value="0">UNPAID</option>
                                   </select>
                                </td>
                                <td className="px-6 py-5">
                                   <div className="flex items-center justify-center space-x-2">
                                      <button 
                                        onClick={() => handleUpdateType(type.id)}
                                        className="p-2 bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                        title="Update"
                                      >
                                         <Check className="h-3.5 w-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteType(type.id)}
                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        title="Delete"
                                      >
                                         <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 
                 <div className="p-8 border-t border-gray-50 bg-gray-50/10">
                    <div className="flex items-start space-x-4">
                       <div className="h-10 w-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                          <Info className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">Configuration Guidelines</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
                             Changes to annual limits will apply to all assigned employees immediately. Leave cycles determine when balances are reset to full allowance.
                          </p>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
