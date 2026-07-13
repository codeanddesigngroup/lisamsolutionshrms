"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  GripVertical, 
  Copy, 
  Check, 
  Eye,
  Settings,
  Layout,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function LeadFormPage() {
  const { showToast } = useToast();
  const [fields, setFields] = useState([
    { id: 1, name: "Name", status: "active", required: true },
    { id: 2, name: "Email", status: "active", required: true },
    { id: 3, name: "Phone", status: "active", required: false },
    { id: 4, name: "Company Name", status: "inactive", required: false },
    { id: 5, name: "Message", status: "active", required: false },
  ]);

  const toggleStatus = (id: number) => {
    setFields(fields.map(f => f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
  };

  const copyIframe = () => {
    const iframeCode = `<iframe src="https://lisam.com/lead-form/123" width="100%" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    showToast("Iframe code copied!", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-12">
                <h4 className="page-title m-0">
                    <Layout className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Lead Form Settings
                </h4>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="white-box">
                <div className="border-b border-[#f2f2f3] pb-4 mb-6">
                    <h3 className="box-title m-0">Configure Form Fields</h3>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold">Drag and drop to sort fields</p>
                </div>

                <div className="space-y-0 border border-[#f2f2f3] rounded">
                    <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 border-b border-[#f2f2f3] text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                        <div className="col-span-2">#</div>
                        <div className="col-span-6">Field Name</div>
                        <div className="col-span-4 text-right">Status</div>
                    </div>
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 px-4 py-3 border-b border-[#f2f2f3] last:border-none hover:bg-gray-50/50 transition-all items-center">
                            <div className="col-span-2 flex items-center text-gray-300 cursor-move">
                                <GripVertical className="h-4 w-4 mr-2" />
                                <span className="text-gray-500 font-bold">{index + 1}</span>
                            </div>
                            <div className="col-span-6 text-[13px] font-medium">
                                {field.name} {field.required && <span className="text-red-500 ml-1">*</span>}
                            </div>
                            <div className="col-span-4 flex justify-end items-center">
                                {field.required ? (
                                    <span className="text-[10px] font-bold text-gray-300 uppercase">Required</span>
                                ) : (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={field.status === 'active'}
                                            onChange={() => toggleStatus(field.id)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#99d683]"></div>
                                    </label>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-[#f2f2f3]">
                    <h4 className="text-[12px] font-bold uppercase mb-4 flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-primary" /> Iframe Snippet
                    </h4>
                    <div className="bg-[#fcf8e3] border border-[#faebcc] p-4 rounded text-[11px] font-medium text-[#8a6d3b] mb-4 overflow-x-auto whitespace-nowrap">
                        &lt;iframe src="https://lisam.com/lead-form/123" width="100%" frameborder="0"&gt;&lt;/iframe&gt;
                    </div>
                    <Button onClick={copyIframe} className="btn-success btn-sm">
                        <Copy className="h-4 w-4 mr-2" /> Copy Iframe Code
                    </Button>
                </div>
            </div>

            <div className="white-box bg-gray-50 border border-[#eee]">
                <div className="border-b border-[#f2f2f3] pb-4 mb-6 flex justify-between items-center bg-white -mx-6 -mt-6 p-6">
                    <h3 className="box-title m-0">Live Preview</h3>
                    <span className="label label-info">Public Form</span>
                </div>
                
                <div className="bg-white p-8 rounded shadow-sm border border-[#eee] min-h-[500px]">
                    <h2 className="text-xl font-bold mb-8 text-center text-gray-700">Contact Us</h2>
                    <div className="space-y-6">
                        {fields.filter(f => f.status === 'active').map(field => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-400 uppercase">
                                    {field.name} {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </label>
                                <input type="text" className="form-control" disabled />
                            </div>
                        ))}
                        <Button className="btn-primary w-full h-11 uppercase tracking-widest text-[12px]" disabled>Submit Request</Button>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
