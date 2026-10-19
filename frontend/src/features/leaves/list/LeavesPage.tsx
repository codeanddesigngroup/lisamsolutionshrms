"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  Calendar, 
  Settings, 
  RefreshCw,
  Download,
  MoreVertical,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { leaveUnits as getLeaveUnits } from "@/lib/hr-utils";
import { collapseLegacyMultiDayLeaves, inclusiveLeaveDays } from "@/lib/leave-utils";

type LeaveRecord = {
  id: number | string;
  employee_id?: number | string;
  leave_type_id?: number | string;
  user?: { id?: number | string; name?: string };
  employee?: { id?: number | string; employee_id?: number | string; name?: string; avatar?: string | null };
  date?: string;
  leave_date?: string;
  end_date?: string;
  created_at?: string;
  legacy_group_ids?: Array<number | string>;
  reason?: string;
  action_reason?: string;
  status: string;
  duration?: string;
  type?: string | { id?: number | string; type_name?: string };
  leave_type?: { id?: number | string; type_name?: string; color?: string; paid?: number | string | boolean };
};

type LeaveQuota = {
  id: number | string;
  leave_type_id: number | string;
  no_of_leaves: number | string;
  leave_type?: { id?: number | string; type_name?: string; color?: string };
};

const getLeaveUserId = (leave: LeaveRecord) => String(leave.user?.id || leave.employee?.id || "");

const leaveUnits = (leave: LeaveRecord) => getLeaveUnits(leave);

const getDurationLabel = (leave: LeaveRecord) => {
  if (leave.duration?.toLowerCase().includes("half")) return "0.5 day";
  const start = String(leave.leave_date || leave.date || "");
  const end = String(leave.end_date || start);
  const days = inclusiveLeaveDays(start, end);
  return `${days} ${days === 1 ? "day" : "days"}`;
};

export default function LeaveDashboardPage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const canCreateLeaves = hasHydrated && (hasPermission("leaves.create") || hasPermission("leaves.manage"));
  const canManageCompanyLeaves = hasHydrated && (hasPermission("leaves.approve") || hasPermission("leaves.manage"));
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveQuota[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setHasHydrated(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [response, quotaResponse] = await Promise.all([
        api.get(user?.role === "employee" && user.id ? `/leave?employee_id=${encodeURIComponent(String(user.id))}` : "/leave"),
        user?.role === "employee" && user.id
          ? api.get(`/leave-quotas?employee_id=${encodeURIComponent(String(user.id))}`)
          : Promise.resolve(null),
      ]);
      const leaveList = collapseLegacyMultiDayLeaves((response.data.data || []) as LeaveRecord[]);
      const scopedLeaves = canManageCompanyLeaves
        ? leaveList
        : leaveList.filter((leave) => getLeaveUserId(leave) === String(user?.id) || leave.user?.name === user?.name || leave.employee?.name === user?.name);
      setLeaves(scopedLeaves);
      setPendingLeaves(scopedLeaves.filter((leave) => leave.status === "pending"));
      setLeaveQuotas((quotaResponse?.data?.data || []) as LeaveQuota[]);
    } catch (err) {
      console.error("Fetch Leaves Error:", err);
      showToast("Failed to load leaves", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated]);

  const handleStatus = async (id: number | string, status: "approved" | "rejected") => {
    if (!canManageCompanyLeaves) {
      showToast("Only admins can approve or reject leave requests.", "error");
      return;
    }
    try {
      const request = leaves.find((leave) => String(leave.id) === String(id));
      await Promise.all((request?.legacy_group_ids || [id]).map((recordId) => api.patch(`/leave/${recordId}`, { status })));
      setLeaves((prev) => prev.map((leave) => leave.id === id ? { ...leave, status } : leave));
      setPendingLeaves((prev) => prev.filter((leave) => leave.id !== id));
      showToast(`Leave ${status}`, "success");
    } catch (err) {
      console.error("Update Leave Error:", err);
      showToast("Failed to update leave", "error");
    }
  };

  const handleCancel = async (id: number | string) => {
    try {
      const request = leaves.find((leave) => String(leave.id) === String(id));
      await Promise.all((request?.legacy_group_ids || [id]).map((recordId) => api.delete(`/leave/${recordId}`)));
      setLeaves((prev) => prev.filter((leave) => String(leave.id) !== String(id)));
      setPendingLeaves((prev) => prev.filter((leave) => String(leave.id) !== String(id)));
      showToast("Pending leave request cancelled", "success");
    } catch (err) {
      console.error("Cancel Leave Error:", err);
      setLeaves((prev) => prev.filter((leave) => leave.id !== id));
      setPendingLeaves((prev) => prev.filter((leave) => leave.id !== id));
      showToast("Leave cancelled locally. PHP endpoint should persist deletion.", "error");
    }
  };

  const leaveBalances = leaveQuotas.map((quota) => {
    const typeId = String(quota.leave_type_id || quota.leave_type?.id || "");
    const matchingLeaves = leaves.filter((leave) => {
      const leaveTypeId = leave.leave_type_id || leave.leave_type?.id || (typeof leave.type === "object" ? leave.type.id : undefined);
      return String(leaveTypeId || "") === typeId;
    });
    const allocated = Number(quota.no_of_leaves || 0);
    const used = matchingLeaves.filter((leave) => leave.status === "approved").reduce((total, leave) => total + leaveUnits(leave), 0);
    const pending = matchingLeaves.filter((leave) => leave.status === "pending").reduce((total, leave) => total + leaveUnits(leave), 0);

    return {
      id: quota.id,
      name: quota.leave_type?.type_name || "Leave",
      allocated,
      used,
      pending,
      remaining: Math.max(allocated - used, 0),
    };
  });

  const displayedLeaves = leaves;
  const pageCount = Math.max(1, Math.ceil(displayedLeaves.length / pageSize));
  const pageLeaves = displayedLeaves.slice(page * pageSize, (page + 1) * pageSize);

  const toggleLeaveSelection = (id: number | string) => {
    const key = String(id);
    setSelectedLeaveIds((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const togglePageSelection = () => {
    const pageIds = pageLeaves.map((leave) => String(leave.id));
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedLeaveIds.includes(id));
    setSelectedLeaveIds((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])]);
  };

  const handleExport = () => {
    const selected = displayedLeaves.filter((leave) => selectedLeaveIds.includes(String(leave.id)));
    const rows = selected.length ? selected : displayedLeaves;
    const csvValue = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [
      ["Employee", "Start Date", "End Date", "Duration", "Status", "Leave Type", "Paid"],
      ...rows.map((leave) => [
        leave.employee?.name || leave.user?.name || "Unknown",
        leave.leave_date || leave.date || "",
        leave.end_date || leave.leave_date || leave.date || "",
        getDurationLabel(leave),
        leave.status,
        typeof leave.type === "string" ? leave.type : leave.leave_type?.type_name || leave.type?.type_name || "Leave",
        leave.leave_type?.paid === undefined ? "" : (leave.leave_type.paid === true || Number(leave.leave_type.paid) === 1 ? "Paid" : "Unpaid"),
      ]),
    ].map((row) => row.map(csvValue).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "leave-records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (leave: LeaveRecord) => {
    if (!window.confirm("Delete this leave record?")) return;
    try {
      await Promise.all((leave.legacy_group_ids || [leave.id]).map((id) => api.delete(`/leave/${id}`)));
      setLeaves((current) => current.filter((item) => item.id !== leave.id));
      setPendingLeaves((current) => current.filter((item) => item.id !== leave.id));
      setSelectedLeaveIds((current) => current.filter((id) => id !== String(leave.id)));
      setOpenActionId(null);
      showToast("Leave record deleted", "success");
    } catch {
      showToast("Failed to delete leave record", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden pb-10">
        
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                 <h4 className="m-0">
                   Leaves
                 </h4>
                 <span className="label label-warning">
                    {pendingLeaves.length} Pending
                 </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase">
                {canManageCompanyLeaves ? "HR / Time Management / Schedule" : "Member / My Leaves / Schedule"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canCreateLeaves && <Link href="/leaves/create" className="inline-flex h-10 items-center rounded bg-blue-600 px-4 text-xs font-bold text-white transition-colors hover:bg-blue-700"><Plus className="mr-2 h-4 w-4" />New Leave</Link>}
            <Button onClick={handleExport} className="inline-flex h-10 items-center rounded border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"><Download className="mr-2 h-4 w-4" />Export</Button>
            {canManageCompanyLeaves && <Link href="/leaves/settings" aria-label="Leave settings" title="Leave settings" className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"><Settings className="h-4 w-4" /></Link>}
            <Button onClick={fetchData} aria-label="Refresh leaves" title="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-white p-0 text-gray-600 hover:bg-gray-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </div>

        {!canManageCompanyLeaves && (
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 className="m-0">My Leave Balances</h4>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Current assigned leave allowance</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            {leaveBalances.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {leaveBalances.map((balance) => (
                  <div key={balance.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-black text-gray-800">{balance.name}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4 text-center">
                      <div><p className="text-lg font-black text-gray-700">{balance.allocated}</p><p className="text-[8px] font-black uppercase tracking-wider text-gray-400">Total Leaves</p></div>
                      <div><p className="text-lg font-black text-orange-500">{balance.used}</p><p className="text-[8px] font-black uppercase tracking-wider text-gray-400">Taken</p></div>
                      <div><p className="text-lg font-black text-green-600">{balance.remaining}</p><p className="text-[8px] font-black uppercase tracking-wider text-gray-400">Remaining</p></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs font-bold text-gray-400">
                No leave balances have been assigned yet.
              </div>
            )}
          </Card>
        )}

        <Card className="overflow-hidden rounded-md border border-gray-200 bg-white p-0 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="w-12 px-5 py-3"><input type="checkbox" aria-label="Select this page" checked={pageLeaves.length > 0 && pageLeaves.every((leave) => selectedLeaveIds.includes(String(leave.id)))} onChange={togglePageSelection} className="h-3.5 w-3.5 accent-blue-600" /></th>
                    <th className="px-3 py-3 font-medium">Employee</th>
                    <th className="px-3 py-3 font-medium">Leave Date</th>
                    <th className="px-3 py-3 font-medium">Duration</th>
                    <th className="px-3 py-3 font-medium">Leave Status</th>
                    <th className="px-3 py-3 font-medium">Leave Type</th>
                    <th className="px-3 py-3 font-medium">Paid</th>
                    <th className="w-16 px-4 py-3 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageLeaves.map((leave) => {
                    const employeeName = leave.employee?.name || leave.user?.name || "Unknown";
                    const start = String(leave.leave_date || leave.date || "").slice(0, 10);
                    const end = String(leave.end_date || start).slice(0, 10);
                    const startDate = start ? new Date(`${start}T00:00:00`) : null;
                    const endDate = end ? new Date(`${end}T00:00:00`) : null;
                    const dateLabel = startDate ? `${startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} (${startDate.toLocaleDateString("en-US", { weekday: "long" })})${endDate && end !== start ? ` - ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} (${endDate.toLocaleDateString("en-US", { weekday: "long" })})` : ""}` : "--";
                    const status = String(leave.status || "pending").toLowerCase();
                    const statusColor = status === "approved" ? "bg-green-500" : status === "rejected" || status === "cancelled" ? "bg-red-600" : "bg-amber-400";
                    const typeName = leave.leave_type?.type_name || (typeof leave.type === "object" ? leave.type.type_name : leave.type) || "Leave";
                    const paid = leave.leave_type?.paid;
                    const paidLabel = paid === undefined ? "--" : paid === true || Number(paid) === 1 ? "Paid" : "Unpaid";
                    const actionKey = String(leave.id);

                    return (
                      <tr key={leave.id} className="h-[50px] text-gray-700 hover:bg-gray-50/70">
                        <td className="px-5 py-2"><input type="checkbox" aria-label={`Select ${employeeName} leave`} checked={selectedLeaveIds.includes(actionKey)} onChange={() => toggleLeaveSelection(leave.id)} className="h-3.5 w-3.5 accent-blue-600" /></td>
                        <td className="px-3 py-2"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">{employeeName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><div className="truncate font-medium text-gray-800">{employeeName}{String(user?.name || "").toLowerCase() === employeeName.toLowerCase() && <span className="ml-1 rounded bg-gray-500 px-1 py-0.5 text-[8px] font-bold text-white">It&apos;s you</span>}</div><div className="text-[10px] text-gray-500">{leave.employee?.employee_id || "Employee"}</div></div></div></td>
                        <td className="px-3 py-2 font-medium text-gray-800">{dateLabel}</td>
                        <td className="px-3 py-2">{getDurationLabel(leave)}</td>
                        <td className="px-3 py-2"><span className="inline-flex items-center gap-2 capitalize"><span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />{status}</span></td>
                        <td className="px-3 py-2"><span className="rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{typeName}</span></td>
                        <td className="px-3 py-2"><span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold text-white ${paidLabel === "Paid" ? "bg-green-600" : paidLabel === "Unpaid" ? "bg-gray-500" : "bg-gray-300"}`}>{paidLabel}</span></td>
                        <td className="relative px-4 py-2 text-center">
                          <button type="button" aria-label={`Actions for ${employeeName} leave`} aria-expanded={openActionId === actionKey} onClick={() => setOpenActionId((current) => current === actionKey ? null : actionKey)} className="inline-flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"><MoreVertical className="h-4 w-4" /></button>
                          {openActionId === actionKey && <div className="absolute right-10 top-1 z-20 w-36 rounded border border-gray-200 bg-white py-1 text-left shadow-lg">
                            <Link href={`/leaves/${leave.id}`} onClick={() => setOpenActionId(null)} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Eye className="h-3.5 w-3.5" />View details</Link>
                            {canManageCompanyLeaves && status === "pending" && <><button type="button" onClick={() => handleStatus(leave.id, "approved")} className="block w-full px-3 py-2 text-left text-xs text-green-700 hover:bg-green-50">Approve</button><button type="button" onClick={() => handleStatus(leave.id, "rejected")} className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Reject</button></>}
                            {!canManageCompanyLeaves && status === "pending" && <button type="button" onClick={() => handleCancel(leave.id)} className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Cancel request</button>}
                            {canManageCompanyLeaves && <button type="button" onClick={() => handleDelete(leave)} className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Delete</button>}
                          </div>}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && pageLeaves.length === 0 && <tr><td colSpan={8} className="py-14 text-center text-sm text-gray-400">No leave records found.</td></tr>}
                  {loading && <tr><td colSpan={8} className="py-14 text-center text-sm text-gray-400">Loading leave records...</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2">Show <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }} className="rounded border border-gray-300 bg-white px-2 py-1"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select> entries</label>
              <div className="flex flex-wrap items-center gap-2"><span className="mr-2">Showing {displayedLeaves.length ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, displayedLeaves.length)} of {displayedLeaves.length} entries</span><button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="rounded bg-blue-600 px-3 py-2 font-semibold text-white">{page + 1}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div>
            </div>
          </Card>
      </div>
    </DashboardLayout>
  );
}
