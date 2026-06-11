"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  AlertTriangle,
  HelpCircle,
  Layers,
  Search,
  BookOpen
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function EmployeeFaqCategoryPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/employee-faq-category");
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Fetch FAQ Categories Error:", err);
      setCategories((current) =>
        current.length === 0 ? [
          { id: 1, name: "General", faq_count: 5 },
          { id: 2, name: "Payroll", faq_count: 3 },
          { id: 3, name: "Benefits", faq_count: 2 },
          { id: 4, name: "Work Culture", faq_count: 4 }
        ] : current
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/employee-faq-category/${editingCategory.id}`, { name: categoryName });
        showToast("Category updated successfully", "success");
      } else {
        await api.post("/employee-faq-category", { name: categoryName });
        showToast("Category created successfully", "success");
      }
      setIsModalOpen(false);
      void fetchCategories();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async () => {
    if (deletingCategoryId) {
      try {
        await api.delete(`/employee-faq-category/${deletingCategoryId}`);
        showToast("Category deleted successfully", "success");
        setDeletingCategoryId(null);
        void fetchCategories();
      } catch (err) {
        showToast("Failed to delete category", "error");
      }
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 text-gray-800 font-black uppercase tracking-widest text-sm">
                FAQ Categories
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">Home / HR / Knowledge Base / Categories</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={fetchCategories} className="bg-gray-50 text-gray-400 hover:text-primary border-none p-2.5 rounded-xl transition-all">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
             </Button>
             <Button onClick={openAddModal} className="bg-primary text-white text-[10px] font-black px-6 h-11 uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> Add Category
             </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              className="w-full bg-gray-50/50 border-none rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Data Table */}
        <Card className="p-0 border-none shadow-sm bg-white overflow-hidden relative rounded-2xl">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100"># ID</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Category Name</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Questions Count</th>
                  <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCategories.length > 0 ? filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 text-xs font-black text-gray-300">
                      #{cat.id.toString().padStart(2, '0')}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                             <HelpCircle className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{cat.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/5">
                         {cat.faq_count || 0} Questions
                       </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center space-x-3">
                        <button 
                          onClick={() => openEditModal(cat)}
                          className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingCategoryId(cat.id)}
                          className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                       <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-gray-200">
                          <BookOpen className="h-10 w-10 text-gray-200" />
                       </div>
                       <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">No Categories Found</h2>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Add your first FAQ category to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Update Category" : "Create Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
           <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Payroll, General, IT Support"
                className="w-full bg-gray-50 border-none rounded-xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
           </div>
           <div className="flex space-x-4 pt-4">
              <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl transition-all">
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
           </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategoryId}
        onClose={() => setDeletingCategoryId(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="text-center py-6 px-4">
           <div className="h-24 w-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-6 shadow-inner">
              <AlertTriangle className="h-10 w-10 text-red-500" />
           </div>
           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-3">Permanent Deletion?</h3>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">
             Deleting this category will un-categorize all associated FAQs. This action cannot be undone.
           </p>
           <div className="flex space-x-4">
              <Button onClick={() => setDeletingCategoryId(null)} className="flex-1 bg-gray-50 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Abort</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-200 rounded-2xl transition-all">Delete Forever</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
