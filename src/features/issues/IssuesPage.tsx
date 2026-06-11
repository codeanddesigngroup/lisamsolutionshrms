"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Bug, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Check, 
  ChevronRight,
  AlertTriangle,
  User,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export default function IssuesPage() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<any[]>([]);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for legacy parity
      setIssues([
        { id: 1, description: "Sidebar menu not opening on mobile", project: "HR Portal", reporter: "John Doe", status: "pending" },
        { id: 2, description: "Salary calculation error for February", project: "Payroll System", reporter: "Jane Smith", status: "resolved" },
        { id: 3, description: "PDF export failing for invoices", project: "Billing Module", reporter: "Admin", status: "pending" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchIssues();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchIssues]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <Bug className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Issues
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
                <Button className="btn-success btn-outline btn-sm">
                    Add Issue <Plus className="h-4 w-4 ml-1 inline-block" />
                </Button>
                <ol className="breadcrumb hidden-xs">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li className="active">Issues</li>
                </ol>
            </div>
        </div>

        {/* Issues Table */}
        <div className="white-box p-0">
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th className="w-16 text-center">#</th>
                            <th>Description</th>
                            <th>Project</th>
                            <th>Reporter</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issues.map((issue, index) => (
                            <tr key={issue.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>
                                    <div className="font-bold text-[13px] flex items-start">
                                        <AlertTriangle className="h-3 w-3 mr-2 text-warning mt-1 shrink-0" />
                                        {issue.description}
                                    </div>
                                </td>
                                <td>
                                    <span className="text-primary font-medium">{issue.project}</span>
                                </td>
                                <td>
                                    <div className="flex items-center text-[12px]">
                                        <User className="h-3 w-3 mr-1 text-gray-400" />
                                        {issue.reporter}
                                    </div>
                                </td>
                                <td>
                                    <span className={`label ${issue.status === 'resolved' ? 'label-success' : 'label-warning'}`}>
                                        {issue.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end space-x-1">
                                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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
