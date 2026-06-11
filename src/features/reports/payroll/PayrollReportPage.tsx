"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { employeeNameOf, formatCurrency, monthName, payrollStatuses, toNumber, type PayrollRecord } from "@/lib/payroll-utils";
import { Download, FileText, RefreshCw, Search, Wallet } from "lucide-react";

export default function PayrollReportPage() {
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<PayrollRecord[]>([]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [employeeId, setEmployeeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const [payrollRes, employeeRes] = await Promise.all([
        api.get(`/payroll?year=${year}&month=${month}`),
        api.get("/employees"),
      ]);
      setSlips(payrollRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReport();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReport]);

  const filteredSlips = useMemo(() => {
    const query = search.trim().toLowerCase();
    return slips.filter((slip) => {
      const employeeMatch = employeeId === "all" || String(slip.employee_id || slip.user_id) === employeeId;
      const statusMatch = status === "all" || String(slip.status) === status;
      const searchMatch = !query || JSON.stringify(slip).toLowerCase().includes(query);
      return employeeMatch && statusMatch && searchMatch;
    });
  }, [slips, employeeId, status, search]);

  const totals = useMemo(
    () => ({
      gross: filteredSlips.reduce((total, slip) => total + toNumber(slip.gross_salary), 0),
      deductions: filteredSlips.reduce((total, slip) => total + toNumber(slip.total_deductions), 0),
      expenses: filteredSlips.reduce((total, slip) => total + toNumber(slip.expense_claims), 0),
      net: filteredSlips.reduce((total, slip) => total + toNumber(slip.net_salary), 0),
    }),
    [filteredSlips],
  );

  const exportCsv = () => {
    const rows = [
      ["Employee", "Period", "Basic", "Gross", "Deductions", "Expense Claims", "TDS", "Net", "Status", "Paid On"],
      ...filteredSlips.map((slip) => [
        employeeNameOf(slip.employee as PayrollRecord),
        `${monthName(slip.month as number)} ${slip.year}`,
        String(slip.basic_salary || 0),
        String(slip.gross_salary || 0),
        String(slip.total_deductions || 0),
        String(slip.expense_claims || 0),
        String(slip.tds || 0),
        String(slip.net_salary || 0),
        String(slip.status || ""),
        String(slip.paid_on || ""),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll-report-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <FileText className="h-5 w-5 mr-3 text-primary" />
              Payroll Report
            </h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/reports" className="hover:text-primary transition-colors">Reports</Link>
              <span>/</span>
              <span className="text-gray-700">Payroll Report</span>
            </div>
          </div>
          <Button onClick={exportCsv} className="bg-primary text-white text-[10px] h-10 px-6 uppercase tracking-widest font-black shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <Card className="p-6 bg-white border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Year</label>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white outline-none focus:border-primary">
                {[2026, 2025, 2024, 2023].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Month</label>
              <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white outline-none focus:border-primary">
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Employee</label>
              <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white outline-none focus:border-primary">
                <option value="all">All Employees</option>
                {employees.map((employee) => <option key={String(employee.id)} value={String(employee.id)}>{employeeNameOf(employee)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white outline-none focus:border-primary">
                <option value="all">All Status</option>
                {payrollStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search report data..." className="w-full text-xs border border-gray-200 rounded-xl p-2.5 pl-10 bg-white outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            ["Gross Salary", totals.gross, "text-blue-600"],
            ["Deductions", totals.deductions, "text-red-500"],
            ["Expenses", totals.expenses, "text-amber-600"],
            ["Net Payable", totals.net, "text-primary"],
          ].map(([label, value, color]) => (
            <Card key={String(label)} className="border-none shadow-sm bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(label)}</p>
                  <p className={`text-2xl font-black mt-2 ${String(color)}`}>{formatCurrency(value)}</p>
                </div>
                <Wallet className={`h-6 w-6 ${String(color)}`} />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-0 overflow-hidden shadow-sm border border-gray-100 bg-white">
          <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Payroll Summary</h3>
            <button type="button" onClick={fetchReport} className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-white">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Employee", "Period", "Basic", "Gross", "Deductions", "Expenses", "Net Payable", "Status"].map((header) => (
                    <th key={header} className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading report...</td></tr>
                ) : filteredSlips.length ? (
                  filteredSlips.map((slip) => (
                    <tr key={String(slip.id)} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-gray-800">{employeeNameOf(slip.employee as PayrollRecord)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">{monthName(slip.month as number)} {String(slip.year)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">{formatCurrency(slip.basic_salary)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-blue-600">{formatCurrency(slip.gross_salary)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-red-500">{formatCurrency(slip.total_deductions)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-amber-600">{formatCurrency(slip.expense_claims)}</td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">{formatCurrency(slip.net_salary)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-600">{String(slip.status)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} className="px-6 py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">No payroll records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
