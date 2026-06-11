"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Briefcase,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { filterEmployeeScopedRecords } from "@/lib/employee-scope";

type EventItem = {
  id: number | string;
  title: string;
  date: string;
  time: string;
  employee: string;
  employee_id?: number | string;
  user_id?: number | string;
  audience?: string;
  users?: Array<{ id?: number | string; name?: string; email?: string }>;
  attendees?: Array<{ id?: number | string; name?: string; email?: string }>;
  client: string;
  category: string;
  location: string;
  color: string;
};

const initialEvents: EventItem[] = [
  { id: 1, title: "Product Launch", date: "2026-05-04", time: "09:00 AM", employee: "John Doe", client: "Acme Corp", category: "Milestone", location: "Office", color: "primary" },
  { id: 2, title: "Team Review", date: "2026-05-04", time: "02:00 PM", employee: "Jane Smith", client: "Internal", category: "Meeting", location: "Conference Room", color: "blue" },
  { id: 3, title: "Client Meeting", date: "2026-05-12", time: "11:00 AM", employee: "John Doe", client: "Globex Corp", category: "Client", location: "Zoom", color: "purple" },
  { id: 4, title: "Company Holiday", date: "2026-05-18", time: "All Day", employee: "All Employees", client: "Internal", category: "Holiday", location: "Company-wide", color: "green" },
];

const blankEvent = {
  title: "",
  date: "2026-05-12",
  time: "09:00 AM",
  employee: "All Employees",
  client: "Internal",
  category: "Meeting",
  location: "",
};

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const colorClasses: Record<string, string> = {
  primary: "bg-primary/10 border-primary text-primary",
  blue: "bg-blue-500/10 border-blue-500 text-blue-600",
  purple: "bg-purple-500/10 border-purple-500 text-purple-600",
  green: "bg-green-500/10 border-green-500 text-green-600",
};

const extractRecords = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const normalizeEvent = (event: Record<string, unknown>): EventItem => ({
  id: (event.id as number | string) || Date.now(),
  title: String(event.title || event.event_name || event.name || "Untitled event"),
  date: String(event.date || event.event_date || event.start_date || new Date().toISOString().slice(0, 10)),
  time: String(event.time || event.start_time || "All Day"),
  employee: typeof event.employee === "string" ? event.employee : String((event.employee as { name?: string } | undefined)?.name || event.audience || "All Employees"),
  employee_id: event.employee_id as number | string | undefined,
  user_id: event.user_id as number | string | undefined,
  audience: event.audience as string | undefined,
  users: event.users as EventItem["users"],
  attendees: event.attendees as EventItem["attendees"],
  client: String(event.client || "Internal"),
  category: String(event.category || "Meeting"),
  location: String(event.location || "Company-wide"),
  color: String(event.color || (event.category === "Holiday" ? "green" : event.category === "Client" ? "purple" : event.category === "Milestone" ? "primary" : "blue")),
});

export default function EventsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"Month" | "Week" | "Day" | "List">("Month");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<EventItem | null>(null);
  const [eventForm, setEventForm] = useState(blankEvent);
  const canManageEvents = user?.role === "admin" || user?.role === "super_admin";

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (user.role === "employee" && user.id) params.set("user_id", String(user.id));
      const response = await api.get(`/event${params.toString() ? `?${params.toString()}` : ""}`);
      const records = extractRecords<Record<string, unknown>>(response.data).map(normalizeEvent);
      setEvents(records.length > 0 ? records : initialEvents);
    } catch (error) {
      console.error("Fetch Events Error:", error);
      setEvents(initialEvents);
    }
  }, [user]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const currentMonth = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const visibleEvents = useMemo(() => filterEmployeeScopedRecords(events, user, { includePublic: true }), [events, user]);
  const employees = Array.from(new Set(visibleEvents.map((event) => event.employee)));
  const clients = Array.from(new Set(visibleEvents.map((event) => event.client)));
  const categories = Array.from(new Set(visibleEvents.map((event) => event.category)));

  const filteredEvents = visibleEvents.filter((event) => {
    const matchesEmployee = employeeFilter === "all" || event.employee === employeeFilter;
    const matchesClient = clientFilter === "all" || event.client === clientFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesEmployee && matchesClient && matchesCategory;
  });

  const monthEvents = filteredEvents.filter((event) => {
    const eventDate = new Date(`${event.date}T00:00:00`);
    return eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === currentDate.getMonth();
  });

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = monthStart.getDay();

  const shiftMonth = (amount: number) => {
    setCurrentDate((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));
  };

  const resetFilters = () => {
    setEmployeeFilter("all");
    setClientFilter("all");
    setCategoryFilter("all");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageEvents) {
      showToast("Employees can view assigned and company events but cannot create events.", "info");
      return;
    }
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...eventForm,
        color: eventForm.category === "Holiday" ? "green" : eventForm.category === "Client" ? "purple" : eventForm.category === "Milestone" ? "primary" : "blue",
      },
    ]);
    setIsEditorOpen(false);
    showToast("Event created locally. PHP endpoint should persist the event payload.", "success");
  };

  const deleteEvent = (id: number | string) => {
    if (!canManageEvents) {
      showToast("Employees can view events but cannot delete them.", "info");
      return;
    }
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setViewingEvent(null);
    showToast("Event deleted locally. PHP endpoint should persist deletion.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 gap-4 border-b border-gray-50">
          <div>
            <h1 className="text-base font-black text-gray-800 uppercase tracking-widest flex items-center">
              <CalendarIcon className="h-5 w-5 mr-3 text-primary" />
              Event Calendar
            </h1>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">Home / Events / Calendar View</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => showToast(`${monthEvents.length} events loaded for ${currentMonth}.`, "success")} className="p-2.5 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-all">
              <RefreshCw className="h-4 w-4" />
            </button>
            {canManageEvents && (
              <Button onClick={() => setIsEditorOpen(true)} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Add Event
              </Button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-sm p-6 bg-white mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {canManageEvents && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Employees</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="all">All Employees</option>
                  {employees.map((employee) => <option key={employee}>{employee}</option>)}
                </select>
              </div>
            </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="all">All Clients</option>
                  {clients.map((client) => <option key={client}>{client}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Event Category</label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer">
                  <option value="all">All Categories</option>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <Button onClick={() => showToast(`${filteredEvents.length} events match these filters.`, "success")} className="flex-1 bg-primary text-white text-[10px] font-black h-11 uppercase tracking-widest">Apply</Button>
              <Button onClick={resetFilters} className="flex-1 bg-gray-100 text-gray-500 border-none h-11 text-[10px] font-black uppercase tracking-widest">Reset</Button>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden p-0">
          <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{currentMonth}</h2>
              <div className="flex bg-gray-50 p-1 rounded-xl">
                <button onClick={() => shiftMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => shiftMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">Today</button>
              <div className="flex bg-gray-50 p-1 rounded-xl shadow-inner border border-gray-100/50">
                {(["Month", "Week", "Day", "List"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setView(option)}
                    className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${view === option ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {view === "Month" ? (
            <div className="grid grid-cols-7">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div key={day} className="py-4 bg-gray-50/30 border-b border-r border-gray-50 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
              {Array.from({ length: leadingEmptyDays }).map((_, index) => (
                <div key={`empty-start-${index}`} className="p-3 border-r border-b border-gray-50 min-h-[140px] bg-gray-50/20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const dateKey = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(day)}`;
                const eventsForDay = monthEvents.filter((event) => event.date === dateKey);

                return (
                  <div key={dateKey} className="group relative p-3 border-r border-b border-gray-50 min-h-[140px] transition-colors hover:bg-gray-50/50">
                    <span className="text-[11px] font-black text-gray-300 group-hover:text-gray-500 transition-colors">{pad(day)}</span>
                    <div className="mt-3 space-y-2">
                      {eventsForDay.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setViewingEvent(event)}
                          className={`w-full rounded-r-lg border-l-2 p-2 text-left ${colorClasses[event.color] || colorClasses.blue}`}
                        >
                          <p className="text-[9px] font-black uppercase leading-tight truncate">{event.title}</p>
                          <div className="flex items-center text-[7px] font-bold mt-1 uppercase opacity-70">
                            <Clock className="h-2 w-2 mr-1" /> {event.time}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthEvents.map((event) => (
                <button key={event.id} onClick={() => setViewingEvent(event)} className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-black text-gray-800">{event.title}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{event.date} at {event.time}</div>
                  </div>
                  <Eye className="h-4 w-4 text-gray-400" />
                </button>
              ))}
              {monthEvents.length === 0 && (
                <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">No events match the current view</div>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title="Add Event" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Event title" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="date" value={eventForm.date} onChange={(event) => setEventForm((prev) => ({ ...prev, date: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" />
            <input required value={eventForm.time} onChange={(event) => setEventForm((prev) => ({ ...prev, time: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="09:00 AM" />
            <input required value={eventForm.employee} onChange={(event) => setEventForm((prev) => ({ ...prev, employee: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Employee" />
            <input required value={eventForm.client} onChange={(event) => setEventForm((prev) => ({ ...prev, client: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Client" />
            <select value={eventForm.category} onChange={(event) => setEventForm((prev) => ({ ...prev, category: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold">
              <option>Meeting</option>
              <option>Client</option>
              <option>Holiday</option>
              <option>Milestone</option>
            </select>
            <input value={eventForm.location} onChange={(event) => setEventForm((prev) => ({ ...prev, location: event.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold" placeholder="Location" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={() => setIsEditorOpen(false)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white h-11 text-[10px] font-black uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save Event</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingEvent} onClose={() => setViewingEvent(null)} title="Event Details" size="md">
        {viewingEvent && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Event</div><div className="mt-1 font-bold text-gray-700">{viewingEvent.title}</div></div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Date</div><div className="mt-1 font-bold text-gray-700">{viewingEvent.date}</div></div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Time</div><div className="mt-1 font-bold text-gray-700">{viewingEvent.time}</div></div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Owner</div><div className="mt-1 font-bold text-gray-700">{viewingEvent.employee}</div></div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Client</div><div className="mt-1 font-bold text-gray-700">{viewingEvent.client}</div></div>
              <div className="rounded border border-gray-100 bg-gray-50 p-3"><div className="text-[9px] font-black uppercase tracking-widest text-gray-400">Location</div><div className="mt-1 font-bold text-gray-700"><MapPin className="mr-1 inline h-3 w-3" />{viewingEvent.location}</div></div>
            </div>
            {canManageEvents && (
              <Button onClick={() => deleteEvent(viewingEvent.id)} className="w-full bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Event
              </Button>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
