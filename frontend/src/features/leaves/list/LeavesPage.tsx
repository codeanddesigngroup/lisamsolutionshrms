"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  Calendar, 
  List, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

type LeaveRecord = {
  id: number | string;
  employee_id?: number | string;
  leave_type_id?: number | string;
  user?: { id?: number | string; name?: string };
  employee?: { id?: number | string; name?: string };
  date?: string;
  leave_date?: string;
  end_date?: string;
  reason?: string;
  action_reason?: string;
  status: string;
  duration?: string;
  type?: string | { id?: number | string; type_name?: string };
  leave_type?: { id?: number | string; type_name?: string; color?: string };
};

type LeaveQuota = {
  id: number | string;
  leave_type_id: number | string;
  no_of_leaves: number | string;
  leave_type?: { id?: number | string; type_name?: string; color?: string };
};

const getLeaveUserId = (leave: LeaveRecord) => String(leave.user?.id || leave.employee?.id || "");

const leaveUnits = (leave: LeaveRecord) => leave.duration?.toLowerCase().includes("half") ? 0.5 : 1;

export default function LeaveDashboardPage() {
  const { showToast } = useToast();
  const { user, hasPermission } = useAuth();
  const canManageCompanyLeaves = user?.role === "admin" || hasPermission("leaves.approve") || hasPermission("leaves.manage");
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<LeaveQuota[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [response, quotaResponse] = await Promise.all([
        api.get(user?.role === "employee" && user.id ? `/leave?employee_id=${encodeURIComponent(String(user.id))}` : "/leave"),
        user?.role === "employee" && user.id
          ? api.get(`/leave-quotas?employee_id=${encodeURIComponent(String(user.id))}`)
          : Promise.resolve(null),
      ]);
      const leaveList = (response.data.data || []) as LeaveRecord[];
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  const handleStatus = async (id: number | string, status: "approved" | "rejected") => {
    if (!canManageCompanyLeaves) {
      showToast("Only admins can approve or reject leave requests.", "error");
      return;
    }
    try {
      await api.patch(`/leave/${id}`, { status });
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
      await api.delete(`/leave/${id}`);
      setLeaves((prev) => prev.filter((leave) => leave.id !== id));
      setPendingLeaves((prev) => prev.filter((leave) => leave.id !== id));
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
          <div className="flex items-center space-x-2">
             {canManageCompanyLeaves && (
             <Link href="/leaves/all">
               <Button className="btn-default">
                  <List className="h-4 w-4 mr-2" /> All Leaves
               </Button>
             </Link>
             )}
             {canManageCompanyLeaves && (
             <Link href="/leaves/settings">
               <Button className="btn-default p-2">
                  <Settings className="h-4 w-4" />
               </Button>
             </Link>
             )}
             <Link href="/leaves/create">
               <Button variant="primary">
                  <Plus className="h-4 w-4 mr-2" /> {canManageCompanyLeaves ? "Assign Leave" : "Apply Leave"}
               </Button>
             </Link>
             <Button onClick={fetchData} className="btn-default p-2">
               <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
             </Button>
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

        {!canManageCompanyLeaves && (
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h4 className="m-0">My Leave Records</h4>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">All submitted leave requests</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black text-primary">{leaves.length} Records</span>
            </div>
            {leaves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Leave Type</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaves.map((leave) => {
                      const leaveType = leave.leave_type?.type_name || (typeof leave.type === "object" ? leave.type.type_name : leave.type) || "Leave";
                      const status = leave.status?.toLowerCase() || "pending";
                      const statusClass = status === "approved"
                        ? "bg-green-50 text-green-600"
                        : status === "rejected" || status === "cancelled"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600";

                      return (
                        <tr key={leave.id} className="text-xs text-gray-600">
                          <td className="px-6 py-4 font-black text-gray-800">{leaveType}</td>
                          <td className="px-6 py-4 font-semibold">
                            {leave.leave_date || leave.date || "--"}
                            {leave.end_date && leave.end_date !== (leave.leave_date || leave.date) ? ` to ${leave.end_date}` : ""}
                          </td>
                          <td className="px-6 py-4 capitalize">{leave.duration || "single"}</td>
                          <td className="max-w-[220px] px-6 py-4">{leave.reason || "--"}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${statusClass}`}>{status}</span>
                          </td>
                          <td className="max-w-[220px] px-6 py-4 text-gray-400">{leave.action_reason || "--"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-bold text-gray-400">No leave records found for your account.</div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Calendar Area */}
           <div className="lg:col-span-8">
              <Card className="p-0 overflow-hidden">
                 <div className="p-6 border-b border-[#f2f2f3] flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                       <button onClick={prevMonth} className="p-1 hover:text-primary"><ChevronLeft className="h-5 w-5" /></button>
                       <h4 className="m-0 min-w-[150px] text-center">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                       </h4>
                       <button onClick={nextMonth} className="p-1 hover:text-primary"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className="label label-success">Approved</span>
                       <span className="label label-warning">Pending</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-7 border-b border-[#f2f2f3]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                       <div key={day} className="py-2 text-center text-[10px] uppercase text-gray-400 font-bold">{day}</div>
                    ))}
                 </div>
                 <div className="grid grid-cols-7 min-h-[400px]">
                    {Array.from({ length: 35 }).map((_, i) => {
                       const day = i - 3;
                       const leave = leaves.find(l => {
                         const leaveDate = new Date(l.leave_date || l.date || "");
                         return leaveDate.getFullYear() === currentMonth.getFullYear()
                           && leaveDate.getMonth() === currentMonth.getMonth()
                           && leaveDate.getDate() === day;
                       });
                       
                       return (
                         <div key={i} className={`relative p-2 border-r border-b border-t border-l border-[#9e9e9e2f] min-h-[80px] ${day < 1 || day > 31 ? 'bg-gray-50' : ''}`}>
                            {day >= 1 && day <= 31 && (
                              <span className={`text-[16px] font-bold ${day === new Date().getDate() ? 'text-primary' : 'text-gray-400'}`}>
                                 {day}
                              </span>
                            )}
                            
                            {day >= 1 && day <= 31 && leave && (
                              <div className={`mt-1 p-1 text-[9px] border-l-2 ${leave.status === 'approved' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-orange-50 border-orange-500 text-orange-700'}`}>
                                 <div className="truncate">{leave.user?.name || leave.employee?.name || "Unknown"}</div>
                              </div>
                            )}
                         </div>
                       );
                    })}
                 </div>
              </Card>
           </div>

           {/* Pending & Actions Column */}
           <div className="lg:col-span-4 space-y-6">
              <Card className="p-6">
                 <h4 className="mb-4">{canManageCompanyLeaves ? "Pending Requests" : "My Pending Requests"}</h4>
                 <div className="space-y-4">
                    {pendingLeaves.length > 0 ? pendingLeaves.map((request) => (
                      <div key={request.id} className="p-4 bg-gray-50 border border-[#f2f2f3]">
                         <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold">{request.user?.name || request.employee?.name || "Unknown"}</div>
                            <span className="text-[10px] text-gray-400">{request.leave_date || request.date}</span>
                         </div>
                         <div className="text-[11px] text-gray-500 mb-3">{request.reason}</div>
                         <div className="flex space-x-2">
                            {canManageCompanyLeaves ? (
                              <>
                            <Button onClick={() => handleStatus(request.id, "approved")} className="btn-success p-1 text-[10px]">Approve</Button>
                            <Button onClick={() => handleStatus(request.id, "rejected")} className="btn-danger p-1 text-[10px]">Reject</Button>
                              </>
                            ) : (
                              <Button onClick={() => handleCancel(request.id)} className="btn-danger p-1 text-[10px]">
                                <XCircle className="h-3 w-3 mr-1" /> Cancel Request
                              </Button>
                            )}
                         </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-400 py-10">No pending requests</div>
                    )}
                 </div>
              </Card>

              <div className="white-box bg-secondary text-white">
                 <h4 className="text-white mb-4">{canManageCompanyLeaves ? "Quick Search" : "My Leave Scope"}</h4>
                 {canManageCompanyLeaves ? (
                 <input 
                   type="text" 
                   placeholder="FIND STAFF..."
                   className="form-control bg-white/10 border-white/20 text-white"
                 />
                 ) : (
                  <p className="text-xs font-bold leading-relaxed text-white/75">
                    Employees can apply for their own leave and cancel pending requests. Approval, rejection, assignment to another employee, and settings remain admin-only.
                  </p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
