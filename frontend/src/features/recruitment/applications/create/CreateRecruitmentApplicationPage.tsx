"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Users, 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Briefcase,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function CreateApplicationPage() {
  const { showToast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Users className="h-5 w-5 mr-2 inline-block text-primary" />
              Create New Application
            </h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
            <Link href="/recruitment/applications">
              <Button className="btn-default btn-sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Applications</Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/applications">Applications</Link></li>
              <li className="active">Create</li>
            </ol>
          </div>
        </div>

        <div className="white-box">
          <form className="space-y-8">
            {/* Personal Information */}
            <div className="row">
              <div className="col-md-4">
                <h5 className="text-[14px] font-bold mb-2">Personal Information</h5>
                <p className="text-[12px] text-gray-400">Basic contact details of the applicant.</p>
              </div>
              <div className="col-md-8 space-y-4">
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Job Opening</label>
                  <select className="form-control">
                    <option>Full Stack Developer</option>
                    <option>UI/UX Designer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Full Name</label>
                  <input type="text" className="form-control" placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Email</label>
                  <input type="email" className="form-control" placeholder="e.g. john@example.com" />
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Phone</label>
                  <input type="tel" className="form-control" placeholder="e.g. +1 234 567 890" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Gender</label>
                    <select className="form-control">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Date of Birth</label>
                    <input type="date" className="form-control" />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#f2f2f3]" />

            {/* Additional Details */}
            <div className="row">
              <div className="col-md-4">
                <h5 className="text-[14px] font-bold mb-2">Additional Details</h5>
                <p className="text-[12px] text-gray-400">Documents and job-specific answers.</p>
              </div>
              <div className="col-md-8 space-y-4">
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Resume (PDF, DOCX)</label>
                  <div className="border-2 border-dashed border-[#f2f2f3] rounded p-8 text-center hover:bg-gray-50 transition-all cursor-pointer">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">Click to upload or drag and drop</p>
                  </div>
                </div>
                <div className="form-group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Cover Letter</label>
                  <textarea className="form-control" rows={4} placeholder="Paste cover letter or notes..."></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#f2f2f3] flex justify-end">
              <Button type="button" className="btn-success" onClick={() => { showToast("Application Created", "success"); }}>
                <Save className="h-4 w-4 mr-2" /> Save Application
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
