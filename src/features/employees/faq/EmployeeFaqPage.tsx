"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  HelpCircle,
  ChevronDown,
  Search,
  Filter,
  Layers,
  MessageCircle,
  FileText
} from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";

type FaqRecord = {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  description: string;
};

type FaqCategory = {
  id: number;
  name: string;
};

export default function EmployeeFAQPage() {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<FaqRecord[]>([]);
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for parity with admin.employee-faq.data
      const mockCategories = [
        { id: 1, name: "Onboarding" },
        { id: 2, name: "Leave Policy" },
        { id: 3, name: "Attendance" }
      ];
      setCategories(mockCategories);

      const mockFaqs = [
        { id: 1, title: "How to apply for leave?", category_id: 2, category_name: "Leave Policy", description: "You can apply for leave via the 'Leaves' section in the sidebar. Simply click 'Add Leave', select the type, and submit." },
        { id: 2, title: "What is the office timing?", category_id: 3, category_name: "Attendance", description: "Office timings are strictly 09:00 AM to 06:00 PM. Please ensure you clock in before 09:15 AM to avoid being marked late." },
        { id: 3, title: "Where is the welcome kit?", category_id: 1, category_name: "Onboarding", description: "The welcome kit is available in the HR office on your first day of joining. It includes your ID card and policy handbook." }
      ];
      setFaqs(mockFaqs);
    } catch {
      showToast("Failed to load FAQs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const filteredFaqs = faqs.filter(faq => {
    const categoryMatch = categoryFilter === "all" || faq.category_id.toString() === categoryFilter;
    const searchMatch = faq.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       faq.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-widest truncate">
                Employee FAQ
              </h1>
              <p className="text-[9px] md:text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider uppercase">HR / Knowledge Base / FAQs</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
             <Link href="/employees/faq/category">
               <Button className="bg-gray-50 text-gray-500 border-none px-3 md:px-5 h-10 md:h-11 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all rounded-xl">
                  <Layers className="h-4 w-4 mr-2" /> Categories
               </Button>
             </Link>
             <Link href="/employees/faq/create">
               <Button className="bg-primary text-white text-[9px] md:text-[10px] font-black px-4 md:px-6 h-10 md:h-11 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all rounded-xl">
                  <Plus className="h-4 w-4 mr-1 md:mr-2" /> Add FAQ
               </Button>
             </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <Card className="p-4 border-none shadow-sm bg-white rounded-2xl border border-gray-50 flex flex-col md:flex-row md:items-center gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="SEARCH KNOWLEDGE BASE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
           </div>
           
           <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-11 pr-10 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                 <option value="all">All Categories</option>
                 {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                 ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
           </div>

           <Button onClick={fetchData} className="bg-gray-50 text-gray-400 border-none h-11 w-11 p-0 rounded-xl hover:text-primary transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
        </Card>

        {/* FAQ List Parity */}
        <div className="space-y-4">
           {filteredFaqs.length > 0 ? filteredFaqs.map((faq) => (
             <Card key={faq.id} className="p-0 border-none shadow-sm bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row">
                   <div className="p-6 md:w-3/4">
                      <div className="flex items-center space-x-3 mb-3">
                         <span className="px-2.5 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/10">
                            {faq.category_name}
                         </span>
                         <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center">
                            ID: #{faq.id}
                         </span>
                      </div>
                      <h3 className="text-sm md:text-base font-black text-gray-800 uppercase tracking-tight mb-3 flex items-center group-hover:text-primary transition-colors">
                         <MessageCircle className="h-4 w-4 mr-3 text-primary/40 group-hover:text-primary transition-colors" /> {faq.title}
                      </h3>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                         <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {faq.description}
                         </p>
                      </div>
                   </div>
                   <div className="p-6 md:w-1/4 bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-50 flex flex-row md:flex-col justify-center items-center gap-3">
                      <Link href={`/employees/faq/${faq.id}/edit`} className="flex-1 md:w-full">
                         <Button className="w-full bg-white text-gray-500 border-gray-100 hover:text-blue-500 hover:bg-blue-50 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">
                            <Edit className="h-3.5 w-3.5 mr-2" /> Edit
                         </Button>
                      </Link>
                      <Button className="flex-1 md:w-full bg-white text-gray-500 border-gray-100 hover:text-red-500 hover:bg-red-50 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">
                         <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </Button>
                   </div>
                </div>
             </Card>
           )) : !loading && (
             <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <HelpCircle className="h-8 w-8 text-gray-200" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No FAQs found matching your criteria</p>
                <Button onClick={() => {setSearchQuery(""); setCategoryFilter("all");}} className="mt-4 bg-primary/10 text-primary border-none h-10 px-6 text-[9px] font-black uppercase tracking-widest rounded-xl">Clear Filters</Button>
             </div>
           )}
        </div>

        {/* Footer Note Parity */}
        <div className="p-6 bg-primary/5 rounded-2xl border border-dashed border-primary/20 flex items-start space-x-4">
           <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-1">Knowledge Management</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-relaxed">
                 Employee FAQs are visible to all staff members in their respective dashboards. Ensure that technical and policy-related answers are kept up to date to reduce HR support tickets.
              </p>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
