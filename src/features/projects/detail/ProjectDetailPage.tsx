"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { Project } from "@/types";
import { useToast } from "@/context/ToastContext";
import { 
  RefreshCw, 
  AlertCircle, 
  ChevronLeft,
  Layers, 
  Users, 
  CheckSquare, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  Plus, 
  Edit, 
  MoreVertical,
  Paperclip,
  Milestone
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "members", label: "Members", icon: Users },
  { id: "milestones", label: "Milestones", icon: Milestone },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "files", label: "Files", icon: Paperclip },
  { id: "discussions", label: "Discussions", icon: MessageSquare },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "issues", label: "Issues", icon: AlertCircle },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "timelogs", label: "Time Logs", icon: Clock },
  { id: "gantt", label: "Gantt", icon: MoreVertical },
  { id: "burndown", label: "Burndown", icon: MoreVertical },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'finished': return 'bg-green-100 text-green-600';
    case 'in progress': return 'bg-blue-100 text-blue-600';
    case 'on hold': return 'bg-orange-100 text-orange-600';
    case 'canceled': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/project/${params.id}`);
        setProject(response.data.data);
      } catch (err) {
        console.error("Fetch Project Error:", err);
        setError(getApiErrorMessage(err, "Failed to load project details."));
        showToast("Error loading project details.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [params.id, showToast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading project details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-20" />
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-2">Oops! Project not found</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md">{error || "Project not found."}</p>
          <Button onClick={() => router.push("/projects")} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white px-6 py-6 rounded-2xl shadow-sm border border-gray-50 flex flex-wrap items-center justify-between gap-4 -mx-6 -mt-6 mb-6">
           <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
                 <Layers className="h-7 w-7" />
              </div>
              <div>
                 <h1 className="text-xl font-black text-gray-800 uppercase tracking-widest">{project.project_name}</h1>
                 <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Project ID: #{project.id} / Client: <span className="text-primary">{project.client?.client_detail?.company_name || project.client?.name || "No Client"}</span></p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <span className={`${getStatusColor(project.status)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>{project.status}</span>
              <Link href={`/projects/${project.id}/edit`}>
                <Button className="bg-white text-gray-400 border border-gray-100 p-2.5 rounded-xl hover:text-primary transition-colors">
                   <Edit className="h-5 w-5" />
                </Button>
              </Link>
              <Button onClick={() => router.push("/projects")} className="bg-gray-50 text-gray-400 border border-gray-100 p-2.5 rounded-xl hover:text-gray-600 transition-colors shadow-sm">
                 <ChevronLeft className="h-5 w-5" />
              </Button>
           </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center space-x-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-50 overflow-x-auto scrollbar-hide">
           {tabs.map((tab) => (
              tab.id === "overview" ? (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === tab.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                   }`}
                >
                   <tab.icon className="h-4 w-4" />
                   <span>{tab.label}</span>
                </button>
              ) : (
                <Link
                  key={tab.id}
                  href={`/projects/${project.id}/${tab.id === "timelogs" ? "time-logs" : tab.id}`}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                   <tab.icon className="h-4 w-4" />
                   <span>{tab.label}</span>
                </Link>
              )
           ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              {activeTab === "overview" && (
                 <>
                    <Card title="Project Summary" className="border-none shadow-sm bg-white p-8 text-gray-800">
                       <div className="text-sm text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: project.project_summary || "No summary provided." }} />
                       <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
                          <div>
                             <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-1">Start Date</p>
                             <p className="text-xs font-bold text-gray-700">{project.start_date || "N/A"}</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-1">Deadline</p>
                             <p className="text-xs font-bold text-red-400">{project.deadline || "No Deadline"}</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-1">Total Budget</p>
                             <p className="text-xs font-black text-gray-900">$0</p>
                          </div>
                          <div>
                             <p className="text-[9px] text-gray-300 font-black uppercase tracking-widest mb-1">Status</p>
                             <p className="text-xs font-bold text-gray-700 capitalize">{project.status}</p>
                          </div>
                       </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Card title="Project Progress" className="border-none shadow-sm bg-white p-8">
                          <div className="flex items-center justify-between mb-4">
                             <span className="text-2xl font-black text-primary">0%</span>
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Completed</span>
                          </div>
                          <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                             <div className="h-full bg-primary shadow-lg shadow-primary/20 transition-all duration-1000" style={{ width: `0%` }} />
                          </div>
                       </Card>
                       <Card title="Finance Overview" className="border-none shadow-sm bg-white p-8">
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">Total Spent</span>
                                <span className="text-xs font-black text-gray-900">$0.00</span>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">Remaining</span>
                                <span className="text-xs font-black text-green-500">$0.00</span>
                             </div>
                          </div>
                       </Card>
                    </div>
                 </>
              )}
              
              {activeTab !== "overview" && null}
           </div>

           <div className="space-y-6">
              <Card title="Project Members" className="border-none shadow-sm bg-white p-6">
                 <div className="space-y-4 mt-2">
                    {project.members && project.members.length > 0 ? (
                      project.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between group cursor-pointer">
                           <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-black text-xs group-hover:from-primary/20 group-hover:to-primary/30 transition-all uppercase">
                                 {member.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-gray-700 group-hover:text-primary transition-colors">{member.name}</p>
                                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                   {member.employee_detail?.designation?.name || "Team Member"}
                                 </p>
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest py-4 text-center">No members assigned</p>
                    )}
                    <Link href={`/projects/${project.id}/members`}>
                      <Button className="w-full bg-gray-50 text-gray-400 border border-gray-100 border-dashed hover:border-primary/50 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest h-10 mt-4">
                         <Plus className="h-3 w-3 mr-2" /> Manage Members
                      </Button>
                    </Link>
                 </div>
              </Card>

              <Card title="Client Details" className="border-none shadow-sm bg-white p-6">
                 {project.client ? (
                   <>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black uppercase text-lg">
                          {project.client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800">{project.client.name}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{project.client.client_detail?.company_name || "Direct Client"}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 text-gray-500">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-bold truncate">{project.client.email}</span>
                        </div>
                        {project.client.client_detail?.website && (
                          <div className="flex items-center space-x-3 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs font-bold">{project.client.client_detail.website}</span>
                          </div>
                        )}
                    </div>
                   </>
                 ) : (
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center py-4">No client assigned</p>
                 )}
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
