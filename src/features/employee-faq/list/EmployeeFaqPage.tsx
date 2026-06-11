"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Calendar, 
  Users, 
  Briefcase, 
  Plus,
  ArrowRight,
  RefreshCw,
  Filter,
  HelpCircle,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Edit, Trash2, AlertTriangle, FilePlus } from "lucide-react";

export default function EmployeeFAQsPage() {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqTitle, setFaqTitle] = useState("");
  const [faqDescription, setFaqDescription] = useState("");
  const [faqCategoryId, setFaqCategoryId] = useState("");
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [faqRes, catRes] = await Promise.all([
        api.get("/employee-faq"),
        api.get("/employee-faq-category") // Assuming this endpoint exists based on Laravel
      ]);
      setFaqs(faqRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch (err) {
      console.error("Fetch FAQ Data Error:", err);
      setCategories((current) =>
        current.length === 0 ? [
          { id: 1, name: "General" },
          { id: 2, name: "Payroll" },
          { id: 3, name: "Benefits" },
          { id: 4, name: "Work Culture" }
        ] : current
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const openAddModal = () => {
    setEditingFaq(null);
    setFaqTitle("");
    setFaqDescription("");
    setFaqCategoryId(categories[0]?.id?.toString() || "");
    setIsModalOpen(true);
  };

  const openEditModal = (faq: any) => {
    setEditingFaq(faq);
    setFaqTitle(faq.title);
    setFaqDescription(faq.description);
    setFaqCategoryId(faq.category_id.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: faqTitle,
        description: faqDescription,
        category_id: faqCategoryId
      };

      if (editingFaq) {
        await api.put(`/employee-faq/${editingFaq.id}`, payload);
        showToast("FAQ updated successfully", "success");
      } else {
        await api.post("/employee-faq", payload);
        showToast("FAQ created successfully", "success");
      }
      setIsModalOpen(false);
      void fetchData();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async () => {
    if (deletingFaqId) {
      try {
        await api.delete(`/employee-faq/${deletingFaqId}`);
        showToast("FAQ deleted successfully", "success");
        setDeletingFaqId(null);
        void fetchData();
      } catch (err) {
        showToast("Failed to delete FAQ", "error");
      }
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  // Group FAQs by Category and Filter
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         faq.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const categoryName = faq.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: categoryName,
        questions: []
      };
    }
    acc[categoryName].questions.push({
      id: faq.id,
      q: faq.title,
      a: faq.description
    });
    return acc;
  }, {});

  const displayData = Object.values(groupedFaqs) as any[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Parity */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <HelpCircle className="h-5 w-5 mr-3 text-primary" />
              Employee FAQ
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Home / Employee FAQ / Knowledge Base</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button 
              onClick={openAddModal}
              className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20"
            >
               <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>
        </div>

        {/* Filters Section Parity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
           <Card className="lg:col-span-12 border-none shadow-sm p-6 bg-white">
              <div className="flex flex-wrap items-end gap-6">
                 <div className="flex-1 min-w-[250px]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Search Knowledge Base</label>
                    <div className="relative group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                       <input 
                         type="text" 
                         placeholder="What are you looking for?" 
                         className="w-full bg-gray-50/50 border-none rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                 </div>
                 <div className="w-full md:w-64">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">FAQ Category</label>
                    <div className="relative">
                       <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                       <select 
                         value={selectedCategory}
                         onChange={(e) => setSelectedCategory(e.target.value)}
                         className="w-full bg-gray-50/50 border-none rounded-xl py-3 pl-11 pr-10 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                       >
                         <option value="all">All Categories</option>
                         {categories.map(cat => (
                            <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                         ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                 </div>
                 <Button 
                   onClick={() => {setSearchTerm(""); setSelectedCategory("all");}}
                   className="bg-gray-100 text-gray-500 border-none px-6 h-11 text-[10px] font-black uppercase tracking-widest"
                 >
                    <RefreshCw className="h-4 w-4 mr-2" /> Reset
                 </Button>
              </div>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
             </div>
           )}
           
           {/* Left Content: FAQs */}
           <div className="lg:col-span-8 space-y-8">
              {displayData.length > 0 ? displayData.map((category: any) => (
                 <div key={category.category} className="space-y-4">
                    <div className="flex items-center space-x-3 px-1">
                       <div className="h-1.5 w-8 bg-primary rounded-full" />
                       <h2 className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{category.category}</h2>
                    </div>
                    <div className="space-y-3">
                       {category.questions.map((faq: any, idx: number) => {
                          const id = `${category.category}-${faq.id}`;
                          const isExpanded = expandedIndex === id;
                          return (
                             <Card 
                                key={idx} 
                                className={`p-0 border-none shadow-sm bg-white overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : "hover:shadow-md"}`}
                             >
                                <button 
                                   onClick={() => toggleExpand(id)}
                                   className="w-full flex items-center justify-between px-6 py-5 text-left group"
                                >
                                   <div className="flex items-center space-x-4">
                                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? "bg-primary text-white" : "bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                                         <HelpCircle className="h-4 w-4" />
                                      </div>
                                      <span className={`text-sm font-bold transition-colors ${isExpanded ? "text-primary" : "text-gray-700 uppercase tracking-tight"}`}>{faq.q}</span>
                                   </div>
                                   {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
                                </button>
                                {isExpanded && (
                                   <div className="px-6 pb-6 pl-[72px]">
                                      <div className="h-px bg-gray-50 mb-6" />
                                      <div 
                                        className="text-sm text-gray-500 leading-relaxed font-medium prose prose-sm max-w-none bg-gray-50/50 p-4 rounded-xl border border-gray-50"
                                        dangerouslySetInnerHTML={{ __html: faq.a }}
                                      />
                                      <div className="mt-6 flex items-center space-x-3">
                                         <button 
                                           onClick={() => openEditModal(faq)}
                                           className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center"
                                         >
                                            <Edit className="h-3 w-3 mr-1" /> Edit FAQ
                                         </button>
                                         <button 
                                           onClick={() => setDeletingFaqId(faq.id)}
                                           className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:underline flex items-center"
                                         >
                                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                                         </button>
                                      </div>
                                   </div>
                                )}
                             </Card>
                          );
                       })}
                    </div>
                 </div>
              )) : !loading && (
                 <div className="py-24 text-center bg-white rounded-3xl shadow-sm border border-gray-50">
                    <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <BookOpen className="h-10 w-10 text-gray-200" />
                    </div>
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-1">No Knowledge Found</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-12">We couldn't find any FAQs matching your search or category filter.</p>
                 </div>
              )}
           </div>

           {/* Right Sidebar: Quick Resources */}
           <div className="lg:col-span-4 space-y-6">
              <Card className="p-8 border-none shadow-sm bg-primary text-white relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                       <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest mb-3">Policy Feedback</h3>
                    <p className="text-xs text-white/80 leading-relaxed mb-8 font-medium">
                       Help us improve our internal guidelines. If you have suggestions for new FAQs or policy updates, please reach out.
                    </p>
                    <button className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest bg-white text-primary px-8 py-3.5 rounded-xl hover:shadow-2xl transition-all active:scale-95">
                       <span>Contact HR Team</span>
                       <ArrowRight className="h-4 w-4" />
                    </button>
                 </div>
                 <HelpCircle className="absolute -right-8 -bottom-8 h-48 w-48 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
              </Card>

              <Card className="p-0 border-none shadow-sm bg-white overflow-hidden">
                 <div className="p-5 border-b border-gray-50 bg-gray-50/30">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Resources</h4>
                 </div>
                 <div className="p-3">
                    {[
                       { label: "Payroll Calendar 2026", href: "/payroll" },
                       { label: "Holiday Schedule", href: "/holidays" },
                       { label: "Employee Onboarding", href: "#" },
                       { label: "Insurance & Benefits", href: "#" },
                       { label: "Code of Conduct", href: "#" },
                    ].map((link) => (
                       <Link 
                          key={link.label} 
                          href={link.href} 
                          className="flex items-center justify-between px-5 py-4 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all group"
                       >
                          <span className="group-hover:text-primary group-hover:translate-x-1 transition-all uppercase tracking-tight">{link.label}</span>
                          <ArrowRight className="h-4 w-4 text-gray-200 group-hover:text-primary transition-all" />
                       </Link>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? "Update FAQ" : "Create New FAQ"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">FAQ Title</label>
                 <input 
                   type="text" 
                   required
                   placeholder="e.g. How to apply for leave?"
                   className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                   value={faqTitle}
                   onChange={(e) => setFaqTitle(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Category</label>
                 <select 
                   required
                   className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                   value={faqCategoryId}
                   onChange={(e) => setFaqCategoryId(e.target.value)}
                 >
                   {categories.map(cat => (
                      <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
                   ))}
                 </select>
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Detailed Description</label>
              <RichTextEditor 
                value={faqDescription}
                onChange={setFaqDescription}
                placeholder="Explain the solution or policy detail here..."
              />
           </div>

           <div className="flex space-x-4 pt-4 border-t border-gray-50">
              <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl transition-all">
                {editingFaq ? "Save Changes" : "Publish FAQ"}
              </Button>
           </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingFaqId}
        onClose={() => setDeletingFaqId(null)}
        title="Delete FAQ"
        size="sm"
      >
        <div className="text-center py-6 px-4">
           <div className="h-24 w-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-6 shadow-inner border border-red-100/50">
              <AlertTriangle className="h-10 w-10 text-red-500" />
           </div>
           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-3">Remove this FAQ?</h3>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">
             Are you sure you want to delete this question? This will remove it from the knowledge base for all employees.
           </p>
           <div className="flex space-x-4">
              <Button onClick={() => setDeletingFaqId(null)} className="flex-1 bg-gray-50 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Abort</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-14 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-200 rounded-2xl transition-all">Confirm Delete</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
