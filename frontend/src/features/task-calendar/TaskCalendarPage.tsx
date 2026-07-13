"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { filterTasksForUser } from "@/lib/task-visibility";
import type { Task } from "@/types";

const priorityColors: Record<string, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  medium: "#2563eb",
  low: "#64748b",
};

const dateKey = (value?: string) => (value ? String(value).slice(0, 10) : "");

export default function TaskCalendarPage() {
  const { user, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
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
      console.error("Fetch Task Calendar Error:", error);
      showToast("Failed to load task calendar.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildTaskUrl, showToast, user]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const days = useMemo(() => {
    const values: Array<number | null> = [];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let index = 0; index < firstDay; index += 1) values.push(null);
    for (let day = 1; day <= totalDays; day += 1) values.push(day);
    return values;
  }, [month, year]);

  const tasksByDate = useMemo(() => {
    return filterTasksForUser(tasks, user).reduce<Record<string, Task[]>>((acc, task) => {
      const key = dateKey(task.due_date);
      if (!key) return acc;
      acc[key] = [...(acc[key] || []), task];
      return acc;
    }, {});
  }, [tasks, user]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-700">{user?.role === "employee" ? "My Task Calendar" : "Task Calendar"}</h1>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Link href="/dashboard" className="hover:text-primary">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Task Calendar</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchTasks} className="p-2 text-gray-400 transition-colors hover:text-primary" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            {canCreateTasks && (
              <Link href="/tasks/create">
                <Button className="flex h-9 items-center space-x-2 border-none bg-primary text-xs text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  <span>Add Task</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <div>
              <h3 className="text-sm font-bold text-gray-700">{monthName} {year}</h3>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {loading ? "Loading tasks" : `${filterTasksForUser(tasks, user).length} visible task(s)`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={prevMonth} className="rounded-full border border-gray-200 bg-white/50 p-2 text-gray-400 shadow-sm transition-all hover:bg-white hover:text-primary">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="rounded border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 shadow-sm transition-all hover:text-primary">
                Today
              </button>
              <button onClick={nextMonth} className="rounded-full border border-gray-200 bg-white/50 p-2 text-gray-400 shadow-sm transition-all hover:bg-white hover:text-primary">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const currentKey = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayTasks = currentKey ? tasksByDate[currentKey] || [] : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div key={`${currentKey || "blank"}-${index}`} className={`min-h-[120px] border-b border-r border-gray-50 p-2 transition-colors hover:bg-gray-50/50 ${!day ? "bg-gray-50/30" : ""}`}>
                  {day && (
                    <>
                      <span className={`flex h-6 w-6 items-center justify-center text-xs font-bold ${isToday ? "rounded-full bg-primary text-white shadow-sm" : "text-gray-400"}`}>
                        {day}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayTasks.map((task) => {
                          const color = priorityColors[String(task.priority || "medium").toLowerCase()] || priorityColors.medium;
                          return (
                            <Link
                              key={task.id}
                              href={`/tasks/${task.id}`}
                              className="block truncate rounded border-l-2 px-2 py-1 text-[9px] font-bold shadow-sm transition-all hover:brightness-95"
                              style={{ backgroundColor: `${color}15`, color, borderLeftColor: color }}
                              title={task.heading}
                            >
                              {task.heading}
                            </Link>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
