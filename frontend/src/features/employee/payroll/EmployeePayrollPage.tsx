"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { employeeNameOf, formatCurrency, monthName, toNumber, type PayrollRecord } from "@/lib/payroll-utils";
import { Download, Eye, FileText, RefreshCw, Wallet } from "lucide-react";

const getSalaryJson = (slip: PayrollRecord) => {
  const raw = slip.salary_json;
  return raw && typeof raw === "object" ? (raw as { earnings?: PayrollRecord[]; deductions?: PayrollRecord[] }) : {};
};

export default function EmployeePayrollPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState<PayrollRecord[]>([]);
  const [activeSlip, setActiveSlip] = useState<PayrollRecord | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/payroll");
      setSlips(response.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayslips();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPayslips]);

  const mySlips = useMemo(() => {
    const userId = String(user?.id || "");
    return slips
      .filter((slip) => String(slip.employee_id || slip.user_id) === userId)
      .filter((slip) => String(slip.status) !== "generated")
      .sort((a, b) => String(b.salary_from || "").localeCompare(String(a.salary_from || "")));
  }, [slips, user?.id]);

  const totals = useMemo(
    () => ({
      paid: mySlips.filter((slip) => slip.status === "paid").reduce((total, slip) => total + toNumber(slip.net_salary), 0),
      pending: mySlips.filter((slip) => slip.status !== "paid").reduce((total, slip) => total + toNumber(slip.net_salary), 0),
      deductions: mySlips.reduce((total, slip) => total + toNumber(slip.total_deductions), 0),
    }),
    [mySlips],
  );

  const exportSlip = (slip: PayrollRecord) => {
    const rows = [
      ["Employee", employeeNameOf(slip.employee as PayrollRecord)],
      ["Period", `${monthName(slip.month as number)} ${slip.year}`],
      ["Basic Salary", String(slip.basic_salary || 0)],
      ["Gross Salary", String(slip.gross_salary || 0)],
      ["Deductions", String(slip.total_deductions || 0)],
      ["Net Payable", String(slip.net_salary || 0)],
      ["Status", String(slip.status || "")],
      ["Paid On", String(slip.paid_on || "")],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `my-payslip-${slip.year}-${String(slip.month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 -mx-6 -mt-6">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <Wallet className="h-5 w-5 mr-3 text-primary" />
              My Payslips
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Review locked and paid salary slips shared by payroll admins.</p>
          </div>
          <Button onClick={fetchPayslips} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            ["Paid Salary", totals.paid, "text-green-600"],
            ["Pending Release", totals.pending, "text-amber-600"],
            ["Total Deductions", totals.deductions, "text-red-500"],
          ].map(([label, value, color]) => (
            <Card key={String(label)} className="border-none shadow-sm p-5 bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(label)}</p>
              <p className={`text-2xl font-black mt-2 ${String(color)}`}>{formatCurrency(value)}</p>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Payslip History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Period", "Pay Days", "Gross", "Deductions", "Net", "Status", "Actions"].map((header) => (
                    <th key={header} className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading payslips...</td></tr>
                ) : mySlips.length ? (
                  mySlips.map((slip) => (
                    <tr key={String(slip.id)} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4 text-xs font-black text-gray-800">{monthName(slip.month as number)} {String(slip.year)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-600">{String(slip.pay_days || 0)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-blue-600">{formatCurrency(slip.gross_salary)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-red-500">{formatCurrency(slip.total_deductions)}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-900">{formatCurrency(slip.net_salary)}</td>
                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-600">{String(slip.status)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setActiveSlip(slip)} className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"><Eye className="h-4 w-4" /></button>
                          <button type="button" onClick={() => exportSlip(slip)} className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50"><Download className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-20 text-center">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">No released payslips yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={Boolean(activeSlip)} onClose={() => setActiveSlip(null)} title="Payslip Detail" size="lg">
        {activeSlip && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                ["Basic", activeSlip.basic_salary],
                ["Gross", activeSlip.gross_salary],
                ["Deductions", activeSlip.total_deductions],
                ["Net", activeSlip.net_salary],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(label)}</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{formatCurrency(value)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-700"><span>Basic Salary</span><span>{formatCurrency(activeSlip.basic_salary)}</span></div>
                  {(getSalaryJson(activeSlip).earnings || []).map((item) => (
                    <div key={String(item.id)} className="flex justify-between text-xs font-bold text-gray-600">
                      <span>{String(item.title || item.component_name)}</span>
                      <span className="text-green-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Deductions</h3>
                <div className="space-y-3">
                  {(getSalaryJson(activeSlip).deductions || []).map((item) => (
                    <div key={String(item.id)} className="flex justify-between text-xs font-bold text-gray-600">
                      <span>{String(item.title || item.component_name)}</span>
                      <span className="text-red-500">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
