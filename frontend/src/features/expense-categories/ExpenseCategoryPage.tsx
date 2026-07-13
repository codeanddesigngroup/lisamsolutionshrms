"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Check,
  ChevronRight,
  Settings,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ExpenseCategoryPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([
    { id: 1, name: "Travel" },
    { id: 2, name: "Food" },
    { id: 3, name: "Office Supplies" },
    { id: 4, name: "Marketing" },
  ]);

  const [newName, setNewName] = useState("");

  const handleUpdate = async (id: number) => {
    showToast("Category updated", "success");
  };

  const handleDelete = async (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
    showToast("Category deleted", "success");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const id = Math.max(...categories.map(c => c.id)) + 1;
    setCategories([...categories, { id, name: newName }]);
    setNewName("");
    showToast("Category created", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <DollarSign className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Expense Categories
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end">
                <ol className="breadcrumb">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li><Link href="/expenses">Expenses</Link></li>
                    <li className="active">Categories</li>
                </ol>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="white-box">
                <h3 className="box-title mb-6">Existing Categories</h3>
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th className="w-16">#</th>
                                <th>Category Name</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat, index) => (
                                <tr key={cat.id}>
                                    <td>{index + 1}</td>
                                    <td className="font-medium">{cat.name}</td>
                                    <td className="text-right">
                                        <div className="flex justify-end space-x-1">
                                            <button onClick={() => handleDelete(cat.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all">
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

            <div className="white-box h-fit">
                <h3 className="box-title mb-6">Add New Category</h3>
                <form onSubmit={handleCreate}>
                    <div className="form-group">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Category Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Utilities"
                            required 
                        />
                    </div>
                    <div className="form-actions mt-6">
                        <Button type="submit" className="btn-success w-full">
                            <Plus className="h-4 w-4 mr-2" /> Save Category
                        </Button>
                    </div>
                </form>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
