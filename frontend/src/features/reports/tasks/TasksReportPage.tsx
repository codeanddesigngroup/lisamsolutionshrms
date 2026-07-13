"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Filter, RefreshCw, BarChart, PieChart as PieIcon, TrendingUp, Download, Calendar, Search, Users, Briefcase } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StableResponsiveContainer from "@/components/charts/StableResponsiveContainer";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const taskRows = [
  { id: 1, project: "Website Redesign", task: "Design Homepage", assignee: "John Doe", dueDate: "2026-05-10", status: "In Progress" },
  { id: 2, project: "Mobile App", task: "Bug Fixing", assignee: "Jane Smith", dueDate: "2026-05-12", status: "Completed" },
  { id: 3, project: "API Integration", task: "Unit Testing", assignee: "Mike Tyson", dueDate: "2026-05-15", status: "To Do" },
  { id: 4, project: "Website Redesign", task: "CSS Styling", assignee: "Sarah Connor", dueDate: "2026-05-08", status: "Completed" },
  { id: 5, project: "Mobile App", task: "UI Enhancements", assignee: "Bruce Wayne", dueDate: "2026-05-20", status: "In Progress" },
];

export default function TaskReportPage() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");

  const filteredTaskRows = taskRows.filter((row) => {
    const startMatch = !dateFrom || row.dueDate >= dateFrom;
    const endMatch = !dateTo || row.dueDate <= dateTo;
    const projectMatch = !projectFilter || row.project === projectFilter;
    const employeeMatch = !employeeFilter || row.assignee === employeeFilter;
    return startMatch && endMatch && projectMatch && employeeMatch;
  });

  const filteredTaskStats = [
    { label: "To Complete", value: filteredTaskRows.filter((row) => row.status !== "Completed").length, color: "#3b82f6", bg: "bg-blue-500" },
    { label: "Completed", value: filteredTaskRows.filter((row) => row.status === "Completed").length, color: "#10b981", bg: "bg-green-500" },
    { label: "Pending", value: filteredTaskRows.filter((row) => row.status === "To Do").length, color: "#f59e0b", bg: "bg-yellow-500" },
  ];
  const projectOptions = Array.from(new Set(taskRows.map((row) => row.project)));
  const employeeOptions = Array.from(new Set(taskRows.map((row) => row.assignee)));

  const chartData = filteredTaskStats.map(stat => ({
    name: stat.label,
    value: stat.value,
    color: stat.color
  }));

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setProjectFilter("");
    setEmployeeFilter("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <Briefcase className="h-5 w-5 mr-3 text-primary" />
              Task Report
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Home / Reports / Project Task Analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
               <Download className="h-4 w-4 mr-2" /> Export Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm p-6 bg-white mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-gray-500" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">All Projects</option>
                  {projectOptions.map((project) => <option key={project} value={project}>{project}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Employee</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="w-full bg-gray-50/50 rounded-xl py-3 pl-11 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="">All Employees</option>
                  {employeeOptions.map((employee) => <option key={employee} value={employee}>{employee}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-12 flex items-end justify-end space-x-2">
              <Button onClick={handleRefresh} className="bg-primary text-white text-[10px] font-black h-11 px-8 uppercase tracking-widest">
                Apply
              </Button>
              <Button onClick={handleReset} className="bg-gray-100 text-gray-500 border-none px-6 h-11 text-[10px] font-black uppercase tracking-widest">
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {filteredTaskStats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm p-6 bg-white overflow-hidden relative group">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-2xl font-black text-gray-800 tracking-tighter">{stat.value}</h4>
                  <div className="flex items-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> Project progress
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} text-white flex items-center justify-center shadow-lg shadow-gray-200`}>
                  <BarChart className="h-6 w-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts & Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 border-none shadow-sm p-6 bg-white flex flex-col">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
              <PieIcon className="h-4 w-4 mr-2 text-primary" />
              Status Breakdown
            </h3>
            <StableResponsiveContainer height={256}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  content={({ payload }) => (
                    <ul className="flex justify-center space-x-4 mt-4">
                      {payload?.map((entry: any, index: number) => (
                        <li key={`item-${index}`} className="flex items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }}></span>
                          {entry.value}
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </PieChart>
            </StableResponsiveContainer>
          </Card>

          <Card className="lg:col-span-8 border-none shadow-sm bg-white overflow-hidden p-0">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                <Search className="h-4 w-4 mr-2 text-primary" />
                Tasks Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Task</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign To</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTaskRows.map((row, i) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-gray-300 text-center">{i + 1}</td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-black text-primary uppercase tracking-tight hover:underline cursor-pointer">{row.project}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-700">{row.task}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                           <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400 border border-gray-200">
                             {row.assignee.charAt(0)}
                           </div>
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{row.assignee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-400">{row.dueDate}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          row.status === "Completed" ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredTaskRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        No tasks found for selected filters
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
