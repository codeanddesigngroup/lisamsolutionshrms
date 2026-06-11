"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  StickyNote, 
  Trash2, 
  Edit, 
  Check,
  ChevronRight,
  Clock,
  Settings,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function StickyNotesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([
    { id: 1, text: "Remember to call the client for project feedback.", date: "2024-05-01", color: "bg-[#ab8ce4]" },
    { id: 2, text: "Server maintenance scheduled for next Sunday.", date: "2024-05-02", color: "bg-[#5475ed]" },
    { id: 3, text: "Team meeting at 10 AM.", date: "2024-05-03", color: "bg-[#00c292]" },
    { id: 4, text: "Check monthly expense reports.", date: "2024-05-05", color: "bg-[#f1c411]" },
  ]);

  const handleDelete = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
    showToast("Note deleted", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <StickyNote className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Sticky Notes
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end">
                <ol className="breadcrumb">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li className="active">Sticky Notes</li>
                </ol>
            </div>
        </div>

        <div className="white-box mb-8">
            <Button className="btn-info btn-outline btn-rounded btn-sm">
                Add Note <Plus className="h-4 w-4 ml-1 inline-block" />
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="noteBox">
            {notes.map((note) => (
                <div key={note.id} className={`${note.color} rounded-sm shadow-md min-h-[180px] p-4 flex flex-col justify-between text-white transition-transform hover:scale-[1.02]`}>
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <Clock className="h-4 w-4 opacity-70" />
                            <div className="flex space-x-1">
                                <button className="p-1 hover:bg-white/20 rounded transition-colors"><Edit className="h-3 w-3" /></button>
                                <button onClick={() => handleDelete(note.id)} className="p-1 hover:bg-white/20 rounded transition-colors"><X className="h-3 w-3" /></button>
                            </div>
                        </div>
                        <p className="text-[13px] font-medium leading-relaxed italic">"{note.text}"</p>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-4 border-t border-white/20 pt-2">
                        {note.date}
                    </div>
                </div>
            ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
