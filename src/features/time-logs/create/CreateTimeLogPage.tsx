"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, Clock, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { filterTasksForUser } from "@/lib/task-visibility";

export default function CreateTimeLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_id: "",
    task_id: "",
    memo: "",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const taskUrl = user?.role === "employee" && user.id ? `/task?include=project,users&user_id=${encodeURIComponent(String(user.id))}` : "/task?include=project,users";
        const [projRes, taskRes] = await Promise.all([
          api.get("/project"),
          api.get(taskUrl),
        ]);
        const visibleTasks = filterTasksForUser(taskRes.data.data || [], user);
        const visibleProjects = user?.role === "employee"
          ? Array.from(
              visibleTasks.reduce((projectMap: Map<string, any>, task: any) => {
                const projectId = task.project?.id || task.project_id;
                if (projectId && task.project) projectMap.set(String(projectId), task.project);
                return projectMap;
              }, new Map<string, any>()).values(),
            )
          : projRes.data.data || [];
        setProjects(visibleProjects);
        setTasks(visibleTasks);
      } catch {
        setProjects([{ id: 1, project_name: "Website Redesign" }]);
        setTasks([{ id: 1, heading: "Design Homepage" }]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        task: { id: formData.task_id },
        task_id: formData.task_id,
        memo: formData.memo,
        start_time: new Date().toISOString(),
        status: "running",
        user_id: user?.id,
        employee_id: user?.id,
      };
      if (formData.project_id) {
        payload.project = { id: formData.project_id };
        payload.project_id = formData.project_id;
      }

      await api.post("/time-log", payload);
      router.push("/time-logs");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to start time log.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Log Time</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span>/</span>
              <Link href="/time-logs" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Time Logs</Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Log Time</span>
            </div>
          </div>
          <Link href="/time-logs">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" /><span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-2xl mx-auto shadow-sm border-gray-100 relative">
          {loadingOptions && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500">{error}</div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Project</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <select name="project_id" value={formData.project_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">Select Project (Optional)</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Task <span className="text-red-500">*</span></label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <select name="task_id" value={formData.task_id} onChange={handleChange}
                  className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none appearance-none cursor-pointer" required>
                  <option value="">Select Task</option>
                  {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.heading}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Memo / Notes <span className="text-red-500">*</span></label>
              <textarea name="memo" value={formData.memo} onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-28"
                placeholder="What are you working on?" required />
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/time-logs">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving || loadingOptions}
                className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-2" />}
                {saving ? "Starting..." : "Start Timer"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
