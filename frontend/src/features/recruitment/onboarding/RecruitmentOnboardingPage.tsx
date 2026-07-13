"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  UserCheck, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
  const onboards = [
    { id: 1, name: "Dan Brown", job: "HR Manager", joinDate: "2024-05-15", status: "In Progress", statusColor: "label-warning" },
    { id: 2, name: "Sarah Wilson", job: "Frontend Developer", joinDate: "2024-05-20", status: "Completed", statusColor: "label-success" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><UserCheck className="h-5 w-5 mr-2 inline-block text-primary" /> Onboarding</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/recruitment/onboarding/create"><Button className="btn-inverse btn-sm"><Plus className="h-4 w-4 mr-1 inline-block" /> Add Onboard</Button></Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Onboarding</li>
            </ol>
          </div>
        </div>
        <div className="white-box p-0">
          <div className="table-responsive">
            <table>
              <thead><tr><th className="w-12">#</th><th>Employee Name</th><th>Job Applied For</th><th>Joining Date</th><th>Status</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {onboards.map((o, i) => (
                  <tr key={o.id}>
                    <td>{i + 1}</td>
                    <td className="font-bold">{o.name}</td>
                    <td>{o.job}</td>
                    <td>{new Date(o.joinDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><span className={`label ${o.statusColor}`}>{o.status}</span></td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all"><Eye className="h-4 w-4" /></button>
                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                        <button className="btn-default btn-outline p-1 rounded hover:bg-gray-200 transition-all"><FileText className="h-4 w-4" /></button>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
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
