"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  Layers, 
  Trash2, 
  Edit, 
  Eye, 
  Check,
  ChevronRight,
  ListTodo,
  Users
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

export default function ProjectTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for legacy parity
      setTemplates([
        { id: 1, name: "Web Development Standard", category: "Development", members: 5, tasks: 12 },
        { id: 2, name: "SEO Audit Template", category: "Marketing", members: 2, tasks: 8 },
        { id: 3, name: "Client Onboarding", category: "Admin", members: 3, tasks: 15 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTemplates();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTemplates]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-6 col-md-6 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <Layers className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Project Templates
                    <span className="text-info border-l border-[#eee] ml-2 pl-2">3</span>
                    <span className="text-[10px] text-gray-400 ml-1 uppercase font-bold">Total Templates</span>
                </h4>
            </div>
            <div className="col-lg-6 col-sm-8 col-md-6 col-xs-12 flex justify-end items-center space-x-2">
                <Link href="/project-template/create">
                    <Button className="btn-success btn-outline btn-sm">
                        Add Template <Plus className="h-4 w-4 ml-1 inline-block" />
                    </Button>
                </Link>
            </div>
        </div>

        {/* Templates Table */}
        <div className="white-box p-0">
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th className="w-16">#</th>
                            <th>Template Name</th>
                            <th>Category</th>
                            <th><Users className="h-4 w-4 inline-block mr-1" /> Members</th>
                            <th><ListTodo className="h-4 w-4 inline-block mr-1" /> Tasks</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map((template, index) => (
                            <tr key={template.id}>
                                <td>{index + 1}</td>
                                <td className="font-bold text-primary hover:underline cursor-pointer">{template.name}</td>
                                <td>
                                    <span className="label label-info">{template.category}</span>
                                </td>
                                <td>{template.members}</td>
                                <td>{template.tasks}</td>
                                <td className="text-right">
                                    <div className="flex justify-end space-x-1">
                                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all">
                                            <Edit className="h-4 w-4" />
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
