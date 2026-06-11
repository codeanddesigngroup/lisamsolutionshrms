"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Users, 
  Plus, 
  Eye, 
  Trash2, 
  SlidersHorizontal,
  Columns,
  Mail,
  Download,
  X,
  Check,
  FileText,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

const initialApplications = [
  { id: 1, name: "Alice Johnson", job: "Full Stack Developer", location: "New York", status: "Applied", statusColor: "label-info", appliedDate: "2026-05-01" },
  { id: 2, name: "Bob Williams", job: "Full Stack Developer", location: "New York", status: "Phone Screen", statusColor: "label-primary", appliedDate: "2026-05-03" },
  { id: 3, name: "Carol Davis", job: "UI/UX Designer", location: "Remote", status: "Interview", statusColor: "label-warning", appliedDate: "2026-05-05" },
  { id: 4, name: "Dan Brown", job: "HR Manager", location: "Chicago", status: "Hired", statusColor: "label-success", appliedDate: "2026-05-07" },
  { id: 5, name: "Eve Miller", job: "Full Stack Developer", location: "New York", status: "Rejected", statusColor: "label-danger", appliedDate: "2026-05-09" },
  { id: 6, name: "Frank Wilson", job: "UI/UX Designer", location: "Remote", status: "Applied", statusColor: "label-info", appliedDate: "2026-05-11" },
];

const statusKey = (status: string) => status.toLowerCase().replace(/\s+/g, "_");
const jobKey = (job: string) => job === "Full Stack Developer" ? "1" : job === "UI/UX Designer" ? "2" : "3";
const locationKey = (location: string) => location.toLowerCase().replace(/\s+/g, "_");

export default function RecruitmentApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState(initialApplications);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJob, setFilterJob] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [deletingApplicationId, setDeletingApplicationId] = useState<number | null>(null);

  const filteredApplications = applications.filter((application) => {
    const matchesStatus = filterStatus === "all" || statusKey(application.status) === filterStatus;
    const matchesJob = filterJob === "all" || jobKey(application.job) === filterJob;
    const matchesLocation = filterLocation === "all" || locationKey(application.location) === filterLocation;
    const matchesFrom = !filterFrom || application.appliedDate >= filterFrom;
    const matchesTo = !filterTo || application.appliedDate <= filterTo;
    return matchesStatus && matchesJob && matchesLocation && matchesFrom && matchesTo;
  });

  const resetFilters = () => {
    setFilterStatus("all");
    setFilterJob("all");
    setFilterLocation("all");
    setFilterFrom("");
    setFilterTo("");
  };

  const exportApplications = () => {
    const rows = [
      ["Applicant Name", "Job", "Location", "Applied Date", "Status"],
      ...filteredApplications.map((application) => [
        application.name,
        application.job,
        application.location,
        application.appliedDate,
        application.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "job-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Applications exported", "success");
  };

  const deleteApplication = () => {
    if (!deletingApplicationId) return;
    setApplications((prev) => prev.filter((application) => application.id !== deletingApplicationId));
    setDeletingApplicationId(null);
    showToast("Application deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Users className="h-5 w-5 mr-2 inline-block text-primary" />
              Job Applications
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/recruitment/applications/create">
              <Button className="btn-inverse btn-sm">
                <Plus className="h-4 w-4 mr-1 inline-block" /> Create New
              </Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Applications</li>
            </ol>
          </div>
        </div>

        {/* Action Bar */}
        <div className="white-box p-0">
          <div className="px-6 py-4 border-b border-[#f2f2f3] flex flex-wrap gap-2">
            <Button className="btn-success btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-1" /> Filter Results
            </Button>
            <Link href="/recruitment/applications/board">
              <Button className="btn-primary btn-outline btn-sm">
                <Columns className="h-4 w-4 mr-1" /> Board View
              </Button>
            </Link>
            <Button onClick={() => showToast("Recruitment mail settings should open the backend-driven settings route.", "success")} className="btn-info btn-sm">
              <Mail className="h-4 w-4 mr-1" /> Mail Settings
            </Button>
            <div className="ml-auto">
              <Button onClick={exportApplications} className="btn-primary btn-sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="px-6 py-4 bg-[#fbfbfb] border-b border-t border-[#f2f2f3]">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[13px] font-bold">Filter By</h4>
                <button onClick={() => setShowFilters(false)}><X className="h-4 w-4 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <input type="date" className="form-control" value={filterFrom} onChange={(event) => setFilterFrom(event.target.value)} />
                </div>
                <div>
                  <input type="date" className="form-control" value={filterTo} onChange={(event) => setFilterTo(event.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="phone_screen">Phone Screen</option>
                  <option value="interview">Interview</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select className="form-control" value={filterJob} onChange={(e) => setFilterJob(e.target.value)}>
                  <option value="all">All Jobs</option>
                  <option value="1">Full Stack Developer</option>
                  <option value="2">UI/UX Designer</option>
                  <option value="3">HR Manager</option>
                </select>
                <select className="form-control" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                  <option value="all">All Locations</option>
                  <option value="new_york">New York</option>
                  <option value="remote">Remote</option>
                  <option value="chicago">Chicago</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => showToast(`${filteredApplications.length} applications match these filters.`, "success")} className="btn-success btn-sm"><Check className="h-4 w-4 mr-1" /> Apply</Button>
                <Button onClick={resetFilters} className="btn-inverse btn-sm">Reset</Button>
              </div>
            </div>
          )}

          {/* Applications Table */}
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Applicant Name</th>
                  <th>Job</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app, index) => (
                  <tr key={app.id}>
                    <td>{index + 1}</td>
                    <td className="font-bold">{app.name}</td>
                    <td>{app.job}</td>
                    <td>{app.location}</td>
                    <td>
                      <span className={`label ${app.statusColor}`}>{app.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Link href={`/recruitment/applications/${app.id}`}>
                          <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all" title="View"><Eye className="h-4 w-4" /></button>
                        </Link>
                        <button onClick={() => showToast("Application documents are ready for PHP API wiring.", "success")} className="btn-default btn-outline p-1 rounded hover:bg-gray-200 transition-all" title="Documents"><FileText className="h-4 w-4" /></button>
                        <button onClick={() => setDeletingApplicationId(app.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No applications match these filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!deletingApplicationId}
        onClose={() => setDeletingApplicationId(null)}
        title="Delete Application"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium leading-relaxed text-gray-500">
            This removes the application from the current recruitment list.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingApplicationId(null)} className="btn-default flex-1">Cancel</Button>
            <Button onClick={deleteApplication} className="btn-danger flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
