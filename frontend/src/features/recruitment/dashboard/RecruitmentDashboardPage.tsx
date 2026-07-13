"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  UserX, 
  FileText, 
  Calendar, 
  Star,
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function RecruitmentDashboardPage() {
  const stats = [
    { label: "Total Companies", value: 3, bg: "bg-[#041731]", icon: Briefcase, link: "/recruitment/jobs" },
    { label: "Total Openings", value: 12, bg: "bg-[#03a9f3]", icon: FileText, link: "/recruitment/jobs" },
    { label: "Total Applications", value: 48, bg: "bg-[#03a9f3]", icon: Users, link: "/recruitment/applications" },
    { label: "Total Hired", value: 8, bg: "bg-[#00c292]", icon: UserCheck, link: "/recruitment/applications" },
    { label: "Total Rejected", value: 5, bg: "bg-[#041731]", icon: UserX, link: "/recruitment/applications" },
    { label: "New Applications", value: 14, bg: "bg-[#fb9678]", icon: AlertCircle, link: "/recruitment/applications" },
    { label: "Shortlisted", value: 6, bg: "bg-[#E6A817]", icon: Star, link: "/recruitment/applications" },
    { label: "Today Interviews", value: 2, bg: "bg-[#03a9f3]", icon: Calendar, link: "/recruitment/interviews" },
  ];

  const todos = [
    { id: 1, title: "Review frontend developer applications", status: "pending" },
    { id: 2, title: "Schedule interview with John Smith", status: "pending" },
    { id: 3, title: "Send onboarding docs to new hire", status: "completed" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Briefcase className="h-5 w-5 mr-2 inline-block text-primary" />
              Recruitment Dashboard
            </h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end">
            <ol className="breadcrumb">
              <li><Link href="/dashboard">Home</Link></li>
              <li className="active">Recruitment</li>
            </ol>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Link href={stat.link} key={idx}>
              <div className={`${stat.bg} text-white rounded p-6 text-center hover:opacity-90 transition-all cursor-pointer`}>
                <h1 className="text-3xl text-white font-light mb-1">{stat.value}</h1>
                <h6 className="text-[11px] text-white font-bold uppercase tracking-wider opacity-80">{stat.label}</h6>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Links + ToDo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="white-box">
            <h3 className="box-title mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/recruitment/jobs/create" className="flex items-center justify-between p-4 border border-[#f2f2f3] rounded hover:bg-gray-50 transition-all">
                <span className="flex items-center text-[13px] font-bold"><Plus className="h-4 w-4 mr-3 text-primary" /> Post New Job</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link href="/recruitment/applications" className="flex items-center justify-between p-4 border border-[#f2f2f3] rounded hover:bg-gray-50 transition-all">
                <span className="flex items-center text-[13px] font-bold"><Users className="h-4 w-4 mr-3 text-primary" /> View Applications</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link href="/recruitment/interviews" className="flex items-center justify-between p-4 border border-[#f2f2f3] rounded hover:bg-gray-50 transition-all">
                <span className="flex items-center text-[13px] font-bold"><Calendar className="h-4 w-4 mr-3 text-primary" /> Interview Schedule</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
              <Link href="/recruitment/onboarding" className="flex items-center justify-between p-4 border border-[#f2f2f3] rounded hover:bg-gray-50 transition-all">
                <span className="flex items-center text-[13px] font-bold"><UserCheck className="h-4 w-4 mr-3 text-primary" /> Onboarding</span>
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </Link>
            </div>
          </div>

          {/* ToDo List */}
          <div className="white-box">
            <div className="flex justify-between items-center mb-6">
              <h3 className="box-title m-0">ToDo List</h3>
              <Button className="btn-success btn-sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            <div className="space-y-0">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Pending Tasks</h5>
              {todos.filter(t => t.status === "pending").map(todo => (
                <div key={todo.id} className="flex items-center p-3 border-b border-[#f2f2f3] hover:bg-gray-50 transition-all">
                  <input type="checkbox" className="mr-3" />
                  <span className="text-[13px] font-medium">{todo.title}</span>
                </div>
              ))}
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-6">Completed Tasks</h5>
              {todos.filter(t => t.status === "completed").map(todo => (
                <div key={todo.id} className="flex items-center p-3 border-b border-[#f2f2f3] opacity-50">
                  <input type="checkbox" className="mr-3" checked readOnly />
                  <span className="text-[13px] font-medium line-through">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
