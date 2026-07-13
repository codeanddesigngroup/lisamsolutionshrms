"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Filter, RefreshCw, DollarSign, Download, PieChart, TrendingUp, User } from "lucide-react";
import Link from "next/link";

const expenseData = [
  { id: 1, item: "MacBook Pro", category: "Hardware", price: "$2,500.00", date: "2026-05-01", status: "Approved" },
  { id: 2, item: "Office Rent", category: "Rent", price: "$1,200.00", date: "2026-05-02", status: "Pending" },
  { id: 3, item: "Internet Bill", category: "Utilities", price: "$80.00", date: "2026-05-03", status: "Approved" },
];

export default function ExpenseReportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Expense Report</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/reports" className="hover:text-primary transition-colors font-bold">Reports</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Expense Report</span>
            </div>
          </div>
          <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
             <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-6 border-none shadow-sm bg-white flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                 <DollarSign className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Expenses</p>
                 <p className="text-2xl font-black text-gray-800">$3,780.00</p>
              </div>
           </Card>
           <Card className="p-6 border-none shadow-sm bg-white flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <PieChart className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Highest Category</p>
                 <p className="text-2xl font-black text-gray-800">Hardware</p>
              </div>
           </Card>
           <Card className="p-6 border-none shadow-sm bg-white flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center">
                 <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Monthly Growth</p>
                 <p className="text-2xl font-black text-gray-800">+4.2%</p>
              </div>
           </Card>
        </div>

        {/* Data Table */}
        <Card className="p-0 overflow-hidden shadow-sm border border-gray-100 bg-white">
           <div className="p-5 border-b border-gray-50 bg-gray-50/30">
              <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Expense Itemization</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Item Name</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Price</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Purchase Date</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {expenseData.map((row) => (
                       <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-gray-700">{row.item}</td>
                          <td className="px-6 py-4">
                             <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">{row.category}</span>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-gray-900">{row.price}</td>
                          <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.date}</td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                row.status === "Approved" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                             }`}>{row.status}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
