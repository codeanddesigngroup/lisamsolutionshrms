"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Trash2, 
  Archive, 
  CheckCircle,
  Star,
  Download,
  Edit,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const [rating, setRating] = useState(0);

  const application = {
    id: params.id,
    name: "Alice Johnson",
    job: "Full Stack Developer",
    location: "New York",
    email: "alice@example.com",
    phone: "+1 234 567 890",
    photo: null,
    resume: "resume.pdf",
    appliedAt: "2024-05-01 10:00 AM",
    status: "Applied",
    gender: "Female",
    dob: "1995-08-12",
    country: "USA",
    state: "New York",
    city: "Brooklyn",
    answers: [
      { question: "Why do you want to work with us?", answer: "I love your tech stack and company culture." },
      { question: "What is your expected salary range?", answer: "$80k - $100k" }
    ],
    schedule: {
      date: "2024-05-10 10:00 AM",
      employee: "John Doe",
      status: "Accepted"
    },
    notes: [
      { id: 1, user: "Admin", text: "Great portfolio, definitely shortlist.", date: "2 days ago" }
    ]
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Users className="h-5 w-5 mr-2 inline-block text-primary" />
              Application Detail
            </h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end items-center space-x-2">
            <Link href="/recruitment/applications">
              <Button className="btn-default btn-sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to List</Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/applications">Applications</Link></li>
              <li className="active">Detail</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="white-box text-center p-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl mx-auto mb-4 border-2 border-primary/20">
                {application.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold mb-1">{application.name}</h3>
              <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-4">{application.job}</p>
              
              <div className="flex justify-center mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`h-5 w-5 cursor-pointer ${rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                    onClick={() => setRating(s)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <Button className="btn-primary btn-sm btn-block"><Download className="h-4 w-4 mr-2" /> View Resume</Button>
                <Button className="btn-success btn-sm btn-block"><CheckCircle className="h-4 w-4 mr-2" /> Start Onboarding</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="btn-info btn-outline btn-sm"><Archive className="h-4 w-4 mr-2" /> Archive</Button>
                  <Button className="btn-danger btn-outline btn-sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                </div>
              </div>
            </div>

            <div className="white-box">
              <h4 className="box-title mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block">Email</label>
                    <span className="text-[13px]">{application.email}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block">Phone</label>
                    <span className="text-[13px]">{application.phone}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase font-bold block">Address</label>
                    <span className="text-[13px]">{application.city}, {application.state}, {application.country}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Tabs & Details */}
          <div className="lg:col-span-8">
            <div className="white-box p-0 overflow-hidden">
              <div className="border-b border-[#f2f2f3]">
                <nav className="flex px-6">
                  {["info", "questions", "interviews", "notes"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-4 text-[12px] font-bold uppercase tracking-wider border-b-2 transition-all mr-4 ${
                        activeTab === tab ? "text-primary border-primary" : "text-gray-400 border-transparent hover:text-primary"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Info Tab */}
                {activeTab === "info" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[11px] text-gray-400 uppercase font-bold block mb-1">Applied At</label>
                        <p className="text-[13px] font-medium">{application.appliedAt}</p>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 uppercase font-bold block mb-1">Gender</label>
                        <p className="text-[13px] font-medium">{application.gender}</p>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 uppercase font-bold block mb-1">Date of Birth</label>
                        <p className="text-[13px] font-medium">{application.dob}</p>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 uppercase font-bold block mb-1">Current Status</label>
                        <span className="label label-info">{application.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions Tab */}
                {activeTab === "questions" && (
                  <div className="space-y-6">
                    {application.answers.map((a, i) => (
                      <div key={i} className="pb-4 border-b border-[#f2f2f3] last:border-0">
                        <h5 className="text-[13px] font-bold mb-2">{a.question}</h5>
                        <p className="text-[13px] text-gray-600">{a.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interviews Tab */}
                {activeTab === "interviews" && (
                  <div className="space-y-6">
                    {application.schedule ? (
                      <div className="bg-gray-50 p-4 rounded border border-[#f2f2f3]">
                        <h5 className="text-[14px] font-bold mb-4">Scheduled Interview</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-start">
                            <Calendar className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold block">Date</label>
                              <span className="text-[12px]">{application.schedule.date}</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Clock className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold block">Status</label>
                              <span className="label label-success text-[10px]">{application.schedule.status}</span>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Users className="h-4 w-4 text-primary mr-2" />
                            <div>
                              <label className="text-[10px] text-gray-400 uppercase font-bold block">Assigned To</label>
                              <span className="text-[12px]">{application.schedule.employee}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[12px] text-gray-400 font-bold uppercase">No interview scheduled</p>
                        <Button className="btn-info btn-sm mt-4">Schedule Now</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === "notes" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {application.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-4 rounded border border-[#f2f2f3] relative group">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="text-[13px] font-bold">{note.user}</h6>
                            <span className="text-[11px] text-gray-400">{note.date}</span>
                          </div>
                          <p className="text-[13px] text-gray-600">{note.text}</p>
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-[#f2f2f3]">
                      <textarea className="form-control mb-3" rows={3} placeholder="Add a note..."></textarea>
                      <Button className="btn-primary btn-sm">Add Note</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
