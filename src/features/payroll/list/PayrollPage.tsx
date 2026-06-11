"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import {
  canGeneratePayrollForEmployee,
  departmentIdOf,
  designationIdOf,
  employeeIdOf,
  employeeNameOf,
  formatCurrency,
  getMonthRange,
  monthName,
  payrollStatuses,
  toNumber,
  type PayrollGenerationOptions,
  type PayrollRecord,
  type PayrollStatus,
} from "@/lib/payroll-utils";
import { useToast } from "@/context/ToastContext";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

const years = [2026, 2025, 2024, 2023];

const emptyOptions: PayrollGenerationOptions = {
  useAttendance: true,
  markApprovedLeavesPaid: true,
  markAbsentUnpaid: false,
  includeExpenseClaims: true,
  addTimelogs: false,
};

const getSalaryJson = (slip: PayrollRecord) => {
  const raw = slip.salary_json;
  return raw && typeof raw === "object"
    ? (raw as { earnings?: PayrollRecord[]; deductions?: PayrollRecord[]; attendance_summary?: PayrollRecord })
    : {};
};

const statusClass = (status: string) => {
  if (status === "paid") return "bg-green-50 text-green-700 border-green-100";
  if (status === "locked") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "review") return "bg-blue-50 text-blue-700 border-blue-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

export default function PayrollDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [slips, setSlips] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<PayrollRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<PayrollRecord[]>([]);
  const [employeeSalaryGroups, setEmployeeSalaryGroups] = useState<PayrollRecord[]>([]);
  const [cycles, setCycles] = useState<PayrollRecord[]>([]);
  const [departments, setDepartments] = useState<PayrollRecord[]>([]);
  const [designations, setDesignations] = useState<PayrollRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PayrollRecord[]>([]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [cycle, setCycle] = useState("1");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [designation, setDesignation] = useState("all");
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<PayrollGenerationOptions>(emptyOptions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<PayrollStatus>("review");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [addExpenseOnPaid, setAddExpenseOnPaid] = useState(true);
  const [activeSlip, setActiveSlip] = useState<PayrollRecord | null>(null);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const [slipRes, employeeRes, salaryRes, groupRes, cycleRes, departmentRes, designationRes, paymentRes] = await Promise.all([
        api.get(`/payroll?month=${month}&year=${year}&cycle=${cycle}`),
        api.get("/employees"),
        api.get("/employee-salaries"),
        api.get("/employee-salary-groups"),
        api.get("/payroll-cycles"),
        api.get("/departments"),
        api.get("/designations"),
        api.get("/salary-payment-methods"),
      ]);

      setSlips(slipRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setSalaryRecords(salaryRes.data.data || []);
      setEmployeeSalaryGroups(groupRes.data.data || []);
      setCycles(cycleRes.data.data || []);
      setDepartments(departmentRes.data.data || []);
      setDesignations(designationRes.data.data || []);
      setPaymentMethods(paymentRes.data.data || []);
      const defaultMethod = (paymentRes.data.data || []).find((method: PayrollRecord) => method.is_default) || (paymentRes.data.data || [])[0];
      setPaymentMethodId((current) => current || String(defaultMethod?.id || ""));
    } catch (error) {
      console.error("Fetch payroll error", error);
      showToast("Payroll data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  }, [cycle, month, showToast, year]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPayroll();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchPayroll]);

  const filteredSlips = useMemo(() => {
    const query = search.trim().toLowerCase();
    return slips.filter((slip) => {
      const employee = slip.employee as PayrollRecord | undefined;
      const searchMatch = !query || JSON.stringify(slip).toLowerCase().includes(query);
      const statusMatch = status === "all" || String(slip.status) === status;
      const departmentMatch = department === "all" || String(departmentIdOf(employee)) === department;
      const designationMatch = designation === "all" || String(designationIdOf(employee)) === designation;
      return searchMatch && statusMatch && departmentMatch && designationMatch;
    });
  }, [slips, search, status, department, designation]);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => {
        const departmentMatch = department === "all" || String(departmentIdOf(employee)) === department;
        const designationMatch = designation === "all" || String(designationIdOf(employee)) === designation;
        return departmentMatch && designationMatch;
      }),
    [employees, department, designation],
  );

  const readiness = useMemo(
    () =>
      filteredEmployees.map((employee) => ({
        employee,
        ...canGeneratePayrollForEmployee(employee, salaryRecords, employeeSalaryGroups),
      })),
    [filteredEmployees, salaryRecords, employeeSalaryGroups],
  );

  const stats = useMemo(() => {
    const totalNet = filteredSlips.reduce((total, slip) => total + toNumber(slip.net_salary), 0);
    const paid = filteredSlips.filter((slip) => slip.status === "paid").reduce((total, slip) => total + toNumber(slip.net_salary), 0);
    const deductions = filteredSlips.reduce((total, slip) => total + toNumber(slip.total_deductions), 0);
    const readyEmployees = readiness.filter((item) => item.ok).length;
    return { totalNet, paid, deductions, readyEmployees };
  }, [filteredSlips, readiness]);

  const toggleOption = (key: keyof PayrollGenerationOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleSelected = (id: number | string | undefined) => {
    if (id === undefined) return;
    const value = String(id);
    setSelectedIds((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const handleGenerate = async () => {
    const selectedEmployeeIds = readiness.filter((item) => item.ok).map((item) => employeeIdOf(item.employee));
    if (!selectedEmployeeIds.length) {
      showToast("No employees are ready for payroll generation. Check salary setup first.", "error");
      return;
    }

    const range = getMonthRange(year, month);
    setGenerating(true);
    try {
      const response = await api.post("/payroll/generate", {
        year,
        month,
        payroll_cycle: cycle,
        salary_from: range.start,
        salary_to: range.end,
        userIds: selectedEmployeeIds,
        ...options,
      });
      const generated = response.data.data?.generated?.length || 0;
      const skipped = response.data.data?.skipped?.length || 0;
      showToast(`${generated} payslip(s) generated${skipped ? `, ${skipped} skipped` : ""}.`, generated ? "success" : "info");
      setSelectedIds([]);
      await fetchPayroll();
    } catch (error) {
      console.error("Generate payroll error", error);
      showToast("Could not generate payroll.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkStatus = async () => {
    if (!selectedIds.length) {
      showToast("Select at least one payslip.", "error");
      return;
    }

    try {
      await api.post("/payroll/updateStatus", {
        ids: selectedIds,
        status: bulkStatus,
        paid_on: paidOn,
        salary_payment_method_id: paymentMethodId,
        add_expenses: addExpenseOnPaid,
      });
      showToast("Payroll status updated.", "success");
      setSelectedIds([]);
      await fetchPayroll();
    } catch (error) {
      console.error("Payroll status error", error);
      showToast("Could not update payroll status.", "error");
    }
  };

  const handleDelete = async (id: number | string | undefined) => {
    if (id === undefined) return;
    try {
      await api.delete(`/payroll/${id}`);
      showToast("Payslip deleted.", "success");
      await fetchPayroll();
    } catch (error) {
      console.error("Delete payroll error", error);
      showToast("Could not delete payslip.", "error");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Employee", "Period", "Monthly Salary", "Pay Days", "Gross", "Deductions", "Expenses", "Net", "Status", "Paid On"],
      ...filteredSlips.map((slip) => [
        employeeNameOf(slip.employee as PayrollRecord),
        `${monthName(slip.month as number)} ${slip.year}`,
        String(slip.monthly_salary || 0),
        String(slip.pay_days || 0),
        String(slip.gross_salary || 0),
        String(slip.total_deductions || 0),
        String(slip.expense_claims || 0),
        String(slip.net_salary || 0),
        String(slip.status || ""),
        String(slip.paid_on || ""),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `payroll-${year}-${String(month).padStart(2, "0")}.csv`;
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
              Payroll Management
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Generate, review, lock, and pay employee salary slips.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/payroll/settings">
              <Button className="bg-gray-50 text-gray-600 border border-gray-100 px-4 h-10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100">
                <Settings className="h-4 w-4" /> Payroll Settings
              </Button>
            </Link>
            <Button onClick={handleGenerate} loading={generating} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Generate Payslips
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm p-6 bg-white">
          <div className="flex items-center gap-2 mb-5">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">Payroll Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
              <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                {years.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month</label>
              <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cycle</label>
              <select value={cycle} onChange={(event) => setCycle(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                {cycles.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name || item.cycle)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department</label>
              <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="all">All Departments</option>
                {departments.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.team_name || item.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Designation</label>
              <select value={designation} onChange={(event) => setDesignation(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="all">All Designations</option>
                {designations.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20">
                <option value="all">All Status</option>
                {payrollStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-5 pt-5 border-t border-gray-100">
            {[
              { key: "useAttendance", label: "Use Attendance", icon: Clock },
              { key: "markApprovedLeavesPaid", label: "Paid Leaves", icon: CheckCircle2 },
              { key: "markAbsentUnpaid", label: "Absent Unpaid", icon: AlertCircle },
              { key: "includeExpenseClaims", label: "Expense Claims", icon: Wallet },
              { key: "addTimelogs", label: "Add Timelogs", icon: Users },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleOption(item.key as keyof PayrollGenerationOptions)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  options[item.key as keyof PayrollGenerationOptions]
                    ? "border-primary/20 bg-primary/5 text-primary"
                    : "border-gray-100 bg-gray-50 text-gray-500"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { label: "Net Payroll", value: formatCurrency(stats.totalNet), icon: Wallet, tone: "text-primary" },
            { label: "Paid", value: formatCurrency(stats.paid), icon: CheckCircle2, tone: "text-green-600" },
            { label: "Deductions", value: formatCurrency(stats.deductions), icon: AlertCircle, tone: "text-red-500" },
            { label: "Ready Employees", value: `${stats.readyEmployees}/${readiness.length}`, icon: Users, tone: "text-blue-600" },
          ].map((item) => (
            <Card key={item.label} className="border-none shadow-sm p-5 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                  <h3 className={`mt-2 text-2xl font-black tracking-tight ${item.tone}`}>{item.value}</h3>
                </div>
                <div className="h-11 w-11 rounded-xl bg-gray-50 flex items-center justify-center">
                  <item.icon className={`h-5 w-5 ${item.tone}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, salary slip, status..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-xs font-bold text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as PayrollStatus)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700">
                {payrollStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {bulkStatus === "paid" && (
                <>
                  <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700">
                    {paymentMethods.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.payment_method)}</option>)}
                  </select>
                  <input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700" />
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <input type="checkbox" checked={addExpenseOnPaid} onChange={(event) => setAddExpenseOnPaid(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    Expense
                  </label>
                </>
              )}
              <Button onClick={handleBulkStatus} className="h-10 bg-secondary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                Update Status
              </Button>
              <Button onClick={exportCsv} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button onClick={fetchPayroll} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-3">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-10">
                    <input
                      type="checkbox"
                      checked={filteredSlips.length > 0 && selectedIds.length === filteredSlips.length}
                      onChange={(event) => setSelectedIds(event.target.checked ? filteredSlips.map((slip) => String(slip.id)) : [])}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pay Days</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Deductions</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Net</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-16 text-center text-xs font-black uppercase tracking-widest text-gray-400">Loading payroll...</td></tr>
                ) : filteredSlips.length ? (
                  filteredSlips.map((slip) => (
                    <tr key={String(slip.id)} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <input type="checkbox" checked={selectedIds.includes(String(slip.id))} onChange={() => toggleSelected(slip.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase">
                            {employeeNameOf(slip.employee as PayrollRecord).charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-800">{employeeNameOf(slip.employee as PayrollRecord)}</p>
                            <p className="text-[10px] text-gray-400 font-bold">ID: {String(slip.employee_id || slip.user_id)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-gray-600">
                        {monthName(slip.month as number)} {String(slip.year)}
                        <p className="text-[10px] text-gray-400 mt-1">{String(slip.salary_from)} to {String(slip.salary_to)}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-black text-gray-700">{String(slip.pay_days || 0)}</td>
                      <td className="px-5 py-4 text-xs font-black text-gray-700">{formatCurrency(slip.gross_salary)}</td>
                      <td className="px-5 py-4 text-xs font-black text-red-500">{formatCurrency(slip.total_deductions)}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-900">{formatCurrency(slip.net_salary)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(String(slip.status))}`}>{String(slip.status)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setActiveSlip(slip)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600" aria-label="View payslip">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(slip.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete payslip">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-20 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-sm font-black text-gray-800 uppercase tracking-widest">No payslips found</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Generate payroll for {monthName(month)} {year}.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-none shadow-sm p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">Generation Readiness</h2>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Employees must be active, payroll enabled, have salary, and be assigned to a salary group.</p>
            </div>
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {readiness.map((item) => (
              <div key={String(item.employee.id)} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-gray-800">{employeeNameOf(item.employee)}</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${item.ok ? "text-green-600" : "text-red-500"}`}>{item.reason}</p>
                </div>
                {item.ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={Boolean(activeSlip)} onClose={() => setActiveSlip(null)} title="Payslip Detail" size="lg">
        {activeSlip && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Salary", value: formatCurrency(activeSlip.monthly_salary) },
                { label: "Gross Salary", value: formatCurrency(activeSlip.gross_salary) },
                { label: "Deductions", value: formatCurrency(activeSlip.total_deductions) },
                { label: "Net Payable", value: formatCurrency(activeSlip.net_salary) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                  <p className="text-lg font-black text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Basic Salary</span>
                    <span>{formatCurrency(activeSlip.basic_salary)}</span>
                  </div>
                  {(getSalaryJson(activeSlip).earnings || []).map((item) => (
                    <div key={String(item.id)} className="flex items-center justify-between text-xs font-bold text-gray-600">
                      <span>{String(item.title || item.component_name)}</span>
                      <span className="text-green-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Expense Claims</span>
                    <span className="text-green-600">{formatCurrency(activeSlip.expense_claims)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Timelog Earnings</span>
                    <span className="text-green-600">{formatCurrency(activeSlip.timelog_earnings)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Deductions</h3>
                <div className="space-y-3">
                  {(getSalaryJson(activeSlip).deductions || []).map((item) => (
                    <div key={String(item.id)} className="flex items-center justify-between text-xs font-bold text-gray-600">
                      <span>{String(item.title || item.component_name)}</span>
                      <span className="text-red-500">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {!(getSalaryJson(activeSlip).deductions || []).length && (
                    <p className="text-xs font-bold text-gray-400">No deductions applied.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Attendance Basis</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  ["Working", activeSlip.working_days],
                  ["Present", activeSlip.present_days],
                  ["Leave", activeSlip.leave_days],
                  ["Absent", activeSlip.absent_days],
                  ["Holiday", activeSlip.holiday_days],
                  ["Pay Days", activeSlip.pay_days],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-gray-50 p-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(label)}</p>
                    <p className="text-lg font-black text-gray-800 mt-1">{String(value || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
