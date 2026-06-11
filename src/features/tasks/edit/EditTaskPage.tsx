"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function EditTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const canManageTask = user?.role === "admin" || user?.role === "super_admin";

  const [task, setTask] = useState({
    title: "Design homepage mockup",
    project: "Website Redesign",
    priority: "High",
    dueDate: "2024-05-10",
    status: "incomplete",
    description: "Create a modern and clean homepage layout for the new website redesign project."
  });

  useEffect(() => {
    if (!user || canManageTask) return;
    showToast("Employees can view assigned tasks but cannot edit task setup.", "info");
    router.replace("/tasks");
  }, [canManageTask, router, showToast, user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/tasks');
  };

  if (user && !canManageTask) {
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
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between -mx-6 -mt-6 mb-6">
           <div className="flex items-center space-x-4">
              <Link href="/tasks" className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                 <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                 <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Edit Task</h1>
                 <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update task for {task.project}</p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <Button onClick={() => router.back()} className="bg-gray-50 text-gray-500 border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleSave} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                 <Save className="h-4 w-4 mr-2" /> Update Task
              </Button>
           </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Task Details" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Title</label>
                       <input type="text" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                       <textarea value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-32" />
                    </div>
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Settings" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                       <input type="date" value={task.dueDate} onChange={(e) => setTask({...task, dueDate: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</label>
                       <select value={task.priority} onChange={(e) => setTask({...task, priority: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                          <option>Urgent</option>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                       <select value={task.status} onChange={(e) => setTask({...task, status: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                          <option value="incomplete">Incomplete</option>
                          <option value="completed">Completed</option>
                       </select>
                    </div>
                 </div>
              </Card>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
