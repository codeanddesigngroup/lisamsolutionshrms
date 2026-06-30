"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { Plus, RefreshCw, Edit, Trash2, Eye, AlertTriangle, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { getStoredRole } from "@/lib/session";
import type { Project } from "@/types";

const statusColors: Record<string, string> = {
  "in progress": "bg-blue-100 text-blue-600",
  "not started": "bg-gray-100 text-gray-500",
  "on hold": "bg-yellow-100 text-yellow-600",
  "finished": "bg-green-100 text-green-600",
  "canceled": "bg-red-100 text-red-500",
};

const memberColors = ["bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-red-400", "bg-pink-400", "bg-indigo-400", "bg-orange-400"];

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [deletingProjectId, setDeletingProjectId] = useState<number | string | null>(null);
  const [userRole] = useState(() => getStoredRole());
  const canManageProjects = userRole === "admin";

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/project?include=client,members");
      setProjects(response.data.data);
    } catch (err) {
      console.error("Fetch Projects Error:", err);
      showToast("Failed to fetch projects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = projects.filter(proj => {
    const query = searchTerm.trim().toLowerCase();
    const searchText = [
      proj.project_name,
      proj.status,
      proj.client?.name,
      proj.deadline,
      ...(proj.members || []).map((member) => member.name),
    ].filter(Boolean).join(" ").toLowerCase();
    const searchMatch = !query || searchText.includes(query);
    const statusMatch = statusFilter === "All" || proj.status.toLowerCase() === statusFilter.toLowerCase();
    const clientMatch = clientFilter === "All" || proj.client?.name === clientFilter;
    return searchMatch && statusMatch && clientMatch;
  });

  const handleDelete = async () => {
    if (deletingProjectId) {
      try {
        await api.delete(`/project/${deletingProjectId}`);
        setProjects(prev => prev.filter(p => p.id !== deletingProjectId));
        setDeletingProjectId(null);
        showToast("Project deleted successfully", "success");
      } catch (err) {
        console.error("Delete Project Error:", err);
        showToast("Failed to delete project", "error");
      }
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setClientFilter("All");
  };

  const clients = Array.from(new Set(projects.map(p => p.client?.name).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-5 gap-3">
          <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Projects</h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchProjects}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canManageProjects && (
              <Link href="/projects/create" className="flex items-center space-x-1 rounded border border-green-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                <span>Add Project</span>
                <Plus className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-lg border border-gray-100 bg-white py-2 pl-9 pr-3 text-xs font-bold outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  placeholder="Search project, client, member"
                  type="search"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                <option value="in progress">In Progress</option>
                <option value="not started">Not Started</option>
                <option value="on hold">On Hold</option>
                <option value="finished">Finished</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client</label>
              <select 
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none bg-white"
              >
                <option>All</option>
                {clients.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleReset}
                className="flex items-center space-x-1 rounded-lg border border-gray-200 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /><span>Reset</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-50 overflow-hidden min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Projects...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">#</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Members</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Deadline</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProjects.length > 0 ? filteredProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{proj.id}</td>
                    <td className="px-6 py-4">
                      <Link href={`/projects/${proj.id}`} className="text-xs font-bold text-gray-700 hover:text-primary transition-colors">{proj.project_name}</Link>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-primary/70 uppercase tracking-tight">{proj.client?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {proj.members?.slice(0, 4).map((m, i) => (
                          <div key={i} className={`h-7 w-7 rounded-full border-2 border-white ${memberColors[i % memberColors.length]} flex items-center justify-center text-white text-[9px] font-black`} title={m.name}>
                            {m.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        ))}
                        {(proj.members?.length || 0) > 4 && (
                          <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-500 text-[8px] font-black">
                            +{(proj.members?.length || 0) - 4}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'No Deadline'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-700">
                      {proj.total_earnings ? `$${proj.total_earnings}` : '$0'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${statusColors[proj.status.toLowerCase()] || "bg-gray-100 text-gray-500"}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Link href={`/projects/${proj.id}`} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="View"><Eye className="h-4 w-4" /></Link>
                        {canManageProjects && (
                          <>
                            <Link href={`/projects/${proj.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="Edit"><Edit className="h-4 w-4" /></Link>
                            <button onClick={() => setDeletingProjectId(proj.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-xs font-medium text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProjectId}
        onClose={() => setDeletingProjectId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Project?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             This will permanently delete the project and all associated tasks and files.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingProjectId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete Project</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
