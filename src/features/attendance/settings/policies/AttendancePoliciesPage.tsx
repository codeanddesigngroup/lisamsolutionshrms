"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldAlert, Clock, Coins, Coffee, Save, History, Settings2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export default function AttendancePolicyPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [policies, setPolicies] = useState({
    late_entry: {
      enabled: true,
      grace_period: 15,
      deduction_rule: "3_lates_equals_half_day",
      strict_mode: false
    },
    early_exit: {
      enabled: false,
      buffer_minutes: 5,
      deduction_rule: "pro_rata"
    },
    overtime: {
      enabled: true,
      min_ot_minutes: 60,
      approval_required: true,
      round_to_nearest: 30
    },
    break_tracking: {
      auto_deduct: true,
      break_duration: 60,
      include_in_working_hours: false
    }
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      showToast("Attendance policies updated successfully", "success");
      setLoading(false);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="white-box flex items-center justify-between border-l-4 border-primary p-6">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="font-black uppercase tracking-tight text-gray-800">Attendance Policies</h4>
                 <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Global Governance & Deduction Rules</p>
              </div>
           </div>
           <Button variant="primary" onClick={handleSave} disabled={loading} className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" /> {loading ? 'Saving...' : 'Save Changes'}
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Late Entry Rules */}
           <div className="white-box p-8 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                 <Clock className="h-5 w-5" />
                 <h5 className="text-xs font-black uppercase tracking-widest">Late Entry Logic</h5>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Enable Late Tracking</label>
                    <input 
                      type="checkbox" 
                      checked={policies.late_entry.enabled}
                      onChange={(e) => setPolicies({...policies, late_entry: {...policies.late_entry, enabled: e.target.checked}})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Grace Period (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={policies.late_entry.grace_period}
                      onChange={(e) => setPolicies({...policies, late_entry: {...policies.late_entry, grace_period: parseInt(e.target.value)}})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Deduction Rule</label>
                    <select 
                      className="form-control"
                      value={policies.late_entry.deduction_rule}
                      onChange={(e) => setPolicies({...policies, late_entry: {...policies.late_entry, deduction_rule: e.target.value}})}
                    >
                       <option value="3_lates_equals_half_day">3 Lates = 1 Half Day Deduction</option>
                       <option value="fixed_amount">Fixed Amount per Late</option>
                       <option value="per_minute">Deduct Per Minute</option>
                    </select>
                 </div>
              </div>
           </div>

           {/* Overtime Policies */}
           <div className="white-box p-8 space-y-6">
              <div className="flex items-center gap-2 text-warning">
                 <Coins className="h-5 w-5" />
                 <h5 className="text-xs font-black uppercase tracking-widest">Overtime (OT) Engine</h5>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Enable OT Calculation</label>
                    <input 
                      type="checkbox" 
                      checked={policies.overtime.enabled}
                      onChange={(e) => setPolicies({...policies, overtime: {...policies.overtime, enabled: e.target.checked}})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Minimum OT (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={policies.overtime.min_ot_minutes}
                      onChange={(e) => setPolicies({...policies, overtime: {...policies.overtime, min_ot_minutes: parseInt(e.target.value)}})}
                    />
                    <span className="text-[9px] text-gray-400 mt-1 italic block font-bold">Extra time below this will be ignored.</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Requires Supervisor Approval</label>
                    <input 
                      type="checkbox" 
                      checked={policies.overtime.approval_required}
                      onChange={(e) => setPolicies({...policies, overtime: {...policies.overtime, approval_required: e.target.checked}})}
                    />
                 </div>
              </div>
           </div>

           {/* Break & Auto-Deduction */}
           <div className="white-box p-8 space-y-6">
              <div className="flex items-center gap-2 text-info">
                 <Coffee className="h-5 w-5" />
                 <h5 className="text-xs font-black uppercase tracking-widest">Break Management</h5>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Auto-Deduct Break Time</label>
                    <input 
                      type="checkbox" 
                      checked={policies.break_tracking.auto_deduct}
                      onChange={(e) => setPolicies({...policies, break_tracking: {...policies.break_tracking, auto_deduct: e.target.checked}})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Standard Break (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={policies.break_tracking.break_duration}
                      onChange={(e) => setPolicies({...policies, break_tracking: {...policies.break_tracking, break_duration: parseInt(e.target.value)}})}
                    />
                 </div>
              </div>
           </div>

           {/* Early Exit Control */}
           <div className="white-box p-8 space-y-6">
              <div className="flex items-center gap-2 text-red-500">
                 <History className="h-5 w-5" />
                 <h5 className="text-xs font-black uppercase tracking-widest">Early Exit Restrictions</h5>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Track Early Clock-out</label>
                    <input 
                      type="checkbox" 
                      checked={policies.early_exit.enabled}
                      onChange={(e) => setPolicies({...policies, early_exit: {...policies.early_exit, enabled: e.target.checked}})}
                    />
                 </div>
                 <div className="form-group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Early Buffer (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={policies.early_exit.buffer_minutes}
                      onChange={(e) => setPolicies({...policies, early_exit: {...policies.early_exit, buffer_minutes: parseInt(e.target.value)}})}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Audit Log / Change History */}
        <div className="white-box p-8">
           <div className="flex items-center gap-2 text-gray-400 mb-6">
              <Settings2 className="h-5 w-5" />
              <h5 className="text-xs font-black uppercase tracking-widest">Policy Change History</h5>
           </div>
           <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                 <div>
                    <p className="text-[11px] font-bold text-gray-700">Grace period increased from 10m to 15m</p>
                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Updated by Admin · May 12, 2026</p>
                 </div>
                 <button className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
