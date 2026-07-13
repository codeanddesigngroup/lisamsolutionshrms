"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, Paperclip, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { filterTasksForUser } from "@/lib/task-visibility";
import type { Task } from "@/types";

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-100 border-gray-200", statuses: ["incomplete", "to do", "todo", "pending"] },
  { id: "inprogress", title: "In Progress", color: "bg-blue-50 border-blue-100", statuses: ["doing", "in progress", "progress"] },
  { id: "review", title: "Review", color: "bg-yellow-50 border-yellow-100", statuses: ["review", "under review"] },
  { id: "done", title: "Done", color: "bg-green-50 border-green-100", statuses: ["completed", "complete", "done"] },
];

const priorityClass = (priority?: string) => {
  switch ((priority || "").toLowerCase()) {
    case "urgent":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-600";
    case "medium":
      return "bg-blue-100 text-blue-600";
    case "low":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-500";
  }
};

const getInitials = (name?: string) =>
  (name || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getCollectionCount = (value: unknown) => (Array.isArray(value) ? value.length : 0);

export default function TaskBoardPage() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canCreateTasks = Boolean(isAdmin && (hasPermission("tasks.create") || hasPermission("tasks.manage")));

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
    } catch (error) {
      console.error("Fetch Task Board Error:", error);
      showToast("Failed to load task board.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildTaskUrl, showToast, user]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const boardColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: filterTasksForUser(tasks, user).filter((task) => {
          const status = String(task.status || "").toLowerCase();
          return column.statuses.includes(status) || (column.id === "todo" && !status);
        }),
      })),
    [tasks, user],
  );

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-100px)] flex-col space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-700">{user?.role === "employee" ? "My Task Board" : "Task Board"}</h1>
            <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
              <Link href="/dashboard" className="font-bold transition-colors hover:text-primary">Home</Link>
              <span className="font-bold">/</span>
              <span className="font-bold text-gray-700">Task Board</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchTasks} className="p-2 text-gray-400 transition-colors hover:text-primary" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {canCreateTasks && (
              <Link href="/tasks/create">
                <Button className="h-9 bg-primary px-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-primary/20">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Add New Task
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-1 space-x-6 overflow-x-auto pb-6 scrollbar-thin">
          {boardColumns.map((column) => (
            <div key={column.id} className="flex w-80 flex-shrink-0 flex-col">
              <div className={`flex items-center justify-between rounded-t-lg border-b-2 p-4 ${column.color}`}>
                <h3 className="flex items-center text-xs font-black uppercase tracking-widest text-gray-700">
                  <span className="mr-2 h-2 w-2 rounded-full bg-gray-400" />
                  {column.title}
                </h3>
                <span className="rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-bold text-gray-500">{column.tasks.length}</span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto rounded-b-lg border border-t-0 border-gray-100 bg-gray-50/50 p-3">
                {loading && column.tasks.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-400">Loading...</div>
                ) : column.tasks.length > 0 ? (
                  column.tasks.map((task) => {
                    const commentsCount = getCollectionCount(task.comments);
                    const filesCount = getCollectionCount(task.files);
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                        <Card className="cursor-pointer border-none p-4 shadow-sm transition-shadow hover:shadow-md">
                          <div className="mb-2 flex items-start justify-between">
                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${priorityClass(task.priority)}`}>
                              {task.priority || "Medium"}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                <Calendar className="mr-1 h-3 w-3" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <h4 className="mb-2 text-sm font-bold text-gray-800">{task.heading}</h4>
                          <p className="mb-4 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{task.description || task.project?.project_name || "No description provided."}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {task.users?.length ? (
                                task.users.map((assignee) => (
                                  <div key={assignee.id} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-[8px] font-bold text-primary" title={assignee.name}>
                                    {getInitials(assignee.name)}
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-full bg-gray-100 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-gray-400">Unassigned</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-[10px] font-bold text-gray-400">
                              {commentsCount > 0 && <span className="flex items-center"><MessageSquare className="mr-1 h-3 w-3" /> {commentsCount}</span>}
                              {filesCount > 0 && <span className="flex items-center"><Paperclip className="mr-1 h-3 w-3" /> {filesCount}</span>}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    No tasks
                  </div>
                )}
                {canCreateTasks && (
                  <Link href="/tasks/create" className="block w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-all hover:border-primary hover:text-primary">
                    + Add Task
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
