"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDataTable from "@/components/admin/AdminDataTable";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

const employeeLogs = [
  { id: 1, employee: "John Doe", total_hours: "42 hrs", billable_hours: "36 hrs", active_timers: 1, approved: "34 hrs", pending: "8 hrs" },
  { id: 2, employee: "Jane Smith", total_hours: "38 hrs", billable_hours: "32 hrs", active_timers: 1, approved: "30 hrs", pending: "8 hrs" },
  { id: 3, employee: "Mike Brown", total_hours: "28 hrs", billable_hours: "25 hrs", active_timers: 0, approved: "28 hrs", pending: "0 hrs" },
];

export default function TimeLogsByEmployeePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Time Logs By Employee</h1>
            <p className="mt-1 text-xs font-bold text-gray-400">Employee totals, approvals, and active timer counts</p>
          </div>
          <Link href="/time-logs">
            <Button className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>

        <AdminDataTable
          title="Employee Time Summary"
          records={employeeLogs}
          getRecordKey={(record) => record.id}
          columns={[
            { header: "Employee", accessor: (record) => record.employee },
            { header: "Total Hours", accessor: (record) => record.total_hours },
            { header: "Billable", accessor: (record) => record.billable_hours },
            { header: "Approved", accessor: (record) => record.approved },
            { header: "Pending", accessor: (record) => record.pending },
            {
              header: "Active Timers",
              accessor: (record) => (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  <Clock className="mr-2 h-3.5 w-3.5" /> {record.active_timers}
                </span>
              ),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
