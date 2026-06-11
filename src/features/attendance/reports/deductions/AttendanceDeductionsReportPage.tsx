"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Download, Filter, Coins, AlertCircle, UserCheck, TrendingDown, History } from "lucide-react";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { calculateAttendanceStatus } from "@/lib/hr-utils";
import { formatCurrency, toNumber } from "@/lib/payroll-utils";

export default function AttendanceDeductionReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    employees: [],
    attendance: [],
    shifts: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, attRes, shiftRes] = await Promise.all([
          api.get("/employee"),
          api.get("/attendance"),
          api.get("/shift-types")
        ]);
        setData({
          employees: empRes.data.data || [],
          attendance: attRes.data.data || [],
          shifts: shiftRes.data.data || []
        });
      } catch (error) {
        console.error("Failed to fetch report data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const reportData = useMemo(() => {
    return data.employees.map((emp: any) => {
      const empAttendance = data.attendance.filter((a: any) => 
        (a.employee_id || a.user_id) === emp.id
      );
      
      const lates = empAttendance.filter((a: any) => {
        const shift = data.shifts.find((s: any) => s.id === (emp.employee_detail?.shift_type_id || a.shift_id));
        return calculateAttendanceStatus(a, shift) === "late";
      }).length;

      const halfDays = empAttendance.filter((a: any) => {
        const shift = data.shifts.find((s: any) => s.id === (emp.employee_detail?.shift_type_id || a.shift_id));
        return calculateAttendanceStatus(a, shift) === "half-day";
      }).length;

      // Mock Calculation Logic (Based on our "3 Lates = 1 Half Day" policy)
      const baseSalary = 50000; // Mock base
      const perDaySalary = baseSalary / 30;
      
      // 3 Lates = 0.5 Day deduction
      const lateDeductionDays = Math.floor(lates / 3) * 0.5;
      const halfDayDeductionDays = halfDays * 0.5;
      
      const totalDeductionDays = lateDeductionDays + halfDayDeductionDays;
      const deductionAmount = totalDeductionDays * perDaySalary;
      const netSalary = baseSalary - deductionAmount;

      return {
        ...emp,
        lates,
        halfDays,
        baseSalary,
        deductionAmount,
        netSalary,
        totalDeductionDays
      };
    });
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-red-500">
           <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded bg-red-50 flex items-center justify-center text-red-500">
                 <Coins className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Deduction Reconciliation</h4>
                 <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">Attendance Impact on Payroll (May 2026)</p>
              </div>
           </div>
           <div className="flex items-center space-x-2">
              <Button className="btn-default"><Filter className="h-4 w-4 mr-2" /> Adjust Rules</Button>
              <Button variant="primary"><Download className="h-4 w-4 mr-2" /> Export Payroll CSV</Button>
           </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="white-box p-6 bg-orange-50/50 border border-orange-100">
              <div className="flex items-center justify-between">
                 <History className="h-5 w-5 text-orange-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Total Late Instances</span>
              </div>
              <div className="text-2xl font-black text-gray-800 mt-2">
                 {reportData.reduce((acc, curr) => acc + curr.lates, 0)}
              </div>
           </div>
           <div className="white-box p-6 bg-red-50/50 border border-red-100">
              <div className="flex items-center justify-between">
                 <TrendingDown className="h-5 w-5 text-red-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Total Salary Deducted</span>
              </div>
              <div className="text-2xl font-black text-gray-800 mt-2">
                 {formatCurrency(reportData.reduce((acc, curr) => acc + curr.deductionAmount, 0))}
              </div>
           </div>
           <div className="white-box p-6 bg-green-50/50 border border-green-100">
              <div className="flex items-center justify-between">
                 <UserCheck className="h-5 w-5 text-green-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Clean Records</span>
              </div>
              <div className="text-2xl font-black text-gray-800 mt-2">
                 {reportData.filter(d => d.lates === 0).length} Staff
              </div>
           </div>
        </div>

        {/* Main Report Table */}
        <div className="white-box p-0 overflow-hidden">
           <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employee Payroll Impact Sheet</h5>
              <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                 <AlertCircle className="h-3 w-3 text-red-500" />
                 Calculated via "3-Late Rule"
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/50 border-b border-gray-50">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Employee</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Lates</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Half Days</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Base Salary</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Penalty (Days)</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-red-500">Deduction</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-green-600">Net Payable</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {reportData.map((emp) => (
                       <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="text-xs font-black text-gray-800">{emp.name}</div>
                             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{emp.employee_detail?.designation?.name || "Staff"}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`text-xs font-black ${emp.lates > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{emp.lates}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`text-xs font-black ${emp.halfDays > 0 ? 'text-red-500' : 'text-gray-300'}`}>{emp.halfDays}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-600">
                             {formatCurrency(emp.baseSalary)}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                                <div className="h-1.5 w-12 bg-gray-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-red-400" style={{ width: `${Math.min(100, (emp.totalDeductionDays / 5) * 100)}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-red-500">-{emp.totalDeductionDays}d</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-red-500">
                             -{formatCurrency(emp.deductionAmount)}
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-sm font-black text-gray-800">{formatCurrency(emp.netSalary)}</div>
                             {emp.deductionAmount === 0 && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Full Pay</span>}
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
