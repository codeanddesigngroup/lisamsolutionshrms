"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { AlertTriangle, Edit, Plus, Save, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

type TaskCategory = {
  id: number;
  name: string;
  tasks: number;
};

const initialCategories: TaskCategory[] = [
  { id: 1, name: "Development", tasks: 45 },
  { id: 2, name: "Design", tasks: 22 },
  { id: 3, name: "Bug Fix", tasks: 12 },
  { id: 4, name: "Marketing", tasks: 8 },
];

export default function TaskCategoryPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tasks: "0" });

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditor = (category?: TaskCategory) => {
    setEditingCategory(category || null);
    setForm(category ? { name: category.name, tasks: String(category.tasks) } : { name: "", tasks: "0" });
    setIsEditorOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { name: form.name, tasks: Number(form.tasks) || 0 };
    if (editingCategory) {
      setCategories((prev) => prev.map((category) => category.id === editingCategory.id ? { ...category, ...payload } : category));
      showToast("Task category updated locally. PHP endpoint should persist it.", "success");
    } else {
      setCategories((prev) => [...prev, { id: Date.now(), ...payload }]);
      showToast("Task category added locally. PHP endpoint should persist it.", "success");
    }
    setIsEditorOpen(false);
  };

  const deleteCategory = () => {
    if (!deletingCategoryId) return;
    setCategories((prev) => prev.filter((category) => category.id !== deletingCategoryId));
    setDeletingCategoryId(null);
    showToast("Task category deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Task Categories</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-gray-700">Task Categories</span>
            </div>
          </div>
          <Button onClick={() => openEditor()} className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white border-none text-[10px] h-8 px-3">
            <Plus className="h-3 w-3" />
            <span>Add Category</span>
          </Button>
        </div>

        <Card className="p-0 overflow-hidden shadow-sm border border-gray-100 max-w-4xl mx-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2 border border-gray-200 rounded px-3 py-1.5 bg-gray-50/50 w-64 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search..." className="bg-transparent border-none text-xs w-full focus:outline-none text-gray-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{filteredCategories.length} Categories</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Tasks</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-32 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((cat, i) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-3.5 w-3.5 text-primary opacity-60" />
                      <span className="text-xs font-bold text-gray-700">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {cat.tasks} Tasks
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor(cat)} className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-500 rounded transition-all" title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeletingCategoryId(cat.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-all" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingCategory ? "Edit Task Category" : "Add Task Category"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Category name" />
          <input type="number" min="0" value={form.tasks} onChange={(event) => setForm((prev) => ({ ...prev, tasks: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Total tasks" />
          <div className="flex gap-3 pt-3">
            <Button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingCategoryId} onClose={() => setDeletingCategoryId(null)} title="Delete Task Category" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium text-gray-500">This category will be removed from the task category list.</p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingCategoryId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={deleteCategory} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
