"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditProjectPage() {
  const router = useRouter();

  const [project, setProject] = useState({
    name: "Website Redesign",
    client: "Acme Corp",
    startDate: "2024-01-15",
    deadline: "2024-06-30",
    status: "In Progress",
    budget: "$15,000",
    category: "Development",
    description: "Complete overhaul of the corporate website including new branding and CMS integration."
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/projects');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between -mx-6 -mt-6 mb-6">
           <div className="flex items-center space-x-4">
              <Link href="/projects" className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                 <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                 <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Edit Project</h1>
                 <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update details for {project.name}</p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <Button onClick={() => router.back()} className="bg-gray-50 text-gray-500 border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleSave} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                 <Save className="h-4 w-4 mr-2" /> Update Project
              </Button>
           </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="General Details" className="border-none shadow-sm p-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Name</label>
                       <input type="text" value={project.name} onChange={(e) => setProject({...project, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
                       <input type="date" value={project.startDate} onChange={(e) => setProject({...project, startDate: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline</label>
                       <input type="date" value={project.deadline} onChange={(e) => setProject({...project, deadline: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                       <textarea value={project.description} onChange={(e) => setProject({...project, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-32" />
                    </div>
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Project Info" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</label>
                       <select value={project.client} onChange={(e) => setProject({...project, client: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                          <option>Acme Corp</option>
                          <option>Tech Solutions</option>
                          <option>Global Media</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Category</label>
                       <select value={project.category} onChange={(e) => setProject({...project, category: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                          <option>Development</option>
                          <option>Design</option>
                          <option>Marketing</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget</label>
                       <input type="text" value={project.budget} onChange={(e) => setProject({...project, budget: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                 </div>
              </Card>

              <Card title="Project Status" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                    <select value={project.status} onChange={(e) => setProject({...project, status: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                       <option>In Progress</option>
                       <option>Not Started</option>
                       <option>Finished</option>
                       <option>On Hold</option>
                    </select>
                 </div>
              </Card>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
