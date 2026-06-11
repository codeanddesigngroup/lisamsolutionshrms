"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Edit, Trash2, Eye, CheckCircle2, Circle, AlertTriangle, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { filterTasksForUser, isTaskAssignedToUser } from "@/lib/task-visibility";
import type { Task } from "@/types";

const priorityColors: Record<string, string> = {
  "urgent": "bg-red-100 text-red-600",
  "high": "bg-orange-100 text-orange-500",
  "medium": "bg-yellow-100 text-yellow-600",
  "low": "bg-blue-100 text-blue-500",
};

const memberColors = ["bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-red-400", "bg-pink-400", "bg-indigo-400"];

export default function TasksPage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | string | null>(null);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canManageTasks = Boolean(isAdmin && (hasPermission("tasks.edit") || hasPermission("tasks.delete") || hasPermission("tasks.manage")));
  const canCreateTasks = Boolean(isAdmin && (hasPermission("tasks.create") || hasPermission("tasks.manage")));
  const canUpdateOwnTaskStatus = Boolean(user?.role === "employee" && hasPermission("tasks.edit"));

  const buildTaskUrl = useCallback(
    (scoped: boolean) => {
      const params = new URLSearchParams({ include: "project,users" });
      if (scoped && user?.role === "employee" && user.id) {
        params.set("user_id", String(user.id));
      }
      return `/task?${params.toString()}`;
    },
    [user],
  );

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(buildTaskUrl(true));
      const records = Array.isArray(response.data.data) ? (response.data.data as Task[]) : [];
      let visibleTasks = filterTasksForUser(records, user);

      if (user.role === "employee" && visibleTasks.length === 0 && records.length === 0) {
        const fallbackResponse = await api.get(buildTaskUrl(false));
        const fallbackRecords = Array.isArray(fallbackResponse.data.data) ? (fallbackResponse.data.data as Task[]) : [];
        visibleTasks = filterTasksForUser(fallbackRecords, user);
      }

      setTasks(visibleTasks);
    } catch (err) {
      console.error("Fetch Tasks Error:", err);
      showToast("Failed to fetch tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [buildTaskUrl, showToast, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = filterTasksForUser(tasks, user).filter(t => {
    const query = searchTerm.trim().toLowerCase();
    const searchText = [
      t.heading,
      t.description,
      t.status,
      t.priority,
      t.project?.project_name,
      ...(t.users || []).map((user) => user.name),
    ].filter(Boolean).join(" ").toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    const statusMatch = statusFilter === "All" || t.status.toLowerCase() === statusFilter.toLowerCase();
    const priorityMatch = priorityFilter === "All" || t.priority.toLowerCase() === priorityFilter.toLowerCase();
    return searchMatch && statusMatch && priorityMatch;
  });

  const handleToggleStatus = async (task: Task) => {
    const canUpdateTask = canManageTasks || (canUpdateOwnTaskStatus && isTaskAssignedToUser(task, user));

    if (!canUpdateTask) {
      showToast("You can view tasks but cannot update their status.", "info");
      return;
    }

    const id = task.id;
    const currentStatus = task.status;
    const newStatus = currentStatus === "completed" ? "incomplete" : "completed";
    try {
      await api.patch(`/task/${id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      showToast("Task status updated", "success");
    } catch (err) {
      console.error("Update Task Status Error:", err);
      showToast("Failed to update task status", "error");
    }
  };

  const handleDelete = async () => {
    if (!canManageTasks) {
      showToast("You can view tasks but cannot delete them.", "info");
      setDeletingTaskId(null);
      return;
    }

    if (deletingTaskId) {
      try {
        await api.delete(`/task/${deletingTaskId}`);
        setTasks(prev => prev.filter(t => t.id !== deletingTaskId));
        setDeletingTaskId(null);
        showToast("Task deleted successfully", "success");
      } catch (err) {
        console.error("Delete Task Error:", err);
        showToast("Failed to delete task", "error");
      }
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">{user?.role === "employee" ? "My Tasks" : "All Tasks"}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchTasks}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/taskboard" className="rounded border border-blue-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">Task Board</Link>
            <Link href="/task-calendar" className="rounded border border-gray-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-500 hover:text-white transition-colors">Task Calendar</Link>
            {canCreateTasks && (
              <Link href="/tasks/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                <span>Add Task</span><Plus className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-xs font-bold outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  placeholder="Search task, project, assignee"
                  type="search"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                <option value="incomplete">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority</label>
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center justify-end">
              <button 
                onClick={handleReset}
                className="flex items-center space-x-1 rounded-lg border border-gray-200 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /><span>Reset</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Tasks...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-8"></th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Title</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                  <tr key={task.id} className={`hover:bg-gray-50/50 transition-colors group ${task.status === "completed" ? "bg-gray-50/30" : ""}`}>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleStatus(task)} className="transition-transform active:scale-90">
                        {task.status === "completed"
                          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                          : <Circle className="h-5 w-5 text-gray-200 hover:text-primary transition-colors" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{task.id}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setViewingTask(task)}
                        className={`text-xs font-bold text-gray-700 hover:text-primary transition-colors text-left ${task.status === "completed" ? "line-through text-gray-400" : ""}`}
                      >
                        {task.heading}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-primary/70 uppercase tracking-tight">{task.project?.project_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {task.users?.map((u, i) => (
                          <div key={i} className={`h-7 w-7 rounded-full border-2 border-white ${memberColors[i % memberColors.length]} flex items-center justify-center text-white text-[9px] font-black`} title={u.name}>
                            {u.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${priorityColors[task.priority.toLowerCase()] || "bg-gray-100 text-gray-500"}`}>{task.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewingTask(task)} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                        {canManageTasks && (
                          <>
                            <Link href={`/tasks/${task.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                            <button onClick={() => setDeletingTaskId(task.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      {user?.role === "employee" ? "No assigned tasks found." : "No tasks found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <Modal 
        isOpen={!!viewingTask} 
        onClose={() => setViewingTask(null)} 
        title="Task Details"
        size="lg"
      >
        {viewingTask && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-gray-50 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-800 mb-1">{viewingTask.heading}</h2>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{viewingTask.project?.project_name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${priorityColors[viewingTask.priority.toLowerCase()]}`}>
                {viewingTask.priority} Priority
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</h4>
                    <p className={`text-xs font-bold uppercase ${viewingTask.status === "completed" ? "text-green-500" : "text-yellow-600"}`}>
                      {viewingTask.status}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Due Date</h4>
                    <p className="text-xs font-bold text-gray-700">{viewingTask.due_date ? new Date(viewingTask.due_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned To</h4>
                    <div className="flex -space-x-2 mt-2">
                        {viewingTask.users?.map((u, i) => (
                          <div key={i} className={`h-8 w-8 rounded-full border-2 border-white ${memberColors[i % memberColors.length]} flex items-center justify-center text-white text-[10px] font-black`} title={u.name}>
                            {u.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        ))}
                      </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex justify-end">
               <Button onClick={() => setViewingTask(null)} className="bg-gray-100 text-gray-600 border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest">Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This action cannot be undone. This task will be permanently removed from the system.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingTaskId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Yes, Delete</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
