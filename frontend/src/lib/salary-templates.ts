export type SalaryField = { id: string; label: string; enabled: boolean; visible: boolean; role: 'info' | 'addition' | 'deduction'; stage: 'netBasic' | 'totalSalary' | 'totalAmount'; multiple?: boolean; options?: string[] };
export type SalaryEntry = { id: string; label: string; amount: number };
export type SalaryBreakdowns = Record<string, SalaryEntry[]>;
export const entryTotal = (entries: SalaryEntry[]) => Math.round(entries.reduce((sum, entry) => sum + (Number.isFinite(entry.amount) ? Math.max(0, entry.amount) : 0), 0) * 100) / 100;
export function fieldForDepartment(templates: SalaryTemplate[], department: string, id: string) {
  return templates.find(t => t.departments.some(d => d.toLowerCase() === department.toLowerCase()))?.fields.find(f => f.id === id);
}
export type SalaryTemplate = { id: string; name: string; departments: string[]; fields: SalaryField[] };
export const templateKey = 'hrms-salary-templates-v1';
const field = (id: string, label: string, role: SalaryField['role'] = 'addition', stage: SalaryField['stage'] = 'netBasic'): SalaryField => ({ id, label, role, stage, enabled: true, visible: true });
export const baseFields = [field('basicSalary', 'Basic Salary', 'info'), field('presentDays', 'Days Present', 'info'), field('halfDays', 'Half Days', 'info'), field('halfDayDeduction', 'Half Day Deduction', 'deduction'), field('casualLeaves', 'Casual Leaves', 'info'), field('sickLeaves', 'Sick Leaves', 'info'), field('lateDays', 'Late Days', 'info'), field('lateDeduction', 'Late Deduction', 'deduction'), field('absentDays', 'Absent Days', 'info'), field('absenceDeduction', 'Absence Deduction', 'deduction'), field('penalties', 'Penalties', 'deduction'), field('loanAdvance', 'Loan / Advance', 'deduction'), field('transportation', 'Transportation'), field('parking', 'Parking', 'deduction'), field('bankCharges', 'Bank Charges'), field('attendanceBonus', 'Attendance Bonus'), field('commission', 'Commission / Others', 'addition', 'totalSalary'), field('monthlySpiffs', 'Monthly SPIFFs', 'addition', 'totalSalary'), field('weeklySpiffs', 'Weekly SPIFFs', 'addition', 'totalAmount')];
export const defaultTemplates: SalaryTemplate[] = [];
export function calculateSalary(values: Record<string, number>, template: SalaryTemplate) {
  const sum = (stage: SalaryField['stage']) => template.fields.reduce((total, f) => total + (f.enabled && f.role !== 'info' && f.id !== 'basicSalary' && f.stage === stage ? (f.role === 'deduction' ? -1 : 1) * (Number.isFinite(values[f.id]) ? values[f.id] : 0) : 0), 0);
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const netBasic = round(Math.max(0, (values.basicSalary || 0) + sum('netBasic')));
  const totalSalary = round(netBasic + sum('totalSalary'));
  return { netBasic, totalSalary, totalAmount: round(totalSalary + sum('totalAmount')) };
}
export function readLocal<T>(key: string, fallback: T): T {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(value) ? value as T : fallback; } catch { return fallback; }
}
