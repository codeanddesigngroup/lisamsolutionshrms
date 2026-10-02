"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { attendanceService } from "@/services/attendance/attendance.service";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
  Layers,
  PhoneCall,
  Receipt,
  RefreshCw,
  UserSquare2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type RecordRow = Record<string, any>;

type DashboardStats = {
  totalClients: number;
  totalEmployees: number;
  totalProjects: number;
  unpaidInvoices: number;
  pendingTasks: number;
  completedTasks: number;
  todayAttendance: string;
  monthlyEarnings: number[];
};

const emptyStats: DashboardStats = {
  totalClients: 0,
  totalEmployees: 0,
  totalProjects: 0,
  unpaidInvoices: 0,
  pendingTasks: 0,
  completedTasks: 0,
  todayAttendance: "0/0",
  monthlyEarnings: Array.from({ length: 12 }, () => 0),
};

const todayString = () => new Date().toISOString().slice(0, 10);

const getList = (payload: unknown): RecordRow[] => {
  const envelope = payload as { data?: unknown };
  if (Array.isArray(envelope?.data)) return envelope.data as RecordRow[];
  if (Array.isArray(payload)) return payload as RecordRow[];
  return [];
};

const getTotalCount = (payload: unknown) => {
  const envelope = payload as { count?: number; meta?: { total?: number } };
  return Number(envelope?.meta?.total ?? envelope?.count ?? getList(payload).length ?? 0);
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const isCompletedTask = (task: RecordRow) => {
  const status = String(task.status || task.board_column?.slug || task.board_column?.column_name || "").toLowerCase();
  return ["completed", "complete", "done", "finished"].some((token) => status.includes(token));
};

const isUnpaidInvoice = (invoice: RecordRow) => {
  const status = String(invoice.status || invoice.payment_status || "").toLowerCase();
  return Boolean(status) && !["paid", "cancelled", "void"].some((token) => status.includes(token));
};

const getAmount = (record: RecordRow) =>
  Number(record.amount || record.total || record.total_amount || record.paid_amount || record.payment_amount || 0) || 0;

const buildMonthlyEarnings = (payments: RecordRow[], invoices: RecordRow[]) => {
  const months = Array.from({ length: 12 }, () => 0);
  const source = payments.length ? payments : invoices.filter((invoice) => !isUnpaidInvoice(invoice));

  source.forEach((record) => {
    const dateValue = record.paid_on || record.payment_date || record.date || record.issue_date || record.created_at;
    const date = new Date(dateValue || "");
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== new Date().getFullYear()) return;
    months[date.getMonth()] += getAmount(record);
  });

  return months;
};

const initialsFor = (name?: string) =>
  String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

export default function DashboardPage() {
  const { user } = useAuth();
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardStats>(emptyStats);
  const [overdueTasks, setOverdueTasks] = useState<RecordRow[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<RecordRow[]>([]);
  const [calendarItems, setCalendarItems] = useState<RecordRow[]>([]);
  const [projectActivities, setProjectActivities] = useState<RecordRow[]>([]);
  const [userActivities, setUserActivities] = useState<RecordRow[]>([]);

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = user?.role === "super_admin" ? "" : String(user?.company_id || "");
      const currentYear = new Date().getFullYear();
      const today = todayString();
      const [
        clientsResult,
        employeesResult,
        projectsResult,
        tasksResult,
        invoicesResult,
        paymentsResult,
        leadsResult,
        leavesResult,
        holidaysResult,
        attendanceEmployeesResult,
        todayAttendanceResult,
      ] = await Promise.allSettled([
        api.get("/clients", { params: { per_page: 1000 } }),
        api.get("/employees"),
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/invoices", { params: { per_page: 1000 } }),
        api.get("/payments", { params: { per_page: 1000 } }),
        api.get("/leads", { params: { per_page: 1000 } }),
        api.get("/leaves", { params: { start_date: today, end_date: `${currentYear}-12-31` } }),
        api.get("/holidays"),
        attendanceService.getEmployees({ companyId }),
        attendanceService.getTodayRecords({ companyId }),
      ]);

      const clientsPayload = clientsResult.status === "fulfilled" ? clientsResult.value.data : undefined;
      const employees = employeesResult.status === "fulfilled" ? getList(employeesResult.value.data) : [];
      const projects = projectsResult.status === "fulfilled" ? getList(projectsResult.value.data) : [];
      const tasks = tasksResult.status === "fulfilled" ? getList(tasksResult.value.data) : [];
      const invoices = invoicesResult.status === "fulfilled" ? getList(invoicesResult.value.data) : [];
      const payments = paymentsResult.status === "fulfilled" ? getList(paymentsResult.value.data) : [];
      const leads = leadsResult.status === "fulfilled" ? getList(leadsResult.value.data) : [];
      const leaves = leavesResult.status === "fulfilled" ? getList(leavesResult.value.data) : [];
      const holidays = holidaysResult.status === "fulfilled" ? getList(holidaysResult.value.data) : [];
      const attendanceEmployees = attendanceEmployeesResult.status === "fulfilled" ? attendanceEmployeesResult.value : [];
      const todayAttendance = todayAttendanceResult.status === "fulfilled" ? todayAttendanceResult.value : [];

      const pendingTasks = tasks.filter((task) => !isCompletedTask(task));
      const completedTasks = tasks.filter(isCompletedTask);
      const overdue = pendingTasks
        .filter((task) => String(task.due_date || "").slice(0, 10) < today)
        .sort((a, b) => String(a.due_date || "").localeCompare(String(b.due_date || "")))
        .slice(0, 5);
      const followUps = leads
        .filter((lead) => String(lead.next_follow_up || lead.follow_up_date || lead.follow_up || "").slice(0, 10) >= today)
        .sort((a, b) => String(a.next_follow_up || a.follow_up_date || a.follow_up || "").localeCompare(String(b.next_follow_up || b.follow_up_date || b.follow_up || "")))
        .slice(0, 5);
      const upcomingLeaves = leaves
        .filter((leave) => String(leave.status || "").toLowerCase() === "approved")
        .map((leave) => ({
          date: leave.leave_date || leave.date,
          event: `${leave.employee?.name || leave.user?.name || "Employee"} - ${leave.leave_type?.type_name || leave.type?.type_name || "Approved Leave"}`,
          kind: "leave",
        }));
      const upcomingHolidays = holidays.map((holiday) => ({
        date: holiday.holiday_date || holiday.date,
        event: holiday.name || holiday.occassion || "Holiday",
        kind: "holiday",
      }));

      setStatsData({
        totalClients: getTotalCount(clientsPayload),
        totalEmployees: employees.length,
        totalProjects: projects.length,
        unpaidInvoices: invoices.filter(isUnpaidInvoice).length,
        pendingTasks: pendingTasks.length,
        completedTasks: completedTasks.length,
        todayAttendance: `${todayAttendance.filter((row) => row.clock_in).length}/${attendanceEmployees.length}`,
        monthlyEarnings: buildMonthlyEarnings(payments, invoices),
      });
      setOverdueTasks(overdue);
      setPendingFollowUps(followUps);
      setCalendarItems(
        [...upcomingLeaves, ...upcomingHolidays]
          .filter((item) => String(item.date || "").slice(0, 10) >= today)
          .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
          .slice(0, 5),
      );
      setProjectActivities(projects.slice(0, 5));
      setUserActivities([...tasks, ...leaves, ...projects].slice(0, 6));
    } catch (error) {
      console.error("Fetch Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  const stats = [
    { label: "Total Clients", value: statsData.totalClients, icon: Users, color: "text-blue-500", bg: "bg-blue-50", href: "/clients" },
    { label: "Total Employees", value: statsData.totalEmployees, icon: UserSquare2, color: "text-orange-500", bg: "bg-orange-50", href: "/employees" },
    { label: "Total Projects", value: statsData.totalProjects, icon: Layers, color: "text-purple-500", bg: "bg-purple-50", href: "/projects" },
    { label: "Unpaid Invoices", value: statsData.unpaidInvoices, icon: Receipt, color: "text-red-500", bg: "bg-red-50", href: "/invoices" },
    { label: "Pending Tasks", value: statsData.pendingTasks, icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-50", href: "/tasks" },
    { label: "Completed Tasks", value: statsData.completedTasks, icon: CheckSquare, color: "text-green-500", bg: "bg-green-50", href: "/tasks" },
    { label: "Today Attendance", value: statsData.todayAttendance, icon: UserSquare2, color: "text-pink-500", bg: "bg-pink-50", href: "/attendance" },
  ];
  const maxEarnings = Math.max(...statsData.monthlyEarnings, 1);
  const totalEarnings = useMemo(() => statsData.monthlyEarnings.reduce((sum, value) => sum + value, 0), [statsData.monthlyEarnings]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="flex items-center font-black uppercase tracking-widest text-gray-800">Dashboard</h1>
            <p className="mt-0.5 text-[10px] font-bold text-gray-400">Welcome back, {user?.name || "Admin"}</p>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={fetchDashboard} className="rounded-lg p-2 text-gray-400 transition-colors hover:text-primary" title="Refresh dashboard">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Current Time</p>
              <p className="flex items-center justify-end text-xs font-bold text-primary">
                <Clock className="mr-1 h-3.5 w-3.5" /> {time || "Loading..."}
              </p>
            </div>
            <div className="hidden text-right md:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Today&apos;s Date</p>
              <p className="text-xs font-bold text-gray-700">{new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="group border-none bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color} shadow-sm transition-colors group-hover:bg-primary group-hover:text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[9px] font-black uppercase tracking-wider text-gray-400">{stat.label}</p>
                    <p className="truncate text-lg font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
            <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Recent Earnings</h3>
            </div>
            <div className="p-6">
              <div className="relative flex h-48 items-end justify-between px-2">
                <div className="absolute top-0 w-full border-t border-dashed border-gray-200" />
                <div className="absolute top-1/2 w-full border-t border-dashed border-gray-200" />
                {statsData.monthlyEarnings.map((amount, index) => (
                  <div key={index} className="relative flex h-full w-1/12 items-end px-1">
                    <div className="relative w-full rounded-t-sm bg-blue-100 transition-colors hover:bg-blue-200" style={{ height: `${Math.max((amount / maxEarnings) * 100, amount > 0 ? 8 : 2)}%` }}>
                      <div className="absolute -top-1 w-full border-t-2 border-primary" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((monthName) => <span key={monthName}>{monthName}</span>)}
              </div>
              <p className="mt-4 text-[10px] font-medium text-gray-500">
                <span className="mr-2 rounded bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-600">PKR {totalEarnings.toLocaleString()}</span>
                Payments received this year from available finance records.
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">Leaves & Events</h3>
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-4 p-6">
              {calendarItems.map((item, index) => (
                <div key={`${item.date}-${index}`} className={`flex items-center rounded-xl border p-3 ${item.kind === "leave" ? "border-green-100 bg-green-50 text-green-600" : "border-blue-100 bg-blue-50 text-blue-600"}`}>
                  <div className="flex-shrink-0 border-r border-current border-opacity-20 px-3 text-center">
                    <p className="text-[10px] font-black uppercase">{formatDate(item.date).split(" ")[0] || "--"}</p>
                    <p className="text-sm font-black">{formatDate(item.date).split(" ")[1] || "--"}</p>
                  </div>
                  <div className="px-4">
                    <p className="text-xs font-bold">{item.event}</p>
                  </div>
                </div>
              ))}
              {!loading && calendarItems.length === 0 && <EmptyState label="No upcoming leaves or holidays" />}
              <div className="pt-2 text-center">
                <Link href="/leaves" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View Full Calendar</Link>
              </div>
            </div>
          </Card>

          <ListCard title="Overdue Tasks" items={overdueTasks} emptyLabel="No overdue tasks">
            {(task, index) => (
              <li key={task.id || index} className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center">
                <div className="flex items-start space-x-3">
                  <span className="mt-0.5 text-[10px] font-black text-gray-400">{index + 1}.</span>
                  <div>
                    <Link href="/tasks" className="text-xs font-bold text-gray-800 transition-colors hover:text-primary">{task.heading || task.title || "Untitled task"}</Link>
                    <p className="mt-0.5 text-[10px] font-medium text-gray-500">{task.project?.project_name || "No project"}</p>
                  </div>
                </div>
                <span className="inline-block self-start whitespace-nowrap rounded-md bg-red-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-red-600 sm:self-center">{formatDate(task.due_date)}</span>
              </li>
            )}
          </ListCard>

          <ListCard title="Pending Follow-Up" items={pendingFollowUps} emptyLabel="No pending follow-ups">
            {(lead, index) => (
              <li key={lead.id || index} className="flex flex-col justify-between gap-2 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-gray-400">{index + 1}.</span>
                  <Link href="/leads" className="flex items-center text-xs font-bold text-primary hover:underline">
                    <PhoneCall className="mr-1.5 h-3 w-3" /> {lead.client_name || lead.name || lead.company_name || "Lead"}
                  </Link>
                </div>
                <span className="inline-block self-start whitespace-nowrap rounded-md bg-yellow-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-700 sm:self-center">
                  {formatDate(lead.next_follow_up || lead.follow_up_date || lead.follow_up)}
                </span>
              </li>
            )}
          </ListCard>

          <TimelineCard title="Project Activity Timeline" items={projectActivities} emptyLabel="No project activity">
            {(project, index) => (
              <ActivityRow
                key={project.id || index}
                dotColor={["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500"][index % 5]}
                time={formatDate(project.updated_at || project.created_at || project.start_date)}
                title={project.project_name || "Project"}
                detail={`${project.status || "Updated"}${project.client?.name ? ` / ${project.client.name}` : ""}`}
              />
            )}
          </TimelineCard>

          <Card className="overflow-hidden border-none bg-white p-0 shadow-sm lg:col-span-2">
            <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">User Activity Timeline</h3>
            </div>
            <div className="relative p-6">
              <div className="absolute bottom-6 left-[3.25rem] top-6 w-px bg-gray-100" />
              <div className="space-y-6">
                {userActivities.map((item, index) => {
                  const actor = item.employee?.name || item.user?.name || item.users?.[0]?.name || item.client?.name || user?.name || "System";
                  const action = item.heading ? `Task updated: ${item.heading}` : item.reason ? `Leave request: ${item.reason}` : item.project_name ? `Project updated: ${item.project_name}` : "Record updated";
                  return (
                    <div key={`${item.id || index}-${action}`} className="relative flex items-start space-x-6">
                      <div className="z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-xs font-black text-blue-600 shadow-sm">
                        {initialsFor(actor)}
                      </div>
                      <div className="mt-1 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-bold text-gray-800"><span className="text-primary">{actor}</span></p>
                          <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400 sm:ml-4 sm:mt-0">{formatDate(item.updated_at || item.created_at || item.date || item.due_date)}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{action}</p>
                      </div>
                    </div>
                  );
                })}
                {!loading && userActivities.length === 0 && <EmptyState label="No recent activity" />}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ label }: { label: string }) {
  return <div className="p-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</div>;
}

function ListCard({ title, items, emptyLabel, children }: { title: string; items: RecordRow[]; emptyLabel: string; children: (item: RecordRow, index: number) => ReactNode }) {
  return (
    <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
      <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">{title}</h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {items.map(children)}
        {items.length === 0 && <EmptyState label={emptyLabel} />}
      </ul>
    </Card>
  );
}

function TimelineCard({ title, items, emptyLabel, children }: { title: string; items: RecordRow[]; emptyLabel: string; children: (item: RecordRow, index: number) => ReactNode }) {
  return (
    <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
      <div className="border-b border-gray-50 bg-gray-50/30 px-6 py-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-800">{title}</h3>
      </div>
      <div className="relative p-6">
        <div className="absolute bottom-6 left-9 top-6 w-px bg-gray-100" />
        <div className="space-y-6">
          {items.map(children)}
          {items.length === 0 && <EmptyState label={emptyLabel} />}
        </div>
      </div>
    </Card>
  );
}

function ActivityRow({ dotColor, time, title, detail }: { dotColor: string; time: string; title: string; detail: string }) {
  return (
    <div className="relative flex items-start space-x-6">
      <div className="mt-0.5 w-16 flex-shrink-0 text-right">
        <p className="text-[9px] font-black uppercase leading-tight text-gray-400">{time || "Recent"}</p>
      </div>
      <div className={`z-10 mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
      <div>
        <p className="text-xs leading-relaxed text-gray-700">
          <span className="font-bold text-gray-900">{title}:</span> {detail}
        </p>
      </div>
    </div>
  );
}
