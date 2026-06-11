"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { filterEmployeeScopedRecords } from "@/lib/employee-scope";

type TimeLogRecord = {
  id: number | string;
  user_id?: number | string;
  employee_id?: number | string;
  employee?: { id?: number | string; name?: string };
  user?: { id?: number | string; name?: string };
  project?: { project_name?: string; name?: string };
  project_name?: string;
  start_time?: string;
  total_minutes?: number | string;
  total_hours?: number | string;
};

const extractRecords = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const getHours = (entry: TimeLogRecord) => {
  const minutes = Number(entry.total_minutes || 0) || Math.round((Number(entry.total_hours || 0) || 0) * 60);
  return minutes ? `${Math.round((minutes / 60) * 10) / 10}h` : "0h";
};

export default function TimeLogCalendarPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [entries, setEntries] = useState<TimeLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const shiftMonth = (amount: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ include: "project,task" });
      if (user.role === "employee" && user.id) params.set("user_id", String(user.id));
      const response = await api.get(`/time-log?${params.toString()}`);
      setEntries(filterEmployeeScopedRecords(extractRecords<TimeLogRecord>(response.data), user));
    } catch (error) {
      console.error("Fetch Time Log Calendar Error:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const visibleEntries = useMemo(() => filterEmployeeScopedRecords(entries, user), [entries, user]);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => (index < firstDay ? null : index - firstDay + 1));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Time Log Calendar</h1>
            <p className="mt-1 text-xs font-bold text-gray-400">Monthly time distribution</p>
          </div>
          <Link href="/time-logs">
            <Button className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-50 p-6">
            <button onClick={() => shiftMonth(-1)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-primary">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">
                {month.toLocaleString("default", { month: "long", year: "numeric" })}
              </h2>
              {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
            </div>
            <button onClick={() => shiftMonth(1)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-primary">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              const dateKey = day ? `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayEntries = day ? visibleEntries.filter((entry) => String(entry.start_time || "").slice(0, 10) === dateKey) : [];
              return (
                <div key={`${dateKey || "blank"}-${index}`} className={`min-h-28 border-b border-r border-gray-50 p-2 ${!day ? "bg-gray-50/50" : "bg-white"}`}>
                  {day && <span className="text-xs font-black text-gray-400">{day}</span>}
                  <div className="mt-2 space-y-1">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="rounded-lg border-l-2 border-primary bg-primary/5 px-2 py-1">
                        <p className="truncate text-[10px] font-black text-gray-700">{entry.employee?.name || entry.user?.name || "My Log"}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{getHours(entry)} / {entry.project?.project_name || entry.project?.name || entry.project_name || "Internal"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
