"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/context/ToastContext";
import { RefreshCw, Save, ArrowLeft, AlertCircle, Clock, Eye, EyeOff, Plus, UserCheck, UserX } from "lucide-react";
import { Employee } from "@/types";
import { getModulesFromPermissions, rolePermissions, type PermissionKey } from "@/lib/auth-contract";
import EmployeePermissionMatrix from "@/features/employees/components/EmployeePermissionMatrix";
import ShiftCreateModal, { type ShiftTypeOption } from "@/features/attendance/settings/shifts/components/ShiftCreateModal";
import { useAuth } from "@/context/AuthContext";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 8, "Password must be at least 8 characters"),
  employee_id: z.string().min(1, "Employee Device ID is required"),
  joining_date: z.string().min(1, "Joining date is required"),
  gender: z.string().min(1, "Please select gender"),
  department_id: z.string().min(1, "Please select a department"),
  designation_id: z.string().min(1, "Please select a designation"),
  shift_type_id: z.string().optional(),
  role: z.literal("employee"),
  status: z.enum(["active", "deactive"]),
  mobile: z.string().optional(),
  address: z.string().optional(),
}).superRefine((data, ctx) => {
  const password = data.password?.trim().toLowerCase();
  if (!password) return;

  const blockedValues = [data.name, data.email, data.employee_id]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (blockedValues.includes(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: "Password must be unique and cannot match name, email, or employee ID",
    });
  }
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

type DepartmentOption = {
  id: number | string;
  name?: string;
  team_name?: string;
};

type DesignationOption = {
  id: number | string;
  name: string;
};

type EmployeeUpdatePayload = {
  company_id?: string;
  name: string;
  email: string;
  role: "employee";
  status: "active" | "deactive";
  password?: string;
  gender: string;
  permissions: PermissionKey[];
  modules: string[];
  department_id: string;
  designation_id: string;
  shift_type_id?: string;
  employee_detail: {
    employee_id: string;
    joining_date: string;
    department_id: string;
    designation_id: string;
    shift_type_id?: string;
    mobile?: string;
    address?: string;
  };
};

type EmployeeWithAccess = Employee & {
  employee_id?: string;
  company_id?: number | string;
  joining_date?: string;
  department_id?: number | string;
  designation_id?: number | string;
  shift_type_id?: number | string;
  hourly_rate?: number | string;
  permissions?: PermissionKey[];
  modules?: string[];
  permission_record?: {
    permission_keys?: PermissionKey[];
  };
};

type EmployeeDetailDraft = Partial<NonNullable<Employee["employee_detail"]>>;

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [designations, setDesignations] = useState<DesignationOption[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isShiftCreateOpen, setIsShiftCreateOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionKey[]>(rolePermissions.employee);
  const companyId = user?.company_id ? String(user.company_id) : "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: "employee",
      status: "active",
      gender: "",
      password: "",
    },
  });
  const employeeStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    register("status");
  }, [register]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!employeeId || !/^\d+$/.test(String(employeeId))) {
          setEmployee(null);
          showToast("A valid employee ID is required.", "error");
          return;
        }

        const empRes = await api.get(`/employees/${encodeURIComponent(String(employeeId))}`);
        const [deptRes, desigRes, shiftRes] = await Promise.allSettled([
          api.get("/departments"),
          api.get("/designations"),
          api.get("/shift-types"),
        ]);

        const data = empRes.data.data as EmployeeWithAccess;
        const permissions =
          Array.isArray(data.permissions) && data.permissions.length > 0
            ? data.permissions
            : Array.isArray(data.permission_record?.permission_keys) && data.permission_record.permission_keys.length > 0
              ? data.permission_record.permission_keys
              : ["dashboard.view", "profile.*"] as PermissionKey[];
        const detail: EmployeeDetailDraft = data.employee_detail || {};
        setEmployee(data);
        setPermissionState(permissions);
        setDepartments(deptRes.status === "fulfilled" ? deptRes.value.data.data || [] : []);
        setDesignations(desigRes.status === "fulfilled" ? desigRes.value.data.data || [] : []);
        setShiftTypes(shiftRes.status === "fulfilled" ? shiftRes.value.data.data || [] : []);

        reset({
          name: data.name,
          email: data.email,
          employee_id: detail.employee_id || data.employee_id || "",
          joining_date: detail.joining_date || data.joining_date || "",
          gender: data.gender || "",
          department_id: (detail.department_id || data.department_id || "")?.toString(),
          designation_id: (detail.designation_id || data.designation_id || "")?.toString(),
          shift_type_id: (detail.shift_type_id || data.shift_type_id || "")?.toString(),
          role: "employee",
          status: data.status === "deactive" ? "deactive" : "active",
          password: "",
          mobile: detail.mobile || data.mobile || "",
          address: detail.address || "",
        });
      } catch (err: unknown) {
        console.error("Fetch Edit Data Error:", err);
        showToast("Failed to load employee data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, reset, showToast]);

  const handleShiftCreated = (shift: ShiftTypeOption) => {
    setShiftTypes((current) => [shift, ...current.filter((item) => String(item.id) !== String(shift.id))]);
    setValue("shift_type_id", String(shift.id), { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    setSaving(true);
    try {
      const permissions = permissionState;
      const modules = getModulesFromPermissions(permissions);
      const payload: EmployeeUpdatePayload = {
        name: data.name,
        email: data.email,
        role: "employee",
        status: data.status,
        company_id: companyId,
        gender: data.gender,
        permissions,
        modules,
        department_id: data.department_id,
        designation_id: data.designation_id,
        shift_type_id: data.shift_type_id,
        employee_detail: {
          employee_id: data.employee_id,
          joining_date: data.joining_date,
          department_id: data.department_id,
          designation_id: data.designation_id,
          shift_type_id: data.shift_type_id,
          mobile: data.mobile,
          address: data.address,
        },
      };
      
      if (data.password) {
        payload.password = data.password;
      }

      await api.put(`/employee/${params.id}`, payload);
      showToast("Employee updated successfully!");
      router.push(`/employees/${params.id}`);
      router.refresh();
    } catch (err: unknown) {
      console.error("Update Employee Error:", err);
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errorMessage || "Failed to update employee.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading employee data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-20" />
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-2">Profile Not Found</h2>
          <Button onClick={() => router.push("/employees")} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
            Back to Employees
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between -mx-6 -mt-6 mb-6">
           <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                 <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                 <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Edit Employee</h1>
                 <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update profile for {employee.name}</p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <Button onClick={() => router.back()} className="bg-gray-50 text-gray-500 border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                 {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                 {saving ? "Updating..." : "Update Employee"}
              </Button>
           </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Personal Details" className="border-none shadow-sm p-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          {...register("name")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.name ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.name && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address <span className="text-red-500">*</span></label>
                       <input 
                          type="email" 
                          {...register("email")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.email ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.email && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                       <input 
                          type="text" 
                          {...register("mobile")}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" 
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender <span className="text-red-500">*</span></label>
                       <select
                          {...register("gender")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none appearance-none cursor-pointer ${errors.gender ? "ring-1 ring-red-500" : "focus:ring-primary"}`}
                       >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                       </select>
                       {errors.gender && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.gender.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Device ID <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          {...register("employee_id")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.employee_id ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.employee_id && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.employee_id.message}</p>}
                    </div>
                 </div>
              </Card>

              <Card title="Job Information" className="border-none shadow-sm p-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Joining Date <span className="text-red-500">*</span></label>
                       <input 
                          type="date" 
                          {...register("joining_date")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.joining_date ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.joining_date && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.joining_date.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department <span className="text-red-500">*</span></label>
                       <select 
                          {...register("department_id")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none appearance-none cursor-pointer ${errors.department_id ? "ring-1 ring-red-500" : "focus:ring-primary"}`}
                       >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name || dept.team_name}</option>
                          ))}
                       </select>
                       {errors.department_id && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.department_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Designation <span className="text-red-500">*</span></label>
                       <select 
                          {...register("designation_id")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none appearance-none cursor-pointer ${errors.designation_id ? "ring-1 ring-red-500" : "focus:ring-primary"}`}
                       >
                          <option value="">Select Designation</option>
                          {designations.map(desig => (
                            <option key={desig.id} value={desig.id}>{desig.name}</option>
                          ))}
                       </select>
                       {errors.designation_id && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.designation_id.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex items-center justify-between gap-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Type</label>
                         <button
                           type="button"
                           onClick={() => setIsShiftCreateOpen(true)}
                           className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary transition hover:bg-primary hover:text-white"
                         >
                           <Plus className="h-3 w-3" />
                           New Shift
                         </button>
                       </div>
                       <div className="relative">
                          <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                          <select
                             {...register("shift_type_id")}
                             className="w-full bg-gray-50 border-none rounded-xl p-3 pl-12 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                          >
                             <option value="">Select Shift</option>
                             {shiftTypes.map((shift) => (
                               <option key={shift.id} value={shift.id}>
                                 {shift.type} {shift.start_time && shift.end_time ? `(${shift.start_time}-${shift.end_time})` : ""}
                               </option>
                             ))}
                          </select>
                       </div>
                       <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Used by attendance calculations.</p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Address</label>
                       <textarea 
                          {...register("address")}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-24"
                       />
                    </div>
                 </div>
              </Card>

              <Card className="border-none shadow-sm p-0 bg-white rounded-2xl overflow-hidden">
                 <EmployeePermissionMatrix
                    permissions={permissionState}
                    onPermissionsChange={setPermissionState}
                 />
              </Card>

           </div>

           <div className="space-y-6">
              <Card title="Profile Photo" className="border-none shadow-sm p-8 bg-white text-center">
                 <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary text-3xl font-black shadow-inner border border-primary/5 mx-auto mb-6 relative group overflow-hidden uppercase">
                    {employee.name.charAt(0)}
                 </div>
                 <div className={`${employeeStatus === "active" ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"} mb-4 rounded-xl border py-3 text-[10px] font-black uppercase tracking-widest`}>
                    {employeeStatus === "active" ? "Active Account" : "Deactivated Account"}
                 </div>
                 <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">
                    <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                          {employeeStatus === "active" ? <UserCheck className="h-5 w-5 text-green-500" /> : <UserX className="h-5 w-5 text-red-500" />}
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-800">Employee Status</p>
                          <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-gray-400">
                            {employeeStatus === "active" ? "Can access active workflows" : "Access and payroll eligibility paused"}
                          </p>
                       </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                       <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={employeeStatus === "active"}
                          onChange={(event) => setValue("status", event.target.checked ? "active" : "deactive", { shouldDirty: true, shouldValidate: true })}
                       />
                       <div className="h-6 w-11 rounded-full bg-gray-200 shadow-inner after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                    </label>
                 </div>
                 <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Password</label>
                    <div className="relative">
                       <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Leave blank to keep"
                          {...register("password")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 pr-11 text-xs font-bold focus:ring-1 outline-none ${
                            errors.password ? "ring-1 ring-red-500" : "focus:ring-primary"
                          }`}
                       />
                       <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 transition hover:text-primary"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                       >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                    </div>
                    {errors.password && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.password.message}</p>}
                 </div>
              </Card>

              <Card title="Account Stats" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System ID</p>
                       <p className="text-xs font-black text-gray-800">#{employee.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Type</p>
                       <p className="text-xs font-black text-gray-800 uppercase">employee</p>
                    </div>
                 </div>
              </Card>
           </div>
        </form>
      </div>
      <ShiftCreateModal
        isOpen={isShiftCreateOpen}
        onClose={() => setIsShiftCreateOpen(false)}
        onCreated={handleShiftCreated}
        companyId={companyId}
      />
    </DashboardLayout>
  );
}
