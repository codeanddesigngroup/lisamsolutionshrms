"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  Bell, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  Megaphone, 
  RefreshCw,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function NoticeBoardPage() {
  const { showToast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [noticeHeading, setNoticeHeading] = useState("");
  const [noticeDescription, setNoticeDescription] = useState("");
  const [noticeTo, setNoticeTo] = useState("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/notice";
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await api.get(url);
      setNotices(response.data.data || []);
    } catch (err) {
      console.error("Fetch Notices Error:", err);
      setNotices((current) =>
        current.length === 0 ? [
          { id: 1, heading: "Eid-ul-Fitr Holiday", description: "The office will remain closed for 3 days starting from Friday.", created_at: new Date().toISOString(), to: "all" },
          { id: 2, heading: "New HR Policy", description: "Please review the updated leave policy in the employee portal.", created_at: new Date().toISOString(), to: "employee" }
        ] : current
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchNotices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchNotices]);

  const openAddModal = () => {
    setEditingNotice(null);
    setNoticeHeading("");
    setNoticeDescription("");
    setNoticeTo("all");
    setIsModalOpen(true);
  };

  const openEditModal = (notice: any) => {
    setEditingNotice(notice);
    setNoticeHeading(notice.heading);
    setNoticeDescription(notice.description);
    setNoticeTo(notice.to || "all");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        heading: noticeHeading,
        description: noticeDescription,
        to: noticeTo
      };

      if (editingNotice) {
        await api.put(`/notice/${editingNotice.id}`, payload);
        showToast("Notice updated successfully", "success");
      } else {
        await api.post("/notice", payload);
        showToast("Notice published successfully", "success");
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await api.delete(`/notice/${deletingId}`);
        showToast("Notice deleted successfully", "success");
        setDeletingId(null);
        fetchNotices();
      } catch (err) {
        showToast("Failed to delete notice", "error");
      }
    }
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-8 shadow-sm -mx-6 -mt-6 mb-6 gap-6 border-b border-gray-50">
          <div className="flex items-center space-x-4">
             <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Megaphone className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-xl font-black text-gray-800 uppercase tracking-widest">Notice Board</h1>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-[0.2em] uppercase">Home / Communication / Notices</p>
             </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchNotices}
              className="p-3 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all shadow-sm active:scale-95"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button 
              onClick={openAddModal}
              className="bg-primary text-white text-[10px] font-black px-8 h-12 uppercase tracking-widest shadow-xl shadow-primary/20 rounded-xl transition-all active:scale-95"
            >
               <Plus className="h-4 w-4 mr-2" /> Add Notice
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="border-none shadow-sm p-8 bg-white rounded-2xl">
           <div className="flex flex-wrap items-end gap-8">
              <div className="flex-1 min-w-[200px] space-y-2">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Published From</label>
                 <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50/50 border-none rounded-xl py-4 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    />
                 </div>
              </div>
              <div className="flex-1 min-w-[200px] space-y-2">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Published To</label>
                 <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50/50 border-none rounded-xl py-4 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    />
                 </div>
              </div>
              <div className="flex items-center space-x-3">
                 <Button 
                   onClick={fetchNotices}
                   className="bg-gray-800 text-white text-[10px] font-black px-8 h-12 uppercase tracking-widest rounded-xl hover:bg-gray-700 transition-all shadow-lg"
                 >
                    Apply Filter
                 </Button>
                 {(startDate || endDate) && (
                   <Button 
                     onClick={resetFilters}
                     className="bg-gray-100 text-gray-500 border-none px-8 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                   >
                      Reset
                   </Button>
                 )}
              </div>
           </div>
        </Card>

        {/* Notices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            </div>
          )}
           {notices.map((notice) => (
              <Card key={notice.id} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500 rounded-2xl flex flex-col">
                 <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex-1">
                    <div className="flex items-center justify-between mb-6">
                       <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                          <Megaphone className="h-6 w-6" />
                       </div>
                       <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => openEditModal(notice)} className="p-2.5 bg-white rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm border border-gray-100"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingId(notice.id)} className="p-2.5 bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all shadow-sm border border-gray-100"><Trash2 className="h-4 w-4" /></button>
                       </div>
                    </div>
                    <h3 className="text-sm font-black text-gray-800 leading-relaxed mb-4 uppercase tracking-tight group-hover:text-primary transition-colors">{notice.heading}</h3>
                    <div 
                      className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-4 mb-6 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: notice.description }}
                    />
                 </div>
                 <div className="px-8 py-6 bg-white flex items-center justify-between border-t border-gray-50">
                    <div className="flex flex-col space-y-1">
                       <span className="flex items-center text-[9px] text-gray-400 font-black uppercase tracking-widest">
                          <Calendar className="h-3 w-3 mr-2 text-primary" /> {new Date(notice.created_at).toLocaleDateString()}
                       </span>
                       <span className="flex items-center text-[9px] text-gray-400 font-black uppercase tracking-widest">
                          <User className="h-3 w-3 mr-2 text-primary" /> Posted By Admin
                       </span>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                       <span className="bg-primary/5 text-primary px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-primary/10">To: {notice.to || 'All'}</span>
                    </div>
                 </div>
              </Card>
           ))}

           {!loading && notices.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] shadow-sm border border-gray-50">
                 <div className="h-24 w-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-dashed border-gray-200">
                    <Bell className="h-10 w-10 text-gray-200" />
                 </div>
                 <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-2">No active notices</h2>
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest max-w-xs mx-auto leading-loose">The board is clear. There are no announcements or updates for the current filters.</p>
                 <Button onClick={openAddModal} className="mt-10 bg-primary text-white text-[10px] font-black px-12 h-14 uppercase tracking-widest shadow-2xl shadow-primary/30 rounded-2xl transition-all hover:-translate-y-1">
                    <Plus className="h-4 w-4 mr-2" /> Add Your First Notice
                 </Button>
              </div>
           )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Remove Notice"
        size="sm"
      >
        <div className="text-center py-6 px-4">
           <div className="h-24 w-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-6 shadow-inner border border-red-100/50">
              <AlertTriangle className="h-10 w-10" />
           </div>
           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-3">Delete Notice?</h3>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">This will permanently remove the announcement from the board for all staff members.</p>
           <div className="flex space-x-4">
              <Button onClick={() => setDeletingId(null)} className="flex-1 bg-gray-50 text-gray-500 border-none h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">Abort</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 rounded-2xl hover:bg-red-600 transition-all">Confirm</Button>
           </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNotice ? "Update Notice" : "Publish Announcement"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8 p-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block text-left">Notice Heading</label>
                 <input 
                   type="text" 
                   required
                   placeholder="e.g. Monthly Performance Review"
                   className="w-full bg-gray-50 border-none rounded-2xl py-4.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
                   value={noticeHeading}
                   onChange={(e) => setNoticeHeading(e.target.value)}
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block text-left">Target Audience</label>
                 <select 
                   required
                   className="w-full bg-gray-50 border-none rounded-2xl py-4.5 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                   value={noticeTo}
                   onChange={(e) => setNoticeTo(e.target.value)}
                 >
                   <option value="all">Everyone</option>
                   <option value="admin">Administrators</option>
                   <option value="employee">Staff Members</option>
                 </select>
              </div>
           </div>
           
           <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block text-left">Detailed Content</label>
              <RichTextEditor 
                value={noticeDescription}
                onChange={setNoticeDescription}
                placeholder="Write your announcement details here..."
              />
           </div>

           <div className="flex space-x-5 pt-8 border-t border-gray-50">
              <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-15 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Discard</Button>
              <Button type="submit" className="flex-1 bg-primary text-white h-15 text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-2xl transition-all">
                {editingNotice ? "Update & Republish" : "Publish Now"}
              </Button>
           </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
