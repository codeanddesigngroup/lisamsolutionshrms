"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type Option = { id: number; name: string };
type ProjectForm = {
  project_name: string;
  client_id: string;
  department_id: string;
  start_date: string;
  deadline: string;
  without_deadline: boolean;
  project_summary: string;
  status: "not started" | "in progress" | "on hold" | "canceled" | "finished";
};

const emptyForm: ProjectForm = {
  project_name: "", client_id: "", department_id: "", start_date: "", deadline: "",
  without_deadline: false, project_summary: "", status: "not started",
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [clients, setClients] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projectResponse, clientResponse, departmentResponse] = await Promise.all([
          api.get(`/project/${params.id}`),
          api.get("/client?per_page=100"),
          api.get("/departments"),
        ]);
        const project = projectResponse.data.data;
        setClients(clientResponse.data.data || []);
        setDepartments(departmentResponse.data.data || []);
        setForm({
          project_name: project.project_name || "",
          client_id: project.client_id ? String(project.client_id) : "",
          department_id: project.department_id ? String(project.department_id) : "",
          start_date: project.start_date || "",
          deadline: project.deadline || "",
          without_deadline: Boolean(project.without_deadline),
          project_summary: project.project_summary || "",
          status: project.status || "not started",
        });
      } catch (err) {
        console.error("Load Project Error:", err);
        showToast("Failed to load project.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, showToast]);

  const update = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`/project/${params.id}`, {
        ...form,
        client_id: form.client_id ? Number(form.client_id) : null,
        department_id: form.department_id ? Number(form.department_id) : null,
        deadline: form.without_deadline ? null : form.deadline,
      });
      showToast("Project updated successfully!");
      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error("Update Project Error:", err);
      showToast("Failed to update project.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex min-h-[400px] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="-mx-6 -mt-6 flex items-center justify-between border border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="rounded-xl p-2 text-gray-400 hover:bg-gray-50"><ArrowLeft className="h-5 w-5" /></Link>
            <div><h1 className="text-base font-black uppercase tracking-widest text-gray-800">Edit Project</h1><p className="mt-0.5 text-[10px] font-bold text-gray-400">Update {form.project_name}</p></div>
          </div>
          <Button type="submit" disabled={saving} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white">
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Updating..." : "Update Project"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="General Details" className="border-none bg-white p-8 shadow-sm lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Name</span><input required value={form.project_name} onChange={(e) => update("project_name", e.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold outline-none focus:ring-1 focus:ring-primary" /></label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Client</span><select value={form.client_id} onChange={(e) => update("client_id", e.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold"><option value="">No client</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Department</span><select value={form.department_id} onChange={(e) => update("department_id", e.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold"><option value="">No department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</span><input required type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold" /></label>
              <label className="space-y-1.5"><span className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline <span><input type="checkbox" checked={form.without_deadline} onChange={(e) => update("without_deadline", e.target.checked)} /> No deadline</span></span><input required={!form.without_deadline} disabled={form.without_deadline} type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold disabled:opacity-50" /></label>
              <label className="space-y-1.5 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Summary</span><textarea value={form.project_summary} onChange={(e) => update("project_summary", e.target.value)} className="h-32 w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold" /></label>
            </div>
          </Card>
          <Card title="Project Status" className="h-fit border-none bg-white p-8 shadow-sm">
            <select value={form.status} onChange={(e) => update("status", e.target.value as ProjectForm["status"])} className="w-full rounded-xl border-none bg-gray-50 p-3 text-xs font-bold uppercase">
              <option value="not started">Not Started</option><option value="in progress">In Progress</option><option value="on hold">On Hold</option><option value="canceled">Canceled</option><option value="finished">Finished</option>
            </select>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  );
}
