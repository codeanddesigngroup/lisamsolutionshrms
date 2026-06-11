"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { filterEmployeeScopedRecords } from "@/lib/employee-scope";

type EventRecord = {
  id: number | string;
  title?: string;
  event_name?: string;
  name?: string;
  date?: string;
  event_date?: string;
  start_date?: string;
  time?: string;
  start_time?: string;
  employee?: string | { id?: number | string; name?: string };
  employee_id?: number | string;
  user_id?: number | string;
  audience?: string;
  users?: Array<{ id?: number | string; name?: string; email?: string }>;
  attendees?: Array<{ id?: number | string; name?: string; email?: string }>;
  category?: string;
  color?: string;
};

const fallbackEvents: EventRecord[] = [
  { id: 1, title: "Team Review", date: "2026-05-24", time: "02:00 PM", employee_id: 2, employee: "Jane Smith", color: "bg-green-500" },
  { id: 2, title: "Company Town Hall", date: "2026-05-29", time: "04:00 PM", audience: "All Employees", employee: "All Employees", color: "bg-blue-500" },
];

const extractRecords = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const eventTitle = (event: EventRecord) => event.title || event.event_name || event.name || "Untitled event";
const eventDate = (event: EventRecord) => event.date || event.event_date || event.start_date || "";

export default function EventCalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const canManageEvents = user?.role === "admin" || user?.role === "super_admin";

  const fetchEvents = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (user.role === "employee" && user.id) params.set("user_id", String(user.id));
      const response = await api.get(`/event${params.toString() ? `?${params.toString()}` : ""}`);
      const records = extractRecords<EventRecord>(response.data);
      setEvents(records.length > 0 ? records : fallbackEvents);
    } catch (error) {
      console.error("Fetch Event Calendar Error:", error);
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const visibleEvents = useMemo(() => filterEmployeeScopedRecords(events, user, { includePublic: true }), [events, user]);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => (index < firstDay ? null : index - firstDay + 1));
  const shiftMonth = (amount: number) => setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-3 border-b border-gray-500">
          <div>
             <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Event Calendar</h1>
             <p className="text-[10px] text-gray-400 font-bold mt-0.5">Manage company events and scheduled meetings</p>
          </div>
          {canManageEvents && (
            <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
               <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Sidebar Events */}
           <div className="space-y-6">
              <Card title="Upcoming Events" className="border-gray-500 shadow-sm bg-white p-6">
                 <div className="space-y-4 mt-2">
                    {visibleEvents.slice(0, 5).map((event) => (
                       <div key={event.id} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                          <div className={`h-2 w-2 rounded-full mt-1.5 ${event.color || "bg-blue-500"}`} />
                          <div>
                             <p className="text-xs font-bold text-gray-700">{eventTitle(event)}</p>
                             <div className="flex items-center space-x-2 mt-1">
                                <Clock className="h-3 w-3 text-gray-300" />
                                <span className="text-[9px] text-gray-400 font-black uppercase">{event.time || event.start_time || "All Day"}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
              
              <Card className="border-none shadow-sm bg-primary/5 p-6 border border-primary/10">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Pro Tip</p>
                 <p className="text-xs text-primary/70 font-medium leading-relaxed">
                    {canManageEvents ? "Click on any date in the calendar to quickly create a new event for that day." : "This calendar only shows company-wide events and events assigned to you."}
                 </p>
              </Card>
           </div>

           {/* Calendar Grid */}
           <div className="lg:col-span-3">
              <Card className="border-none shadow-sm bg-white p-6">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">{monthName}</h2>
                    <div className="flex items-center space-x-1">
                       <button onClick={() => shiftMonth(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronLeft className="h-5 w-5 text-gray-400" /></button>
                       <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors">Today</button>
                       <button onClick={() => shiftMonth(1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronRight className="h-5 w-5 text-gray-400" /></button>
                       {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                    </div>
                 </div>

                 <div className="grid grid-cols-7 border-t border-l border-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                       <div key={day} className="py-4 text-center border-r border-b border-gray-50">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{day}</span>
                       </div>
                    ))}
                    {cells.map((day, i) => {
                       const dateKey = day ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
                       const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                       const hasEvent = visibleEvents.find((event) => eventDate(event) === dateKey);
                       
                       return (
                          <div key={i} className="min-h-[100px] p-2 border-r border-b border-l border-t border-gray-500 hover:bg-gray-50/30 transition-colors cursor-pointer relative group">
                             <span className={`inline-block h-6 w-6 text-center leading-6 rounded-lg text-[16px] font-black ${
                                isToday ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 group-hover:text-gray-700"
                             }`}>
                                {day || ""}
                             </span>
                             {hasEvent && (
                                <div className={`mt-2 p-1.5 rounded-lg ${hasEvent.color || "bg-blue-500"} text-white text-[8px] font-black uppercase truncate tracking-tighter shadow-sm`}>
                                   {eventTitle(hasEvent)}
                                </div>
                             )}
                          </div>
                       );
                    })}
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
