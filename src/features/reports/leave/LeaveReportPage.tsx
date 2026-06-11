"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart2, Calendar, ChevronDown, Clock, Download, FileText, PieChart as PieChartIcon, RefreshCw, Search } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StableResponsiveContainer from "@/components/charts/StableResponsiveContainer";
import api from "@/lib/api";
import { getEmployeeDisplayId, getLeaveDate, getLeaveEmployeeId, leaveUnits, type HRRecord } from "@/lib/hr-utils";

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 30);

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
const getLeaveTypeId = (leave: HRRecord) => String(leave.leave_type_id || leave.leave_type?.id || leave.type?.id || "");

export default function LeaveReportPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<HRRecord[]>([]);
  const [leaves, setLeaves] = useState<HRRecord[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<HRRecord[]>([]);
  const [leaveQuotas, setLeaveQuotas] = useState<HRRecord[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [startDate, setStartDate] = useState(toInputDate(defaultStart));
  const [endDate, setEndDate] = useState(toInputDate(today));

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeResponse, leaveResponse, leaveTypeResponse, quotaResponse] = await Promise.all([
        api.get("/employee"),
        api.get("/leaves"),
        api.get("/leave-type"),
        api.get("/leave-quotas"),
      ]);
      setEmployees(employeeResponse.data.data || []);
      setLeaves(leaveResponse.data.data || []);
      setLeaveTypes(leaveTypeResponse.data.data || []);
      setLeaveQuotas(quotaResponse.data.data || []);
    } catch (error) {
      console.error("Fetch Leave Report Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchReport();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReport]);

  const reportRows = useMemo(() => {
    return employees.map((employee) => {
      const employeeId = String(employee.id);
      const employeeLeaves = leaves.filter((leave) => {
        const date = getLeaveDate(leave);
        return getLeaveEmployeeId(leave) === employeeId && (!startDate || date >= startDate) && (!endDate || date <= endDate);
      });
      const quotas = leaveQuotas.filter((quota) => getLeaveEmployeeId(quota) === employeeId);
      const total = quotas.length > 0
        ? quotas.reduce((sum, quota) => sum + Number(quota.no_of_leaves || quota.leaves || 0), 0)
        : leaveTypes.reduce((sum, type) => sum + Number(type.no_of_leaves || type.leave_number || type.leaves || 0), 0);
      const approved = employeeLeaves.filter((leave) => leave.status === "approved").reduce((sum, leave) => sum + leaveUnits(leave), 0);
      const pending = employeeLeaves.filter((leave) => leave.status === "pending").reduce((sum, leave) => sum + leaveUnits(leave), 0);
      const rejected = employeeLeaves.filter((leave) => leave.status === "rejected").reduce((sum, leave) => sum + leaveUnits(leave), 0);
      const upcoming = employeeLeaves.filter((leave) => leave.status !== "rejected" && getLeaveDate(leave) > toInputDate(today)).reduce((sum, leave) => sum + leaveUnits(leave), 0);
      const byType = leaveTypes.map((type) => {
        const typeId = String(type.id);
        const quota = quotas.find((item) => String(item.leave_type_id || item.type_id) === typeId);
        const allowed = Number(quota?.no_of_leaves || type.no_of_leaves || type.leave_number || type.leaves || 0);
        const used = employeeLeaves.filter((leave) => getLeaveTypeId(leave) === typeId && leave.status === "approved").reduce((sum, leave) => sum + leaveUnits(leave), 0);
        return { id: typeId, name: type.type_name || type.name || "Leave", allowed, used, remaining: Math.max(0, allowed - used) };
      });

      return {
        id: employee.id,
        employee,
        total,
        taken: approved,
        pending,
        rejected,
        upcoming,
        remaining: Math.max(0, total - approved),
        byType,
      };
    }).filter((row) => {
      const employeeMatch = employeeFilter === "all" || String(row.id) === employeeFilter;
      const balanceMatch =
        balanceFilter === "all" ||
        (balanceFilter === "pending" && row.pending > 0) ||
        (balanceFilter === "low" && row.remaining <= 5) ||
        (balanceFilter === "healthy" && row.remaining > 5);
      return employeeMatch && balanceMatch;
    });
  }, [balanceFilter, employeeFilter, employees, endDate, leaveQuotas, leaveTypes, leaves, startDate]);

  const totals = useMemo(() => {
    const taken = reportRows.reduce((sum, row) => sum + row.taken, 0);
    const pending = reportRows.reduce((sum, row) => sum + row.pending, 0);
    const rejected = reportRows.reduce((sum, row) => sum + row.rejected, 0);
    const remaining = reportRows.reduce((sum, row) => sum + row.remaining, 0);
    const upcoming = reportRows.reduce((sum, row) => sum + row.upcoming, 0);
    return { taken, pending, rejected, remaining, upcoming };
  }, [reportRows]);

  const chartData = [
    { name: "Approved", value: totals.taken, color: "#10b981" },
    { name: "Pending", value: totals.pending, color: "#f59e0b" },
    { name: "Rejected", value: totals.rejected, color: "#ef4444" },
  ].filter((entry) => entry.value > 0);

  const handleReset = () => {
    setEmployeeFilter("all");
    setBalanceFilter("all");
    setStartDate(toInputDate(defaultStart));
    setEndDate(toInputDate(today));
  };

  const handleExport = () => {
    const rows = [
      ["Employee", "Employee ID", "Allowed", "Taken", "Remaining", "Pending", "Upcoming", "Rejected"],
      ...reportRows.map((row) => [
        row.employee.name || "",
        getEmployeeDisplayId(row.employee),
        String(row.total),
        String(row.taken),
        String(row.remaining),
        String(row.pending),
        String(row.upcoming),
        String(row.rejected),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leave-report-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="flex items-center text-base font-black uppercase tracking-widest text-gray-800">
              <FileText className="mr-3 h-5 w-5 text-primary" />
              Leave Report
            </h1>
            <p className="mt-0.5 text-[10px] font-bold tracking-wider text-gray-400">Reports / Employee Leave Summary</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={fetchReport} className="rounded-xl bg-gray-50 p-2.5 text-gray-400 transition-all hover:text-primary" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button onClick={handleExport} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-none bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">From</label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="form-control" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">To</label>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="form-control" />
            </div>
            <div className="md:col-span-3">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Balance Status</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <select value={balanceFilter} onChange={(event) => setBalanceFilter(event.target.value)} className="form-control pl-11">
                  <option value="all">All Balances</option>
                  <option value="pending">Has Pending Requests</option>
                  <option value="low">Low Remaining Balance</option>
                  <option value="healthy">Healthy Remaining Balance</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Select Employee</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="form-control pl-11">
                  <option value="all">All Employees</option>
                  {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end space-x-2 md:col-span-2">
              <Button onClick={fetchReport} className="h-11 flex-1 bg-primary text-[10px] font-black uppercase tracking-widest text-white">Generate</Button>
              <Button onClick={handleReset} className="h-11 border-none bg-gray-100 px-6 text-[10px] font-black uppercase tracking-widest text-gray-500">Reset</Button>
            </div>
          </div>
        </Card>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            { label: "Total Leaves Taken", value: `${totals.taken} Days`, sub: "Filtered employees", color: "text-primary", icon: BarChart2, bg: "bg-primary/5" },
            { label: "Pending Approvals", value: String(totals.pending).padStart(2, "0"), sub: "Awaiting HR review", color: "text-orange-500", icon: Clock, bg: "bg-orange-50" },
            { label: "Remaining Balance", value: `${totals.remaining} Days`, sub: "Filtered pool", color: "text-green-500", icon: PieChartIcon, bg: "bg-green-50" },
            { label: "Upcoming Leaves", value: `${totals.upcoming} Days`, sub: "Future requests", color: "text-blue-500", icon: Calendar, bg: "bg-blue-50" },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden border-none bg-white p-6 shadow-sm">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                  <h3 className={`text-2xl font-black tracking-tighter ${stat.color}`}>{stat.value}</h3>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-300">{stat.sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="flex flex-col border-none bg-white p-6 shadow-sm lg:col-span-4">
            <h3 className="mb-8 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              <PieChartIcon className="mr-2 h-4 w-4 text-primary" />
              Status Breakdown
            </h3>
            <StableResponsiveContainer height={256}>
              <RechartsPieChart>
                <Pie data={chartData.length > 0 ? chartData : [{ name: "No Data", value: 1, color: "#e5e7eb" }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {(chartData.length > 0 ? chartData : [{ color: "#e5e7eb" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={({ payload }) => (
                    <ul className="mt-6 flex justify-center space-x-4">
                      {payload?.map((entry: any, index: number) => (
                        <li key={`item-${index}`} className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                          <span className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          {entry.value}
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </RechartsPieChart>
            </StableResponsiveContainer>
          </Card>

          <Card className="relative overflow-hidden border-none bg-white p-0 shadow-sm lg:col-span-8">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-5">
              <h3 className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                <Search className="mr-2 h-4 w-4 text-primary" />
                Staff Leave Balances
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    {["#", "Employee", "Allowed", "Taken", "Remaining", "Pending", "Upcoming"].map((heading) => (
                      <th key={heading} className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 first:text-left">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportRows.map((row, index) => (
                    <tr key={row.id} className="group transition-colors hover:bg-gray-50/50">
                      <td className="px-8 py-5 text-center text-xs font-bold text-gray-300">{index + 1}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 to-primary/5 text-[10px] font-black uppercase text-primary transition-transform group-hover:rotate-3">
                            {String(row.employee.name || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-gray-800">{row.employee.name}</p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">{getEmployeeDisplayId(row.employee)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center text-xs font-bold text-gray-500">{row.total}</td>
                      <td className="px-8 py-5 text-center"><Badge value={row.taken} color="red" /></td>
                      <td className="px-8 py-5 text-center"><Badge value={row.remaining} color="green" /></td>
                      <td className="px-8 py-5 text-center"><Badge value={row.pending} color="orange" /></td>
                      <td className="px-8 py-5 text-center"><Badge value={row.upcoming} color="blue" /></td>
                    </tr>
                  ))}
                  {!loading && reportRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        No leave balances found for selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Badge({ value, color }: { value: number; color: "green" | "red" | "orange" | "blue" }) {
  const classes = {
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-500 border-red-100",
    orange: "bg-orange-50 text-orange-500 border-orange-100",
    blue: "bg-blue-50 text-blue-500 border-blue-100",
  };

  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${classes[color]}`}>{value}</span>;
}
