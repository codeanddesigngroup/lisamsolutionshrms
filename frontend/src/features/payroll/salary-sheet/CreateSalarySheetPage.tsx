"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { departmentIdOf, employeeIdOf, employeeNameOf, getEmployeeMonthlySalary, getMonthRange, monthName, toNumber, type PayrollRecord } from "@/lib/payroll-utils";
import { calculateAttendanceStatus, leaveUnits, type HRRecord, type ShiftDefinition } from "@/lib/hr-utils";

type FormState = {
  employeeId: string; bankAccount: string; employmentType: string; basicSalary: number; presentDays: number;
  halfDays: number; halfDayDeduction: number; casualLeaves: number; sickLeaves: number; lateDays: number;
  lateDeduction: number; absentDays: number; absenceDeduction: number; penalties: number; loanAdvance: number;
  transportation: number; parking: number; bankCharges: number; attendanceBonus: number; commission: number;
  monthlySpiffs: number; weeklySpiffs: number;
};

type EditableField = Exclude<keyof FormState, "employeeId">;

const now = new Date();
const inputClass = "h-9 w-32 rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-bold text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const initialRow: FormState = {
  employeeId: "", bankAccount: "", employmentType: "Existing", basicSalary: 0, presentDays: 0, halfDays: 0,
  halfDayDeduction: 0, casualLeaves: 0, sickLeaves: 0, lateDays: 0, lateDeduction: 0, absentDays: 0,
  absenceDeduction: 0, penalties: 0, loanAdvance: 0, transportation: 0, parking: 0, bankCharges: 0,
  attendanceBonus: 0, commission: 0, monthlySpiffs: 0, weeklySpiffs: 0,
};

const fields: { key: EditableField; label: string; type?: "text" | "number"; attendance?: boolean }[] = [
  { key: "bankAccount", label: "Bank Account", type: "text" }, { key: "employmentType", label: "Employment Type", type: "text" },
  { key: "basicSalary", label: "Basic Salary" }, { key: "presentDays", label: "Days Present", attendance: true },
  { key: "halfDays", label: "Half Days", attendance: true }, { key: "halfDayDeduction", label: "Half Day Deduction" },
  { key: "casualLeaves", label: "Casual Leaves", attendance: true }, { key: "sickLeaves", label: "Sick Leaves", attendance: true },
  { key: "lateDays", label: "Late Days", attendance: true }, { key: "lateDeduction", label: "Late Deduction" },
  { key: "absentDays", label: "Absent Days", attendance: true }, { key: "absenceDeduction", label: "Absence Deduction" },
  { key: "penalties", label: "Penalties" }, { key: "loanAdvance", label: "Loan / Advance" },
  { key: "transportation", label: "Transportation" }, { key: "parking", label: "Parking" },
  { key: "bankCharges", label: "Bank Charges" }, { key: "attendanceBonus", label: "Attendance Bonus" },
  { key: "commission", label: "Commission / Others" }, { key: "monthlySpiffs", label: "Monthly SPIFFs" },
  { key: "weeklySpiffs", label: "Weekly SPIFFs" },
];

const employeeDetail = (employee?: PayrollRecord) => employee?.employee_detail && typeof employee.employee_detail === "object" ? employee.employee_detail as PayrollRecord : undefined;
const recordsFromResponse = (payload: unknown): PayrollRecord[] => {
  if (Array.isArray(payload)) return payload as PayrollRecord[];
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  return Array.isArray(data) ? data as PayrollRecord[] : [];
};
const attendanceTime = (value: unknown) => {
  const text = String(value || "");
  if (text.includes("T")) return text.slice(11, 16);
  if (text.includes(" ")) return text.split(" ").at(-1)?.slice(0, 5) || "";
  return text.slice(0, 5);
};
const totalsFor = (row: FormState) => {
  const deductions = row.halfDayDeduction + row.lateDeduction + row.absenceDeduction + row.penalties + row.loanAdvance + row.parking;
  const additions = row.transportation + row.bankCharges + row.attendanceBonus;
  const netBasic = Math.max(0, row.basicSalary - deductions + additions);
  const totalSalary = netBasic + row.commission + row.monthlySpiffs;
  return { netBasic, totalSalary, totalAmount: totalSalary + row.weeklySpiffs };
};

export default function CreateSalarySheetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<PayrollRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<PayrollRecord[]>([]);
  const [cycles, setCycles] = useState<PayrollRecord[]>([]);
  const [rows, setRows] = useState<FormState[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([api.get("/departments"), api.get("/employees"), api.get("/employee-salaries"), api.get("/payroll-cycles")]);
      if (results[0].status === "fulfilled") setDepartments(recordsFromResponse(results[0].value.data));
      else showToast("Departments could not be fetched from the database.", "error");
      if (results[1].status === "fulfilled") setEmployees(recordsFromResponse(results[1].value.data));
      else showToast("Employees could not be fetched from the database.", "error");
      if (results[2].status === "fulfilled") setSalaryRecords(recordsFromResponse(results[2].value.data));
      if (results[3].status === "fulfilled") setCycles(recordsFromResponse(results[3].value.data));
      setLoading(false);
    };
    void load();
  }, [showToast]);

  const loadEmployeeRow = async (employee: PayrollRecord, targetMonth: number, targetYear: number): Promise<FormState> => {
    const employeeId = String(employee.id);
    const range = getMonthRange(targetYear, targetMonth);
    const detail = employeeDetail(employee);
    const row: FormState = { ...initialRow, employeeId, basicSalary: getEmployeeMonthlySalary(salaryRecords, employeeId, range.end), bankAccount: String(detail?.bank_account_number || detail?.account_number || employee.bank_account_number || ""), employmentType: String(detail?.employment_type || employee.employment_type || "Existing") };
    const [attendanceResult, leaveResult, holidayResult] = await Promise.allSettled([
      api.get(`/employees/${employeeId}/attendance`, { params: { limit: 500 } }),
      api.get("/leaves", { params: { employee_id: employeeId, start_date: range.start, end_date: range.end } }),
      api.get("/holidays", { params: { company_id: employee.company_id } }),
    ]);
    const attendance = attendanceResult.status === "fulfilled" ? recordsFromResponse(attendanceResult.value.data).filter((record) => {
      const date = String(record.workDate || record.work_date || record.date || "").slice(0, 10);
      return date >= range.start && date <= range.end;
    }) : [];
    const leaves = leaveResult.status === "fulfilled" ? recordsFromResponse(leaveResult.value.data) : [];
    const holidays = holidayResult.status === "fulfilled" ? recordsFromResponse(holidayResult.value.data) : [];
    const shift = (employee.shift_type && typeof employee.shift_type === "object" ? employee.shift_type : undefined) as ShiftDefinition | undefined;
    attendance.forEach((record) => {
      const checkIn = record.checkIn ?? record.check_in;
      if (!checkIn) return;
      const status = calculateAttendanceStatus({ status: String(record.status || ""), clock_in: attendanceTime(checkIn), clock_out: attendanceTime(record.checkOut ?? record.check_out), half_day: record.half_day === true, late: record.late === true, lateWaived: record.lateWaived === true || record.late_waived === true }, shift);
      if (status === "half-day") row.halfDays += 1;
      else if (status !== "absent") { row.presentDays += 1; if (status === "late") row.lateDays += 1; }
    });
    leaves.filter((leave) => String(leave.status || "").toLowerCase() === "approved").forEach((leave) => {
      const leaveType = leave.leave_type && typeof leave.leave_type === "object" ? leave.leave_type as PayrollRecord : undefined;
      const typeName = String(leaveType?.type_name || (leave.type && typeof leave.type === "object" ? (leave.type as PayrollRecord).type_name : leave.type) || "").toLowerCase();
      const units = leaveUnits(leave as HRRecord);
      if (typeName.includes("casual")) row.casualLeaves += units;
      if (typeName.includes("sick")) row.sickLeaves += units;
    });
    const attendedDates = new Set(attendance.map((record) => String(record.workDate || record.work_date || record.date || "").slice(0, 10)));
    const leaveDates = new Set(leaves.map((leave) => String(leave.leave_date || leave.date || "").slice(0, 10)).filter(Boolean));
    const holidayDates = new Set(holidays.map((holiday) => String(holiday.date || holiday.holiday_date || "").slice(0, 10)));
    const today = new Date().toISOString().slice(0, 10);
    const effectiveEnd = range.start <= today && today < range.end ? today : range.end;
    if (range.start <= today) {
      const cursor = new Date(`${range.start}T00:00:00Z`);
      const end = new Date(`${effectiveEnd}T00:00:00Z`);
      while (cursor <= end) {
        const date = cursor.toISOString().slice(0, 10);
        const weekday = cursor.getUTCDay();
        if (weekday >= 1 && weekday <= 5 && !attendedDates.has(date) && !leaveDates.has(date) && !holidayDates.has(date)) row.absentDays += 1;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    return row;
  };

  const loadDepartmentRows = async (id: string, targetMonth: number, targetYear: number) => {
    setRows([]);
    if (!id) return;
    const selected = employees.filter((employee) => String(departmentIdOf(employee)) === id);
    if (!selected.length) { showToast("No employees found in this department.", "error"); return; }
    setAttendanceLoading(true);
    try { setRows(await Promise.all(selected.map((employee) => loadEmployeeRow(employee, targetMonth, targetYear)))); }
    catch (error) { console.error("Load department salary rows error", error); showToast("Some employee payroll details could not be loaded.", "error"); }
    finally { setAttendanceLoading(false); }
  };

  const selectDepartment = (id: string) => {
    setDepartmentId(id);
    void loadDepartmentRows(id, month, year);
  };

  const updateRow = (index: number, key: EditableField, value: string) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: key === "bankAccount" || key === "employmentType" ? value : toNumber(value) } : row));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!departmentId || !rows.length) { showToast("Select a department with employees.", "error"); return; }
    setSaving(true);
    try {
      const range = getMonthRange(year, month);
      await api.post("/payroll/generate", { year, month, payroll_cycle: String(cycles[0]?.id || 1), salary_from: range.start, salary_to: range.end, userIds: rows.map((row) => row.employeeId), useAttendance: true, markApprovedLeavesPaid: true, markAbsentUnpaid: false, includeExpenseClaims: true, addTimelogs: false });
      const response = await api.get(`/payroll?month=${month}&year=${year}`);
      const slips = recordsFromResponse(response.data);
      let saved: Record<string, unknown> = {};
      try { saved = JSON.parse(window.localStorage.getItem("salary-sheet-manual-v1") || "{}"); } catch { saved = {}; }
      rows.forEach((row) => {
        const slip = slips.find((item) => String(item.employee_id || item.user_id || employeeIdOf((item.employee || item.user) as PayrollRecord)) === row.employeeId);
        if (!slip?.id) return;
        saved[String(slip.id)] = {
          bankAccount: row.bankAccount, employmentType: row.employmentType, halfDays: row.halfDays,
          halfDayDeduction: row.halfDayDeduction, casualLeaves: row.casualLeaves, sickLeaves: row.sickLeaves,
          lateDays: row.lateDays, lateDeduction: row.lateDeduction, absentDays: row.absentDays,
          absenceDeduction: row.absenceDeduction, penalties: row.penalties, loanAdvance: row.loanAdvance,
          transportation: row.transportation, parking: row.parking, bankCharges: row.bankCharges,
          attendanceBonus: row.attendanceBonus, commission: row.commission, monthlySpiffs: row.monthlySpiffs,
          weeklySpiffs: row.weeklySpiffs,
        };
      });
      window.localStorage.setItem("salary-sheet-manual-v1", JSON.stringify(saved));
      showToast("Department salary sheet created.", "success");
      router.push(`/payroll/salary-sheet?month=${month}&year=${year}`);
    } catch (error) { console.error("Create department salary sheet error", error); showToast("Department salary sheet could not be created. Check employee salary setups.", "error"); }
    finally { setSaving(false); }
  };

  return <DashboardLayout><form onSubmit={submit} className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Link href="/payroll/salary-sheet" className="mt-1 rounded-xl border border-gray-100 bg-white p-2 text-gray-400 hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link><div><h1 className="text-xl font-black text-gray-900">Create Department Salary Sheet</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Review and edit one salary row for every employee</p></div></div><Button type="submit" loading={saving} disabled={!rows.length || attendanceLoading} className="h-10 px-5"><Save className="h-4 w-4" /> Save Salary Sheet</Button></div>
    <Card><h2 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-800">Department & Payroll Period</h2><div className="grid gap-4 md:grid-cols-3">
      <Field label="Department"><select required disabled={loading} value={departmentId} onChange={(event) => selectDepartment(event.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold"><option value="">{loading ? "Loading departments..." : "Select department"}</option>{departments.map((department) => <option key={String(department.id)} value={String(department.id)}>{String(department.name || department.title || "Department")}</option>)}</select></Field>
      <Field label="Month"><select value={month} onChange={(event) => { const nextMonth = Number(event.target.value); setMonth(nextMonth); if (departmentId) void loadDepartmentRows(departmentId, nextMonth, year); }} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>)}</select></Field>
      <Field label="Year"><input type="number" value={year} onChange={(event) => { const nextYear = Number(event.target.value); setYear(nextYear); if (departmentId) void loadDepartmentRows(departmentId, month, nextYear); }} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold" /></Field>
    </div></Card>
    <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Employee Salary Rows</h2>{attendanceLoading && <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Loading employee attendance...</span>}</div>
      <div className="overflow-x-auto"><table className="min-w-max border-separate border-spacing-0 text-left"><thead><tr><th className="sticky left-0 z-20 border-b bg-gray-50 px-3 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Employee</th>{fields.map((field) => <Fragment key={field.key}><th className="border-b bg-gray-50 px-2 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">{field.label}{field.attendance && <span className="ml-1 text-blue-500">*</span>}</th>{field.key === "attendanceBonus" && <th className="border-b bg-emerald-50 px-3 py-3 text-[9px] font-black uppercase tracking-wider text-emerald-700">Net Basic Salary</th>}{field.key === "monthlySpiffs" && <th className="border-b bg-emerald-50 px-3 py-3 text-[9px] font-black uppercase tracking-wider text-emerald-700">Total Salary (Payable)</th>}</Fragment>)}<th className="border-b bg-emerald-50 px-3 py-3 text-[9px] font-black uppercase tracking-wider text-emerald-700">Total Amount</th></tr></thead>
      <tbody>{rows.map((row, index) => { const employee = employees.find((item) => String(item.id) === row.employeeId); const totals = totalsFor(row); return <tr key={row.employeeId}><td className="sticky left-0 z-10 min-w-44 border-b bg-white px-3 py-2 text-xs font-black text-gray-800">{employeeNameOf(employee)}</td>{fields.map((field) => <Fragment key={field.key}><td className="border-b px-2 py-2"><input required type={field.type || "number"} min={field.type === "text" ? undefined : 0} step={field.type === "text" ? undefined : "0.01"} value={row[field.key]} onChange={(event) => updateRow(index, field.key, event.target.value)} className={inputClass} /></td>{field.key === "attendanceBonus" && <CalculatedCell value={totals.netBasic} />}{field.key === "monthlySpiffs" && <CalculatedCell value={totals.totalSalary} />}</Fragment>)}<CalculatedCell value={totals.totalAmount} /></tr>; })}</tbody></table></div>
      {!attendanceLoading && departmentId && !rows.length && <p className="py-12 text-center text-xs font-black uppercase tracking-widest text-gray-400">No employees found in this department.</p>}
      {!departmentId && <p className="py-12 text-center text-xs font-black uppercase tracking-widest text-gray-400">Select a department to load employees.</p>}
    </Card>
  </form></DashboardLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</span>{children}</label>; }
function CalculatedCell({ value }: { value: number }) { return <td className="whitespace-nowrap border-b bg-emerald-50/50 px-3 py-2 text-xs font-black text-emerald-700">PKR {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>; }
