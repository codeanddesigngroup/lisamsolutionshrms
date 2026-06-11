"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, User } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

type OptionRecord = {
  id: number | string;
  name?: string;
  type_name?: string;
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
};

export default function CreateLeavePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<OptionRecord[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<OptionRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    user_id: "",
    type_id: "",
    duration: "single",
    leave_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    reason: "",
    status: "pending"
  });
  const canManageCompanyLeaves = user?.role === "admin" || hasPermission("leaves.approve") || hasPermission("leaves.manage");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, typeRes] = await Promise.all([
          api.get("/employee"),
          api.get("/leave-type")
        ]);
        const employeeOptions = empRes.data.data || [];
        setEmployees(employeeOptions);
        setLeaveTypes(typeRes.data.data || []);
        if (!canManageCompanyLeaves) {
          const selfEmployee = employeeOptions.find((employee: OptionRecord & { email?: string; role?: string }) =>
            String(employee.id) === String(user?.id) || employee.email === user?.email || employee.role === "employee"
          );
          setFormData((current) => ({ ...current, user_id: String(selfEmployee?.id || user?.id || "") }));
        }
      } catch (err) {
        console.error("Failed to fetch leave options:", err);
        showToast("Failed to load leave options", "error");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageCompanyLeaves, user?.email, user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const start = new Date(`${formData.leave_date}T00:00:00`);
      const end = formData.duration === "multiple" && formData.end_date
        ? new Date(`${formData.end_date}T00:00:00`)
        : start;
      const dates: string[] = [];
      for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        dates.push(cursor.toISOString().slice(0, 10));
      }

      const payload: Record<string, unknown> = {
        user_id: formData.user_id,
        user: { id: formData.user_id },
        leave_type_id: formData.type_id,
        type_id: formData.type_id,
        type: { id: formData.type_id },
        duration: formData.duration,
        leave_date: formData.leave_date,
        date: formData.leave_date,
        multi_date: dates.join(","),
        reason: formData.reason,
        status: canManageCompanyLeaves ? formData.status : "pending"
      };

      await api.post("/leave", payload);
      showToast(canManageCompanyLeaves ? "Leave assigned successfully" : "Leave application submitted for approval", "success");
      router.push("/leaves");
      router.refresh();
    } catch (err) {
      console.error("Create Leave Error:", err);
      setError(getApiErrorMessage(err, "Failed to create leave."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">{canManageCompanyLeaves ? "Assign Leave" : "Apply Leave"}</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/leaves" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Leaves</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">{canManageCompanyLeaves ? "Assign Leave" : "Apply Leave"}</span>
            </div>
          </div>
          <Link href="/leaves">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100 relative min-h-[400px]">
          {loadingOptions && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
               <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading options...</p>
             </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500 animate-in slide-in-from-top-2">
                  {error}
               </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employee <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <select 
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}
                    disabled={!canManageCompanyLeaves}
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">{canManageCompanyLeaves ? "Select Employee" : "My Profile"}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Leave Type <span className="text-red-500">*</span></label>
                <select 
                  name="type_id"
                  value={formData.type_id}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.type_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Duration <span className="text-red-500">*</span></label>
                <select 
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="single">Single Day</option>
                  <option value="multiple">Multiple Days</option>
                  <option value="half day">Half Day</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{formData.duration === "multiple" ? "Start Date" : "Leave Date"} <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="leave_date"
                  value={formData.leave_date}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>

              {formData.duration === "multiple" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="end_date"
                    min={formData.leave_date}
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    required
                  />
                </div>
              )}

              {canManageCompanyLeaves && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status <span className="text-red-500">*</span></label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              )}

            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason for Leave <span className="text-red-500">*</span></label>
              <textarea 
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all"
                placeholder="Details about the leave..."
                required
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/leaves">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving || loadingOptions} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                {saving ? "Saving..." : canManageCompanyLeaves ? "Save Leave" : "Submit Application"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
