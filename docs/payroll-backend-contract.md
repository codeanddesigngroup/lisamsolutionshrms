# Payroll Backend Contract

This frontend payroll module is modeled after the Laravel `Modules/Payroll` flow, but it is ready for a custom PHP backend. The backend should expose these resource contracts under the same normalized API paths so the frontend can switch from mock mode to live mode without UI changes.

## Core Resources

- `GET /v1/payroll`
  - Query filters: `month`, `year`, `cycle`, `payroll_cycle_id`, `status`, `employee_id`, `department_id`, `designation_id`, `search`.
  - Returns salary slips.
- `POST /v1/payroll/generate`
  - Generates payslips for a period.
- `POST /v1/payroll/update-status`
  - Moves selected salary slips to `generated`, `review`, `locked`, or `paid`.
- `GET /v1/payroll-cycles`
  - Returns monthly, weekly, biweekly, and semimonthly cycles.
- `GET|POST|PUT|DELETE /v1/salary-components`
  - Manages earning and deduction components.
- `GET|POST|PUT|DELETE /v1/salary-groups`
  - Manages groups and their attached component IDs.
- `GET|POST|PUT|DELETE /v1/employee-salaries`
  - Manages employee salary history records.
- `GET|POST|PUT|DELETE /v1/employee-salary-groups`
  - Assigns employees to salary groups.
- `GET|POST|PUT|DELETE /v1/employee-payroll-cycles`
  - Assigns employees to payroll cycles.
- `GET|POST|PUT|DELETE /v1/salary-tds`
  - Manages TDS/tax slabs.
- `GET|POST|PUT|DELETE /v1/salary-payment-methods`
  - Manages payment methods used when marking payroll paid.
- `GET|POST|PUT|DELETE /v1/payroll-settings`
  - Stores TDS status, finance month, threshold salary, and payslip extra fields.

## Generate Payload

```json
{
  "year": 2026,
  "month": 5,
  "payroll_cycle": 1,
  "salary_from": "2026-05-01",
  "salary_to": "2026-05-31",
  "userIds": [1, 2],
  "useAttendance": true,
  "markApprovedLeavesPaid": true,
  "markAbsentUnpaid": false,
  "includeExpenseClaims": true,
  "addTimelogs": false
}
```

Expected response:

```json
{
  "success": true,
  "data": {
    "generated": [],
    "skipped": [],
    "period": {
      "year": 2026,
      "month": 5,
      "salary_from": "2026-05-01",
      "salary_to": "2026-05-31",
      "payroll_cycle_id": 1
    }
  }
}
```

## Salary Slip Shape

Each salary slip should include:

- `id`, `user_id`, `employee_id`
- `employee` summary with `id`, `name`, `email`, and `employee_detail`
- `salary_group_id`, `payroll_cycle_id`
- `basic_salary`, `monthly_salary`, `gross_salary`, `total_deductions`, `net_salary`
- `month`, `month_name`, `year`, `salary_from`, `salary_to`
- `pay_days`, `working_days`, `present_days`, `leave_days`, `absent_days`, `holiday_days`
- `expense_claims`, `timelog_earnings`, `tds`
- `status`: `generated`, `review`, `locked`, or `paid`
- `paid_on`, `salary_payment_method_id` when paid
- `salary_json.earnings[]`, `salary_json.deductions[]`, and `salary_json.attendance_summary`

## Status Update Payload

```json
{
  "ids": [1, 2],
  "status": "paid",
  "paid_on": "2026-05-31",
  "salary_payment_method_id": 1,
  "add_expenses": true
}
```

When `status` is `paid` and `add_expenses` is true, the backend should create a company expense for the total paid salary amount.

## Calculation Notes

- Employee payroll can only generate when the employee is active, salary generation is enabled, a salary history record exists, and a salary group is assigned.
- Monthly salary is calculated from salary history: `initial + increments - decrements` up to the selected period end date.
- Attendance mode uses working days, holidays, approved leaves, absent handling, and selected generation options to calculate `pay_days`.
- Salary components support `earning` and `deduction` types, with `fixed` or `percent` values.
- Fixed component values should support monthly, weekly, biweekly, and semimonthly values.
- TDS should be calculated from configured slabs when payroll settings have TDS enabled.
