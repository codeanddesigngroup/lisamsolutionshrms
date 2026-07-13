"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function RecruitmentDepartmentsPage() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([
    { id: 1, name: "Engineering" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Human Resources" },
    { id: 4, name: "Design" },
    { id: 5, name: "Sales" },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><Building2 className="h-5 w-5 mr-2 inline-block text-primary" /> Recruitment Departments</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-success btn-outline btn-sm"><Plus className="h-4 w-4 mr-1" /> Add Department</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Departments</li>
            </ol>
          </div>
        </div>
        <div className="white-box p-0">
          <div className="table-responsive">
            <table>
              <thead><tr><th className="w-16">#</th><th>Department Name</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {departments.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{d.name}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" onClick={() => { setDepartments(departments.filter(x => x.id !== d.id)); showToast("Deleted", "success"); }}><Trash2 className="h-4 w-4" /></button>
                      </div>
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
