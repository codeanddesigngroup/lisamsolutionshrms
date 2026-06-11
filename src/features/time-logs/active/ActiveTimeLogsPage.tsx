"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { ArrowLeft, Clock, Pause, Play, Timer, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type ActiveTimer = {
  id: number | string;
  employee: string;
  project: string;
  task: string;
  started_at: string;
  duration: string;
  memo: string;
  status: string;
};

const starterTimers: ActiveTimer[] = [
  { id: 1, employee: "John Doe", project: "Website Redesign", task: "Homepage QA", started_at: "2026-05-08 09:10", duration: "2 hrs 25 mins", memo: "Final review", status: "running" },
  { id: 2, employee: "Jane Smith", project: "Mobile App", task: "API testing", started_at: "2026-05-08 10:00", duration: "1 hr 35 mins", memo: "Regression pass", status: "running" },
];

export default function ActiveTimersPage() {
  const { user } = useAuth();
  const [timers, setTimers] = useState(starterTimers);
  const visibleTimers = useMemo(
    () => (user?.role === "employee" ? timers.filter((timer) => timer.employee.toLowerCase() === user.name.toLowerCase()) : timers),
    [timers, user],
  );

  const stopTimer = (timerId: number | string) => {
    setTimers((current) => current.map((timer) => timer.id === timerId ? { ...timer, status: "stopped" } : timer));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Active Timers</h1>
            <p className="mt-1 text-xs font-bold text-gray-400">Live timers across projects and employees</p>
          </div>
          <Link href="/time-logs">
            <Button className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Time Logs
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-none bg-white p-6 shadow-sm">
            <Timer className="mb-3 h-5 w-5 text-primary" />
            <p className="text-2xl font-black text-gray-800">{visibleTimers.filter((timer) => timer.status === "running").length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Running</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <Clock className="mb-3 h-5 w-5 text-blue-500" />
            <p className="text-2xl font-black text-gray-800">4 hrs</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logged Today</p>
          </Card>
          <Card className="border-none bg-white p-6 shadow-sm">
            <User className="mb-3 h-5 w-5 text-green-500" />
            <p className="text-2xl font-black text-gray-800">{new Set(visibleTimers.map((timer) => timer.employee)).size}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{user?.role === "employee" ? "My Timers" : "Employees"}</p>
          </Card>
        </div>

        <AdminDataTable
          title="Running Timer List"
          records={visibleTimers}
          getRecordKey={(record) => record.id}
          columns={[
            { header: "Employee", accessor: (record) => record.employee },
            { header: "Project", accessor: (record) => record.project },
            { header: "Task", accessor: (record) => record.task },
            { header: "Started", accessor: (record) => record.started_at },
            { header: "Duration", accessor: (record) => record.duration },
            {
              header: "Action",
              accessor: (record) => (
                <button
                  onClick={() => stopTimer(record.id)}
                  className={`inline-flex items-center rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest ${record.status === "running" ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  {record.status === "running" ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {record.status === "running" ? "Stop" : "Stopped"}
                </button>
              ),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
