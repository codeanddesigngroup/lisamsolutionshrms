"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function JobCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([
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
            <h4 className="page-title m-0"><Tag className="h-5 w-5 mr-2 inline-block text-primary" /> Job Categories</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-success btn-outline btn-sm"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Categories</li>
            </ol>
          </div>
        </div>
        <div className="white-box p-0">
          <div className="table-responsive">
            <table>
              <thead><tr><th className="w-16">#</th><th>Category Name</th><th className="text-right">Action</th></tr></thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{c.name}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" onClick={() => { setCategories(categories.filter(x => x.id !== c.id)); showToast("Deleted", "success"); }}><Trash2 className="h-4 w-4" /></button>
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
