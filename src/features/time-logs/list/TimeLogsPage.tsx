"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Plus, RefreshCw, Edit, Trash2, Eye, Calendar, User, Clock, Timer, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { filterEmployeeScopedRecords } from "@/lib/employee-scope";

type RawTimeLog = {
  id: number | string;
  employee?: { id?: number | string; name?: string };
  user?: { id?: number | string; name?: string };
  employee_id?: number | string;
  user_id?: number | string;
  project?: { project_name?: string; name?: string };
  project_name?: string;
  task?: { heading?: string; title?: string };
  task_name?: string;
  start_time?: string;
  end_time?: string;
  total_minutes?: number | string;
  total_hours?: number | string;
  status?: string;
  memo?: string;
};

type TimeLogRow = {
  id: number | string;
  employeeId?: number | string;
  employee: string;
  project: string;
  task: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  status: string;
};

const fallbackTimeLogs: TimeLogRow[] = [
  { id: 1, employeeId: 1, employee: "John Doe", project: "Website Redesign", task: "Design Homepage", startTime: "2026-05-01 09:00 AM", endTime: "2026-05-01 01:00 PM", totalHours: "4 Hrs", status: "Approved" },
  { id: 2, employeeId: 2, employee: "Jane Smith", project: "Mobile App", task: "Bug Fixing", startTime: "2026-05-01 10:00 AM", endTime: "2026-05-01 03:00 PM", totalHours: "5 Hrs", status: "Pending" },
  { id: 3, employeeId: 3, employee: "Mike Tyson", project: "API Integration", task: "Unit Testing", startTime: "2026-05-02 09:00 AM", endTime: "2026-05-02 06:00 PM", totalHours: "9 Hrs", status: "Approved" },
];

const extractRecords = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatDuration = (minutes?: number | string, hours?: number | string) => {
  const totalMinutes = Number(minutes || 0) || Math.round((Number(hours || 0) || 0) * 60);
  if (!totalMinutes) return "0 Hrs";
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes ? `${wholeHours} Hrs ${remainingMinutes} Min` : `${wholeHours} Hrs`;
};

const normalizeLog = (log: RawTimeLog): TimeLogRow => ({
  id: log.id,
  employeeId: log.employee_id || log.user_id || log.employee?.id || log.user?.id,
  employee: log.employee?.name || log.user?.name || (log.employee_id ? `Employee #${log.employee_id}` : "Employee"),
  project: log.project?.project_name || log.project?.name || log.project_name || "Internal",
  task: log.task?.heading || log.task?.title || log.task_name || log.memo || "Time log",
  startTime: formatDateTime(log.start_time),
  endTime: formatDateTime(log.end_time),
  totalHours: formatDuration(log.total_minutes, log.total_hours),
  status: log.status || "Approved",
});

export default function TimeLogsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<TimeLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [viewingLog, setViewingLog] = useState<TimeLogRow | null>(null);
  const [deletingLog, setDeletingLog] = useState<TimeLogRow | null>(null);
  const isEmployee = user?.role === "employee";
  const canManageTimeLogs = user?.role === "admin" || user?.role === "super_admin";

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ include: "project,task" });
      if (isEmployee && user.id) params.set("user_id", String(user.id));
      const response = await api.get(`/time-log?${params.toString()}`);
      const records = extractRecords<RawTimeLog>(response.data);
      const visibleRecords = filterEmployeeScopedRecords(records, user);
      setLogs(visibleRecords.map(normalizeLog));
    } catch (error) {
      console.error("Fetch Time Logs Error:", error);
      setLogs(isEmployee ? fallbackTimeLogs.filter((log) => String(log.employeeId) === String(user.id)) : fallbackTimeLogs);
      showToast("Failed to load time logs. Showing local records.", "error");
    } finally {
      setLoading(false);
    }
  }, [isEmployee, showToast, user]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const visibleLogs = useMemo(
    () => (isEmployee ? logs.filter((log) => String(log.employeeId || "") === String(user?.id || "") || log.employee.toLowerCase() === user?.name?.toLowerCase()) : logs),
    [isEmployee, logs, user?.id, user?.name],
  );
  const projectOptions = Array.from(new Set(visibleLogs.map((log) => log.project)));
  const taskOptions = Array.from(new Set(visibleLogs.map((log) => log.task)));
  const employeeOptions = Array.from(new Set(visibleLogs.map((log) => log.employee)));
  const filteredLogs = visibleLogs.filter((log) => {
    const logDate = log.startTime.slice(0, 10);
    const startMatch = !dateFrom || logDate >= dateFrom;
    const endMatch = !dateTo || logDate <= dateTo;
    const projectMatch = projectFilter === "all" || log.project === projectFilter;
    const taskMatch = taskFilter === "all" || log.task === taskFilter;
    const employeeMatch = employeeFilter === "all" || log.employee === employeeFilter;
    return startMatch && endMatch && projectMatch && taskMatch && employeeMatch;
  });

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setProjectFilter("all");
    setTaskFilter("all");
    setEmployeeFilter("all");
  };

  const deleteLog = () => {
    if (!deletingLog) return;
    setLogs((current) => current.filter((log) => log.id !== deletingLog.id));
    setDeletingLog(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700">{isEmployee ? "My Time Logs" : "Time Logs"}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {canManageTimeLogs && (
              <Link href="/time-logs/active" className="flex items-center space-x-1 rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors">
                <Timer className="h-3.5 w-3.5" /><span>Active Timers</span>
                <span className="ml-1 bg-white/20 px-1.5 rounded text-[10px]">3</span>
              </Link>
            )}
            <Link href="/time-logs/calendar" className="flex items-center space-x-1 rounded bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black transition-colors">
              <Calendar className="h-3.5 w-3.5" /><span>Calendar View</span>
            </Link>
            {canManageTimeLogs && (
              <>
                <Link href="/invoices/create?type=timelog" className="flex items-center space-x-1 rounded border border-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-800 hover:text-white transition-colors">
                  <Plus className="h-3.5 w-3.5" /><span>Create Invoice</span>
                </Link>
                <Link href="/time-logs/by-employee" className="flex items-center space-x-1 rounded border border-blue-500 px-3 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-500 hover:text-white transition-colors">
                  <User className="h-3.5 w-3.5" /><span>By Employee</span>
                </Link>
              </>
            )}
            <Link href="/time-logs/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-500 hover:text-white transition-colors">
              <Clock className="h-3.5 w-3.5" /><span>Log Time</span>
            </Link>
            <button onClick={fetchLogs} className="rounded border border-gray-200 p-2 text-gray-400 hover:text-primary" title="Refresh">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <ol className="flex text-sm text-gray-500 space-x-1">
              <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
              <li>/</li>
              <li className="text-gray-700">Time Logs</li>
            </ol>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Project</label>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Task</label>
              <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {taskOptions.map((task) => <option key={task} value={task}>{task}</option>)}
              </select>
            </div>
            {!isEmployee && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Employee Name</label>
              <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                <option value="all">All</option>
                {employeeOptions.map((employee) => <option key={employee} value={employee}>{employee}</option>)}
              </select>
            </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-end space-x-2">
            <button onClick={resetFilters} className="flex items-center space-x-1 rounded bg-gray-600 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700">
              <RefreshCw className="h-3.5 w-3.5" /><span>Reset</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Task</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Start Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">End Time</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total Hours</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{log.id}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-800">{log.employee}</td>
                    <td className="px-4 py-3 text-xs text-primary font-medium">{log.project}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{log.task}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.startTime}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.endTime}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-700">{log.totalHours}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        log.status === "Approved" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button onClick={() => setViewingLog(log)} className="text-primary hover:text-blue-600" title="View"><Eye className="h-4 w-4" /></button>
                        {canManageTimeLogs && (
                          <>
                            <Link href={`/time-logs/create?edit=${log.id}`} className="text-blue-400 hover:text-blue-600" title="Edit"><Edit className="h-4 w-4" /></Link>
                            <button onClick={() => setDeletingLog(log)} className="text-red-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No time logs found for selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal isOpen={Boolean(viewingLog)} onClose={() => setViewingLog(null)} title="Time Log Details" size="lg">
        {viewingLog && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(viewingLog).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-1 text-sm font-bold text-gray-800">{String(value)}</p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(deletingLog)} onClose={() => setDeletingLog(null)} title="Delete Time Log" size="sm">
        <div className="py-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-6 text-xs font-bold text-gray-500">This will remove the selected local time log from the list.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingLog(null)} className="flex-1 bg-gray-100 text-gray-500">Cancel</Button>
            <Button onClick={deleteLog} className="flex-1 bg-red-500 text-white">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
