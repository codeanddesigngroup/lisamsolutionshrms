"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { FileText, Plus, Download, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function RecruitmentDocumentsPage() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([
    { id: 1, name: "Resume - Alice Johnson", file: "alice_resume.pdf", applicant: "Alice Johnson", type: "Resume", uploadedAt: "2024-05-01" },
    { id: 2, name: "Cover Letter - Bob Williams", file: "bob_cover.pdf", applicant: "Bob Williams", type: "Cover Letter", uploadedAt: "2024-04-28" },
    { id: 3, name: "Onboarding Contract - Dan Brown", file: "dan_contract.docx", applicant: "Dan Brown", type: "Contract", uploadedAt: "2024-05-10" },
    { id: 4, name: "NDA - Sarah Wilson", file: "sarah_nda.pdf", applicant: "Sarah Wilson", type: "NDA", uploadedAt: "2024-05-12" },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><FileText className="h-5 w-5 mr-2 inline-block text-primary" /> Documents</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-success btn-sm"><Upload className="h-4 w-4 mr-1" /> Upload Document</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Documents</li>
            </ol>
          </div>
        </div>

        <div className="white-box p-0">
          <div className="px-6 py-3 border-b border-[#f2f2f3] bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            We accept JPEG, JPG, PNG, GIF, TXT, DOC, DOCX, RTF, XLS, XLSX and PDF files
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Document Name</th>
                  <th>Applicant</th>
                  <th>Type</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={doc.id}>
                    <td>{i + 1}</td>
                    <td className="font-bold">{doc.name}</td>
                    <td>{doc.applicant}</td>
                    <td><span className="label label-info">{doc.type}</span></td>
                    <td className="text-primary hover:underline cursor-pointer">{doc.file}</td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all" title="Download"><Download className="h-4 w-4" /></button>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" title="Delete" onClick={() => { setDocuments(documents.filter(d => d.id !== doc.id)); showToast("Deleted", "success"); }}><Trash2 className="h-4 w-4" /></button>
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
