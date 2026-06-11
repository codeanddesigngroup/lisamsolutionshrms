"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Clock,
  Edit,
  Flag,
  ListTodo,
  MessageSquare,
  Paperclip,
  Pause,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Share2,
  User,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminCommentThread from "@/components/admin/AdminCommentThread";
import AdminDataTable from "@/components/admin/AdminDataTable";
import AdminFileManager, { ManagedFile } from "@/components/admin/AdminFileManager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { Task } from "@/types";
import { useToast } from "@/context/ToastContext";
import { formatDuration } from "@/lib/hr-utils";
import { useAuth } from "@/context/AuthContext";
import { isTaskAssignedToUser } from "@/lib/task-visibility";

type LooseRecord = {
  id?: number | string;
  title?: string;
  name?: string;
  status?: string;
  due_date?: string;
  files?: ManagedFile[];
  employee?: { name?: string };
  user?: { name?: string };
  start_time?: string;
  started_at?: string;
  end_time?: string;
  ended_at?: string;
  total_minutes?: number | string;
  minutes?: number | string;
  memo?: string;
  note?: string;
  body?: string;
  comment?: string;
  description?: string;
  created_at?: string;
  created_by?: string;
  comment_file?: ManagedFile[];
  action?: string;
  type?: string;
  details?: string;
  message?: string;
  date?: string;
  [key: string]: unknown;
};

const tabs = [
  { id: "details", label: "Task", icon: ListTodo },
  { id: "subtasks", label: "Subtasks", icon: CheckSquare },
  { id: "files", label: "Files", icon: Paperclip },
  { id: "timelogs", label: "Time Logs", icon: Clock },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "notes", label: "Notes", icon: MessageSquare },
  { id: "history", label: "History", icon: Calendar },
];

const starterSubtasks = [
  {
    id: "starter-subtask-1",
    title: "Confirm task requirements",
    status: "complete",
    due_date: "2026-05-10",
    files: [],
  },
  {
    id: "starter-subtask-2",
    title: "Prepare frontend handoff",
    status: "incomplete",
    due_date: "2026-05-13",
    files: [{ id: "starter-subtask-file-1", filename: "handoff-checklist.pdf", size: "95 KB" }],
  },
];

const starterFiles = [
  {
    id: "starter-file-1",
    filename: "task-brief.pdf",
    size: "184 KB",
    created_at: "2026-05-01T08:00:00.000Z",
    uploaded_by: "Admin",
  },
];

const starterComments = [
  {
    id: "starter-comment-1",
    body: "Client priority and delivery expectations confirmed.",
    created_at: "2026-05-01T10:00:00.000Z",
    user: { name: "Project Manager" },
  },
];

const starterNotes = [
  {
    id: "starter-note-1",
    body: "Internal note: keep this task pinned until the current milestone is closed.",
    created_at: "2026-05-01T11:00:00.000Z",
    user: { name: "Admin" },
  },
];

const starterTimeLogs = [
  {
    id: "starter-log-1",
    employee: { name: "Frontend Developer" },
    start_time: "2026-05-01 09:00",
    end_time: "2026-05-01 11:30",
    total_minutes: 150,
    memo: "Initial implementation",
  },
];

const starterHistory = [
  {
    id: "starter-history-1",
    action: "Task created",
    details: "Initial task details were added.",
    created_at: "2026-05-01T08:00:00.000Z",
    user: { name: "Admin" },
  },
  {
    id: "starter-history-2",
    action: "Status changed",
    details: "Task moved to doing.",
    created_at: "2026-05-02T09:30:00.000Z",
    user: { name: "Project Manager" },
  },
];

const getCollection = (value: unknown, fallback: LooseRecord[]): LooseRecord[] => {
  return Array.isArray(value) && value.length > 0 ? (value as LooseRecord[]) : fallback;
};

const getStatusColor = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "complete":
      return "bg-green-100 text-green-600";
    case "doing":
      return "bg-blue-100 text-blue-600";
    case "to do":
      return "bg-orange-100 text-orange-600";
    case "incomplete":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getPriorityColor = (priority?: string) => {
  switch ((priority || "").toLowerCase()) {
    case "urgent":
      return "text-red-600";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-blue-500";
    case "low":
      return "text-green-500";
    default:
      return "text-gray-400";
  }
};


const getRecordKey = (record: LooseRecord, fallback: string) => String(record.id || record.title || record.name || record.created_at || fallback);

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<LooseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canManageTask = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    const fetchTask = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/task/${params.id}`);
        const fetchedTask = response.data.data as Task;

        if (user.role === "employee" && !isTaskAssignedToUser(fetchedTask, user)) {
          setTask(null);
          setError("This task is not assigned to you.");
          showToast("You can only open tasks assigned to you.", "info");
          return;
        }

        setTask(fetchedTask);
        setSubtasks(getCollection((fetchedTask as unknown as LooseRecord).subtasks, starterSubtasks));
        setError(null);
      } catch (err: unknown) {
        console.error("Fetch Task Error:", err);
        setError(getApiErrorMessage(err, "Failed to load task details."));
        showToast("Error loading task details.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [params.id, showToast, user]);

  const collections = useMemo(() => {
    const source = (task || {}) as LooseRecord;
    return {
      files: getCollection(source.files, starterFiles),
      comments: getCollection(source.comments, starterComments),
      notes: getCollection(source.notes, starterNotes),
      timeLogs: getCollection(source.time_logs || source.timeLogs, starterTimeLogs),
      history: getCollection(source.history || source.activities, starterHistory),
    };
  }, [task]);

  const completedSubtasks = subtasks.filter((subtask) => ["complete", "completed"].includes(String(subtask.status || "").toLowerCase())).length;
  const subtaskProgress = subtasks.length ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  const totalLoggedMinutes = collections.timeLogs.reduce((sum, entry) => sum + Number(entry.total_minutes || entry.minutes || 0), 0);

  const toggleSubtask = (subtaskId: number | string) => {
    setSubtasks((current) =>
      current.map((subtask) => {
        const key = subtask.id || subtask.title || subtask.name;
        if (key !== subtaskId) return subtask;
        const isComplete = ["complete", "completed"].includes(String(subtask.status || "").toLowerCase());
        return { ...subtask, status: isComplete ? "incomplete" : "complete" };
      }),
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading task details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !task) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500 opacity-20" />
          <h2 className="mb-2 text-lg font-black uppercase tracking-widest text-gray-800">Task details unavailable</h2>
          <p className="mb-6 max-w-md text-sm text-gray-500">{error || "Task not found."}</p>
          <Button onClick={() => router.push("/tasks")} className="h-10 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
            Back to Tasks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-50 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-widest text-gray-800">{task.heading}</h1>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Task ID: #{task.id} / Project: <span className="text-primary">{task.project?.project_name || "N/A"}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`rounded-xl p-2.5 transition-colors ${isPinned ? "bg-primary text-white" : "border border-gray-100 bg-white text-gray-400 hover:text-primary"}`}
              title={isPinned ? "Unpin task" : "Pin task"}
            >
              <Pin className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 transition-colors hover:text-primary"
              title="Share task"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex items-center space-x-2 rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                isTimerRunning ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isTimerRunning ? "Stop Timer" : "Start Timer"}</span>
            </button>
            {canManageTask && (
              <Link href={`/tasks/${task.id}/edit`}>
                <Button className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 transition-colors hover:text-primary">
                  <Edit className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button onClick={() => router.push("/tasks")} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-gray-400 shadow-sm transition-colors hover:text-gray-600">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto rounded-2xl border border-gray-50 bg-white p-1.5 shadow-sm scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 whitespace-nowrap rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {activeTab === "details" && (
              <Card title="Task Details" className="border-none bg-white p-8 shadow-sm">
                <div className="grid grid-cols-1 gap-6 border-b border-gray-50 pb-6 md:grid-cols-4">
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Start Date</p>
                    <p className="text-xs font-bold text-gray-700">{task.start_date || "N/A"}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Due Date</p>
                    <p className="text-xs font-bold text-red-500">{task.due_date || "No Due Date"}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Category</p>
                    <p className="text-xs font-bold text-gray-700">{task.category?.category_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">Priority</p>
                    <span className={`${getPriorityColor(task.priority)} rounded border border-gray-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest`}>
                      {task.priority || "Medium"}
                    </span>
                  </div>
                </div>
                <div className="pt-6">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-300">Description</p>
                  <div className="text-sm font-medium leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: task.description || "No description provided." }} />
                </div>
              </Card>
            )}

            {activeTab === "subtasks" && (
              <div className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Subtasks</h3>
                    <p className="mt-1 text-xs font-medium text-gray-400">{completedSubtasks}/{subtasks.length} complete / {subtaskProgress}% progress</p>
                  </div>
                  {canManageTask && (
                    <button className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      <span>Add Subtask</span>
                    </button>
                  )}
                </div>
                <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${subtaskProgress}%` }} />
                </div>
                <div className="space-y-3">
                  {subtasks.map((subtask, index) => {
                    const isComplete = ["complete", "completed"].includes(String(subtask.status || "").toLowerCase());
                    const subtaskKey = getRecordKey(subtask, `subtask-${index}`);
                    return (
                      <div key={subtaskKey} className="rounded-2xl border border-gray-50 bg-gray-50/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <button type="button" onClick={() => toggleSubtask(subtask.id || subtaskKey)} className="flex min-w-0 items-center gap-3 text-left">
                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${isComplete ? "border-green-500 bg-green-500 text-white" : "border-gray-200 bg-white text-transparent"}`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                            <span className={`text-sm font-black ${isComplete ? "text-gray-400 line-through" : "text-gray-800"}`}>{subtask.title || subtask.name || "Untitled subtask"}</span>
                          </button>
                          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            <span>{subtask.due_date || "No due date"}</span>
                            <span className={`${getStatusColor(subtask.status)} rounded-full px-2.5 py-1 text-[9px] font-black`}>{subtask.status || "Incomplete"}</span>
                          </div>
                        </div>
                        {Array.isArray(subtask.files) && subtask.files.length > 0 && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <AdminFileManager title="Subtask Files" description="Files attached to this subtask." files={subtask.files} allowUpload={false} emptyText="No subtask files." />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <AdminFileManager
                title="Task Files"
                description="Matches Laravel task file controls with upload, preview, download, and delete."
                files={collections.files}
                emptyText="No task files uploaded yet."
              />
            )}

            {activeTab === "timelogs" && (
              <AdminDataTable
                title={`Time Logs / ${formatDuration(totalLoggedMinutes)}`}
                records={collections.timeLogs}
                getRecordKey={(record, index) => getRecordKey(record, `time-log-${index}`)}
                columns={[
                  { header: "Employee", accessor: (record) => record.employee?.name || record.user?.name || record.name || "N/A" },
                  { header: "Start", accessor: (record) => record.start_time || record.started_at || "N/A" },
                  { header: "End", accessor: (record) => record.end_time || record.ended_at || "Running" },
                  { header: "Time", accessor: (record) => formatDuration(Number(record.total_minutes || record.minutes)) },
                  { header: "Memo", accessor: (record) => record.memo || record.note || "N/A" },
                ]}
              />
            )}

            {activeTab === "comments" && (
              <AdminCommentThread
                title="Task Comments"
                placeholder="Write a task comment..."
                comments={collections.comments.map((comment) => ({
                  id: comment.id || comment.created_at || "task-comment",
                  body: comment.body || comment.comment || comment.description || "",
                  created_at: comment.created_at,
                  user: comment.user || { name: comment.created_by || "Admin" },
                  files: comment.files,
                  comment_file: comment.comment_file,
                }))}
                emptyText="No task comments yet."
              />
            )}

            {activeTab === "notes" && (
              <AdminCommentThread
                title="Private Notes"
                placeholder="Add a private task note..."
                comments={collections.notes.map((note) => ({
                  id: note.id || note.created_at || "task-note",
                  body: note.body || note.note || note.description || "",
                  created_at: note.created_at,
                  user: note.user || { name: note.created_by || "Admin" },
                }))}
                emptyText="No task notes yet."
              />
            )}

            {activeTab === "history" && (
              <AdminDataTable
                title="Task History"
                records={collections.history}
                getRecordKey={(record, index) => getRecordKey(record, `history-${index}`)}
                columns={[
                  { header: "Date", accessor: (record) => record.created_at || record.date || "N/A" },
                  { header: "Action", accessor: (record) => record.action || record.type || "Updated" },
                  { header: "Details", accessor: (record) => record.details || record.description || record.message || "N/A" },
                  { header: "User", accessor: (record) => record.user?.name || record.created_by || "System" },
                ]}
              />
            )}
          </div>

          <div className="space-y-6">
            <Card title="Assignees" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                {task.users && task.users.length > 0 ? (
                  task.users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-black uppercase text-primary">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800">{user.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{user.employee_detail?.designation?.name || "Staff"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No one assigned</p>
                )}
              </div>
            </Card>

            <Card title="Status Tracking" className="border-none bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Status</span>
                  <span className={`${getStatusColor(task.status)} rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest`}>{task.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Priority</span>
                  <div className="flex items-center space-x-1">
                    <Flag className={`h-3 w-3 fill-current ${getPriorityColor(task.priority)}`} />
                    <span className={`text-[10px] font-black uppercase ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtask Progress</span>
                  <span className="text-xs font-black text-gray-800">{subtaskProgress}%</span>
                </div>
                {canManageTask && (
                  <Button className="mt-2 h-11 w-full bg-primary text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
                    Update Progress
                  </Button>
                )}
              </div>
            </Card>

            {canManageTask && (
              <Card title="Task Tools" className="border-none bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-3">
                  <button className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-primary hover:text-white">
                    <Bell className="mr-2 h-4 w-4" /> Send Reminder
                  </button>
                  <button className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-700 transition-all hover:bg-primary hover:text-white">
                    <User className="mr-2 h-4 w-4" /> Manage Members
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
