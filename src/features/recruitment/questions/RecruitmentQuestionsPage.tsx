"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { MessageSquare, Plus, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function CustomQuestionsPage() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([
    { id: 1, question: "Why do you want to work with us?", type: "Text", required: true },
    { id: 2, question: "What is your expected salary range?", type: "Text", required: false },
    { id: 3, question: "Are you willing to relocate?", type: "Radio", required: true },
    { id: 4, question: "When can you start?", type: "Text", required: true },
  ]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><MessageSquare className="h-5 w-5 mr-2 inline-block text-primary" /> Custom Questions</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-success btn-outline btn-sm"><Plus className="h-4 w-4 mr-1" /> Add Question</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Questions</li>
            </ol>
          </div>
        </div>
        <div className="white-box p-0">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, i) => (
                  <tr key={q.id}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{q.question}</td>
                    <td><span className="label label-info">{q.type}</span></td>
                    <td>{q.required ? <span className="label label-success">Yes</span> : <span className="label label-default">No</span>}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-1">
                        <button className="btn-success btn-outline p-1 rounded hover:bg-success hover:text-white transition-all"><Edit className="h-4 w-4" /></button>
                        <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" onClick={() => { setQuestions(questions.filter(x => x.id !== q.id)); showToast("Deleted", "success"); }}><Trash2 className="h-4 w-4" /></button>
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
