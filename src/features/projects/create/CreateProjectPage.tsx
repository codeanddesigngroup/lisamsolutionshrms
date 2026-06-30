"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/context/ToastContext";

type OptionRecord = {
  id: number | string;
  name?: string;
  project_name?: string;
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const projectSchema = z.object({
  project_name: z.string().min(2, "Project name must be at least 2 characters"),
  start_date: z.string().min(1, "Start date is required"),
  deadline: z.string().optional(),
  without_deadline: z.boolean(),
  client_id: z.string().optional(),
  project_summary: z.string().optional(),
  status: z.enum(["not started", "in progress", "on hold", "canceled", "finished"]),
}).refine((data) => {
  if (!data.without_deadline && !data.deadline) {
    return false;
  }
  return true;
}, {
  message: "Deadline is required when 'No Deadline' is not checked",
  path: ["deadline"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [clients, setClients] = useState<OptionRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      project_name: "",
      start_date: new Date().toISOString().split('T')[0],
      deadline: "",
      without_deadline: false,
      client_id: "",
      project_summary: "",
      status: "not started",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const withoutDeadline = watch("without_deadline");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const clientRes = await api.get("/client");
        setClients(clientRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch project options:", err);
        showToast("Failed to load project options", "error");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ProjectFormValues) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        project_name: data.project_name,
        start_date: data.start_date,
        status: data.status,
        project_summary: data.project_summary
      };

      if (!data.without_deadline) {
        payload.deadline = data.deadline;
      } else {
        payload.without_deadline = true;
      }

      if (data.category_id) {
        payload.category = { id: data.category_id };
      }

      if (data.client_id) {
        payload.client = { id: data.client_id };
      }

      await api.post("/project", payload);
      showToast("Project created successfully!");
      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error("Create Project Error:", err);
      showToast(getApiErrorMessage(err, "Failed to create project."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Project</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/projects" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Projects</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Project</span>
            </div>
          </div>
          <Link href="/projects">
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
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  {...register("project_name")}
                  placeholder="e.g. Website Redesign" 
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${
                    errors.project_name ? "border-red-500" : "border-gray-200"
                  }`} 
                />
                {errors.project_name && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.project_name.message}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  {...register("start_date")}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${
                    errors.start_date ? "border-red-500" : "border-gray-200"
                  }`} 
                />
                {errors.start_date && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.start_date.message}</p>}
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Deadline {!withoutDeadline && <span className="text-red-500">*</span>}
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      {...register("without_deadline")}
                      className="rounded border-gray-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No Deadline</span>
                  </label>
                </div>
                <input 
                  type="date" 
                  {...register("deadline")}
                  disabled={withoutDeadline}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50 ${
                    errors.deadline ? "border-red-500" : "border-gray-200"
                  }`} 
                />
                {errors.deadline && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.deadline.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client</label>
                <select 
                  {...register("client_id")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">--</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status <span className="text-red-500">*</span></label>
                <select 
                  {...register("status")}
                  className={`w-full border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer ${
                    errors.status ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="not started">Not Started</option>
                  <option value="in progress">In Progress</option>
                  <option value="on hold">On Hold</option>
                  <option value="canceled">Canceled</option>
                  <option value="finished">Finished</option>
                </select>
                {errors.status && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.status.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project Summary</label>
              <textarea 
                {...register("project_summary")}
                className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all" 
                placeholder="Enter project details..."
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/projects">
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
                {saving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
