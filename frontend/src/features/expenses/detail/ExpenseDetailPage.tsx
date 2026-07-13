"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, DollarSign, FileText, FolderOpen, Receipt, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/payroll-utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminFileManager from "@/components/admin/AdminFileManager";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";
import apiClient from "@/lib/api-client";

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

export default function ExpenseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState("pending");
  const expense = useMemo(() => ({
    id: params.id || "preview",
    item_name: "Software Subscription",
    employee: "John Doe",
    category: "Tools",
    project: "Website Redesign",
    purchase_date: "2026-05-05",
    price: 249,
    description: "Monthly design and development tool subscription.",
    files: [{ id: "receipt-1", filename: "receipt.pdf", size: "120 KB", created_at: "2026-05-05T09:00:00.000Z" }],
  }), [params.id]);

  const updateExpenseStatus = (nextStatus: "approved" | "rejected") => {
    setStatus(nextStatus);
    apiClient.action("expenses", String(expense.id), nextStatus === "approved" ? "approve" : "reject", {}).catch((err) => {
      console.warn("Expense approval endpoint pending:", err);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Expense #{expense.id}</h1>
            <p className="mt-1 text-xs font-bold text-gray-400">Receipt, category, project, and approval workflow</p>
          </div>
          <Button onClick={() => router.push("/expenses")} className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Expense Details" className="border-none bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {([
                  { label: "Item", value: expense.item_name, Icon: Receipt },
                  { label: "Employee", value: expense.employee, Icon: FileText },
                  { label: "Category", value: expense.category, Icon: FolderOpen },
                  { label: "Project", value: expense.project, Icon: FolderOpen },
                  { label: "Purchase Date", value: expense.purchase_date, Icon: FileText },
                  { label: "Amount", value: formatCurrency(expense.price), Icon: DollarSign },
                ] satisfies DetailField[]).map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-2xl bg-gray-50 p-4">
                    <Icon className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-1 text-sm font-black text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm font-medium leading-relaxed text-gray-600">{expense.description}</p>
            </Card>

            <AdminFileManager title="Expense Receipts" description="Receipt upload, preview, download, and delete controls." files={expense.files} />
          </div>

          <Card title="Approval" className="h-fit border-none bg-white p-6 shadow-sm">
            <span className={`${statusClasses[status]} mb-4 block rounded-full px-3 py-1 text-center text-[10px] font-black uppercase tracking-widest`}>
              {status}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateExpenseStatus("approved")} className="flex h-10 items-center justify-center rounded-xl bg-green-50 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </button>
              <button onClick={() => updateExpenseStatus("rejected")} className="flex h-10 items-center justify-center rounded-xl bg-red-50 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white">
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
