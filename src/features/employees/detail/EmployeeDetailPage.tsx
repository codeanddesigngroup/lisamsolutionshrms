"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Edit,
  Eye,
  FilePlus,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  calculateAttendanceStatus,
  getAttendanceEmployeeId,
  getEmployeeDisplayId,
  getEmployeeId,
  getLeaveDate,
  getLeaveEmployeeId,
  leaveUnits,
  type HRRecord,
} from "@/lib/hr-utils";

const tabs = [
  { id: "activity", label: "Activity", icon: Activity },
  { id: "profile", label: "Profile", icon: User },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "leaves", label: "Leaves", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
];

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string) => {
  if (!value) return "Active";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

const getProjectName = (project: HRRecord) => project.project_name || project.name || "Untitled Project";
const getTaskTitle = (task: HRRecord) => task.heading || task.title || "Untitled Task";
const getLeaveTypeId = (leave: HRRecord) => String(leave.leave_type_id || leave.leave_type?.id || leave.type?.id || "");
const getLeaveTypeName = (leave: HRRecord) => leave.leave_type?.type_name || leave.type?.type_name || leave.type || "Leave";

const hasMember = (record: HRRecord, employee: HRRecord) => {
  const employeeId = String(employee.id);
  const employeeName = String(employee.name || "");
  const candidates = [...(record.members || []), ...(record.users || []), ...(record.assignees || [])];
  return candidates.some((candidate) => String(candidate.id || candidate.user_id || candidate.user?.id || "") === employeeId || candidate.name === employeeName || candidate.user?.name === employeeName);
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [employee, setEmployee] = useState<HRRecord | null>(null);
  const [projects, setProjects] = useState<HRRecord[]>([]);
  const [tasks, setTasks] = useState<HRRecord[]>([]);
  const [leaves, setLeaves] = useState<HRRecord[]>([]);
  const [documents, setDocuments] = useState<HRRecord[]>([]);
  const [activities, setActivities] = useState<HRRecord[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<HRRecord[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<HRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const safeGet = async (url: string) => {
        try {
          const response = await api.get(url);
          return (response.data.data || []) as HRRecord[];
        } catch {
          return [] as HRRecord[];
        }
      };

      const employeeResponse = await api.get(`/employee/${params.id}`);
      const employeeData = employeeResponse.data.data as HRRecord;
      const employeeId = String(employeeData.id || params.id);
      const employeeName = String(employeeData.name || "");
      const [
        allProjects,
        allTasks,
        allLeaves,
        allDocs,
        allActivities,
        allAttendance,
        allQuotas,
      ] = await Promise.all([
        safeGet("/projects"),
        safeGet("/tasks"),
        safeGet(`/leaves?employee_id=${encodeURIComponent(employeeId)}`),
        safeGet("/employee-docs"),
        safeGet("/user-activities"),
        safeGet("/attendance"),
        safeGet(`/leave-quotas?employee_id=${encodeURIComponent(employeeId)}`),
      ]);

      const belongsToEmployee = (record: HRRecord) =>
        getEmployeeId(record) === employeeId || record.user?.name === employeeName || record.employee?.name === employeeName;

      setEmployee(employeeData);
      setProjects((employeeData.projects || allProjects.filter((project) => hasMember(project, employeeData))) as HRRecord[]);
      setTasks((employeeData.tasks || allTasks.filter((task) => hasMember(task, employeeData) || belongsToEmployee(task))) as HRRecord[]);
      setLeaves((employeeData.leaves || allLeaves.filter((leave) => getLeaveEmployeeId(leave) === employeeId || leave.user?.name === employeeName || leave.employee?.name === employeeName)) as HRRecord[]);
      setDocuments(allDocs.filter((row) => belongsToEmployee(row)));
      setActivities(allActivities.filter((row) => belongsToEmployee(row)).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))));
      setAttendanceRows(allAttendance.filter((row) => getAttendanceEmployeeId(row) === employeeId || row.employee?.name === employeeName));
      setLeaveQuotas(allQuotas.filter((quota) => getLeaveEmployeeId(quota) === employeeId));
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error("Fetch Employee Error:", err);
      setError(apiError.response?.data?.message || "Failed to load employee details.");
      showToast("Error loading employee details.", "error");
    } finally {
      setLoading(false);
    }
  }, [params.id, showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchEmployee();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchEmployee]);

  const handleDeleteDocument = async (id: number | string) => {
    try {
      await api.delete(`/employee-docs/${id}`);
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      showToast("Document deleted successfully.", "success");
    } catch {
      setDocuments((current) => current.filter((doc) => doc.id !== id));
      showToast("Document removed locally until the PHP endpoint is ready.", "error");
    }
  };

  const derived = useMemo(() => {
    const completedTasks = tasks.filter((task) => ["completed", "done"].includes(String(task.status || "").toLowerCase()));
    const approvedLeaveUnits = leaves.filter((leave) => leave.status === "approved").reduce((total, leave) => total + leaveUnits(leave), 0);
    const quotaTotal = leaveQuotas.reduce((total, quota) => total + Number(quota.no_of_leaves || quota.leaves || 0), 0);
    const presentEntries = attendanceRows.filter((row) => ["present", "late", "half-day"].includes(calculateAttendanceStatus(row, row.shift_type)));
    const attendanceRate = attendanceRows.length > 0 ? Math.round((presentEntries.length / attendanceRows.length) * 100) : 0;

    return {
      completedTasks: completedTasks.length,
      approvedLeaveUnits,
      quotaTotal,
      remainingLeaves: Math.max(0, quotaTotal - approvedLeaveUnits),
      activeProjects: projects.filter((project) => !["finished", "completed", "archived"].includes(String(project.status || "").toLowerCase())).length,
      attendanceRate,
    };
  }, [attendanceRows, leaveQuotas, leaves, projects, tasks]);

  const leaveBalanceRows = useMemo(() => {
    return leaveQuotas.map((quota) => {
      const typeId = String(quota.leave_type_id || quota.type_id || quota.leave_type?.id || "");
      const total = Number(quota.no_of_leaves || quota.leaves || 0);
      const typeLeaves = leaves.filter((leave) => getLeaveTypeId(leave) === typeId);
      const approved = typeLeaves.filter((leave) => leave.status === "approved").reduce((sum, leave) => sum + leaveUnits(leave), 0);
      const pending = typeLeaves.filter((leave) => leave.status === "pending").reduce((sum, leave) => sum + leaveUnits(leave), 0);
      return { id: quota.id || typeId, name: quota.leave_type?.type_name || quota.type?.type_name || "Leave", total, approved, pending, remaining: Math.max(0, total - approved) };
    });
  }, [leaveQuotas, leaves]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading profile details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 opacity-20" />
          <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-gray-800">Profile Not Found</h2>
          <p className="mb-6 max-w-md text-sm text-gray-500">{error || "Employee not found."}</p>
          <Button onClick={() => router.push("/employees")} className="h-10 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
            Go Back to Employees
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const detail = employee.employee_detail || {};
  const initial = String(employee.name || "?").charAt(0);
  const designationName = detail.designation?.name || "N/A";
  const departmentName = detail.department?.team_name || detail.department?.name || "N/A";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-50 bg-white px-6 py-8 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/5 bg-gradient-to-br from-primary/10 to-primary/30 text-3xl font-black uppercase text-primary shadow-inner">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-gray-800">{employee.name}</h1>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">{designationName} / {departmentName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center text-[10px] font-bold text-gray-400"><Mail className="mr-1.5 h-3 w-3" /> {employee.email}</span>
                {(employee.mobile || detail.mobile) && <span className="flex items-center text-[10px] font-bold text-gray-400"><Phone className="mr-1.5 h-3 w-3" /> {employee.mobile || detail.mobile}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${employee.status === "deactive" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
              {employee.status || "active"}
            </span>
            <Link href={`/employees/${employee.id}/edit`}>
              <Button className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-colors hover:text-primary">
                <Edit className="h-5 w-5" />
              </Button>
            </Link>
            <Button onClick={() => router.push("/employees")} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-gray-400 shadow-sm transition-colors hover:text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Tasks Done", value: derived.completedTasks, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
            { label: "Leaves Taken", value: derived.approvedLeaveUnits, icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Remaining Leaves", value: derived.remainingLeaves, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-none bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <h3 className="text-2xl font-black text-gray-800">{stat.value}</h3>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 whitespace-nowrap rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {activeTab === "activity" && (
              <Card title="Recent Activity" className="border-none bg-white p-8 shadow-sm">
                <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-gray-100">
                  {activities.map((item) => (
                    <div key={item.id} className="relative pl-10">
                      <div className="absolute left-0 top-1.5 h-[23px] w-[23px] rounded-full border-4 border-white bg-primary shadow-sm" />
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-300">{formatDateTime(item.created_at)}</p>
                      <p className="text-sm font-bold text-gray-700">{item.activity || item.description || "Activity recorded"}</p>
                    </div>
                  ))}
                  {activities.length === 0 && <EmptyState label="No activity recorded" />}
                </div>
              </Card>
            )}

            {activeTab === "profile" && (
              <Card title="Personal Information" className="border-none bg-white p-8 shadow-sm">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Full Name", employee.name],
                    ["Employee Device ID", getEmployeeDisplayId(employee)],
                    ["Joining Date", formatDate(detail.joining_date)],
                    ["Department", departmentName],
                    ["Designation", designationName],
                    ["Gender", employee.gender || "Not specified"],
                    ["Mobile", employee.mobile || detail.mobile || "N/A"],
                    ["Slack Username", detail.slack_username ? `@${detail.slack_username}` : "N/A"],
                    ["Basic Salary", detail.hourly_rate ? `PKR ${detail.hourly_rate}` : "N/A"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">{label}</p>
                      <p className="text-sm font-bold text-gray-700">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-gray-50 pt-8">
                  <p className="mb-3 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-300"><MapPin className="mr-2 h-3 w-3" /> Current Address</p>
                  <p className="text-sm font-bold leading-relaxed text-gray-700">{detail.address || "No address provided."}</p>
                </div>
              </Card>
            )}

            {activeTab === "projects" && (
              <DataCard title="Projects Worked" emptyLabel="No projects assigned" columns={["Project", "Deadline", "Progress", "Status"]}>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700">{getProjectName(project)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{formatDate(project.deadline)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Number(project.completion_percent || 0)}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400">{project.completion_percent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={project.status || "active"} /></td>
                  </tr>
                ))}
              </DataCard>
            )}

            {activeTab === "tasks" && (
              <DataCard title="Task History" emptyLabel="No tasks found" columns={["Task", "Project", "Due Date", "Status"]}>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700">{getTaskTitle(task)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{task.project?.project_name || task.project_name || "Personal"}</td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{formatDate(task.due_date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={task.status || "open"} /></td>
                  </tr>
                ))}
              </DataCard>
            )}

            {activeTab === "leaves" && (
              <div className="space-y-6">
                <DataCard title="Leave Balances" emptyLabel="No leave balances found" columns={["Leave Type", "Allowed", "Taken", "Pending", "Remaining"]}>
                  {leaveBalanceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">{row.name}</td>
                      <td className="px-6 py-4 text-center text-xs font-black text-gray-600">{row.total}</td>
                      <td className="px-6 py-4 text-center text-xs font-black text-red-500">{row.approved}</td>
                      <td className="px-6 py-4 text-center text-xs font-black text-orange-500">{row.pending}</td>
                      <td className="px-6 py-4 text-center text-xs font-black text-green-600">{row.remaining}</td>
                    </tr>
                  ))}
                </DataCard>
                <DataCard title="Leave Records" emptyLabel="No leave records" columns={["Date", "Type", "Reason", "Status"]}>
                  {leaves.map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 text-xs font-bold text-gray-700">{formatDate(getLeaveDate(leave))}</td>
                      <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-primary">{getLeaveTypeName(leave)}</td>
                      <td className="max-w-[240px] truncate px-6 py-4 text-xs text-gray-500">{leave.reason || "No reason provided"}</td>
                      <td className="px-6 py-4"><StatusBadge status={leave.status || "pending"} /></td>
                    </tr>
                  ))}
                </DataCard>
              </div>
            )}

            {activeTab === "documents" && (
              <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-50 p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Employee Documents</h3>
                  <Button className="bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-white">
                    <FilePlus className="mr-2 h-4 w-4" /> Add Document
                  </Button>
                </div>
                <div className="divide-y divide-gray-50">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-6 transition-colors hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">{doc.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{doc.size || "File"} / {formatDate(doc.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href={doc.file_url || "#"} className="p-2 text-gray-300 transition-colors hover:text-primary" title="View"><Eye className="h-4 w-4" /></a>
                        <a href={doc.file_url || "#"} className="p-2 text-gray-300 transition-colors hover:text-primary" title="Download"><Download className="h-4 w-4" /></a>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-gray-300 transition-colors hover:text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {documents.length === 0 && <EmptyState label="No documents uploaded" />}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card title="Skills & Expertise" className="border-none bg-white p-6 shadow-sm">
              <div className="mt-2 flex flex-wrap gap-2">
                {(employee.skills || detail.skills || ["Generalist"]).map((skill: string) => (
                  <span key={skill} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            <Card title="Work Summary" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <SummaryRow icon={Briefcase} label="Active Projects" value={derived.activeProjects} />
                <SummaryRow icon={Clock} label="Attendance" value={`${derived.attendanceRate}%`} />
                <SummaryRow icon={CheckCircle2} label="Tasks Done" value={derived.completedTasks} />
                <SummaryRow icon={FileText} label="Leave Quota" value={derived.quotaTotal} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "approved" || normalized === "completed" || normalized === "active" || normalized === "finished"
      ? "bg-green-100 text-green-600"
      : normalized === "rejected" || normalized === "deactive" || normalized === "absent"
        ? "bg-red-100 text-red-600"
        : "bg-orange-100 text-orange-600";

  return <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${className}`}>{status}</span>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center">
      <Award className="mx-auto mb-3 h-10 w-10 text-gray-200" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">{label}</p>
    </div>
  );
}

function DataCard({ title, columns, emptyLabel, children }: { title: string; columns: string[]; emptyLabel: string; children: ReactNode }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <Card title={title} className="overflow-hidden border-none bg-white p-0 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              {columns.map((column) => (
                <th key={column} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length > 0 ? children : (
              <tr>
                <td colSpan={columns.length}><EmptyState label={emptyLabel} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 text-gray-400">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-800">{value}</span>
    </div>
  );
}
