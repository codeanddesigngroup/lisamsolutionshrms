"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Layers,
  ChevronRight,
  Search,
  Info
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";

type FaqCategory = {
  id: number;
  name: string;
  faq_count: number;
};

export default function FAQCategoryPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<FaqCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API parity with Laravel route admin.employee-faq-category.data
      // await api.get("/employee-faq-category");
      
      // Mock data for parity
      const mockCategories = [
        { id: 1, name: "Onboarding", faq_count: 5 },
        { id: 2, name: "Leave Policy", faq_count: 3 },
        { id: 3, name: "Attendance Rules", faq_count: 8 },
        { id: 4, name: "Company Benefits", faq_count: 4 }
      ];
      setCategories(mockCategories);
    } catch {
      showToast("Failed to load FAQ categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchCategories();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchCategories]);

  const handleSave = async () => {
    if (!categoryName) {
      showToast("Please enter a category name", "error");
      return;
    }
    setLoading(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast(`Category ${currentCategory ? 'updated' : 'created'} successfully`, "success");
      setIsModalOpen(false);
      await fetchCategories();
    } catch {
      showToast("Action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentCategory(null);
    setCategoryName("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: FaqCategory) => {
    setCurrentCategory(cat);
    setCategoryName(cat.name);
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">
                FAQ Categories
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Knowledge Base / Categories</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
             <Link href="/employees/faq">
               <Button className="bg-gray-50 text-gray-500 border-none px-3 md:px-5 h-10 md:h-11 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all rounded-xl">
                  Back to FAQs
               </Button>
             </Link>
             <Button onClick={openAddModal} className="bg-primary text-white text-[9px] md:text-[10px] font-black px-4 md:px-6 h-10 md:h-11 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all rounded-xl">
                <Plus className="h-4 w-4 mr-1 md:mr-2" /> Add Category
             </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="p-4 border-none shadow-sm bg-white rounded-2xl border border-gray-50 flex items-center space-x-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="SEARCH CATEGORIES..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>
           <Button onClick={fetchCategories} className="bg-gray-50 text-gray-400 border-none h-11 w-11 p-0 rounded-xl hover:text-primary transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
        </Card>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
             <Card key={cat.id} className="p-6 border-none shadow-sm bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex space-x-1">
                      <button onClick={() => openEditModal(cat)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit className="h-3.5 w-3.5" /></button>
                      <button className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                   </div>
                </div>
                <div className="flex flex-col h-full">
                   <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-4">
                      <Layers className="h-5 w-5" />
                   </div>
                   <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">{cat.name}</h3>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                      {cat.faq_count} Questions <ChevronRight className="h-3 w-3 ml-2 text-primary" />
                   </p>
                   
                   <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <Link href={`/employees/faq?category=${cat.id}`} className="text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:underline">
                         View Content
                      </Link>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                   </div>
                </div>
             </Card>
           )) : !loading && (
             <div className="col-span-full py-20 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No categories found matching your search</p>
             </div>
           )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCategory ? "Edit Category" : "Add New Category"}
        size="sm"
      >
        <div className="space-y-6 py-4">
           <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</label>
              <input 
                type="text" 
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Company Policy"
                className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 text-xs font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
           </div>

           <div className="p-4 bg-primary/5 rounded-2xl flex items-start space-x-3">
              <Info className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
                 Categories help organize your employee knowledge base into logical sections for better accessibility.
              </p>
           </div>

           <div className="flex space-x-3 pt-4">
              <Button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl">Cancel</Button>
              <Button onClick={handleSave} className="flex-1 bg-primary text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark shadow-xl shadow-primary/20 rounded-2xl">
                 {currentCategory ? "Update" : "Create"} Category
              </Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
