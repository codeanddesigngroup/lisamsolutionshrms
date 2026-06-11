"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, User, XCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import apiClient from "@/lib/api-client";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const statusClasses: Record<string, string> = {
  approved: "bg-green-100 text-green-600",
  pending: "bg-yellow-100 text-yellow-600",
  rejected: "bg-red-100 text-red-500",
};

type DetailField = {
  label: string;
  value: string;
  Icon: LucideIcon;
};

export default function LeaveDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const [status, setStatus] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");
  const canApproveLeaves = user?.role === "admin" || hasPermission("leaves.approve") || hasPermission("leaves.manage");
  const leave = useMemo(() => ({
    id: params.id || "preview",
    employee: "Alice Smith",
    type: "Casual Leave",
    duration: "Full Day",
    from: "2026-05-12",
    to: "2026-05-12",
    reason: "Family emergency",
    applied_on: "2026-05-08",
  }), [params.id]);

  const updateLeaveStatus = (nextStatus: "approved" | "rejected") => {
    if (!canApproveLeaves) return;
    setStatus(nextStatus);
    apiClient.action("leaves", String(leave.id), nextStatus === "approved" ? "approve" : "reject", { reason: rejectReason }).catch((err) => {
      console.warn("Leave approval endpoint pending:", err);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Leave Request #{leave.id}</h1>
            <p className="mt-1 text-xs font-bold text-gray-400">Review, approve, reject, and track leave history</p>
          </div>
          <Button onClick={() => router.push("/leaves")} className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Leave Details" className="border-none bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {([
                  { label: "Employee", value: leave.employee, Icon: User },
                  { label: "Leave Type", value: leave.type, Icon: FileText },
                  { label: "Duration", value: leave.duration, Icon: Clock },
                  { label: "Applied On", value: leave.applied_on, Icon: Calendar },
                  { label: "From", value: leave.from, Icon: Calendar },
                  { label: "To", value: leave.to, Icon: Calendar },
                ] satisfies DetailField[]).map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-2xl bg-gray-50 p-4">
                    <Icon className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-1 text-sm font-black text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-gray-50 bg-white p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</p>
                <p className="text-sm font-medium leading-relaxed text-gray-600">{leave.reason}</p>
              </div>
            </Card>

            <AdminDataTable
              title="Approval Timeline"
              records={[
                { id: 1, date: leave.applied_on, action: "Submitted", user: leave.employee, notes: leave.reason },
                { id: 2, date: "2026-05-08", action: "Awaiting approval", user: "HR", notes: "Pending manager review" },
              ]}
              getRecordKey={(record) => record.id}
              columns={[
                { header: "Date", accessor: (record) => record.date },
                { header: "Action", accessor: (record) => record.action },
                { header: "User", accessor: (record) => record.user },
                { header: "Notes", accessor: (record) => record.notes },
              ]}
            />
          </div>

          <div className="space-y-6">
            <Card title={canApproveLeaves ? "Approval" : "Request Status"} className="border-none bg-white p-6 shadow-sm">
              <span className={`${statusClasses[status]} mb-4 block rounded-full px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest`}>
                {status}
              </span>
              {canApproveLeaves ? (
              <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateLeaveStatus("approved")} className="flex h-10 items-center justify-center rounded-xl bg-green-50 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </button>
                <button onClick={() => updateLeaveStatus("rejected")} className="flex h-10 items-center justify-center rounded-xl bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white">
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </button>
              </div>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reject reason or approval note"
                className="mt-4 h-24 w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-primary/10"
              />
              </>
              ) : (
                <p className="rounded-xl bg-gray-50 p-4 text-xs font-bold leading-relaxed text-gray-500">
                  Employees can view their leave request and cancel pending requests from My Leaves. Approval and rejection are admin-only, matching the Laravel member flow.
                </p>
              )}
            </Card>

            <Link href={canApproveLeaves ? "/leaves/all" : "/leaves"} className="block rounded-2xl border border-gray-50 bg-white p-5 shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/5">
              <Calendar className="mb-3 h-5 w-5 text-primary" />
              <span className="block text-xs font-black uppercase tracking-widest text-gray-800">{canApproveLeaves ? "All Leaves" : "My Leaves"}</span>
              <span className="mt-1 block text-xs font-medium text-gray-400">{canApproveLeaves ? "Open complete leave register" : "Return to my leave calendar"}</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
