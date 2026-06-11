"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  Mail,
  MessageSquare,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RecruitmentJobsPage() {
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const jobs = [
    { id: 1, title: "Full Stack Developer", company: "Lisam Solutions", location: "New York", startDate: "2024-04-01", endDate: "2024-06-01", status: "active", applications: 12 },
    { id: 2, title: "UI/UX Designer", company: "Lisam Solutions", location: "Remote", startDate: "2024-04-15", endDate: "2024-05-30", status: "active", applications: 8 },
    { id: 3, title: "HR Manager", company: "Lisam Solutions", location: "Chicago", startDate: "2024-03-01", endDate: "2024-04-15", status: "inactive", applications: 15 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Briefcase className="h-5 w-5 mr-2 inline-block text-primary" />
              Jobs
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/recruitment/jobs/create">
              <Button className="btn-inverse btn-sm">
                <Plus className="h-4 w-4 mr-1 inline-block" /> Create New
              </Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Jobs</li>
            </ol>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center bg-white rounded border border-[#f2f2f3] overflow-hidden">
            <div className="bg-[#03a9f3] p-4 flex items-center justify-center"><Briefcase className="h-6 w-6 text-white" /></div>
            <div className="p-4">
              <span className="text-[11px] text-gray-400 uppercase font-bold block">Total Jobs</span>
              <span className="text-xl font-bold">{jobs.length}</span>
            </div>
          </div>
          <div className="flex items-center bg-white rounded border border-[#f2f2f3] overflow-hidden">
            <div className="bg-[#00c292] p-4 flex items-center justify-center"><Briefcase className="h-6 w-6 text-white" /></div>
            <div className="p-4">
              <span className="text-[11px] text-gray-400 uppercase font-bold block">Active Jobs</span>
              <span className="text-xl font-bold">{jobs.filter(j => j.status === 'active').length}</span>
            </div>
          </div>
          <div className="flex items-center bg-white rounded border border-[#f2f2f3] overflow-hidden">
            <div className="bg-[#fb9678] p-4 flex items-center justify-center"><Briefcase className="h-6 w-6 text-white" /></div>
            <div className="p-4">
              <span className="text-[11px] text-gray-400 uppercase font-bold block">Inactive Jobs</span>
              <span className="text-xl font-bold">{jobs.filter(j => j.status === 'inactive').length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="form-control" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
            <option value="">Filter Company: View All</option>
            <option value="lisam">Lisam Solutions</option>
          </select>
          <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Filter Status: View All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Jobs Table */}
        <div className="white-box p-0">
          <div className="px-6 py-4 border-b border-[#f2f2f3] flex flex-wrap gap-2">
            <Link href="/recruitment/questions">
              <Button className="btn-primary btn-sm"><MessageSquare className="h-4 w-4 mr-1" /> Custom Questions</Button>
            </Link>
            <Button className="btn-success btn-sm"><Mail className="h-4 w-4 mr-1" /> Send New Job Emails</Button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr key={job.id}>
                    <td>{index + 1}</td>
                    <td className="font-bold text-primary hover:underline cursor-pointer">{job.title}</td>
                    <td>{job.company}</td>
                    <td>{job.location}</td>
                    <td>{new Date(job.startDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>{new Date(job.endDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <span className={`label ${job.status === 'active' ? 'label-success' : 'label-danger'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all" title="View"><Eye className="h-4 w-4" /></button>
                        <button className="btn-default btn-outline p-1 rounded hover:bg-gray-200 transition-all" title="Copy URL"><Copy className="h-4 w-4" /></button>
                        <Link href={`/recruitment/jobs/${job.id}/edit`}>
                          <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all" title="Edit"><Edit className="h-4 w-4" /></button>
                        </Link>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
