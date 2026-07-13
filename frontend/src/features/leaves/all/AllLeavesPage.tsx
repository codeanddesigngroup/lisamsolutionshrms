"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Calendar, Filter, RefreshCw, User, FileText, ChevronDown, Download, Eye, Trash2, ChevronLeft, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type LeaveRecord = {
  id: number | string;
  employee?: { id?: number | string; name?: string; avatar?: string | null };
  user?: { id?: number | string; name?: string };
  date?: string;
  leave_date?: string;
  type?: string;
  leave_type?: { type_name?: string };
  status: "pending" | "approved" | "rejected" | string;
  reason?: string;
};

type EmployeeOption = {
  id: number | string;
  name: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved": return "text-green-500 bg-green-50 border-green-100";
    case "rejected": return "text-red-500 bg-red-50 border-red-100";
    case "pending": return "text-orange-500 bg-orange-50 border-orange-100";
    default: return "text-gray-500 bg-gray-50 border-gray-100";
  }
};

export default function AllLeavesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaveResponse, employeeResponse] = await Promise.all([
        api.get("/leave"),
        api.get("/employee"),
      ]);
      setLeaves(leaveResponse.data.data || []);
      setEmployees(employeeResponse.data.data || []);
    } catch (err) {
      console.error("Fetch Leaves Error:", err);
      showToast("Failed to load leave records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const employeeId = String(leave.employee?.id || leave.user?.id || "");
      const date = leave.leave_date || leave.date || "";
      const employeeMatch = !filterEmployee || employeeId === filterEmployee;
      const statusMatch = filterStatus === "all" || leave.status === filterStatus;
      const startMatch = !filterStartDate || date >= filterStartDate;
      const endMatch = !filterEndDate || date <= filterEndDate;
      return employeeMatch && statusMatch && startMatch && endMatch;
    });
  }, [filterEmployee, filterEndDate, filterStartDate, filterStatus, leaves]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/leave/${deletingId}`);
      setLeaves((prev) => prev.filter((leave) => leave.id !== deletingId));
      setDeletingId(null);
      showToast("Leave deleted successfully", "success");
    } catch (err) {
      console.error("Delete Leave Error:", err);
      showToast("Failed to delete leave", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden pb-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <Link href="/leaves"><div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-all cursor-pointer"><ChevronLeft className="h-5 w-5" /></div></Link>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">Leave Records</h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Personnel History / All Logs</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <Button className="bg-gray-50 text-gray-400 border-none px-4 h-11 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-primary transition-all"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            <Link href="/leaves/create"><Button className="bg-primary text-white text-[9px] md:text-[10px] font-black px-4 md:px-6 h-11 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all rounded-xl">Assign Leave</Button></Link>
          </div>
        </div>

        <Card className="p-5 border-none shadow-sm bg-white rounded-2xl flex flex-col lg:flex-row lg:items-end gap-6 border border-gray-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><User className="h-3 w-3 mr-2 text-primary" /> Employee</label>
            <div className="relative">
              <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                <option value="">All Employees</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><Calendar className="h-3 w-3 mr-2 text-primary" /> Date Range</label>
            <div className="flex items-center space-x-2">
              <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20" />
              <span className="text-gray-300 text-xs font-black">TO</span>
              <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center"><Filter className="h-3 w-3 mr-2 text-primary" /> Status</label>
            <div className="relative">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchData} className="bg-primary text-white h-12 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">Apply Filters</Button>
            <Button onClick={() => { setFilterEmployee(""); setFilterStatus("all"); setFilterStartDate(""); setFilterEndDate(""); }} className="bg-gray-50 text-gray-400 h-12 w-12 p-0 rounded-xl hover:text-primary transition-all"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          </div>
        </Card>

        <Card className="p-0 border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-gray-50 min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Leave Date</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!loading ? filteredLeaves.map((leave) => {
                  const employeeName = leave.employee?.name || leave.user?.name || "Unknown";
                  const date = leave.leave_date || leave.date || "";
                  return (
                    <tr key={leave.id} className="hover:bg-gray-50/20 transition-all group">
                      <td className="px-6 py-5 text-[11px] font-black text-gray-300 uppercase">#{leave.id}</td>
                      <td className="px-6 py-5"><div className="flex items-center space-x-3"><div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/5 shadow-sm">{employeeName.charAt(0)}</div><span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{employeeName}</span></div></td>
                      <td className="px-6 py-5"><span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">{date ? new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span></td>
                      <td className="px-6 py-5"><span className="px-3 py-1 bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-200">{leave.leave_type?.type_name || leave.type || "Leave"}</span></td>
                      <td className="px-6 py-5"><span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusColor(leave.status)}`}>{leave.status}</span></td>
                      <td className="px-6 py-5"><div className="flex items-center justify-center space-x-2"><Link href={`/leaves/${leave.id}`} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"><Eye className="h-4 w-4" /></Link><button onClick={() => setDeletingId(leave.id)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  );
                }) : Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-8"><div className="h-6 bg-gray-50 rounded-xl w-full" /></td></tr>)}
              </tbody>
            </table>
          </div>
          {!loading && filteredLeaves.length === 0 && <div className="py-20 text-center"><FileText className="h-12 w-12 text-gray-100 mx-auto mb-4" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No leave records found</p></div>}
          <div className="p-6 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {filteredLeaves.length} Total Records</p>
          </div>
        </Card>
      </div>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Leave" size="sm">
        <div className="text-center py-4">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">This will permanently delete the leave record.</p>
          <div className="flex space-x-3">
            <Button onClick={() => setDeletingId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
