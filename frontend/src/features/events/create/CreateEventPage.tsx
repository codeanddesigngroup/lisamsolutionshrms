"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, RefreshCw, Calendar as CalendarIcon, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState(() => ({
    event_name: "",
    where: "",
    description: "",
    start_date_time: new Date().toISOString().slice(0, 16),
    end_date_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // +1 hour
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        event_name: formData.event_name,
        where: formData.where,
        description: formData.description,
        start_date_time: new Date(formData.start_date_time).toISOString(),
        end_date_time: new Date(formData.end_date_time).toISOString(),
      };

      // Mock testing bypass
      if (localStorage.getItem("token") === "mock_token_12345") {
        setTimeout(() => {
          router.push("/event-calendar");
          router.refresh();
        }, 800);
        return;
      }

      await api.post("/event", payload);
      router.push("/event-calendar");
      router.refresh();
    } catch (err: any) {
      console.error("Create Event Error:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Event</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/event-calendar" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Event Calendar</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Event</span>
            </div>
          </div>
          <Link href="/event-calendar">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] font-black h-8 px-4 hover:bg-gray-200 uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border-l-4 border-red-500 animate-in slide-in-from-top-2">
                  {error}
               </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Event Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleChange}
                    type="text" 
                    placeholder="e.g. Annual Team Retreat" 
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date & Time <span className="text-red-500">*</span></label>
                <input 
                  name="start_date_time"
                  value={formData.start_date_time}
                  onChange={handleChange}
                  type="datetime-local" 
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date & Time <span className="text-red-500">*</span></label>
                <input 
                  name="end_date_time"
                  value={formData.end_date_time}
                  onChange={handleChange}
                  type="datetime-local" 
                  className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  required 
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    name="where"
                    value={formData.where}
                    onChange={handleChange}
                    type="text" 
                    placeholder="e.g. Conference Room A or Zoom Link" 
                    className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
              </div>

            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border-gray-200 rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-32 transition-all"
                placeholder="Event details..."
              ></textarea>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/event-calendar">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Event"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
