"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { buildSalarySlip, canGeneratePayrollForEmployee, departmentIdOf, employeeNameOf, formatCurrency, getMonthRange, monthName, toNumber, type PayrollRecord } from "@/lib/payroll-utils";

import MultipleAmountField from './MultipleAmountField';
import { createdSheetsKey, defaultTemplates, entryTotal, fieldForDepartment, readLocal, templateKey, type SalaryBreakdowns, type SalaryEntry, type SalaryTemplate } from '@/lib/salary-templates';

type ManualField = Exclude<keyof ManualValues, 'breakdowns' | 'customValues'>;
type ManualValues = {
  breakdowns?: SalaryBreakdowns;
  customValues?: Record<string, number | string>;
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
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  basicSalary: number;
  presentDays: number;
  absentDays: number;
};

const years = [2026, 2025, 2024, 2023];
const numberFields: (ManualField)[] = ["halfDays", "halfDayDeduction", "casualLeaves", "sickLeaves", "lateDays", "lateDeduction", "absenceDeduction", "penalties", "loanAdvance", "transportation", "parking", "bankCharges", "attendanceBonus", "commission", "monthlySpiffs", "weeklySpiffs"];

const headers = [
  "S.No", "Name", "Bank Account No", "Employment Type", "Basic Salary", "Days Present", "Half Day",
  "Half Day Deduction", "Casual Leaves", "Sick Leaves", "Late Days", "Late Deduction", "Absent Days",
  "Absence Deduction", "Penalties", "Loan / Advance / Other", "Transportation Allowance", "Parking Charges",
  "Bank Charges", "Attendance Bonus", "Net Basic Salary", "Commission / Others", "Monthly SPIFFs",
  "Total Salary (Payable)", "Weekly SPIFF (Cash)", "Total Amount",
];

const nested = (value: unknown) => value && typeof value === "object" ? value as PayrollRecord : undefined;
const pick = (record: PayrollRecord | undefined, keys: string[]) => keys.map((key) => record?.[key]).find((value) => value !== undefined && value !== null && value !== "");
const recordsFromResponse = (payload: unknown): PayrollRecord[] => {
  if (Array.isArray(payload)) return payload as PayrollRecord[];
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  return Array.isArray(data) ? data as PayrollRecord[] : [];
};
const isNotFound = (error: unknown) => {
  const response = nested(nested(error)?.response);
  return toNumber(response?.status) === 404;
};

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

const amount = (value: unknown) => Math.abs(toNumber(value));
const calculate = (row: SheetRow) => {
  const basicSalary = amount(row.basicSalary);
  const deductions = amount(row.halfDayDeduction) + amount(row.lateDeduction) + amount(row.absenceDeduction) + amount(row.penalties) + amount(row.loanAdvance) + amount(row.parking);
  const additions = amount(row.transportation) + amount(row.bankCharges) + amount(row.attendanceBonus);
  const netBasic = Math.max(0, basicSalary - deductions + additions);
  const totalSalary = netBasic + amount(row.commission) + amount(row.monthlySpiffs);
  return { netBasic, totalSalary, totalAmount: totalSalary + amount(row.weeklySpiffs) };
};

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
const cleanMoneyText = (value: unknown) => String(value ?? "")
  .replace(/-\s*PKR/g, "PKR")
  .replace(/PKR\s*-/g, "PKR ")
  .replace(/-\s*(?=\d)/g, "");
const money = (value: unknown) => cleanMoneyText(formatCurrency(amount(value)));
const sheetLines = (row: SheetRow, index: number) => {
  const calculated = calculate(row);
  const deductions = amount(row.halfDayDeduction) + amount(row.lateDeduction) + amount(row.absenceDeduction) + amount(row.penalties) + amount(row.loanAdvance) + amount(row.parking);
  return {
    title: row.employeeName,
    subtitle: `${row.departmentName || "Department"} - Sheet #${index + 1}`,
    total: money(calculated.totalSalary),
    lines: [
      ["Basic Salary", money(row.basicSalary)],
      ["Days Present", row.presentDays],
      ["Absent Days", row.absentDays],
      ["Deductions", money(deductions)],
      ["Net Basic", money(calculated.netBasic)],
      ["Payable", money(calculated.totalSalary)],
    ],
  };
};
const sheetHtml = (row: SheetRow, index: number) => {
  const data = sheetLines(row, index);
  return `<section class="sheet"><header><div><h1>${escapeHtml(data.title)}</h1><p>${escapeHtml(data.subtitle)}</p></div><strong>${escapeHtml(data.total)}</strong></header><table>${data.lines.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table></section>`;
};
const pdfText = (value: unknown) => cleanMoneyText(value).replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "-");
const pdfMoney = (value: unknown) => cleanMoneyText(value).replace("PKR", "PKR ");
const makePdf = (row: SheetRow, index: number) => {
  const data = sheetLines(row, index);
  const text = (x: number, y: number, size: number, value: unknown) => `BT /F1 ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`;
  const line = (x1: number, y1: number, x2: number, y2: number) => `${x1} ${y1} m ${x2} ${y2} l S`;
  const rect = (x: number, y: number, width: number, height: number) => `${x} ${y} ${width} ${height} re S`;
  const fill = (x: number, y: number, width: number, height: number, shade = "0.94") => `q ${shade} g ${x} ${y} ${width} ${height} re f Q`;
  const commands = [
    "0.10 0.16 0.24 RG 0.8 w",
    rect(36, 36, 523, 770),
    fill(36, 730, 523, 76, "0.95"),
    text(56, 776, 10, "SALARY SHEET"),
    text(56, 752, 22, data.title),
    text(56, 735, 10, data.subtitle),
    text(400, 772, 10, "TOTAL AMOUNT"),
    text(400, 748, 18, pdfMoney(data.total)),
    line(56, 710, 539, 710),
    text(56, 688, 12, "Employee Summary"),
    rect(56, 592, 483, 82),
    text(72, 652, 10, "Department"),
    text(230, 652, 10, row.departmentName || "Department"),
    text(72, 628, 10, "Employment Type"),
    text(230, 628, 10, row.employmentType || "Existing"),
    text(72, 604, 10, "Bank Account"),
    text(230, 604, 10, row.bankAccount || "-"),
    text(56, 566, 12, "Attendance"),
    fill(56, 516, 483, 36, "0.97"),
    text(72, 536, 10, `Days Present: ${row.presentDays}`),
    text(230, 536, 10, `Half Days: ${row.halfDays}`),
    text(380, 536, 10, `Absent Days: ${row.absentDays}`),
    text(56, 482, 12, "Salary Breakdown"),
  ];
  data.lines.forEach(([label, value], rowIndex) => {
    const y = 442 - rowIndex * 34;
    if (y < 96) return;
    commands.push(rowIndex % 2 === 0 ? fill(56, y - 8, 483, 28, "0.985") : "");
    commands.push(text(72, y, 10, label), text(380, y, 10, value), line(56, y - 14, 539, y - 14));
  });
  commands.push(fill(56, 56, 483, 34, "0.92"), text(72, 70, 10, "Generated from Lisam Solutions HRMS"));
  const stream = cleanMoneyText(commands.filter(Boolean).join("\n"));
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};
const downloadBlob = (blob: Blob, filename: string) => {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
};
const safeFilename = (value: string, fallback: string) => value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || fallback;
const downloadSheetPdf = (row: SheetRow, index: number) => downloadBlob(makePdf(row, index), `${safeFilename(row.employeeName, `sheet-${index + 1}`)}-salary-sheet.pdf`);
const printPdf = (title: string, rows: SheetRow[]) => {
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111827}.sheet{page-break-after:always;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px}.sheet:last-child{page-break-after:auto}header{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e5e7eb;padding-bottom:14px;margin-bottom:16px}h1{font-size:20px;margin:0}p{margin:6px 0 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em}strong{color:#047857}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #f3f4f6;padding:10px;text-align:left;font-size:13px}th{color:#6b7280;text-transform:uppercase;font-size:11px;letter-spacing:.08em}@media print{body{margin:0}.sheet{border:none;border-radius:0}}</style></head><body>${rows.map(sheetHtml).join("")}<script>window.onload=()=>{window.print();};<\/script></body></html>`);
  popup.document.close();
};
const printSeparatePdfs = (rows: SheetRow[]) => {
  rows.forEach((row, index) => {
    window.setTimeout(() => {
      downloadSheetPdf(row, index);
    }, index * 500);
  });
};
const localRowsFromStorage = (targetMonth: number, targetYear: number): SheetRow[] => {
  let stored: Record<string, unknown> = {};
  try { stored = JSON.parse(window.localStorage.getItem(createdSheetsKey) || "{}"); } catch { stored = {}; }
  return Object.values(stored).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as { id?: string; month?: number; year?: number; departmentId?: string; departmentName?: string; employeeId?: string; employeeName?: string; values?: ManualValues & { employeeId?: string; basicSalary?: number; presentDays?: number; absentDays?: number } };
    if (Number(record.month) !== targetMonth || Number(record.year) !== targetYear || !record.values) return [];
    return [{
      id: String(record.id || `local-${record.values.employeeId}`),
      employeeId: String(record.employeeId || record.values.employeeId || ""),
      ...blankManualValues({}),
      ...record.values,
      employeeName: String(record.employeeName || "Unknown Employee"),
      departmentId: String(record.departmentId || ""),
      departmentName: String(record.departmentName || ""),
      basicSalary: amount(record.values.basicSalary),
      presentDays: toNumber(record.values.presentDays),
      absentDays: toNumber(record.values.absentDays),
    }];
  });
};

export default function SalarySheetPage() {
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SalaryTemplate[]>(defaultTemplates);
  const [departments, setDepartments] = useState<PayrollRecord[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [slips, setSlips] = useState<PayrollRecord[]>([]);
  const [localRows, setLocalRows] = useState<SheetRow[]>([]);
  const [manual, setManual] = useState<Record<string, ManualValues>>({});
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SheetRow | null>(null);

  const loadSheet = useCallback(async () => {
    setLoading(true);
    setTemplates(readLocal(templateKey, defaultTemplates));
    setLocalRows(localRowsFromStorage(month, year));
    try {
      const [payrollResponse, departmentResponse] = await Promise.allSettled([
        api.get(`/payroll?month=${month}&year=${year}`),
        api.get("/departments"),
      ]);

      if (departmentResponse.status === "fulfilled") {
        setDepartments(recordsFromResponse(departmentResponse.value.data));
      }
      if (payrollResponse.status !== "fulfilled" && !isNotFound(payrollResponse.reason)) throw payrollResponse.reason;
      let records: PayrollRecord[] = payrollResponse.status === "fulfilled" ? recordsFromResponse(payrollResponse.value.data) : [];

      if (!records.length && payrollResponse.status === "rejected" && isNotFound(payrollResponse.reason)) {
        const monthRange = getMonthRange(year, month);
        const [employeeRes, salaryRes, salaryGroupRes, componentRes, employeeGroupRes, employeeCycleRes, cycleRes, settingRes, tdsRes] = await Promise.allSettled([
          api.get("/employees"),
          api.get("/employee-salaries"),
          api.get("/salary-groups"),
          api.get("/salary-components"),
          api.get("/employee-salary-groups"),
          api.get("/employee-payroll-cycles"),
          api.get("/payroll-cycles"),
          api.get("/payroll-settings"),
          api.get("/salary-tds"),
        ]);
        const employees = employeeRes.status === "fulfilled" ? recordsFromResponse(employeeRes.value.data) : [];
        const salaryRecords = salaryRes.status === "fulfilled" ? recordsFromResponse(salaryRes.value.data) : [];
        const employeeSalaryGroups = employeeGroupRes.status === "fulfilled" ? recordsFromResponse(employeeGroupRes.value.data) : [];

        records = employees
          .filter((employee) => canGeneratePayrollForEmployee(employee, salaryRecords, employeeSalaryGroups).ok)
          .map((employee) => {
            const slip = buildSalarySlip({
              employee,
              salaryRecords,
              salaryGroups: salaryGroupRes.status === "fulfilled" ? recordsFromResponse(salaryGroupRes.value.data) : [],
              salaryComponents: componentRes.status === "fulfilled" ? recordsFromResponse(componentRes.value.data) : [],
              employeeSalaryGroups,
              employeePayrollCycles: employeeCycleRes.status === "fulfilled" ? recordsFromResponse(employeeCycleRes.value.data) : [],
              payrollCycles: cycleRes.status === "fulfilled" ? recordsFromResponse(cycleRes.value.data) : [],
              attendance: [],
              leaves: [],
              holidays: [],
              expenses: [],
              timeLogs: [],
              settings: settingRes.status === "fulfilled" ? recordsFromResponse(settingRes.value.data)[0] : undefined,
              salaryTds: tdsRes.status === "fulfilled" ? recordsFromResponse(tdsRes.value.data) : [],
              year,
              month,
              startDate: monthRange.start,
              endDate: monthRange.end,
            });
            return { ...slip, employee, user: employee };
          });
      }
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

  const rows = useMemo<SheetRow[]>(() => [...localRows, ...slips.map((slip, index) => {
    const id = String(slip.id ?? `${slip.employee_id ?? slip.user_id}-${index}`);
    if (localRows.some((row) => row.id === id)) return null;
    const values = manual[id] || blankManualValues(slip);
    const employee = nested(slip.employee || slip.user);
    const employeeDepartment = nested(employee?.department) || nested(nested(employee?.employee_detail)?.department);
    const rowDepartmentId = String(departmentIdOf(employee) || employeeDepartment?.id || "");
    return {
      id, ...values,
      employeeId: String(employee?.id || slip.employee_id || slip.user_id || ""),
      departmentId: rowDepartmentId,
      departmentName: String(employeeDepartment?.name || employeeDepartment?.title || employee?.department_name || ''),
      employeeName: employeeNameOf((slip.employee || slip.user) as PayrollRecord),
      basicSalary: amount(slip.monthly_salary || slip.basic_salary),
      presentDays: toNumber(slip.present_days),
      absentDays: toNumber(slip.absent_days),
    };
  }).filter(Boolean) as SheetRow[]].filter((row) => {
    const matchesDepartment = !departmentId || row.departmentId === departmentId || row.departmentName === departments.find(department => String(department.id) === departmentId)?.name;
    const matchesSearch = row.employeeName.toLowerCase().includes(search.trim().toLowerCase());
    return matchesDepartment && matchesSearch;
  }), [departmentId, departments, localRows, manual, search, slips]);

  const totals = useMemo(() => rows.reduce((sum, row) => {
    const calculated = calculate(row);
    const amount = (value: unknown) => Math.max(0, toNumber(value));
    return { basic: sum.basic + amount(row.basicSalary), deductions: sum.deductions + amount(row.halfDayDeduction) + amount(row.lateDeduction) + amount(row.absenceDeduction) + amount(row.penalties) + amount(row.loanAdvance) + amount(row.parking), payable: sum.payable + calculated.totalSalary, grand: sum.grand + calculated.totalAmount };
  }, { basic: 0, deductions: 0, payable: 0, grand: 0 }), [rows]);

  const update = (id: string, field: ManualField, value: string) => {
    setManual((current) => ({ ...current, [id]: { ...(current[id] || {} as ManualValues), [field]: numberFields.includes(field) ? toNumber(value) : value } }));
  };

  const updateEntries = (id: string, field: ManualField, entries: SalaryEntry[]) => {
    const next = { ...manual, [id]: { ...manual[id], [field]: entryTotal(entries), breakdowns: { ...manual[id]?.breakdowns, [field]: entries } } };
    try {
      const stored = JSON.parse(localStorage.getItem('salary-sheet-manual-v1') || '{}');
      localStorage.setItem('salary-sheet-manual-v1', JSON.stringify({ ...stored, ...next }));
      setManual(next);
    } catch { showToast('Could not save the breakdown in this browser.', 'error'); }
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
  const deleteSheet = (row: SheetRow) => {
    let createdSheets: Record<string, unknown> = {};
    let manualSheets: Record<string, unknown> = {};
    try { createdSheets = JSON.parse(localStorage.getItem(createdSheetsKey) || "{}"); } catch { createdSheets = {}; }
    try { manualSheets = JSON.parse(localStorage.getItem("salary-sheet-manual-v1") || "{}"); } catch { manualSheets = {}; }
    delete createdSheets[row.id];
    delete createdSheets[`local-${row.departmentId}-${year}-${month}-${row.employeeId}`];
    delete manualSheets[row.id];
    delete manualSheets[`local-${row.departmentId}-${year}-${month}-${row.employeeId}`];
    localStorage.setItem(createdSheetsKey, JSON.stringify(createdSheets));
    localStorage.setItem("salary-sheet-manual-v1", JSON.stringify(manualSheets));
    setLocalRows((items) => items.filter((item) => item.id !== row.id && item.employeeId !== row.employeeId));
    setManual((current) => {
      const next = { ...current };
      delete next[row.id];
      delete next[`local-${row.departmentId}-${year}-${month}-${row.employeeId}`];
      return next;
    });
    showToast("Salary sheet deleted.", "success");
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/payroll" className="mt-1 rounded-xl border border-gray-100 bg-white p-2 text-gray-400 transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link>
            <div><h1 className="flex items-center gap-2 text-xl font-black text-gray-900"><FileSpreadsheet className="h-5 w-5 text-primary" /> Salary Sheet</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Salaries - Lisam · {monthName(month)} {year}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={loadSheet} className="h-10 px-3"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
            <Link href="/payroll/salary-sheet/create"><Button className="h-10 px-4"><FileSpreadsheet className="h-4 w-4" /> Create Salary Sheet</Button></Link>
            <Button onClick={() => printSeparatePdfs(rows)} disabled={!departmentId || !rows.length} className="h-10 px-4"><Download className="h-4 w-4" /> Download Sheets</Button>
            <Button onClick={exportCsv} disabled={!rows.length} className="h-10 px-4"><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ label: "Employees", value: rows.length }, { label: "Basic Salaries", value: formatCurrency(totals.basic) }, { label: "Total Deductions", value: formatCurrency(totals.deductions) }, { label: "Grand Total", value: formatCurrency(totals.grand) }].map((stat) => <Card key={stat.label} className="p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">{stat.label}</p><p className="mt-2 text-lg font-black text-gray-900">{stat.value}</p></Card>)}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-gray-100 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Monthly Salary Register</h2>
                <p className="mt-1 text-[10px] font-bold text-gray-400">White cells are sourced from payroll; blue cells are editable manual entries.</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
                <select aria-label="Department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="col-span-2 h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 sm:w-44">
                  <option value="">All departments</option>
                  {departments.map((department) => <option key={String(department.id)} value={String(department.id)}>{String(department.name || department.title || "Department")}</option>)}
                </select>
                <select aria-label="Salary month" value={month} onChange={(event) => setMonth(Number(event.target.value))} className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 sm:w-36">{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select>
                <select aria-label="Salary year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 sm:w-28">{Array.from(new Set([now.getFullYear(), ...years])).map((item) => <option key={item}>{item}</option>)}</select>
                <label className="relative col-span-2 block w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" className="h-10 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-xs font-bold outline-none focus:border-primary" /></label>
              </div>
            </div>
          </div>
          <div className="p-4">
            {loading ? <p className="py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading salary sheet...</p> : rows.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((row, index) => <SalaryCard key={row.id} row={row} index={index} month={month} year={year} onDelete={setDeleteTarget} />)}</div> : <p className="py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">No payroll records found for this period.</p>}
          </div>
        </Card>
        {deleteTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-black text-gray-900">Delete salary sheet?</h2>
            <p className="mt-2 text-sm text-gray-500">This will remove the saved sheet for <span className="font-bold text-gray-800">{deleteTarget.employeeName}</span>.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="h-10 rounded-xl border border-gray-200 px-4 text-xs font-black text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={() => deleteSheet(deleteTarget)} className="h-10 rounded-xl bg-red-600 px-4 text-xs font-black text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>}
      </div>
    </DashboardLayout>
  );
}

function SalaryCard({ row, index, month, year, onDelete }: { row: SheetRow; index: number; month: number; year: number; onDelete: (row: SheetRow) => void }) {
  const calculated = calculate(row);
  const editHref = `/payroll/salary-sheet/create?department=${encodeURIComponent(row.departmentId)}&employee=${encodeURIComponent(row.employeeId)}&month=${month}&year=${year}`;
  return <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-gray-900">{row.employeeName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{row.departmentName || "Department"} · Sheet #{index + 1}</p></div><span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{formatCurrency(calculated.totalAmount)}</span></div>
    <div className="grid grid-cols-2 gap-2 text-[11px]"><Info label="Basic Salary" value={formatCurrency(amount(row.basicSalary))} /><Info label="Days Present" value={row.presentDays} /><Info label="Absent Days" value={row.absentDays} /><Info label="Deductions" value={formatCurrency(amount(row.halfDayDeduction) + amount(row.lateDeduction) + amount(row.absenceDeduction) + amount(row.penalties) + amount(row.loanAdvance) + amount(row.parking))} /><Info label="Net Basic" value={formatCurrency(calculated.netBasic)} /><Info label="Payable" value={formatCurrency(calculated.totalSalary)} /></div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Link href={editHref} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-black text-gray-700 transition hover:bg-gray-50"><Pencil className="h-4 w-4" /> Edit</Link>
      <button type="button" onClick={() => downloadSheetPdf(row, index)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-black text-gray-700 transition hover:bg-gray-50"><Download className="h-4 w-4" /> Download</button>
      <button type="button" onClick={() => onDelete(row)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-black text-red-600 transition hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
    </div>
  </div>;
}

function SalaryRow({ row, index, update, updateEntries, templates }: { row: SheetRow; index: number; update: (id: string, field: ManualField, value: string) => void; updateEntries: (id: string, field: ManualField, entries: SalaryEntry[]) => void; templates: SalaryTemplate[] }) {
  const calculated = calculate(row);
  const manualInput = (field: ManualField, type: "text" | "number" = "number") => {
    const config = fieldForDepartment(templates, row.departmentName, field);
    if (type !== 'text' && (field === 'penalties' || config?.multiple || row.breakdowns?.[field])) return <MultipleAmountField label={`${row.employeeName} · ${config?.label || field}`} value={Number(row[field])} entries={row.breakdowns?.[field]} options={config?.options} onChange={entries => updateEntries(row.id, field, entries)} />;
    return <input type={type} min={type === "number" ? 0 : undefined} value={row[field]} onChange={(event) => update(row.id, field, event.target.value)} className="h-8 w-full min-w-24 rounded-lg border border-blue-100 bg-blue-50/60 px-2 font-bold text-slate-700 outline-none focus:border-primary focus:bg-white" />;
  };
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
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-lg bg-gray-50 p-2"><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 font-black text-gray-800">{value}</p></div>; }
