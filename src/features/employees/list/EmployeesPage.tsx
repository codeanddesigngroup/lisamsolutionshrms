"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye, 
  AlertTriangle,
  Users,
  UserCheck,
  Search,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getStoredRole } from "@/lib/session";
import type { UserRole } from "@/lib/auth-contract";

type EmployeeRecord = {
  id: number | string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  employee_detail?: {
    designation?: { name?: string };
    department?: { team_name?: string };
    joining_date?: string;
  };
};

export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState<UserRole>(() => getStoredRole());
  
  // Advanced Filters parity with Laravel
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/employee?include=employeeDetail,employeeDetail.designation,employeeDetail.department,role");
      setEmployees(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      console.error("Fetch Employees Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const query = searchTerm.trim().toLowerCase();
    const joiningDate = emp.employee_detail?.joining_date || "";
    const searchableText = [
      emp.name,
      emp.email,
      emp.role,
      emp.status,
      emp.employee_detail?.designation?.name,
      emp.employee_detail?.department?.team_name,
    ].filter(Boolean).join(" ").toLowerCase();
    const searchMatch = !query || searchableText.includes(query);
    const statusMatch = statusFilter === "all" || emp.status === statusFilter;
    const deptMatch = deptFilter === "all" || emp.employee_detail?.department?.team_name === deptFilter;
    const desigMatch = designationFilter === "all" || emp.employee_detail?.designation?.name === designationFilter;
    const empMatch = employeeFilter === "all" || emp.id.toString() === employeeFilter;
    const roleMatch = roleFilter === "all" || (emp.role || "employee") === roleFilter;
    const startMatch = !startDate || (Boolean(joiningDate) && joiningDate >= startDate);
    const endMatch = !endDate || (Boolean(joiningDate) && joiningDate <= endDate);
    return searchMatch && statusMatch && deptMatch && desigMatch && empMatch && roleMatch && startMatch && endMatch;
  });
  const canManageEmployees = userRole === "admin";

  const handleDelete = async () => {
    if (deletingEmployeeId) {
      try {
        await api.delete(`/employee/${deletingEmployeeId}`);
        setEmployees(prev => prev.filter(e => e.id !== deletingEmployeeId));
        showToast("Employee deleted successfully", "success");
        setDeletingEmployeeId(null);
      } catch (err) {
        console.error("Delete Employee Error:", err);
        showToast("Failed to delete employee", "error");
      }
    }
  };

  const handleReset = () => {
    setStatusFilter("all");
    setDeptFilter("all");
    setRoleFilter("all");
    setDesignationFilter("all");
    setEmployeeFilter("all");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const handleExport = () => {
    const rows = [
      ["Name", "Email", "Role", "Designation", "Department", "Joining Date", "Status"],
      ...filteredEmployees.map((employee) => [
        employee.name,
        employee.email || "",
        employee.role || "employee",
        employee.employee_detail?.designation?.name || "",
        employee.employee_detail?.department?.team_name || "",
        employee.employee_detail?.joining_date || "",
        employee.status || "",
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const departments = Array.from(new Set(employees.map(e => e.employee_detail?.department?.team_name).filter(Boolean)));
  const designations = Array.from(new Set(employees.map(e => e.employee_detail?.designation?.name).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0">
                Employee Directory
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase">HR / Staff Management / Index</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={fetchEmployees} className="btn-default">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
             </Button>
             <Button onClick={handleExport} className="btn-default">
                <Download className="h-4 w-4 mr-2" /> Export
             </Button>
             {canManageEmployees && (
               <Link href="/employees/create">
                 <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" /> Add Employee
                 </Button>
               </Link>
             )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="white-box p-0 flex items-center">
              <div className="p-6 bg-blue-50">
                 <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="p-6 flex-1">
                 <h4 className="text-3xl m-0">{employees.length}</h4>
                 <p className="text-[10px] text-gray-400 uppercase mt-1">Total Workforce</p>
              </div>
           </div>

           <div className="white-box p-0 flex items-center">
              <div className="p-6 bg-red-50">
                 <UserCheck className="h-8 w-8 text-red-500" />
              </div>
              <div className="p-6 flex-1">
                 <h4 className="text-3xl m-0">
                   {employees.filter(e => e.status === 'deactive').length}
                 </h4>
                 <p className="text-[10px] text-gray-400 uppercase mt-1">Inactive Staff</p>
              </div>
           </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="form-control pl-10"
                  placeholder="Search employee, email, role, department"
                  type="search"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block mb-1">Employee</label>
              <select 
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id.toString()}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Role</label>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">All Roles</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Designation</label>
              <select 
                value={designationFilter}
                onChange={(e) => setDesignationFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">All Designations</option>
                {designations.map(desig => (
                  <option key={desig as string} value={desig as string}>{desig as string}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block mb-1">Department</label>
              <select 
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-control"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept as string} value={dept as string}>{dept as string}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="block mb-1">Joining From</label>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="form-control"
                 />
               </div>
               <div className="space-y-2">
                 <label className="block mb-1">Joining To</label>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="form-control"
                 />
               </div>
               <div className="space-y-2">
                 <label className="block mb-1">Status</label>
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="form-control"
                 >
                   <option value="all">All Status</option>
                   <option value="active">Active</option>
                   <option value="deactive">Inactive</option>
                 </select>
               </div>
            </div>

            <div className="lg:col-span-1 flex items-end">
               <Button 
                 onClick={handleReset}
                 className="w-full btn-default"
               >
                 Reset Filters
               </Button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="p-0 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role & Designation</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {emp.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <Link href={`/employees/${emp.id}`} className="text-xs text-[#041731]">{emp.name}</Link>
                          <div className="text-[10px] text-gray-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                       <div>{emp.employee_detail?.designation?.name || 'N/A'}</div>
                       <div className="text-[10px] text-primary">{emp.employee_detail?.department?.team_name || 'N/A'}</div>
                    </td>
                    <td>
                       {emp.employee_detail?.joining_date ? new Date(emp.employee_detail.joining_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td>
                      <span className={`label ${
                         emp.status === "active" ? "label-success" : "label-danger"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center space-x-2">
                        <Link href={`/employees/${emp.id}`} className="p-1 text-gray-400 hover:text-primary"><Eye className="h-4 w-4" /></Link>
                        {canManageEmployees && (
                          <>
                            <Link href={`/employees/${emp.id}/edit`} className="p-1 text-gray-400 hover:text-blue-500"><Edit className="h-4 w-4" /></Link>
                            <button onClick={() => setDeletingEmployeeId(emp.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
 : !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                          <Users className="h-8 w-8 text-gray-200" />
                       </div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No staff records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal Parity */}
      <Modal
        isOpen={!!deletingEmployeeId}
        onClose={() => setDeletingEmployeeId(null)}
        title="Confirm Termination"
        size="sm"
      >
        <div className="text-center py-6 px-4">
           <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <AlertTriangle className="h-10 w-10 text-red-500" />
           </div>
           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Terminate Record?</h3>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
             This action is permanent and will revoke all access for this employee immediately.
           </p>
           <div className="flex space-x-4">
              <Button onClick={() => setDeletingEmployeeId(null)} className="flex-1 bg-gray-50 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100">Abort</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-200 rounded-2xl">Confirm Termination</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
