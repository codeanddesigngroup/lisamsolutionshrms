"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

type OptionRecord = {
  id: number | string;
  name?: string;
  project_name?: string;
  category_name?: string;
  status?: string;
  department_id?: number | string | null;
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const taskSchema = z.object({
  heading: z.string().min(2, "Task title must be at least 2 characters"),
  project_id: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  assigned_user_id: z.string().min(1, "Please assign this task to an employee"),
  category_id: z.string().optional(),
  label: z.enum(["", "bug", "feature", "improvement", "support"]),
  priority: z.enum(["high", "medium", "low"]),
  status: z.string().min(1, "Status is required"),
  is_private: z.boolean(),
  description: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function CreateTaskPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [projects, setProjects] = useState<OptionRecord[]>([]);
  const [employees, setEmployees] = useState<OptionRecord[]>([]);
  const [categories, setCategories] = useState<OptionRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canCreateTask = Boolean(isAdmin && (hasPermission("tasks.create") || hasPermission("tasks.manage")));

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      heading: "",
      project_id: "",
      start_date: new Date().toISOString().split('T')[0],
      due_date: "",
      assigned_user_id: "",
      category_id: "",
      label: "",
      priority: "medium",
      status: "incomplete",
      is_private: false,
      description: "",
    },
  });

  const selectedProjectId = useWatch({ control, name: "project_id" });
  const selectedProject = projects.find((project) => String(project.id) === selectedProjectId);
  const departmentEmployees = selectedProject?.department_id
    ? employees.filter((employee) => String(employee.department_id) === String(selectedProject.department_id))
    : [];

  useEffect(() => {
    if (!user || canCreateTask) return;
    showToast("Employees can view assigned tasks but cannot create tasks.", "info");
    router.replace("/tasks");
  }, [canCreateTask, router, showToast, user]);

  useEffect(() => {
    if (!canCreateTask) {
      return;
    }

    const fetchOptions = async () => {
      const [projectResult, employeeResult, categoryResult] = await Promise.allSettled([
          api.get("/project"),
          api.get("/employee"),
          api.get("/task-category")
      ]);

      if (projectResult.status === "fulfilled") {
        const databaseProjects = (projectResult.value.data.data || []) as OptionRecord[];
        setProjects(databaseProjects.filter((project) => project.status?.trim().toLowerCase() === "in progress"));
      } else {
        console.error("Failed to fetch database projects:", projectResult.reason);
        showToast("Failed to load projects", "error");
      }

      if (employeeResult.status === "fulfilled") {
        setEmployees(employeeResult.value.data.data || []);
      }
      if (categoryResult.status === "fulfilled") {
        setCategories(categoryResult.value.data.data || []);
      }
      setLoadingOptions(false);
    };
    fetchOptions();
  }, [canCreateTask, showToast]);

  const onSubmit = async (data: TaskFormValues) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        heading: data.heading,
        start_date: data.start_date,
        due_date: data.due_date,
        priority: data.priority,
        status: data.status,
        is_private: data.is_private,
        description: data.description,
        label: data.label || null,
        task_users: [{ id: data.assigned_user_id }]
      };

      if (data.project_id) {
        payload.project = { id: data.project_id };
      }

      if (data.category_id) {
        payload.category = { id: data.category_id };
      }

      await api.post("/task", payload);
      showToast("Task created successfully!");
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      console.error("Create Task Error:", err);
      showToast(getApiErrorMessage(err, "Failed to create task."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (user && !canCreateTask) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[320px] items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
          Redirecting to assigned tasks...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Task</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/tasks" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Tasks</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Task</span>
            </div>
          </div>
          <Link href="/tasks">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-4 font-black uppercase tracking-widest hover:bg-gray-200">
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

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Task Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  {...register("heading")}
                  placeholder="e.g. Design Homepage"
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${errors.heading ? "border-red-500" : "border-gray-200"
                    }`}
                />
                {errors.heading && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.heading.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project <span className="text-red-500">*</span></label>
                <select
                  {...register("project_id")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.project_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  {...register("start_date")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Due Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  {...register("due_date")}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${errors.due_date ? "border-red-500" : "border-gray-200"
                    }`}
                />
                {errors.due_date && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.due_date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Assigned To <span className="text-red-500">*</span></label>
                <select
                  {...register("assigned_user_id")}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer ${errors.assigned_user_id ? "border-red-500" : "border-gray-200"
                    }`}
                >
                  <option value="">{selectedProject ? "Select Employee" : "Select a project first"}</option>
                  {departmentEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {errors.assigned_user_id && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.assigned_user_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Task Category <span className="text-red-500">*</span></label>
                <select
                  {...register("category_id")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Task Label <span className="text-red-500">*</span></label>
                <select
                  {...register("label")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Label</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="improvement">Improvement</option>
                  <option value="support">Support</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Priority <span className="text-red-500">*</span></label>
                <select
                  {...register("priority")}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer ${errors.priority ? "border-red-500" : "border-gray-200"
                    }`}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                {errors.priority && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.priority.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea
                {...register("description")}
                className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all"
                placeholder="Enter task details..."
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/tasks">
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
                {saving ? "Saving..." : "Save Task"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
