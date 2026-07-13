"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  HelpCircle, 
  Users, 
  Settings, 
  ShieldCheck, 
  Plus,
  Filter
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const faqData = [
  {
    category: "General",
    icon: HelpCircle,
    questions: [
      { q: "What is Worksuite?", a: "Worksuite is a comprehensive HR and project management tool designed to streamline your business operations, from employee tracking to project execution." },
      { q: "How do I get started?", a: "You can get started by setting up your company profile in the settings, inviting your team members, and creating your first project." },
      { q: "Is there a mobile app?", a: "Yes, Worksuite is fully responsive and can be used on any mobile browser. We also have dedicated iOS and Android apps available." }
    ]
  },
  {
    category: "Projects",
    icon: Settings,
    questions: [
      { q: "How do I create a project?", a: "Navigate to the Work > Projects section and click the 'Add Project' button in the top right corner." },
      { q: "Can I invite clients to projects?", a: "Yes, you can add clients to specific projects, allowing them to view progress, share files, and communicate with the team." },
      { q: "What are project templates?", a: "Project templates allow you to save the structure of a common project (tasks, milestones) and reuse it for future projects." }
    ]
  },
  {
    category: "HR & Employees",
    icon: Users,
    questions: [
      { q: "How do I add a new employee?", a: "Go to the HR > Employee List section and click 'Add Employee'. You'll need to provide their basic details and assign them a role." },
      { q: "How does attendance tracking work?", a: "Employees can clock in and out from their dashboard. Managers can view detailed attendance reports and logs in the HR section." }
    ]
  }
];

export default function FAQsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<string | null>("General-0");

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Knowledge Base</h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Frequently Asked Questions & Support</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
               <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative max-w-2xl mx-auto py-10 text-center space-y-6">
           <h2 className="text-2xl font-black text-gray-800">How can we help you today?</h2>
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              <input 
                type="text" 
                placeholder="Search for questions, categories, or keywords..." 
                className="w-full pl-16 pr-6 py-5 bg-white border-none rounded-3xl shadow-xl shadow-gray-100 text-sm font-medium focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex flex-wrap justify-center gap-2">
              {["Login Issues", "Project Management", "Invoicing", "Mobile App"].map((tag) => (
                 <button key={tag} className="px-4 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest transition-all">
                    {tag}
                 </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           {/* Sidebar Categories */}
           <div className="lg:col-span-1 space-y-4">
              <Card className="p-4 border-none shadow-sm bg-white">
                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Categories</h3>
                 <nav className="space-y-1">
                    {faqData.map((cat) => (
                       <button
                          key={cat.category}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-primary transition-all"
                       >
                          <cat.icon className="h-4 w-4" />
                          <span>{cat.category}</span>
                       </button>
                    ))}
                 </nav>
              </Card>

              <Card className="p-6 border-none shadow-sm bg-primary/5 text-center">
                 <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MessageCircle className="h-6 w-6 text-primary" />
                 </div>
                 <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-2">Still need help?</h4>
                 <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                    If you can't find the answer you're looking for, please contact our support team.
                 </p>
                 <Button className="w-full bg-primary text-white text-[10px] font-black h-9 uppercase tracking-widest">Contact Support</Button>
              </Card>
           </div>

           {/* FAQ Accordion */}
           <div className="lg:col-span-3 space-y-8">
              {faqData.map((category) => (
                 <div key={category.category} className="space-y-4">
                    <div className="flex items-center space-x-3 mb-2 px-2">
                       <category.icon className="h-5 w-5 text-gray-400" />
                       <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">{category.category}</h2>
                    </div>
                    <div className="space-y-3">
                       {category.questions.map((faq, idx) => {
                          const id = `${category.category}-${idx}`;
                          const isExpanded = expandedIndex === id;
                          return (
                             <Card 
                                key={idx} 
                                className={`p-0 border-none shadow-sm bg-white overflow-hidden transition-all duration-300 ${isExpanded ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : ""}`}
                             >
                                <button 
                                   onClick={() => toggleExpand(id)}
                                   className="w-full flex items-center justify-between px-6 py-5 text-left"
                                >
                                   <span className={`text-sm font-black transition-colors ${isExpanded ? "text-primary" : "text-gray-700"}`}>{faq.q}</span>
                                   {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-gray-300" />}
                                </button>
                                {isExpanded && (
                                   <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                                      <div className="h-px bg-gray-50 mb-6" />
                                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                         {faq.a}
                                      </p>
                                   </div>
                                )}
                             </Card>
                          );
                       })}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
