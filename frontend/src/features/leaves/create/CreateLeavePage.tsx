"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Save, RefreshCw, User } from "lucide-react";
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
  email?: string;
  company_id?: number | string | null;
};

type LeaveRecord = {
  leave_type_id?: number | string;
  status?: string;
  leave_date?: string;
  end_date?: string;
  duration?: string;
};

type QuotaRecord = {
  leave_type_id?: number | string;
  no_of_leaves?: number | string;
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
};

const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseDateOnly = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const nextDate = (date: string) => {
  const value = parseDateOnly(date);
  value.setDate(value.getDate() + 1);
  return formatLocalDate(value);
};

const buildDateRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const end = parseDateOnly(endDate);

  for (const cursor = parseDateOnly(startDate); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(formatLocalDate(cursor));
  }

  return dates;
};

const dateFromValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : new Date();
};

type LeaveDatePickerProps = {
  value: string;
  minDate: string;
  label: string;
  isDateDisabled?: (date: string) => boolean;
  onChange: (date: string) => void;
};

function LeaveDatePicker({ value, minDate, label, isDateDisabled, onChange }: LeaveDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => dateFromValue(value || minDate));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const minMonth = dateFromValue(minDate);
  const canGoPrevious = year > minMonth.getFullYear() || (year === minMonth.getFullYear() && month > minMonth.getMonth());

  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setViewDate(dateFromValue(value || minDate));
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between rounded border border-gray-200 bg-white p-2.5 text-left text-xs font-bold outline-none transition-all hover:border-primary/50 focus:ring-1 focus:ring-primary/20"
      >
        <span className={value ? "text-gray-700" : "text-gray-400"}>{value || "Select date"}</span>
        <CalendarDays className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <div role="dialog" aria-label={`${label} calendar`} className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" disabled={!canGoPrevious} onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month" className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-xs font-bold text-gray-700">{viewDate.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Next month" className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-1 text-[9px] font-bold uppercase text-gray-400">{day}</span>)}
            {calendarCells.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />;
              const date = formatDate(new Date(year, month, day));
              const disabled = date < minDate || Boolean(isDateDisabled?.(date));
              const selected = date === value;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => { onChange(date); setOpen(false); }}
                  className={`aspect-square rounded text-xs font-semibold transition-colors ${selected ? "bg-primary text-white" : disabled ? "cursor-not-allowed bg-gray-50 text-gray-300 line-through" : "text-gray-700 hover:bg-primary/10 hover:text-primary"}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const overlapsLeave = (start: string, end: string, leaves: LeaveRecord[]) => leaves.some((leave) => {
  const status = String(leave.status || "").toLowerCase();
  if (status !== "pending" && status !== "approved") return false;
  const existingStart = String(leave.leave_date || "").slice(0, 10);
  const existingEnd = String(leave.end_date || existingStart).slice(0, 10);
  return existingStart <= end && existingEnd >= start;
});

export default function CreateLeavePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<OptionRecord[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<OptionRecord[]>([]);
  const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRecord[]>([]);
  const [employeeQuotas, setEmployeeQuotas] = useState<QuotaRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    user_id: "",
    type_id: "",
    duration: "single",
    leave_date: formatLocalDate(new Date()),
    end_date: "",
    reason: "",
    status: "pending"
  });
  const today = formatLocalDate(new Date());
  const canManageCompanyLeaves = user?.role === "admin" || (user?.role !== "employee" && (hasPermission("leaves.approve") || hasPermission("leaves.manage")));
  const selectedQuota = employeeQuotas.find((quota) => String(quota.leave_type_id) === String(formData.type_id));
  const allocatedDays = Number(selectedQuota?.no_of_leaves || 0);
  const usedDays = employeeLeaves
    .filter((leave) => String(leave.leave_type_id || "") === String(formData.type_id) && ["approved", "pending"].includes(String(leave.status || "").toLowerCase()))
    .reduce((total, leave) => {
      if (String(leave.duration || "").toLowerCase().includes("half")) return total + 0.5;
      const start = new Date(`${leave.leave_date}T00:00:00`);
      const end = new Date(`${leave.end_date || leave.leave_date}T00:00:00`);
      return total + (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? 1 : Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
    }, 0);
  const remainingDays = Math.max(allocatedDays - usedDays, 0);
  const requestedDays = formData.duration === "half day" ? 0.5 : formData.duration === "multiple" && formData.leave_date && formData.end_date
    ? Math.floor((parseDateOnly(formData.end_date).getTime() - parseDateOnly(formData.leave_date).getTime()) / 86400000) + 1
    : 1;
  const insufficientBalance = Boolean(formData.user_id && formData.type_id) && (!selectedQuota || requestedDays > remainingDays);
  const requestEndDate = formData.duration === "multiple" ? formData.end_date : formData.leave_date;
  const hasDateConflict = Boolean(formData.user_id && formData.leave_date && requestEndDate) && employeeLeaves.some((leave) => {
    const status = String(leave.status || "").toLowerCase();
    if (status !== "pending" && status !== "approved") return false;
    const existingStart = String(leave.leave_date || "").slice(0, 10);
    const existingEnd = String(leave.end_date || existingStart).slice(0, 10);
    return existingStart <= requestEndDate && existingEnd >= formData.leave_date;
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, typeRes] = await Promise.all([
          api.get("/employees", { params: { status: "active" } }),
          api.get("/leave-types")
        ]);
        const employeeOptions = empRes.data.data || [];
        setEmployees(employeeOptions);
        setLeaveTypes(typeRes.data.data || []);
        if (!canManageCompanyLeaves) {
          const selfEmployee = employeeOptions.find((employee: OptionRecord) =>
            String(employee.id) === String(user?.employee_id || "") ||
            String(employee.id) === String(user?.id || "") ||
            employee.email === user?.email
          );
          const selfEmployeeId = String(selfEmployee?.id || "");
          setFormData((current) => ({ ...current, user_id: selfEmployeeId }));
          if (selfEmployeeId) {
            const [quotaRes, leaveRes] = await Promise.all([
              api.get("/leave-quotas", { params: { employee_id: selfEmployeeId } }),
              api.get("/leave", { params: { employee_id: selfEmployeeId } }),
            ]);
            setEmployeeQuotas(quotaRes.data.data || []);
            setEmployeeLeaves(leaveRes.data.data || []);
          }
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
    setError("");
  };

  const handleDateSelection = (name: string, value: string) => {
    const nextStartDate = name === "leave_date" ? value : formData.leave_date;
    const nextEndDate = formData.duration === "multiple"
      ? (name === "end_date" ? value : formData.end_date || nextStartDate)
      : nextStartDate;

    if (overlapsLeave(nextStartDate, nextEndDate, employeeLeaves)) {
      setError("That date overlaps a pending or approved leave request. Choose another date.");
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "leave_date" && current.duration === "multiple" && current.end_date && current.end_date <= value ? { end_date: "" } : {}),
    }));
    setError("");
  };

  const handleEmployeeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    setFormData((current) => ({ ...current, user_id: employeeId }));
    setEmployeeQuotas([]);
    setEmployeeLeaves([]);
    setError("");
    if (!employeeId) return;

    setLoadingBalance(true);
    try {
      const [quotaRes, leaveRes] = await Promise.all([
        api.get("/leave-quotas", { params: { employee_id: employeeId } }),
        api.get("/leave", { params: { employee_id: employeeId } }),
      ]);
      setEmployeeQuotas(quotaRes.data.data || []);
      setEmployeeLeaves(leaveRes.data.data || []);
    } catch (err) {
      console.error("Failed to load selected employee leave balance:", err);
      setError("Could not load this employee's leave balance. Please try again.");
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leave_date || (formData.duration === "multiple" && !formData.end_date)) {
      setError("Select all required leave dates.");
      return;
    }
    if (formData.duration === "multiple" && formData.end_date <= formData.leave_date) {
      setError("For multiple days, the end date must be after the start date.");
      return;
    }
    if (formData.leave_date < today || (formData.duration === "multiple" && formData.end_date < today)) {
      setError("Leave dates cannot be in the past.");
      return;
    }
    if (hasDateConflict) {
      setError("You already have a pending or approved leave request for one or more selected dates.");
      return;
    }
    if (insufficientBalance) {
      setError(selectedQuota ? `Not enough leave balance. Remaining: ${remainingDays} day(s).` : "No leave balance is assigned for this leave type.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const dates = buildDateRange(
        formData.leave_date,
        formData.duration === "multiple" && formData.end_date ? formData.end_date : formData.leave_date,
      );

      const payload: Record<string, unknown> = {
        user_id: formData.user_id,
        user: { id: formData.user_id },
        leave_type_id: formData.type_id,
        type_id: formData.type_id,
        type: { id: formData.type_id },
        duration: formData.duration,
        leave_date: formData.leave_date,
        end_date: formData.duration === "multiple" ? formData.end_date : formData.leave_date,
        date: formData.leave_date,
        multi_date: dates.join(","),
        reason: formData.reason,
        status: canManageCompanyLeaves ? formData.status : "pending"
      };

      await api.post("/leaves", payload);
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
                    onChange={handleEmployeeChange}
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
                {formData.user_id && formData.type_id && (
                  <p className={`text-xs font-semibold ${remainingDays > 0 ? "text-gray-500" : "text-red-600"}`}>
                    {loadingBalance ? "Loading leave balance..." : selectedQuota ? `${remainingDays} day(s) remaining` : "No balance assigned for this leave type"}
                  </p>
                )}
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
                <LeaveDatePicker
                  value={formData.leave_date}
                  minDate={today}
                  label={formData.duration === "multiple" ? "Start date" : "Leave date"}
                  isDateDisabled={(date) => {
                    const rangeEnd = formData.duration === "multiple" && formData.end_date >= date ? formData.end_date : date;
                    return overlapsLeave(date, rangeEnd, employeeLeaves);
                  }}
                  onChange={(date) => handleDateSelection("leave_date", date)}
                />
              </div>

              {formData.duration === "multiple" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date <span className="text-red-500">*</span></label>
                  <LeaveDatePicker
                    value={formData.end_date}
                    minDate={formData.leave_date ? nextDate(formData.leave_date) : nextDate(today)}
                    label="End date"
                    isDateDisabled={(date) => overlapsLeave(formData.leave_date, date, employeeLeaves)}
                    onChange={(date) => handleDateSelection("end_date", date)}
                  />
                </div>
              )}

              {hasDateConflict && (
                <div className="md:col-span-2 rounded border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  This employee already has a pending or approved leave request covering one or more selected dates.
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
              <Button type="submit" disabled={saving || loadingOptions || loadingBalance || insufficientBalance || hasDateConflict} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
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
