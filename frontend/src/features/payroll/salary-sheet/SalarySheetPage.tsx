"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, RefreshCw, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { employeeNameOf, formatCurrency, monthName, toNumber, type PayrollRecord } from "@/lib/payroll-utils";

type ManualValues = {
  bankAccount: string;
  employmentType: string;
  halfDays: number;
  halfDayDeduction: number;
  casualLeaves: number;
  sickLeaves: number;
  lateDays: number;
  lateDeduction: number;
  absenceDeduction: number;
  penalties: number;
  loanAdvance: number;
  transportation: number;
  parking: number;
  bankCharges: number;
  attendanceBonus: number;
  commission: number;
  monthlySpiffs: number;
  weeklySpiffs: number;
};

type SheetRow = ManualValues & {
  id: string;
  employeeName: string;
  basicSalary: number;
  presentDays: number;
  absentDays: number;
};

const years = [2026, 2025, 2024, 2023];
const numberFields: (keyof ManualValues)[] = ["halfDays", "halfDayDeduction", "casualLeaves", "sickLeaves", "lateDays", "lateDeduction", "absenceDeduction", "penalties", "loanAdvance", "transportation", "parking", "bankCharges", "attendanceBonus", "commission", "monthlySpiffs", "weeklySpiffs"];

const headers = [
  "S.No", "Name", "Bank Account No", "Employment Type", "Basic Salary", "Days Present", "Half Day",
  "Half Day Deduction", "Casual Leaves", "Sick Leaves", "Late Days", "Late Deduction", "Absent Days",
  "Absence Deduction", "Penalties", "Loan / Advance / Other", "Transportation Allowance", "Parking Charges",
  "Bank Charges", "Attendance Bonus", "Net Basic Salary", "Commission / Others", "Monthly SPIFFs",
  "Total Salary (Payable)", "Weekly SPIFF (Cash)", "Total Amount",
];

const nested = (value: unknown) => value && typeof value === "object" ? value as PayrollRecord : undefined;
const pick = (record: PayrollRecord | undefined, keys: string[]) => keys.map((key) => record?.[key]).find((value) => value !== undefined && value !== null && value !== "");

const blankManualValues = (slip: PayrollRecord): ManualValues => {
  const employee = nested(slip.employee) || nested(slip.user);
  const detail = nested(employee?.employee_detail);
  const attendance = nested(nested(slip.salary_json)?.attendance_summary);
  return {
    bankAccount: String(pick(detail, ["bank_account_number", "account_number", "bank_account_no"]) || pick(employee, ["bank_account_number", "account_number"]) || ""),
    employmentType: String(pick(detail, ["employment_type", "contract_type"]) || pick(employee, ["employment_type"]) || "Existing"),
    halfDays: toNumber(pick(attendance, ["half_days"])), halfDayDeduction: 0,
    casualLeaves: 0, sickLeaves: toNumber(pick(attendance, ["leave_days"])), lateDays: 0, lateDeduction: 0,
    absenceDeduction: Math.max(0, toNumber(slip.monthly_salary) - toNumber(slip.basic_salary)), penalties: 0,
    loanAdvance: 0, transportation: 0, parking: 0, bankCharges: 0, attendanceBonus: 0,
    commission: 0, monthlySpiffs: 0, weeklySpiffs: 0,
  };
};

const calculate = (row: SheetRow) => {
  const deductions = row.halfDayDeduction + row.lateDeduction + row.absenceDeduction + row.penalties + row.loanAdvance + row.parking;
  const additions = row.transportation + row.bankCharges + row.attendanceBonus;
  const netBasic = Math.max(0, row.basicSalary - deductions + additions);
  const totalSalary = netBasic + row.commission + row.monthlySpiffs;
  return { netBasic, totalSalary, totalAmount: totalSalary + row.weeklySpiffs };
};

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function SalarySheetPage() {
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState<PayrollRecord[]>([]);
  const [manual, setManual] = useState<Record<string, ManualValues>>({});
  const [search, setSearch] = useState("");

  const loadSheet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payroll?month=${month}&year=${year}`);
      const records: PayrollRecord[] = response.data.data || [];
      setSlips(records);
      setManual((current) => {
        let saved: Record<string, ManualValues> = {};
        try { saved = JSON.parse(window.localStorage.getItem("salary-sheet-manual-v1") || "{}"); } catch { saved = {}; }
        const next = { ...current, ...saved };
        records.forEach((slip, index) => {
          const id = String(slip.id ?? `${slip.employee_id ?? slip.user_id}-${index}`);
          if (!next[id]) next[id] = blankManualValues(slip);
        });
        return next;
      });
    } catch (error) {
      console.error("Salary sheet fetch error", error);
      showToast("Salary sheet could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  }, [month, showToast, year]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadSheet(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSheet]);

  const rows = useMemo<SheetRow[]>(() => slips.map((slip, index) => {
    const id = String(slip.id ?? `${slip.employee_id ?? slip.user_id}-${index}`);
    const values = manual[id] || blankManualValues(slip);
    return {
      id, ...values,
      employeeName: employeeNameOf((slip.employee || slip.user) as PayrollRecord),
      basicSalary: toNumber(slip.monthly_salary || slip.basic_salary),
      presentDays: toNumber(slip.present_days),
      absentDays: toNumber(slip.absent_days),
    };
  }).filter((row) => row.employeeName.toLowerCase().includes(search.trim().toLowerCase())), [manual, search, slips]);

  const totals = useMemo(() => rows.reduce((sum, row) => {
    const calculated = calculate(row);
    return { basic: sum.basic + row.basicSalary, deductions: sum.deductions + row.halfDayDeduction + row.lateDeduction + row.absenceDeduction + row.penalties + row.loanAdvance + row.parking, payable: sum.payable + calculated.totalSalary, grand: sum.grand + calculated.totalAmount };
  }, { basic: 0, deductions: 0, payable: 0, grand: 0 }), [rows]);

  const update = (id: string, field: keyof ManualValues, value: string) => {
    setManual((current) => ({ ...current, [id]: { ...(current[id] || {} as ManualValues), [field]: numberFields.includes(field) ? toNumber(value) : value } }));
  };

  const exportCsv = () => {
    const body = rows.map((row, index) => {
      const c = calculate(row);
      return [index + 1, row.employeeName, row.bankAccount, row.employmentType, row.basicSalary, row.presentDays, row.halfDays, row.halfDayDeduction, row.casualLeaves, row.sickLeaves, row.lateDays, row.lateDeduction, row.absentDays, row.absenceDeduction, row.penalties, row.loanAdvance, row.transportation, row.parking, row.bankCharges, row.attendanceBonus, c.netBasic, row.commission, row.monthlySpiffs, c.totalSalary, row.weeklySpiffs, c.totalAmount];
    });
    const csv = [headers, ...body].map((line) => line.map(csvCell).join(",")).join("\n");
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    anchor.download = `salary-sheet-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/payroll" className="mt-1 rounded-xl border border-gray-100 bg-white p-2 text-gray-400 transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link>
            <div><h1 className="flex items-center gap-2 text-xl font-black text-gray-900"><FileSpreadsheet className="h-5 w-5 text-primary" /> Salary Sheet</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Salaries - Telecom · {monthName(month)} {year}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700">{Array.from(new Set([now.getFullYear(), ...years])).map((item) => <option key={item}>{item}</option>)}</select>
            <Button onClick={loadSheet} className="h-10 px-3"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
            <Link href="/payroll/salary-sheet/create"><Button className="h-10 px-4"><FileSpreadsheet className="h-4 w-4" /> Create Salary Sheet</Button></Link>
            <Button onClick={exportCsv} disabled={!rows.length} className="h-10 px-4"><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ label: "Employees", value: rows.length }, { label: "Basic Salaries", value: formatCurrency(totals.basic) }, { label: "Total Deductions", value: formatCurrency(totals.deductions) }, { label: "Grand Total", value: formatCurrency(totals.grand) }].map((stat) => <Card key={stat.label} className="p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">{stat.label}</p><p className="mt-2 text-lg font-black text-gray-900">{stat.value}</p></Card>)}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Monthly Salary Register</h2><p className="mt-1 text-[10px] font-bold text-gray-400">White cells are sourced from payroll; blue cells are editable manual entries.</p></div>
            <label className="relative block w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-bold outline-none focus:border-primary" /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[3600px] border-collapse text-[10px]">
              <thead><tr className="bg-slate-800 text-white">{headers.map((header, index) => <th key={header} className={`border-r border-slate-700 px-2 py-3 text-left font-black uppercase tracking-wide ${index === 1 ? "sticky left-0 z-20 min-w-44 bg-slate-800" : "min-w-28"}`}>{header}</th>)}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={headers.length} className="py-16 text-center font-black uppercase tracking-widest text-gray-400">Loading salary sheet...</td></tr> : rows.length ? rows.map((row, index) => <SalaryRow key={row.id} row={row} index={index} update={update} />) : <tr><td colSpan={headers.length} className="py-16 text-center font-black uppercase tracking-widest text-gray-400">No payroll records found for this period.</td></tr>}
              </tbody>
              {!!rows.length && <tfoot><tr className="bg-slate-50 font-black text-slate-800"><td className="px-2 py-4" /><td className="sticky left-0 bg-slate-50 px-2 py-4 uppercase">Totals</td><td colSpan={2} /><MoneyCell value={totals.basic} /><td colSpan={9} /><MoneyCell value={totals.deductions} /><td colSpan={8} /><MoneyCell value={totals.payable} /><td /><MoneyCell value={totals.grand} /></tr></tfoot>}
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SalaryRow({ row, index, update }: { row: SheetRow; index: number; update: (id: string, field: keyof ManualValues, value: string) => void }) {
  const calculated = calculate(row);
  const manualInput = (field: keyof ManualValues, type: "text" | "number" = "number") => <input type={type} min={type === "number" ? 0 : undefined} value={row[field]} onChange={(event) => update(row.id, field, event.target.value)} className="h-8 w-full min-w-24 rounded-lg border border-blue-100 bg-blue-50/60 px-2 font-bold text-slate-700 outline-none focus:border-primary focus:bg-white" />;
  return <tr className="border-b border-gray-100 hover:bg-slate-50/60">
    <td className="px-2 py-2 font-black text-gray-400">{index + 1}</td><td className="sticky left-0 z-10 bg-white px-2 py-2 font-black text-gray-900">{row.employeeName}</td>
    <td className="px-2 py-2">{manualInput("bankAccount", "text")}</td><td className="px-2 py-2">{manualInput("employmentType", "text")}</td><MoneyCell value={row.basicSalary} /><NumberCell value={row.presentDays} />
    <td className="px-2 py-2">{manualInput("halfDays")}</td><td className="px-2 py-2">{manualInput("halfDayDeduction")}</td><td className="px-2 py-2">{manualInput("casualLeaves")}</td><td className="px-2 py-2">{manualInput("sickLeaves")}</td><td className="px-2 py-2">{manualInput("lateDays")}</td><td className="px-2 py-2">{manualInput("lateDeduction")}</td><NumberCell value={row.absentDays} />
    <td className="px-2 py-2">{manualInput("absenceDeduction")}</td><td className="px-2 py-2">{manualInput("penalties")}</td><td className="px-2 py-2">{manualInput("loanAdvance")}</td><td className="px-2 py-2">{manualInput("transportation")}</td><td className="px-2 py-2">{manualInput("parking")}</td><td className="px-2 py-2">{manualInput("bankCharges")}</td><td className="px-2 py-2">{manualInput("attendanceBonus")}</td><MoneyCell value={calculated.netBasic} strong />
    <td className="px-2 py-2">{manualInput("commission")}</td><td className="px-2 py-2">{manualInput("monthlySpiffs")}</td><MoneyCell value={calculated.totalSalary} strong /><td className="px-2 py-2">{manualInput("weeklySpiffs")}</td><MoneyCell value={calculated.totalAmount} strong />
  </tr>;
}

function MoneyCell({ value, strong = false }: { value: number; strong?: boolean }) { return <td className={`px-2 py-2 tabular-nums ${strong ? "bg-emerald-50 font-black text-emerald-700" : "font-bold text-slate-700"}`}>{formatCurrency(value)}</td>; }
function NumberCell({ value }: { value: number }) { return <td className="px-2 py-2 font-bold tabular-nums text-slate-700">{value}</td>; }
