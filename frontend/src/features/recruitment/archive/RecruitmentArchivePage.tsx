"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Archive, 
  Download, 
  Search, 
  Eye, 
  Trash2, 
  RotateCcw,
  Tag
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CandidateArchivePage() {
  const [skillFilter, setSkillFilter] = useState("");

  const archived = [
    { id: 1, name: "Eve Miller", job: "Full Stack Developer", location: "New York", status: "Rejected", skills: ["PHP", "React"], archivedAt: "2024-04-22" },
    { id: 2, name: "Grace Lee", job: "Backend Developer", location: "Remote", status: "Rejected", skills: ["Python", "Django"], archivedAt: "2024-03-15" },
    { id: 3, name: "Hank Taylor", job: "DevOps Engineer", location: "Chicago", status: "Withdrawn", skills: ["AWS", "Docker"], archivedAt: "2024-02-28" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><Archive className="h-5 w-5 mr-2 inline-block text-primary" /> Candidate Database</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-primary btn-sm"><Download className="h-4 w-4 mr-1" /> Export to Excel</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Archive</li>
            </ol>
          </div>
        </div>

        {/* Skill Filter */}
        <div className="white-box">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Filter by Skill</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input 
                  type="text" 
                  className="form-control pl-10" 
                  placeholder="Enter skill to filter by, e.g. php, java, etc." 
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button className="btn-success btn-block h-[34px]"><Search className="h-4 w-4 mr-1" /> Search</Button>
            </div>
          </div>
        </div>

        {/* Archive Table */}
        <div className="white-box p-0">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Applicant Name</th>
                  <th>Applied For</th>
                  <th>Location</th>
                  <th>Skills</th>
                  <th>Archived Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {archived.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td className="font-bold">{a.name}</td>
                    <td>{a.job}</td>
                    <td>{a.location}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {a.skills.map((s) => (
                          <span key={s} className="label label-info">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>{new Date(a.archivedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all" title="View"><Eye className="h-4 w-4" /></button>
                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all" title="Unarchive"><RotateCcw className="h-4 w-4" /></button>
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
