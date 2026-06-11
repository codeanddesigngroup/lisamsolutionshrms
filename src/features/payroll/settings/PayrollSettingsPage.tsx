"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import {
  employeeIdOf,
  employeeNameOf,
  formatCurrency,
  getEmployeeMonthlySalary,
  getEmployeePayrollCycleId,
  getEmployeeSalaryGroupId,
  getGroupComponents,
  toNumber,
  type PayrollRecord,
} from "@/lib/payroll-utils";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Edit,
  Layers,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

type TabKey = "components" | "groups" | "employees" | "tds" | "payments" | "settings";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "components", label: "Components" },
  { key: "groups", label: "Groups" },
  { key: "employees", label: "Employee Setup" },
  { key: "tds", label: "TDS" },
  { key: "payments", label: "Payments" },
  { key: "settings", label: "Payslip" },
];

const emptyComponent = {
  component_name: "",
  component_type: "earning",
  value_type: "fixed",
  component_value: "0",
  weekly_value: "0",
  biweekly_value: "0",
  semimonthly_value: "0",
};

const emptyGroup = {
  group_name: "",
  description: "",
  component_ids: [] as string[],
};

const emptySalary = {
  employee_id: "",
  amount: "",
  type: "initial",
  date: new Date().toISOString().slice(0, 10),
  allow_generate_payroll: "yes",
};

const emptySlab = {
  salary_from: "",
  salary_to: "",
  salary_percent: "",
};

const emptyPaymentMethod = {
  payment_method: "",
  is_default: false,
  status: "active",
};

const componentIcon = (type: unknown) => String(type).toLowerCase() === "deduction" ? Percent : Wallet;

export default function PayrollSettings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("components");
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<PayrollRecord[]>([]);
  const [groups, setGroups] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<PayrollRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<PayrollRecord[]>([]);
  const [employeeGroups, setEmployeeGroups] = useState<PayrollRecord[]>([]);
  const [employeeCycles, setEmployeeCycles] = useState<PayrollRecord[]>([]);
  const [cycles, setCycles] = useState<PayrollRecord[]>([]);
  const [tdsSlabs, setTdsSlabs] = useState<PayrollRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PayrollRecord[]>([]);
  const [settingsRecords, setSettingsRecords] = useState<PayrollRecord[]>([]);
  const [componentModal, setComponentModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [salaryModal, setSalaryModal] = useState(false);
  const [slabModal, setSlabModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<number | string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<number | string | null>(null);
  const [componentForm, setComponentForm] = useState(emptyComponent);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [salaryForm, setSalaryForm] = useState(emptySalary);
  const [slabForm, setSlabForm] = useState(emptySlab);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentMethod);
  const [tdsSettings, setTdsSettings] = useState({ tds_status: "yes", finance_month: "04", tds_salary: "60000" });
  const [extraFields, setExtraFields] = useState("Employee Code, Department");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [componentRes, groupRes, employeeRes, salaryRes, employeeGroupRes, employeeCycleRes, cycleRes, tdsRes, paymentRes, settingRes] = await Promise.all([
        api.get("/salary-components"),
        api.get("/salary-groups"),
        api.get("/employees"),
        api.get("/employee-salaries"),
        api.get("/employee-salary-groups"),
        api.get("/employee-payroll-cycles"),
        api.get("/payroll-cycles"),
        api.get("/salary-tds"),
        api.get("/salary-payment-methods"),
        api.get("/payroll-settings"),
      ]);
      setComponents(componentRes.data.data || []);
      setGroups(groupRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setSalaryRecords(salaryRes.data.data || []);
      setEmployeeGroups(employeeGroupRes.data.data || []);
      setEmployeeCycles(employeeCycleRes.data.data || []);
      setCycles(cycleRes.data.data || []);
      setTdsSlabs(tdsRes.data.data || []);
      setPaymentMethods(paymentRes.data.data || []);
      const settings = settingRes.data.data || [];
      setSettingsRecords(settings);
      const firstSetting = settings[0] || {};
      setTdsSettings({
        tds_status: String(firstSetting.tds_status || "yes"),
        finance_month: String(firstSetting.finance_month || "04"),
        tds_salary: String(firstSetting.tds_salary || "60000"),
      });
      const fields = Array.isArray(firstSetting.extra_fields)
        ? firstSetting.extra_fields.map((field: PayrollRecord) => String(field.label || field.key)).join(", ")
        : "";
      setExtraFields(fields || "Employee Code, Department");
    } catch (error) {
      console.error("Fetch payroll settings error", error);
      showToast("Payroll settings could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  const employeeSetup = useMemo(
    () =>
      employees.map((employee) => {
        const employeeId = employeeIdOf(employee);
        return {
          employee,
          monthlySalary: getEmployeeMonthlySalary(salaryRecords, employeeId, "2999-12-31"),
          salaryGroupId: getEmployeeSalaryGroupId(employeeGroups, employeeId),
          cycleId: getEmployeePayrollCycleId(employeeCycles, employeeId),
          allowGenerate: salaryRecords.some((record) => String(employeeIdOf(record)) === String(employeeId) && String(record.allow_generate_payroll || "yes") !== "no"),
          recordCount: salaryRecords.filter((record) => String(employeeIdOf(record)) === String(employeeId)).length,
        };
      }),
    [employees, salaryRecords, employeeGroups, employeeCycles],
  );

  const resetComponentForm = () => {
    setEditingComponentId(null);
    setComponentForm(emptyComponent);
    setComponentModal(false);
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm(emptyGroup);
    setGroupModal(false);
  };

  const resetPaymentForm = () => {
    setEditingPaymentId(null);
    setPaymentForm(emptyPaymentMethod);
    setPaymentModal(false);
  };

  const saveComponent = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...componentForm,
        component_value: toNumber(componentForm.component_value),
        weekly_value: toNumber(componentForm.weekly_value),
        biweekly_value: toNumber(componentForm.biweekly_value),
        semimonthly_value: toNumber(componentForm.semimonthly_value),
      };
      if (editingComponentId) {
        await api.put(`/salary-components/${editingComponentId}`, payload);
      } else {
        await api.post("/salary-components", payload);
      }
      showToast("Salary component saved.", "success");
      resetComponentForm();
      await fetchSettings();
    } catch (error) {
      console.error("Save component error", error);
      showToast("Could not save salary component.", "error");
    }
  };

  const editComponent = (component: PayrollRecord) => {
    setEditingComponentId(component.id || null);
    setComponentForm({
      component_name: String(component.component_name || ""),
      component_type: String(component.component_type || component.type || "earning"),
      value_type: String(component.value_type || "fixed"),
      component_value: String(component.component_value || 0),
      weekly_value: String(component.weekly_value || 0),
      biweekly_value: String(component.biweekly_value || 0),
      semimonthly_value: String(component.semimonthly_value || 0),
    });
    setComponentModal(true);
  };

  const saveGroup = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = { ...groupForm, components: groupForm.component_ids, component_ids: groupForm.component_ids };
      if (editingGroupId) {
        await api.put(`/salary-groups/${editingGroupId}`, payload);
      } else {
        await api.post("/salary-groups", payload);
      }
      showToast("Salary group saved.", "success");
      resetGroupForm();
      await fetchSettings();
    } catch (error) {
      console.error("Save group error", error);
      showToast("Could not save salary group.", "error");
    }
  };

  const editGroup = (group: PayrollRecord) => {
    setEditingGroupId(group.id || null);
    const componentIds = Array.isArray(group.component_ids) ? group.component_ids : Array.isArray(group.components) ? group.components : [];
    setGroupForm({
      group_name: String(group.group_name || ""),
      description: String(group.description || ""),
      component_ids: componentIds.map((item) => String(item && typeof item === "object" ? (item as PayrollRecord).id : item)),
    });
    setGroupModal(true);
  };

  const deleteRecord = async (resource: string, id: number | string | undefined) => {
    if (!id) return;
    try {
      await api.delete(`/${resource}/${id}`);
      showToast("Record deleted.", "success");
      await fetchSettings();
    } catch (error) {
      console.error("Delete payroll setting record error", error);
      showToast("Could not delete record.", "error");
    }
  };

  const saveSalaryRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post("/employee-salaries", {
        ...salaryForm,
        user_id: salaryForm.employee_id,
        amount: toNumber(salaryForm.amount),
      });
      showToast("Employee salary record added.", "success");
      setSalaryForm(emptySalary);
      setSalaryModal(false);
      await fetchSettings();
    } catch (error) {
      console.error("Save salary record error", error);
      showToast("Could not save employee salary.", "error");
    }
  };

  const saveEmployeeSetup = async (employeeId: number | string, salaryGroupId: string, cycleId: string, allowGenerate: boolean) => {
    try {
      const existingGroup = employeeGroups.find((record) => String(employeeIdOf(record)) === String(employeeId));
      const existingCycle = employeeCycles.find((record) => String(employeeIdOf(record)) === String(employeeId));
      const groupPayload = { user_id: employeeId, employee_id: employeeId, salary_group_id: salaryGroupId };
      const cyclePayload = { user_id: employeeId, employee_id: employeeId, payroll_cycle_id: cycleId };
      if (existingGroup?.id) await api.put(`/employee-salary-groups/${existingGroup.id}`, groupPayload);
      else await api.post("/employee-salary-groups", groupPayload);
      if (existingCycle?.id) await api.put(`/employee-payroll-cycles/${existingCycle.id}`, cyclePayload);
      else await api.post("/employee-payroll-cycles", cyclePayload);
      await api.post("/employee-salary/payroll-status", {
        user_id: employeeId,
        employee_id: employeeId,
        allow_generate_payroll: allowGenerate ? "yes" : "no",
      });
      showToast("Employee payroll setup updated.", "success");
      await fetchSettings();
    } catch (error) {
      console.error("Save employee setup error", error);
      showToast("Could not update employee payroll setup.", "error");
    }
  };

  const saveTdsSettings = async () => {
    try {
      const firstSetting = settingsRecords[0];
      const payload = {
        ...tdsSettings,
        tds_salary: toNumber(tdsSettings.tds_salary),
        extra_fields: extraFields.split(",").map((field) => ({ label: field.trim(), key: field.trim().toLowerCase().replace(/\s+/g, "_"), enabled: true })).filter((field) => field.label),
      };
      if (firstSetting?.id) await api.put(`/payroll-settings/${firstSetting.id}`, payload);
      else await api.post("/payroll-settings", payload);
      showToast("Payroll settings saved.", "success");
      await fetchSettings();
    } catch (error) {
      console.error("Save TDS settings error", error);
      showToast("Could not save payroll settings.", "error");
    }
  };

  const saveTdsSlab = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post("/salary-tds", {
        salary_from: toNumber(slabForm.salary_from),
        salary_to: toNumber(slabForm.salary_to),
        salary_percent: toNumber(slabForm.salary_percent),
      });
      showToast("TDS slab added.", "success");
      setSlabForm(emptySlab);
      setSlabModal(false);
      await fetchSettings();
    } catch (error) {
      console.error("Save TDS slab error", error);
      showToast("Could not save TDS slab.", "error");
    }
  };

  const savePaymentMethod = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingPaymentId) {
        await api.put(`/salary-payment-methods/${editingPaymentId}`, paymentForm);
      } else {
        await api.post("/salary-payment-methods", paymentForm);
      }
      showToast("Payment method saved.", "success");
      resetPaymentForm();
      await fetchSettings();
    } catch (error) {
      console.error("Save payment method error", error);
      showToast("Could not save payment method.", "error");
    }
  };

  const editPayment = (method: PayrollRecord) => {
    setEditingPaymentId(method.id || null);
    setPaymentForm({
      payment_method: String(method.payment_method || ""),
      is_default: Boolean(method.is_default),
      status: String(method.status || "active"),
    });
    setPaymentModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 -mx-6 -mt-6">
          <div className="flex items-center gap-4">
            <Link href="/payroll" className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
                <Settings className="h-5 w-5 mr-3 text-primary" />
                Payroll Settings
              </h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Salary structures, employee payroll setup, TDS, and payment methods.</p>
            </div>
          </div>
          <Button onClick={fetchSettings} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm border border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "components" && (
          <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Salary Components</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Earnings and deductions used inside salary groups.</p>
              </div>
              <Button onClick={() => setComponentModal(true)} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                <Plus className="h-4 w-4" /> Component
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {components.map((component) => {
                const Icon = componentIcon(component.component_type || component.type);
                return (
                  <div key={String(component.id)} className="rounded-2xl border border-gray-100 p-5 hover:border-primary/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${String(component.component_type).toLowerCase() === "deduction" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-800">{String(component.component_name)}</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(component.component_type || component.type)} / {String(component.value_type)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => editComponent(component)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Edit className="h-4 w-4" /></button>
                        <button type="button" onClick={() => deleteRecord("salary-components", component.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-5 text-[10px] font-bold text-gray-500">
                      <span>Monthly: {String(component.component_value)}</span>
                      <span>Weekly: {String(component.weekly_value)}</span>
                      <span>Biweekly: {String(component.biweekly_value)}</span>
                      <span>Semimonthly: {String(component.semimonthly_value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeTab === "groups" && (
          <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Salary Groups</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Attach components to employees through group assignment.</p>
              </div>
              <Button onClick={() => setGroupModal(true)} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                <Plus className="h-4 w-4" /> Group
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
              {groups.map((group) => {
                const assignedCount = employeeGroups.filter((record) => String(record.salary_group_id) === String(group.id)).length;
                const groupComponents = getGroupComponents(group, components);
                return (
                  <div key={String(group.id)} className="rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">{String(group.group_name)}</h3>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">{assignedCount} assigned employee(s)</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => editGroup(group)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Edit className="h-4 w-4" /></button>
                        <button type="button" disabled={assignedCount > 0} onClick={() => deleteRecord("salary-groups", group.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">{String(group.description || "No description added.")}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {groupComponents.map((component) => (
                        <span key={String(component.id)} className="rounded-full bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{String(component.component_name)}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeTab === "employees" && (
          <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Employee Payroll Setup</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Assign salary group, payroll cycle, and salary history for each employee.</p>
              </div>
              <Button onClick={() => setSalaryModal(true)} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                <Plus className="h-4 w-4" /> Salary Record
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Monthly Salary</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Salary Group</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Generate</th>
                    <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeeSetup.map((row) => {
                    return (
                      <EmployeeSetupRow
                        key={String(row.employee.id)}
                        row={row}
                        groups={groups}
                        cycles={cycles}
                        defaultGroup={String(row.salaryGroupId || "")}
                        defaultCycle={String(row.cycleId || "1")}
                        onSave={saveEmployeeSetup}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "tds" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="border-none shadow-sm bg-white p-5 xl:col-span-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">TDS Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Status</label>
                  <select value={tdsSettings.tds_status} onChange={(event) => setTdsSettings((current) => ({ ...current, tds_status: event.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold">
                    <option value="yes">Enabled</option>
                    <option value="no">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Finance Month</label>
                  <input value={tdsSettings.finance_month} onChange={(event) => setTdsSettings((current) => ({ ...current, finance_month: event.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Threshold Salary</label>
                  <input value={tdsSettings.tds_salary} onChange={(event) => setTdsSettings((current) => ({ ...current, tds_salary: event.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold" />
                </div>
                <Button onClick={saveTdsSettings} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest w-full">
                  <Save className="h-4 w-4" /> Save Settings
                </Button>
              </div>
            </Card>
            <Card className="border-none shadow-sm bg-white p-0 overflow-hidden xl:col-span-2">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">TDS Slabs</h2>
                <Button onClick={() => setSlabModal(true)} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                  <Plus className="h-4 w-4" /> Slab
                </Button>
              </div>
              <div className="divide-y divide-gray-100">
                {tdsSlabs.map((slab) => (
                  <div key={String(slab.id)} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-xs font-black text-gray-800">{formatCurrency(slab.salary_from)} - {formatCurrency(slab.salary_to)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(slab.salary_percent)} percent</p>
                    </div>
                    <button type="button" onClick={() => deleteRecord("salary-tds", slab.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "payments" && (
          <Card className="border-none shadow-sm bg-white p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Salary Payment Methods</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Used when marking payroll as paid.</p>
              </div>
              <Button onClick={() => setPaymentModal(true)} className="h-10 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
                <Plus className="h-4 w-4" /> Method
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
              {paymentMethods.map((method) => (
                <div key={String(method.id)} className="rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-800">{String(method.payment_method)}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{String(method.status || "active")}</p>
                      </div>
                    </div>
                    {method.is_default ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-gray-300" />}
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button onClick={() => editPayment(method)} className="h-9 flex-1 bg-gray-50 text-gray-600 border border-gray-100 text-[10px] font-black uppercase tracking-widest">Edit</Button>
                    <Button onClick={() => deleteRecord("salary-payment-methods", method.id)} className="h-9 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-widest">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "settings" && (
          <Card className="border-none shadow-sm bg-white p-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-4">Payslip Extra Fields</h2>
            <p className="text-xs text-gray-500 mb-4">These fields are sent to the backend as structured payslip metadata for PDF generation.</p>
            <textarea value={extraFields} onChange={(event) => setExtraFields(event.target.value)} rows={4} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-xs font-bold text-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <Button onClick={saveTdsSettings} className="mt-4 h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">
              <Save className="h-4 w-4" /> Save Payslip Fields
            </Button>
          </Card>
        )}
      </div>

      <Modal isOpen={componentModal} onClose={resetComponentForm} title={editingComponentId ? "Edit Component" : "Add Component"} size="lg">
        <form onSubmit={saveComponent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Component Name" value={componentForm.component_name} onChange={(value) => setComponentForm((current) => ({ ...current, component_name: value }))} required />
          <SelectField label="Type" value={componentForm.component_type} onChange={(value) => setComponentForm((current) => ({ ...current, component_type: value }))} options={[["earning", "Earning"], ["deduction", "Deduction"]]} />
          <SelectField label="Value Type" value={componentForm.value_type} onChange={(value) => setComponentForm((current) => ({ ...current, value_type: value }))} options={[["fixed", "Fixed"], ["percent", "Percent"]]} />
          <TextField label="Monthly Value" value={componentForm.component_value} onChange={(value) => setComponentForm((current) => ({ ...current, component_value: value }))} required />
          <TextField label="Weekly Value" value={componentForm.weekly_value} onChange={(value) => setComponentForm((current) => ({ ...current, weekly_value: value }))} />
          <TextField label="Biweekly Value" value={componentForm.biweekly_value} onChange={(value) => setComponentForm((current) => ({ ...current, biweekly_value: value }))} />
          <TextField label="Semimonthly Value" value={componentForm.semimonthly_value} onChange={(value) => setComponentForm((current) => ({ ...current, semimonthly_value: value }))} />
          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <Button type="button" onClick={resetComponentForm} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={groupModal} onClose={resetGroupForm} title={editingGroupId ? "Edit Salary Group" : "Add Salary Group"} size="lg">
        <form onSubmit={saveGroup} className="space-y-4">
          <TextField label="Group Name" value={groupForm.group_name} onChange={(value) => setGroupForm((current) => ({ ...current, group_name: value }))} required />
          <TextField label="Description" value={groupForm.description} onChange={(value) => setGroupForm((current) => ({ ...current, description: value }))} />
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Components</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {components.map((component) => (
                <label key={String(component.id)} className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={groupForm.component_ids.includes(String(component.id))}
                    onChange={(event) => {
                      const value = String(component.id);
                      setGroupForm((current) => ({
                        ...current,
                        component_ids: event.target.checked
                          ? [...current.component_ids, value]
                          : current.component_ids.filter((item) => item !== value),
                      }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {String(component.component_name)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={resetGroupForm} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={salaryModal} onClose={() => setSalaryModal(false)} title="Add Employee Salary Record" size="md">
        <form onSubmit={saveSalaryRecord} className="space-y-4">
          <SelectField label="Employee" value={salaryForm.employee_id} onChange={(value) => setSalaryForm((current) => ({ ...current, employee_id: value }))} options={employees.map((employee) => [String(employee.id), employeeNameOf(employee)])} />
          <SelectField label="Type" value={salaryForm.type} onChange={(value) => setSalaryForm((current) => ({ ...current, type: value }))} options={[["initial", "Initial"], ["increment", "Increment"], ["decrement", "Decrement"]]} />
          <TextField label="Amount" value={salaryForm.amount} onChange={(value) => setSalaryForm((current) => ({ ...current, amount: value }))} required />
          <TextField label="Date" type="date" value={salaryForm.date} onChange={(value) => setSalaryForm((current) => ({ ...current, date: value }))} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => setSalaryModal(false)} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={slabModal} onClose={() => setSlabModal(false)} title="Add TDS Slab" size="md">
        <form onSubmit={saveTdsSlab} className="space-y-4">
          <TextField label="Salary From" value={slabForm.salary_from} onChange={(value) => setSlabForm((current) => ({ ...current, salary_from: value }))} required />
          <TextField label="Salary To" value={slabForm.salary_to} onChange={(value) => setSlabForm((current) => ({ ...current, salary_to: value }))} required />
          <TextField label="Percent" value={slabForm.salary_percent} onChange={(value) => setSlabForm((current) => ({ ...current, salary_percent: value }))} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={() => setSlabModal(false)} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModal} onClose={resetPaymentForm} title={editingPaymentId ? "Edit Payment Method" : "Add Payment Method"} size="md">
        <form onSubmit={savePaymentMethod} className="space-y-4">
          <TextField label="Payment Method" value={paymentForm.payment_method} onChange={(value) => setPaymentForm((current) => ({ ...current, payment_method: value }))} required />
          <SelectField label="Status" value={paymentForm.status} onChange={(value) => setPaymentForm((current) => ({ ...current, status: value }))} options={[["active", "Active"], ["inactive", "Inactive"]]} />
          <label className="flex items-center gap-2 rounded-xl border border-gray-100 p-3 text-xs font-bold text-gray-600">
            <input type="checkbox" checked={paymentForm.is_default} onChange={(event) => setPaymentForm((current) => ({ ...current, is_default: event.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            Set as default
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={resetPaymentForm} className="h-10 bg-gray-50 text-gray-600 border border-gray-100 px-4 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="h-10 bg-primary text-white px-5 text-[10px] font-black uppercase tracking-widest">Save</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function TextField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
        <option value="">Select {label}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function EmployeeSetupRow({
  row,
  groups,
  cycles,
  defaultGroup,
  defaultCycle,
  onSave,
}: {
  row: { employee: PayrollRecord; monthlySalary: number; salaryGroupId: unknown; cycleId: unknown; allowGenerate: boolean; recordCount: number };
  groups: PayrollRecord[];
  cycles: PayrollRecord[];
  defaultGroup: string;
  defaultCycle: string;
  onSave: (employeeId: number | string, salaryGroupId: string, cycleId: string, allowGenerate: boolean) => Promise<void>;
}) {
  const [salaryGroupId, setSalaryGroupId] = useState(defaultGroup);
  const [cycleId, setCycleId] = useState(defaultCycle);
  const [allowGenerate, setAllowGenerate] = useState(row.allowGenerate);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSalaryGroupId(defaultGroup);
      setCycleId(defaultCycle);
      setAllowGenerate(row.allowGenerate);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [defaultGroup, defaultCycle, row.allowGenerate]);

  return (
    <tr className="hover:bg-gray-50/70 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase">
            {employeeNameOf(row.employee).charAt(0)}
          </div>
          <div>
            <p className="text-xs font-black text-gray-800">{employeeNameOf(row.employee)}</p>
            <p className="text-[10px] font-bold text-gray-400">{row.recordCount} salary record(s)</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-xs font-black text-gray-800">{formatCurrency(row.monthlySalary)}</td>
      <td className="px-5 py-4">
        <select value={salaryGroupId} onChange={(event) => setSalaryGroupId(event.target.value)} className="min-w-[190px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">
          <option value="">Select group</option>
          {groups.map((group) => <option key={String(group.id)} value={String(group.id)}>{String(group.group_name)}</option>)}
        </select>
      </td>
      <td className="px-5 py-4">
        <select value={cycleId} onChange={(event) => setCycleId(event.target.value)} className="min-w-[150px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">
          {cycles.map((cycle) => <option key={String(cycle.id)} value={String(cycle.id)}>{String(cycle.name || cycle.cycle)}</option>)}
        </select>
      </td>
      <td className="px-5 py-4">
        <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <input type="checkbox" checked={allowGenerate} onChange={(event) => setAllowGenerate(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
          Enabled
        </label>
      </td>
      <td className="px-5 py-4 text-right">
        <Button onClick={() => onSave(employeeIdOf(row.employee), salaryGroupId, cycleId, allowGenerate)} className="h-9 bg-primary text-white px-4 text-[10px] font-black uppercase tracking-widest">
          <Save className="h-4 w-4" /> Save
        </Button>
      </td>
    </tr>
  );
}
