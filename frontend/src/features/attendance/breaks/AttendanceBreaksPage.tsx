"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { Coffee, RefreshCw, Timer, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type BreakRecord = {
  id: number | string;
  companyId?: number | string;
  company_id?: number | string;
  employeeId?: number | string;
  employee_id?: number | string;
  employeeRecordId?: number | string | null;
  employee_record_id?: number | string | null;
  employeeName?: string | null;
  employee_name?: string | null;
  workDate?: string;
  work_date?: string;
  breakStart?: string | null;
  break_start?: string | null;
  breakEnd?: string | null;
  break_end?: string | null;
  durationMinutes?: number | string | null;
  duration_minutes?: number | string | null;
  departmentName?: string | null;
  department_name?: string | null;
  is_open?: boolean;
};

type DepartmentRecord = {
  id: number | string;
  name?: string;
};

const toLocalDateString = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMinutes = (value?: number | string | null) => {
  const minutes = Number(value || 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return "--";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr${hours === 1 ? "" : "s"} ${remainingMinutes} min`;
};

const getEmployeeName = (record: BreakRecord) => record.employeeName || record.employee_name || "Employee";
const getEmployeeId = (record: BreakRecord) => String(record.employeeId || record.employee_id || "--");
const getWorkDate = (record: BreakRecord) => String(record.workDate || record.work_date || "--");
const getBreakStart = (record: BreakRecord) => record.breakStart || record.break_start || null;
const getBreakEnd = (record: BreakRecord) => record.breakEnd || record.break_end || null;
const getDurationMinutes = (record: BreakRecord) => record.durationMinutes ?? record.duration_minutes;
const getDepartmentName = (record: BreakRecord) => record.departmentName || record.department_name || "--";
const isOpenBreak = (record: BreakRecord) => Boolean(record.is_open || !getBreakEnd(record));

export default function AttendanceBreaksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [breaks, setBreaks] = useState<BreakRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(toLocalDateString());
  const [endDate, setEndDate] = useState(toLocalDateString());
  const [status, setStatus] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const fetchBreaks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/attendance/breaks", {
        params: {
          company_id: user?.role === "super_admin" ? undefined : user?.company_id,
          startDate,
          endDate,
          status: status || undefined,
          employeeName: employeeName.trim() || undefined,
          departmentId: departmentId || undefined,
          limit: 1000,
        },
      });
      setBreaks(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Fetch Attendance Breaks Error:", error);
      showToast("Failed to load attendance breaks", "error");
    } finally {
      setLoading(false);
    }
  }, [departmentId, employeeName, endDate, showToast, startDate, status, user]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments", {
        params: {
          company_id: user?.role === "super_admin" ? undefined : user?.company_id,
        },
      });
      setDepartments(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Fetch Departments Error:", error);
      showToast("Failed to load departments", "error");
    }
  }, [showToast, user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBreaks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBreaks]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDepartments();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDepartments]);

  const stats = useMemo(() => {
    const open = breaks.filter(isOpenBreak).length;
    const completed = breaks.length - open;
    const employees = new Set(breaks.map(getEmployeeId)).size;
    const totalMinutes = breaks.reduce((total, record) => total + Number(getDurationMinutes(record) || 0), 0);
    return { total: breaks.length, open, completed, employees, totalMinutes };
  }, [breaks]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="white-box flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 text-primary">
              <Coffee className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Employee Breaks</h4>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Break start, end, duration, and active break status
              </p>
            </div>
          </div>

          <Button className="btn-default" disabled={loading} onClick={fetchBreaks}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Breaks</p>
            <h4 className="m-0 mt-2 text-2xl font-black">{stats.total}</h4>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">On Break</p>
            <h4 className="m-0 mt-2 text-2xl font-black text-warning">{stats.open}</h4>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed</p>
            <h4 className="m-0 mt-2 text-2xl font-black text-success">{stats.completed}</h4>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employees</p>
                <h4 className="m-0 mt-2 text-2xl font-black">{stats.employees}</h4>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </Card>
        </div>

        <div className="white-box">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Start Date</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="form-control" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">End Date</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="form-control" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Employee Name</span>
              <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} className="form-control" placeholder="All employees" />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Department</span>
              <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="form-control">
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={String(department.id)} value={String(department.id)}>
                    {department.name || `Department ${department.id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-control">
                <option value="">All</option>
                <option value="open">On Break</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button className="w-full" disabled={loading} onClick={fetchBreaks}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Apply
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h5 className="m-0 text-[11px] font-black uppercase tracking-widest text-gray-600">Break List</h5>
          </div>
          <div className="table-responsive">
            <table className="min-w-[1000px]">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Work Date</th>
                  <th>Break Start</th>
                  <th>Break End</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading breaks</p>
                    </td>
                  </tr>
                )}

                {!loading && breaks.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <p className="m-0 text-xs font-black text-gray-800">{getEmployeeName(record)}</p>
                      <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">ID {getEmployeeId(record)}</p>
                    </td>
                    <td className="text-xs font-bold text-gray-600">{getDepartmentName(record)}</td>
                    <td className="text-xs font-black text-gray-700">{getWorkDate(record)}</td>
                    <td className="text-xs font-bold text-gray-700">{formatDateTime(getBreakStart(record))}</td>
                    <td className="text-xs font-bold text-gray-700">{formatDateTime(getBreakEnd(record))}</td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                        {formatMinutes(getDurationMinutes(record))}
                      </div>
                    </td>
                    <td>
                      <span className={`label ${isOpenBreak(record) ? "label-warning" : "label-success"}`}>
                        {isOpenBreak(record) ? "On Break" : "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && breaks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No employee breaks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
