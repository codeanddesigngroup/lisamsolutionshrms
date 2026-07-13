"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Calendar, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  SlidersHorizontal,
  Check,
  X,
  Clock,
  User,
  MessageSquare,
  Columns,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";

const initialInterviews = [
  { id: 1, candidate: "Alice Johnson", job: "Full Stack Developer", date: "2026-05-10", time: "10:00 AM", employee: "John Doe", status: "Pending", statusColor: "label-warning" },
  { id: 2, candidate: "Bob Williams", job: "Full Stack Developer", date: "2026-05-11", time: "02:00 PM", employee: "Jane Smith", status: "Hired", statusColor: "label-success" },
  { id: 3, candidate: "Carol Davis", job: "UI/UX Designer", date: "2026-05-12", time: "11:30 AM", employee: "Mike Tyson", status: "Rejected", statusColor: "label-danger" },
  { id: 4, candidate: "Frank Wilson", job: "UI/UX Designer", date: "2026-05-13", time: "03:00 PM", employee: "John Doe", status: "Pending", statusColor: "label-warning" },
];

export default function InterviewSchedulePage() {
  const { showToast } = useToast();
  const [interviews, setInterviews] = useState(initialInterviews);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [candidateFilter, setCandidateFilter] = useState("all");
  const [viewingInterview, setViewingInterview] = useState<typeof initialInterviews[number] | null>(null);
  const [deletingInterviewId, setDeletingInterviewId] = useState<number | null>(null);

  const filteredInterviews = interviews.filter((interview) => {
    const matchesStatus = statusFilter === "all" || interview.status.toLowerCase() === statusFilter;
    const matchesJob = jobFilter === "all" || interview.job === jobFilter;
    const matchesCandidate = candidateFilter === "all" || interview.candidate === candidateFilter;
    return matchesStatus && matchesJob && matchesCandidate;
  });

  const resetFilters = () => {
    setStatusFilter("all");
    setJobFilter("all");
    setCandidateFilter("all");
  };

  const deleteInterview = () => {
    if (!deletingInterviewId) return;
    setInterviews((prev) => prev.filter((interview) => interview.id !== deletingInterviewId));
    setDeletingInterviewId(null);
    showToast("Interview schedule deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Calendar className="h-5 w-5 mr-2 inline-block text-primary" />
              Interview Schedule
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/recruitment/interviews/create">
              <Button className="btn-inverse btn-sm">
                <Plus className="h-4 w-4 mr-1 inline-block" /> Add Interview Schedule
              </Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Interviews</li>
            </ol>
          </div>
        </div>

        {/* Tabs */}
        <div className="white-box p-0 border-b border-[#eee]">
          <nav className="flex space-x-8 px-6">
            <button onClick={() => setView("table")} className={`py-4 text-[13px] font-bold border-b-2 transition-all ${view === "table" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-primary"}`}>
              All Candidates
            </button>
            <button onClick={() => setView("calendar")} className={`py-4 text-[13px] font-bold border-b-2 transition-all ${view === "calendar" ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-primary"}`}>
              Calendar View
            </button>
          </nav>
        </div>

        {/* Filter Bar */}
        <div className="white-box">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Status</label>
              <select className="form-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job</label>
              <select className="form-control" value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}>
                <option value="all">All Jobs</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Candidate</label>
              <select className="form-control" value={candidateFilter} onChange={(event) => setCandidateFilter(event.target.value)}>
                <option value="all">All Candidates</option>
                {interviews.map((interview) => (
                  <option key={interview.id} value={interview.candidate}>{interview.candidate}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={() => showToast(`${filteredInterviews.length} interviews match these filters.`, "success")} className="btn-success btn-block h-[34px]">Apply</Button>
              <Button onClick={resetFilters} className="btn-default btn-block h-[34px]">Reset</Button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {view === "table" && (
          <div className="white-box p-0">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Candidate</th>
                    <th>Applied For</th>
                    <th><Clock className="h-3 w-3 inline-block mr-1" /> Schedule Date</th>
                    <th>Time</th>
                    <th>Assigned Employee</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.map((interview, index) => (
                    <tr key={interview.id}>
                      <td>{index + 1}</td>
                      <td className="font-bold">{interview.candidate}</td>
                      <td>{interview.job}</td>
                      <td>{new Date(interview.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>{interview.time}</td>
                      <td>
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px] mr-2">{interview.employee.charAt(0)}</div>
                          {interview.employee}
                        </div>
                      </td>
                      <td><span className={`label ${interview.statusColor}`}>{interview.status}</span></td>
                      <td className="text-right">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => setViewingInterview(interview)} className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all" title="View"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => showToast("Interview edit form should submit to the future PHP endpoint.", "success")} className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all" title="Edit"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => showToast("Interview notes are ready for backend wiring.", "success")} className="btn-default btn-outline p-1 rounded hover:bg-gray-200 transition-all" title="Notes"><MessageSquare className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingInterviewId(interview.id)} className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInterviews.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        No interviews match these filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar View (Placeholder) */}
        {view === "calendar" && (
          <div className="white-box min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredInterviews.map((interview) => (
                <button
                  key={interview.id}
                  onClick={() => setViewingInterview(interview)}
                  className="rounded border border-[#eee] bg-white p-4 text-left transition-all hover:border-primary hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{interview.date}</span>
                    <span className={`label ${interview.statusColor}`}>{interview.status}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-800">{interview.candidate}</div>
                  <div className="mt-1 text-[11px] font-medium text-gray-500">{interview.job}</div>
                  <div className="mt-4 flex items-center text-[11px] font-bold text-primary">
                    <Clock className="mr-2 h-3.5 w-3.5" /> {interview.time}
                  </div>
                </button>
              ))}
              {filteredInterviews.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-[12px] font-bold text-gray-400 uppercase">No interviews match these filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!viewingInterview} onClose={() => setViewingInterview(null)} title="Interview Details" size="md">
        {viewingInterview && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            {Object.entries(viewingInterview).filter(([key]) => key !== "id" && key !== "statusColor").map(([key, value]) => (
              <div key={key} className="rounded border border-gray-100 bg-gray-50 p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">{key}</div>
                <div className="mt-1 font-bold text-gray-700">{value}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deletingInterviewId} onClose={() => setDeletingInterviewId(null)} title="Delete Interview" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mb-7 text-xs font-medium leading-relaxed text-gray-500">
            This removes the scheduled interview from the current recruitment calendar.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setDeletingInterviewId(null)} className="btn-default flex-1">Cancel</Button>
            <Button onClick={deleteInterview} className="btn-danger flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
