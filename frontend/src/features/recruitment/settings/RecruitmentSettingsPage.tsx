"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Settings, 
  Globe, 
  Mail, 
  MessageSquare, 
  Link2, 
  FileText, 
  Languages,
  Save,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function RecruitmentSettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("application");

  const tabs = [
    { id: "application", label: "Application Settings", icon: FileText },
    { id: "mail", label: "Email Settings", icon: Mail },
    { id: "sms", label: "SMS Settings", icon: MessageSquare },
    { id: "linkedin", label: "LinkedIn Settings", icon: Link2 },
    { id: "footer", label: "Footer Settings", icon: Globe },
    { id: "language", label: "Language Settings", icon: Languages },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><Settings className="h-5 w-5 mr-2 inline-block text-primary" /> Recruitment Settings</h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end">
            <ol className="breadcrumb">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Settings</li>
            </ol>
          </div>
        </div>

        <div className="panel panel-inverse white-box">
          <div className="panel-heading border-b border-[#f2f2f3] pb-4 mb-6">Recruitment Configuration</div>
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Sidebar */}
            <div className="w-full lg:w-64 border-r border-[#f2f2f3]">
              <nav className="flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-6 py-4 text-[12px] font-bold uppercase tracking-wider transition-all text-left ${
                        activeTab === tab.id ? "bg-[#03a9f3] text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Application Settings */}
              {activeTab === "application" && (
                <div className="space-y-8">
                  <h4 className="text-[14px] font-bold mb-6">Form Settings</h4>
                  <div className="space-y-4">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-[12px] font-bold text-gray-700">Show Profile Image on Apply Page?</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="mr-3" defaultChecked />
                      <span className="text-[12px] font-bold text-gray-700">Require Resume Upload</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-[12px] font-bold text-gray-700">Require Cover Letter</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-[12px] font-bold text-gray-700">Show Terms And Conditions</span>
                    </label>
                  </div>
                  <div className="pt-6 border-t border-[#f2f2f3]">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Legal Term Text</label>
                    <textarea className="form-control" rows={4} defaultValue="I agree with the Terms and Conditions of this company." />
                  </div>
                  <Button className="btn-success" onClick={() => showToast("Settings saved", "success")}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                </div>
              )}

              {/* Mail Settings */}
              {activeTab === "mail" && (
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold mb-6">Email / SMTP Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Driver</label>
                      <select className="form-control"><option>SMTP</option><option>Mailgun</option></select>
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Host</label>
                      <input type="text" className="form-control" defaultValue="smtp.mailtrap.io" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Port</label>
                      <input type="text" className="form-control" defaultValue="587" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Username</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Password</label>
                      <input type="password" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail From Name</label>
                      <input type="text" className="form-control" defaultValue="Lisam HR" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail From Email</label>
                      <input type="email" className="form-control" defaultValue="hr@lisam.com" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Mail Encryption</label>
                      <select className="form-control"><option>TLS</option><option>SSL</option><option>None</option></select>
                    </div>
                  </div>
                  <Button className="btn-success" onClick={() => showToast("Mail settings saved", "success")}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                </div>
              )}

              {/* SMS Settings */}
              {activeTab === "sms" && (
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold mb-6">SMS Notification Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Nexmo Status</label>
                      <select className="form-control"><option>Active</option><option>Inactive</option></select>
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Nexmo Key</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Nexmo Secret</label>
                      <input type="password" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">From Number</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <Button className="btn-success" onClick={() => showToast("SMS settings saved", "success")}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                </div>
              )}

              {/* LinkedIn Settings */}
              {activeTab === "linkedin" && (
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold mb-6">LinkedIn Integration</h4>
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="mr-3" />
                      <span className="text-[12px] font-bold text-gray-700">Allow Sign In Via LinkedIn</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Client ID</label>
                      <input type="text" className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Client Secret</label>
                      <input type="password" className="form-control" />
                    </div>
                    <div className="form-group col-span-2">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Callback URL</label>
                      <input type="text" className="form-control" defaultValue="https://yourdomain.com/auth/linkedin/callback" />
                    </div>
                  </div>
                  <div className="bg-[#fcf8e3] border border-[#faebcc] p-4 rounded text-[11px] text-[#8a6d3b] mt-4">
                    <strong>Note:</strong> Your site must have an SSL Certificate (https) to use LinkedIn Sign In.
                  </div>
                  <Button className="btn-success" onClick={() => showToast("LinkedIn settings saved", "success")}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
                </div>
              )}

              {/* Footer Settings */}
              {activeTab === "footer" && (
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold mb-6">Careers Page Footer Links</h4>
                  <div className="space-y-4">
                    {["Privacy Policy", "Terms of Service"].map((link, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Title</label>
                          <input type="text" className="form-control" defaultValue={link} />
                        </div>
                        <div className="form-group">
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">URL</label>
                          <input type="text" className="form-control" defaultValue="#" />
                        </div>
                        <div><button className="btn-danger btn-outline p-1.5 rounded"><Trash2 className="h-4 w-4" /></button></div>
                      </div>
                    ))}
                  </div>
                  <Button className="btn-info btn-sm"><Plus className="h-4 w-4 mr-1" /> Add Link</Button>
                  <div className="pt-6"><Button className="btn-success" onClick={() => showToast("Footer settings saved", "success")}><Save className="h-4 w-4 mr-2" /> Save Settings</Button></div>
                </div>
              )}

              {/* Language Settings */}
              {activeTab === "language" && (
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold mb-6">Language Settings</h4>
                  <div className="bg-[#d9edf7] border border-[#bce8f1] p-4 rounded text-[11px] text-[#31708f] mb-4">
                    Default language cannot be updated or deleted.
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead><tr><th>#</th><th>Language</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                      <tbody>
                        <tr><td>1</td><td className="font-bold">English</td><td><span className="label label-success">Active</span></td><td className="text-right"><span className="text-[10px] text-gray-400 uppercase font-bold">Default</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
