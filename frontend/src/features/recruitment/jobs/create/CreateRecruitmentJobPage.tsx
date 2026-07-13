"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Briefcase, 
  ArrowLeft, 
  Save, 
  Settings, 
  FileText, 
  MapPin, 
  Layers, 
  Award, 
  Calendar,
  Check
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function CreateJobPage() {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState("general");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Briefcase className="h-5 w-5 mr-2 inline-block text-primary" />
              Create New Job
            </h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
            <Link href="/recruitment/jobs">
              <Button className="btn-default btn-sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs</Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/jobs">Jobs</Link></li>
              <li className="active">Create</li>
            </ol>
          </div>
        </div>

        <div className="white-box p-0 overflow-hidden">
          <div className="flex border-b border-[#f2f2f3]">
            {["general", "details", "questions", "visibility"].map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`py-4 px-6 text-[12px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeSection === sec ? "text-primary border-primary bg-primary/5" : "text-gray-400 border-transparent hover:text-primary"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          <form className="p-6 space-y-6">
            {/* General Info */}
            {activeSection === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group col-span-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Company</label>
                  <select className="form-control">
                    <option value="">-- Choose Company --</option>
                    <option>Lisam Solutions</option>
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Title</label>
                  <input type="text" className="form-control" placeholder="e.g. Frontend Developer" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Location</label>
                  <select className="form-control">
                    <option>New York</option>
                    <option>Remote</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Category</label>
                  <select className="form-control">
                    <option>Engineering</option>
                    <option>Design</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Start Date</label>
                  <input type="date" className="form-control" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">End Date</label>
                  <input type="date" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Total Positions</label>
                  <input type="number" className="form-control" defaultValue="1" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Status</label>
                  <select className="form-control">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {/* Details & SEO */}
            {activeSection === "details" && (
              <div className="space-y-6">
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Description</label>
                  <textarea className="form-control" rows={6} placeholder="Enter job description..."></textarea>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Requirement</label>
                  <textarea className="form-control" rows={6} placeholder="Enter job requirements..."></textarea>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Meta Title</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Meta Description</label>
                  <textarea className="form-control" rows={3}></textarea>
                </div>
              </div>
            )}

            {/* Questions Section */}
            {activeSection === "questions" && (
              <div className="space-y-4">
                <h4 className="text-[13px] font-bold mb-4">Select Questions for Applicants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Why do you want to work with us?", "Salary expectation?", "Relocation?", "Notice period?"].map((q, i) => (
                    <label key={i} className="flex items-center p-3 border border-[#f2f2f3] rounded hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-[12px] font-medium">{q}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility Section */}
            {activeSection === "visibility" && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-[13px] font-bold mb-4">Ask Applicants For</h4>
                  <div className="flex flex-wrap gap-6">
                    {["Gender", "Date of Birth", "Country"].map((col) => (
                      <label key={col} className="flex items-center cursor-pointer">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-[12px] font-bold text-gray-600">{col}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold mb-4">Section Visibility</h4>
                  <div className="flex flex-wrap gap-6">
                    {["Profile Image", "Resume", "Cover Letter", "Terms & Conditions"].map((sec) => (
                      <label key={sec} className="flex items-center cursor-pointer">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-[12px] font-bold text-gray-600">{sec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[#f2f2f3] flex justify-end">
              <Button type="button" className="btn-success" onClick={() => { showToast("Job Created", "success"); }}>
                <Save className="h-4 w-4 mr-2" /> Save Job Opening
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
