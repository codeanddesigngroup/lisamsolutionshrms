export type PayrollStatus = "generated" | "review" | "locked" | "paid";

export type PayrollCycleKey = "monthly" | "weekly" | "biweekly" | "semimonthly";

export type PayrollRecord = Record<string, unknown> & {
  id?: number | string;
};

export type PayrollGenerationOptions = {
  useAttendance: boolean;
  markApprovedLeavesPaid: boolean;
  markAbsentUnpaid: boolean;
  includeExpenseClaims: boolean;
  addTimelogs: boolean;
};

export type SalaryBreakdownItem = {
  id: number | string;
  title: string;
  type: "earning" | "deduction";
  value_type: "fixed" | "percent";
  amount: number;
};

export type BuiltSalarySlip = PayrollRecord & {
  user_id: number | string;
  employee_id: number | string;
  employee: PayrollRecord;
  user: PayrollRecord;
  salary_group_id: number | string | null;
  salary_group?: PayrollRecord;
  payroll_cycle_id: number | string;
  payroll_cycle?: PayrollRecord;
  basic_salary: number;
  monthly_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  month: number;
  month_name: string;
  year: number;
  salary_from: string;
  salary_to: string;
  pay_days: number;
  working_days: number;
  present_days: number;
  leave_days: number;
  absent_days: number;
  holiday_days: number;
  expense_claims: number;
  timelog_earnings: number;
  tds: number;
  status: PayrollStatus;
  salary_json: {
    earnings: SalaryBreakdownItem[];
    deductions: SalaryBreakdownItem[];
    attendance_summary: {
      total_days: number;
      working_days: number;
      present_days: number;
      leave_days: number;
      absent_days: number;
      holiday_days: number;
      pay_days: number;
    };
  };
};

const defaultOptions: PayrollGenerationOptions = {
  useAttendance: true,
  markApprovedLeavesPaid: true,
  markAbsentUnpaid: false,
  includeExpenseClaims: true,
  addTimelogs: false,
};

export const payrollStatuses: PayrollStatus[] = ["generated", "review", "locked", "paid"];

export const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const roundMoney = (value: unknown) => Math.round(toNumber(value) * 100) / 100;

export const formatCurrency = (value: unknown, currency = "PKR") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(toNumber(value));

export const monthName = (month: number | string) =>
  new Date(2026, Math.max(0, toNumber(month, 1) - 1), 1).toLocaleString("default", { month: "long" });

export const toDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const date = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const parseDate = (value?: unknown) => {
  if (!value) return null;
  const text = String(value);
  const date = text.includes("T") ? new Date(text) : new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getMonthRange = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: toDateInput(start),
    end: toDateInput(end),
    days: end.getDate(),
  };
};

export const daysBetweenInclusive = (start: string, end: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return 0;
  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
};

export const isDateInRange = (value: unknown, start: string, end: string) => {
  const date = parseDate(value);
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!date || !startDate || !endDate) return false;
  return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
};

export const getNestedRecord = (value: unknown) => (value && typeof value === "object" ? (value as PayrollRecord) : undefined);

export const getNestedId = (value: unknown): number | string | undefined => {
  const raw = getNestedRecord(value)?.id ?? value;
  if (typeof raw === "number" || typeof raw === "string") return raw;
  if (raw === null || raw === undefined) return undefined;
  return String(raw);
};

export const employeeIdOf = (record: PayrollRecord) =>
  getNestedId(record.user_id) ?? getNestedId(record.employee_id) ?? getNestedId(record.user) ?? getNestedId(record.employee) ?? getNestedId(record.id) ?? "";

export const employeeNameOf = (employee?: PayrollRecord) =>
  String(employee?.name || employee?.employee_name || employee?.user_name || employee?.email || "Unknown Employee");

export const departmentIdOf = (employee?: PayrollRecord) => {
  const detail = getNestedRecord(employee?.employee_detail);
  const department = getNestedRecord(detail?.department);
  return detail?.department_id ?? department?.id ?? employee?.department_id ?? "";
};

export const designationIdOf = (employee?: PayrollRecord) => {
  const detail = getNestedRecord(employee?.employee_detail);
  const designation = getNestedRecord(detail?.designation);
  return detail?.designation_id ?? designation?.id ?? employee?.designation_id ?? "";
};

export const getCycleKey = (cycle?: PayrollRecord): PayrollCycleKey => {
  const raw = String(cycle?.cycle || cycle?.slug || cycle?.name || cycle?.title || "monthly").toLowerCase();
  if (raw.includes("semi")) return "semimonthly";
  if (raw.includes("bi")) return "biweekly";
  if (raw.includes("week")) return "weekly";
  return "monthly";
};

export const getCycleLabel = (cycle?: PayrollRecord) =>
  String(cycle?.name || cycle?.cycle_name || cycle?.cycle || cycle?.title || "Monthly").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

export const getEmployeeMonthlySalary = (records: PayrollRecord[], employeeId: number | string, tillDate: string) => {
  const relevant = records
    .filter((record) => String(employeeIdOf(record)) === String(employeeId))
    .filter((record) => !record.date || isDateInRange(record.date, "1900-01-01", tillDate))
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  return Math.max(
    0,
    relevant.reduce((total, record) => {
      const amount = toNumber(record.amount);
      const type = String(record.type || "initial").toLowerCase();
      if (type === "decrement") return total - amount;
      return total + amount;
    }, 0),
  );
};

export const employeeAllowsPayroll = (records: PayrollRecord[], employeeId: number | string) => {
  const employeeRecords = records.filter((record) => String(employeeIdOf(record)) === String(employeeId));
  if (!employeeRecords.length) return false;
  return employeeRecords.some((record) => String(record.allow_generate_payroll || "yes") !== "no");
};

export const getEmployeeSalaryGroupId = (records: PayrollRecord[], employeeId: number | string) =>
  getNestedId(records.find((record) => String(employeeIdOf(record)) === String(employeeId))?.salary_group_id) ?? null;

export const getEmployeePayrollCycleId = (records: PayrollRecord[], employeeId: number | string, fallback: number | string = 1) =>
  getNestedId(records.find((record) => String(employeeIdOf(record)) === String(employeeId))?.payroll_cycle_id) ?? fallback;

export const getGroupComponents = (group: PayrollRecord | undefined, components: PayrollRecord[]) => {
  const rawComponentIds = Array.isArray(group?.components)
    ? group?.components
    : Array.isArray(group?.component_ids)
      ? group?.component_ids
      : [];
  const componentIds = rawComponentIds.map((item) => String(getNestedId(item)));
  if (!componentIds.length) return [];
  return components.filter((component) => componentIds.includes(String(component.id)));
};

export const getComponentAmount = (component: PayrollRecord, cycleKey: PayrollCycleKey, basicSalary: number) => {
  const valueKey: Record<PayrollCycleKey, string> = {
    monthly: "component_value",
    weekly: "weekly_value",
    biweekly: "biweekly_value",
    semimonthly: "semimonthly_value",
  };
  const value = toNumber(component[valueKey[cycleKey]] ?? component.component_value ?? component.value);
  const valueType = String(component.value_type || "fixed").toLowerCase() === "percent" ? "percent" : "fixed";
  return roundMoney(valueType === "percent" ? (basicSalary * value) / 100 : value);
};

const componentBreakdown = (component: PayrollRecord, cycleKey: PayrollCycleKey, basicSalary: number): SalaryBreakdownItem => {
  const componentType = String(component.component_type || component.type || "earning").toLowerCase() === "deduction" ? "deduction" : "earning";
  const valueType = String(component.value_type || "fixed").toLowerCase() === "percent" ? "percent" : "fixed";
  return {
    id: getNestedId(component.id) || String(component.component_name || "component"),
    title: String(component.component_name || component.name || "Salary Component"),
    type: componentType,
    value_type: valueType,
    amount: getComponentAmount(component, cycleKey, basicSalary),
  };
};

const getRecordDate = (record: PayrollRecord, keys: string[]) => keys.map((key) => record[key]).find(Boolean);

export const summarizeAttendanceForPayroll = (
  employeeId: number | string,
  startDate: string,
  endDate: string,
  attendance: PayrollRecord[],
  leaves: PayrollRecord[],
  holidays: PayrollRecord[],
  options: PayrollGenerationOptions = defaultOptions,
) => {
  const totalDays = daysBetweenInclusive(startDate, endDate);
  const holidayDays = holidays.filter((holiday) => isDateInRange(holiday.holiday_date || holiday.date, startDate, endDate)).length;
  const employeeAttendance = attendance.filter((record) => String(employeeIdOf(record)) === String(employeeId));
  const presentDays = employeeAttendance
    .filter((record) => isDateInRange(record.date || record.clock_in_date, startDate, endDate))
    .reduce((total, record) => {
      const status = String(record.status || "present").toLowerCase();
      if (status === "absent") return total;
      if (status.includes("half") || record.half_day === true) return total + 0.5;
      return total + 1;
    }, 0);
  const leaveDays = leaves
    .filter((record) => String(employeeIdOf(record)) === String(employeeId))
    .filter((record) => String(record.status || "").toLowerCase() === "approved")
    .filter((record) => isDateInRange(getRecordDate(record, ["leave_date", "date", "from_date"]), startDate, endDate))
    .reduce((total, record) => total + (String(record.duration || "").toLowerCase().includes("half") ? 0.5 : 1), 0);

  const workingDays = Math.max(0, totalDays - holidayDays);
  const absentDays = Math.max(0, workingDays - presentDays);
  let attendancePayDays = presentDays;

  if (options.markAbsentUnpaid && options.markApprovedLeavesPaid) {
    attendancePayDays += leaveDays;
  } else if (!options.markAbsentUnpaid) {
    attendancePayDays += options.markApprovedLeavesPaid ? absentDays : Math.max(0, absentDays - leaveDays);
  }

  return {
    totalDays,
    workingDays,
    presentDays: roundMoney(presentDays),
    leaveDays: roundMoney(leaveDays),
    absentDays: roundMoney(absentDays),
    holidayDays,
    payDays: roundMoney(options.useAttendance ? attendancePayDays + holidayDays : totalDays),
  };
};

export const getExpenseClaimTotal = (employeeId: number | string, startDate: string, endDate: string, expenses: PayrollRecord[]) =>
  roundMoney(
    expenses
      .filter((record) => String(employeeIdOf(record)) === String(employeeId))
      .filter((record) => isDateInRange(record.purchase_date || record.date || record.created_at, startDate, endDate))
      .filter((record) => ["approved", "accepted", "paid"].includes(String(record.status || "").toLowerCase()) || record.can_claim === true || record.can_claim === "yes")
      .reduce((total, record) => total + toNumber(record.price ?? record.amount ?? record.total), 0),
  );

export const getTimelogEarnings = (employee: PayrollRecord, startDate: string, endDate: string, timeLogs: PayrollRecord[]) => {
  const employeeId = employeeIdOf(employee);
  const detail = getNestedRecord(employee.employee_detail);
  const hourlyRate = toNumber(detail?.hourly_rate ?? employee.hourly_rate);
  if (!hourlyRate) return 0;

  return roundMoney(
    timeLogs
      .filter((record) => String(employeeIdOf(record)) === String(employeeId))
      .filter((record) => isDateInRange(record.start_time || record.date || record.created_at, startDate, endDate))
      .reduce((total, record) => total + toNumber(record.total_hours ?? toNumber(record.total_minutes) / 60) * hourlyRate, 0),
  );
};

export const calculateTds = (monthlySalary: number, settings: PayrollRecord | undefined, slabs: PayrollRecord[]) => {
  const enabled = String(settings?.tds_status ?? settings?.enabled ?? "no").toLowerCase();
  if (!["yes", "true", "1", "enabled"].includes(enabled)) return 0;

  const annualSalary = monthlySalary * 12;
  const matchingSlab = slabs.find((slab) => {
    const from = toNumber(slab.salary_from, 0);
    const to = toNumber(slab.salary_to, Number.MAX_SAFE_INTEGER);
    return annualSalary >= from && annualSalary <= to;
  });
  const percent = toNumber(matchingSlab?.salary_percent);
  return percent ? roundMoney((annualSalary * percent) / 100 / 12) : 0;
};

export const buildSalarySlip = ({
  employee,
  salaryRecords,
  salaryGroups,
  salaryComponents,
  employeeSalaryGroups,
  employeePayrollCycles,
  payrollCycles,
  attendance,
  leaves,
  holidays,
  expenses,
  timeLogs,
  settings,
  salaryTds,
  year,
  month,
  startDate,
  endDate,
  options = defaultOptions,
  id,
}: {
  employee: PayrollRecord;
  salaryRecords: PayrollRecord[];
  salaryGroups: PayrollRecord[];
  salaryComponents: PayrollRecord[];
  employeeSalaryGroups: PayrollRecord[];
  employeePayrollCycles: PayrollRecord[];
  payrollCycles: PayrollRecord[];
  attendance: PayrollRecord[];
  leaves: PayrollRecord[];
  holidays: PayrollRecord[];
  expenses: PayrollRecord[];
  timeLogs: PayrollRecord[];
  settings?: PayrollRecord;
  salaryTds: PayrollRecord[];
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  options?: PayrollGenerationOptions;
  id?: number | string;
}): BuiltSalarySlip => {
  const employeeId = employeeIdOf(employee);
  const monthlySalary = getEmployeeMonthlySalary(salaryRecords, employeeId, endDate);
  const salaryGroupId = getEmployeeSalaryGroupId(employeeSalaryGroups, employeeId);
  const salaryGroup = salaryGroups.find((group) => String(group.id) === String(salaryGroupId));
  const payrollCycleId = getEmployeePayrollCycleId(employeePayrollCycles, employeeId);
  const payrollCycle = payrollCycles.find((cycle) => String(cycle.id) === String(payrollCycleId)) || payrollCycles[0] || { id: 1, cycle: "monthly", name: "Monthly" };
  const cycleKey = getCycleKey(payrollCycle);
  const attendanceSummary = summarizeAttendanceForPayroll(employeeId, startDate, endDate, attendance, leaves, holidays, options);
  const monthRange = getMonthRange(year, month);
  const perDaySalary = monthRange.days ? monthlySalary / monthRange.days : 0;
  const basicSalary = roundMoney(perDaySalary * attendanceSummary.payDays);
  const breakdown = getGroupComponents(salaryGroup, salaryComponents).map((component) => componentBreakdown(component, cycleKey, basicSalary));
  const earnings = breakdown.filter((component) => component.type === "earning");
  const deductions = breakdown.filter((component) => component.type === "deduction");
  const expenseClaims = options.includeExpenseClaims ? getExpenseClaimTotal(employeeId, startDate, endDate, expenses) : 0;
  const timelogEarnings = options.addTimelogs ? getTimelogEarnings(employee, startDate, endDate, timeLogs) : 0;
  const tds = calculateTds(monthlySalary, settings, salaryTds);
  const tdsItem: SalaryBreakdownItem | null = tds
    ? {
        id: "tds",
        title: "TDS",
        type: "deduction",
        value_type: "fixed",
        amount: tds,
      }
    : null;
  const allDeductions = tdsItem ? [...deductions, tdsItem] : deductions;
  const grossSalary = roundMoney(basicSalary + earnings.reduce((total, item) => total + item.amount, 0) + expenseClaims + timelogEarnings);
  const totalDeductions = roundMoney(allDeductions.reduce((total, item) => total + item.amount, 0));
  const netSalary = roundMoney(Math.max(0, grossSalary - totalDeductions));
  const employeeSummary = {
    id: employeeId,
    name: employeeNameOf(employee),
    email: employee.email,
    employee_detail: employee.employee_detail,
  };

  return {
    id: id || `${employeeId}-${year}-${month}-${payrollCycleId}`,
    user_id: employeeId,
    employee_id: employeeId,
    employee: employeeSummary,
    user: employeeSummary,
    salary_group_id: salaryGroupId,
    salary_group: salaryGroup,
    payroll_cycle_id: payrollCycle.id || payrollCycleId,
    payroll_cycle: payrollCycle,
    basic_salary: basicSalary,
    monthly_salary: monthlySalary,
    gross_salary: grossSalary,
    total_deductions: totalDeductions,
    net_salary: netSalary,
    month,
    month_name: monthName(month),
    year,
    salary_from: startDate,
    salary_to: endDate,
    pay_days: attendanceSummary.payDays,
    working_days: attendanceSummary.workingDays,
    present_days: attendanceSummary.presentDays,
    leave_days: attendanceSummary.leaveDays,
    absent_days: attendanceSummary.absentDays,
    holiday_days: attendanceSummary.holidayDays,
    expense_claims: expenseClaims,
    timelog_earnings: timelogEarnings,
    tds,
    status: "generated",
    salary_json: {
      earnings,
      deductions: allDeductions,
      attendance_summary: {
        total_days: attendanceSummary.totalDays,
        working_days: attendanceSummary.workingDays,
        present_days: attendanceSummary.presentDays,
        leave_days: attendanceSummary.leaveDays,
        absent_days: attendanceSummary.absentDays,
        holiday_days: attendanceSummary.holidayDays,
        pay_days: attendanceSummary.payDays,
      },
    },
    created_at: new Date().toISOString(),
  };
};

export const canGeneratePayrollForEmployee = (employee: PayrollRecord, salaryRecords: PayrollRecord[], employeeSalaryGroups: PayrollRecord[]) => {
  const employeeId = employeeIdOf(employee);
  const status = String(employee.status || "active").toLowerCase();
  if (status !== "active") return { ok: false, reason: "Inactive employee" };
  if (!employeeAllowsPayroll(salaryRecords, employeeId)) return { ok: false, reason: "Payroll disabled" };
  if (!getEmployeeMonthlySalary(salaryRecords, employeeId, "2999-12-31")) return { ok: false, reason: "Missing salary" };
  if (!getEmployeeSalaryGroupId(employeeSalaryGroups, employeeId)) return { ok: false, reason: "Missing salary group" };
  return { ok: true, reason: "Ready" };
};
