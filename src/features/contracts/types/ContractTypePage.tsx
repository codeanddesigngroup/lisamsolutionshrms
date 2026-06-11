"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  FileText, 
  Trash2, 
  Edit, 
  Check, 
  ChevronRight,
  Settings,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ContractTypePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([
    { id: 1, name: "Full Time" },
    { id: 2, name: "Part Time" },
    { id: 3, name: "Contractual" },
    { id: 4, name: "Freelance" },
  ]);

  const handleDelete = (id: number) => {
    setTypes(types.filter(t => t.id !== id));
    showToast("Contract type deleted", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <Briefcase className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Contract Types
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
                <Button className="btn-success btn-outline btn-sm">
                    Add Contract Type <Plus className="h-4 w-4 ml-1 inline-block" />
                </Button>
                <ol className="breadcrumb hidden-xs">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li><Link href="/contracts">Contracts</Link></li>
                    <li className="active">Contract Types</li>
                </ol>
            </div>
        </div>

        {/* Contract Types Table */}
        <div className="white-box p-0">
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th className="w-16">#</th>
                            <th>Contract Type Name</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((type, index) => (
                            <tr key={type.id}>
                                <td>{index + 1}</td>
                                <td className="font-medium text-gray-700">{type.name}</td>
                                <td className="text-right">
                                    <div className="flex justify-end space-x-1">
                                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(type.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
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
