"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { employeeIdOf, employeeNameOf, getEmployeeMonthlySalary, getMonthRange, monthName, toNumber, type PayrollRecord } from "@/lib/payroll-utils";
import { calculateAttendanceStatus, leaveUnits, type HRRecord, type ShiftDefinition } from "@/lib/hr-utils";

type FormState = {
  employeeId: string; month: number; year: number; bankAccount: string; employmentType: string;
  basicSalary: number; presentDays: number; halfDays: number; halfDayDeduction: number; casualLeaves: number;
  sickLeaves: number; lateDays: number; lateDeduction: number; absentDays: number; absenceDeduction: number;
  penalties: number; loanAdvance: number; transportation: number; parking: number; bankCharges: number;
  attendanceBonus: number; commission: number; monthlySpiffs: number; weeklySpiffs: number;
};

const now = new Date();
const inputClass = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10";
const initial: FormState = {
  employeeId: "", month: now.getMonth() + 1, year: now.getFullYear(), bankAccount: "", employmentType: "Existing",
  basicSalary: 0, presentDays: 0, halfDays: 0, halfDayDeduction: 0, casualLeaves: 0, sickLeaves: 0,
  lateDays: 0, lateDeduction: 0, absentDays: 0, absenceDeduction: 0, penalties: 0, loanAdvance: 0,
  transportation: 0, parking: 0, bankCharges: 0, attendanceBonus: 0, commission: 0, monthlySpiffs: 0, weeklySpiffs: 0,
};

const fields: { key: keyof FormState; label: string; type?: "text" | "number"; hint?: string }[] = [
  { key: "bankAccount", label: "Bank Account No", type: "text" }, { key: "employmentType", label: "Employment Type (New / Existing)", type: "text" },
  { key: "basicSalary", label: "Basic Salary" }, { key: "presentDays", label: "Days Present", hint: "Attendance" },
  { key: "halfDays", label: "Half Days", hint: "Attendance" }, { key: "halfDayDeduction", label: "Deduction for Half Days" },
  { key: "casualLeaves", label: "Casual Leaves Availed", hint: "Attendance" }, { key: "sickLeaves", label: "Sick Leaves Availed", hint: "Attendance" },
  { key: "lateDays", label: "Late Days", hint: "Attendance" }, { key: "lateDeduction", label: "Deduction for Lates" },
  { key: "absentDays", label: "Absent Days", hint: "Attendance" }, { key: "absenceDeduction", label: "Deduction for Absences" },
  { key: "penalties", label: "Penalties" }, { key: "loanAdvance", label: "Loan / Advance Salary / Other Amounts" },
  { key: "transportation", label: "Transportation Allowance" }, { key: "parking", label: "Parking Charges" },
  { key: "bankCharges", label: "Bank Charges" }, { key: "attendanceBonus", label: "Attendance Bonus" },
  { key: "commission", label: "Commission / Others" }, { key: "monthlySpiffs", label: "Monthly SPIFFs" },
  { key: "weeklySpiffs", label: "Weekly SPIFF Amount (Cash)" },
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

export default function CreateSalarySheetPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(initial);
  const [employees, setEmployees] = useState<PayrollRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<PayrollRecord[]>([]);
  const [cycles, setCycles] = useState<PayrollRecord[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [employeeResult, salaryResult, cycleResult] = await Promise.allSettled([
        api.get("/employees"),
        api.get("/employee-salaries"),
        api.get("/payroll-cycles"),
      ]);

      if (employeeResult.status === "fulfilled") {
        setEmployees(recordsFromResponse(employeeResult.value.data));
      } else {
        console.error("Fetch employees error", employeeResult.reason);
        showToast("Employees could not be fetched from the database.", "error");
      }

      if (salaryResult.status === "fulfilled") setSalaryRecords(recordsFromResponse(salaryResult.value.data));
      else console.error("Fetch employee salaries error", salaryResult.reason);

      if (cycleResult.status === "fulfilled") setCycles(recordsFromResponse(cycleResult.value.data));
      else console.error("Fetch payroll cycles error", cycleResult.reason);

      setEmployeesLoading(false);
    };
    void load();
  }, [showToast]);

  useEffect(() => {
    if (!form.employeeId) return;
    let cancelled = false;

    const loadAttendanceFields = async () => {
      setAttendanceLoading(true);
      const employee = employees.find((item) => String(item.id) === form.employeeId);
      const range = getMonthRange(form.year, form.month);
      const [attendanceResult, leaveResult, holidayResult] = await Promise.allSettled([
        api.get(`/employees/${form.employeeId}/attendance`, { params: { limit: 500 } }),
        api.get("/leaves", { params: { employee_id: form.employeeId, start_date: range.start, end_date: range.end } }),
        api.get("/holidays", { params: { company_id: employee?.company_id } }),
      ]);
      if (cancelled) return;

      const attendance = attendanceResult.status === "fulfilled"
        ? recordsFromResponse(attendanceResult.value.data).filter((record) => {
          const date = String(record.workDate || record.work_date || record.date || "").slice(0, 10);
          return date >= range.start && date <= range.end;
        })
        : [];
      const leaves = leaveResult.status === "fulfilled" ? recordsFromResponse(leaveResult.value.data) : [];
      const holidays = holidayResult.status === "fulfilled" ? recordsFromResponse(holidayResult.value.data) : [];
      const shift = (employee?.shift_type && typeof employee.shift_type === "object" ? employee.shift_type : undefined) as ShiftDefinition | undefined;
      let presentDays = 0;
      let halfDays = 0;
      let lateDays = 0;
      let absentDays = 0;

      attendance.forEach((record) => {
        const checkIn = record.checkIn ?? record.check_in;
        const checkOut = record.checkOut ?? record.check_out;
        if (!checkIn) { absentDays += 1; return; }
        const status = calculateAttendanceStatus({
          status: String(record.status || ""),
          clock_in: attendanceTime(checkIn),
          clock_out: attendanceTime(checkOut),
          half_day: record.half_day === true,
          late: record.late === true,
          lateWaived: record.lateWaived === true || record.late_waived === true,
        }, shift);
        if (status === "half-day") halfDays += 1;
        else if (status === "absent") absentDays += 1;
        else {
          presentDays += 1;
          if (status === "late") lateDays += 1;
        }
      });

      let casualLeaves = 0;
      let sickLeaves = 0;
      const approvedLeaves = leaves.filter((leave) => String(leave.status || "").toLowerCase() === "approved");
      approvedLeaves.forEach((leave) => {
        const leaveType = leave.leave_type && typeof leave.leave_type === "object" ? leave.leave_type as PayrollRecord : undefined;
        const typeName = String(leaveType?.type_name || (leave.type && typeof leave.type === "object" ? (leave.type as PayrollRecord).type_name : leave.type) || "").toLowerCase();
        const units = leaveUnits(leave as HRRecord);
        if (typeName.includes("casual")) casualLeaves += units;
        if (typeName.includes("sick")) sickLeaves += units;
      });

      const attendedDates = new Set(attendance.map((record) => String(record.workDate || record.work_date || record.date || "").slice(0, 10)));
      const assignedLeaveDates = new Set(leaves.map((leave) => String(leave.leave_date || leave.date || "").slice(0, 10)).filter(Boolean));
      const holidayDates = new Set(holidays.map((holiday) => String(holiday.date || holiday.holiday_date || "").slice(0, 10)));
      const today = new Date().toISOString().slice(0, 10);
      const effectiveEnd = range.start <= today && today < range.end ? today : range.end;
      if (range.start <= today) {
        const cursor = new Date(`${range.start}T00:00:00Z`);
        const end = new Date(`${effectiveEnd}T00:00:00Z`);
        absentDays = 0;
        while (cursor <= end) {
          const date = cursor.toISOString().slice(0, 10);
          const weekday = cursor.getUTCDay();
          const missedWorkday = weekday >= 1 && weekday <= 5 && !attendedDates.has(date);
          const excusedDay = assignedLeaveDates.has(date) || holidayDates.has(date);
          if (missedWorkday && !excusedDay) absentDays += 1;
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
      }

      setForm((current) => ({ ...current, presentDays, halfDays, casualLeaves, sickLeaves, lateDays, absentDays }));
      if (attendanceResult.status === "rejected") console.error("Fetch employee attendance error", attendanceResult.reason);
      if (leaveResult.status === "rejected") console.error("Fetch employee leaves error", leaveResult.reason);
      if (holidayResult.status === "rejected") console.error("Fetch holidays error", holidayResult.reason);
      setAttendanceLoading(false);
    };

    void loadAttendanceFields();
    return () => { cancelled = true; };
  }, [employees, form.employeeId, form.month, form.year]);

  const totals = useMemo(() => {
    const deductions = form.halfDayDeduction + form.lateDeduction + form.absenceDeduction + form.penalties + form.loanAdvance + form.parking;
    const additions = form.transportation + form.bankCharges + form.attendanceBonus;
    const netBasic = Math.max(0, form.basicSalary - deductions + additions);
    const totalSalary = netBasic + form.commission + form.monthlySpiffs;
    return { netBasic, totalSalary, totalAmount: totalSalary + form.weeklySpiffs };
  }, [form]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: key === "employeeId" || key === "bankAccount" || key === "employmentType" ? value : toNumber(value) }));
  const selectEmployee = (id: string) => {
    const employee = employees.find((item) => String(item.id) === id);
    const detail = employeeDetail(employee);
    setForm((current) => ({ ...current, employeeId: id, basicSalary: getEmployeeMonthlySalary(salaryRecords, id, getMonthRange(current.year, current.month).end), bankAccount: String(detail?.bank_account_number || detail?.account_number || employee?.bank_account_number || ""), employmentType: String(detail?.employment_type || employee?.employment_type || "Existing") }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.employeeId) { showToast("Select an employee.", "error"); return; }
    setSaving(true);
    try {
      const range = getMonthRange(form.year, form.month);
      await api.post("/payroll/generate", { year: form.year, month: form.month, payroll_cycle: String(cycles[0]?.id || 1), salary_from: range.start, salary_to: range.end, userIds: [form.employeeId], useAttendance: true, markApprovedLeavesPaid: true, markAbsentUnpaid: false, includeExpenseClaims: true, addTimelogs: false });
      const response = await api.get(`/payroll?month=${form.month}&year=${form.year}`);
      const slip = (response.data.data || []).find((item: PayrollRecord) => String(item.employee_id || item.user_id || employeeIdOf((item.employee || item.user) as PayrollRecord)) === form.employeeId);
      if (!slip) throw new Error("Generated salary record was not returned");
      let saved: Record<string, unknown> = {};
      try { saved = JSON.parse(window.localStorage.getItem("salary-sheet-manual-v1") || "{}"); } catch { saved = {}; }
      saved[String(slip.id)] = { bankAccount: form.bankAccount, employmentType: form.employmentType, halfDays: form.halfDays, halfDayDeduction: form.halfDayDeduction, casualLeaves: form.casualLeaves, sickLeaves: form.sickLeaves, lateDays: form.lateDays, lateDeduction: form.lateDeduction, absenceDeduction: form.absenceDeduction, penalties: form.penalties, loanAdvance: form.loanAdvance, transportation: form.transportation, parking: form.parking, bankCharges: form.bankCharges, attendanceBonus: form.attendanceBonus, commission: form.commission, monthlySpiffs: form.monthlySpiffs, weeklySpiffs: form.weeklySpiffs };
      window.localStorage.setItem("salary-sheet-manual-v1", JSON.stringify(saved));
      showToast("Individual salary sheet created.", "success"); router.push(`/payroll/salary-sheet?month=${form.month}&year=${form.year}`);
    } catch (error) { console.error("Create individual salary sheet error", error); showToast("Individual salary sheet could not be created. Check the employee salary setup.", "error"); }
    finally { setSaving(false); }
  };

  return <DashboardLayout><form onSubmit={submit} className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Link href="/payroll/salary-sheet" className="mt-1 rounded-xl border border-gray-100 bg-white p-2 text-gray-400 hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link><div><h1 className="text-xl font-black text-gray-900">Create Individual Salary Sheet</h1><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Complete all fields from the Salaries - Telecom workbook</p></div></div><Button type="submit" loading={saving} className="h-10 px-5"><Save className="h-4 w-4" /> Save Salary Sheet</Button></div>
    <Card><h2 className="mb-4 text-xs font-black uppercase tracking-widest text-gray-800">Employee & Payroll Period</h2><div className="grid gap-4 md:grid-cols-3"><Field label="Employee"><select required disabled={employeesLoading} value={form.employeeId} onChange={(event) => selectEmployee(event.target.value)} className={inputClass}><option value="">{employeesLoading ? "Loading employees..." : employees.length ? "Select employee" : "No employees found"}</option>{employees.map((employee) => <option key={String(employee.id)} value={String(employee.id)}>{employeeNameOf(employee)}</option>)}</select></Field><Field label="Month"><select value={form.month} onChange={(event) => update("month", event.target.value)} className={inputClass}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>)}</select></Field><Field label="Year"><input type="number" value={form.year} onChange={(event) => update("year", event.target.value)} className={inputClass} /></Field></div></Card>
    <Card><div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Salary Sheet Fields</h2>{attendanceLoading && <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Loading attendance...</span>}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{fields.map((field) => <Field key={field.key} label={field.label} hint={field.hint}><input required type={field.type || "number"} min={field.type === "text" ? undefined : 0} step={field.type === "text" ? undefined : "0.01"} value={form[field.key]} onChange={(event) => update(field.key, event.target.value)} className={inputClass} /></Field>)}</div></Card>
    <Card className="border border-emerald-100 bg-emerald-50/30"><div className="mb-4 flex items-center gap-2"><Calculator className="h-4 w-4 text-emerald-600" /><h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Calculated Fields</h2></div><div className="grid gap-4 md:grid-cols-3"><Calculated label="Net Basic Salary" value={totals.netBasic} /><Calculated label="Total Salary (Payable)" value={totals.totalSalary} /><Calculated label="Total Amount" value={totals.totalAmount} /></div></Card>
  </form></DashboardLayout>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-500">{label}{hint && <small className="text-[8px] text-blue-500">{hint}</small>}</span>{children}</label>; }
function Calculated({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-emerald-100 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-2 text-lg font-black text-emerald-700">PKR {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>; }
