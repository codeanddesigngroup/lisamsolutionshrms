"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Columns, 
  ArrowLeft, 
  Plus,
  GripVertical,
  User
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const PIPELINE_STAGES = [
  { id: 1, name: "Applied", color: "#03a9f3", cards: [
    { id: 1, name: "Alice Johnson", job: "Full Stack Developer", date: "May 01, 2024" },
    { id: 6, name: "Frank Wilson", job: "UI/UX Designer", date: "May 03, 2024" },
  ]},
  { id: 2, name: "Phone Screen", color: "#7460ee", cards: [
    { id: 2, name: "Bob Williams", job: "Full Stack Developer", date: "Apr 28, 2024" },
  ]},
  { id: 3, name: "Interview", color: "#E6A817", cards: [
    { id: 3, name: "Carol Davis", job: "UI/UX Designer", date: "Apr 25, 2024" },
  ]},
  { id: 4, name: "Hired", color: "#00c292", cards: [
    { id: 4, name: "Dan Brown", job: "HR Manager", date: "Apr 20, 2024" },
  ]},
  { id: 5, name: "Rejected", color: "#fb9678", cards: [
    { id: 5, name: "Eve Miller", job: "Full Stack Developer", date: "Apr 22, 2024" },
  ]},
];

export default function ApplicationsBoardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Columns className="h-5 w-5 mr-2 inline-block text-primary" />
              Application Board
            </h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Link href="/recruitment/applications">
              <Button className="btn-default btn-sm">
                <ArrowLeft className="h-4 w-4 mr-1 inline-block" /> List View
              </Button>
            </Link>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/applications">Applications</Link></li>
              <li className="active">Board</li>
            </ol>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
              {/* Column Header */}
              <div className="rounded-t px-4 py-3 flex items-center justify-between" style={{ backgroundColor: stage.color }}>
                <h5 className="text-white font-bold text-[12px] uppercase tracking-wider m-0">{stage.name}</h5>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{stage.cards.length}</span>
              </div>

              {/* Cards Container */}
              <div className="bg-gray-50 border border-t-0 border-[#eee] rounded-b p-3 space-y-3 min-h-[300px]">
                {stage.cards.map((card) => (
                  <Link href={`/recruitment/applications/${card.id}`} key={card.id}>
                    <div className="bg-white border border-[#eee] rounded p-4 hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] mr-3">
                            {card.name.charAt(0)}
                          </div>
                          <div>
                            <h6 className="text-[12px] font-bold text-gray-800 m-0 group-hover:text-primary transition-colors">{card.name}</h6>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{card.job}</p>
                          </div>
                        </div>
                        <GripVertical className="h-4 w-4 text-gray-200 cursor-move" />
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#f5f5f5] text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Applied: {card.date}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
