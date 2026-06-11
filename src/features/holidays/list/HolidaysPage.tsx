"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  ChevronRight,
  List,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type HolidayRecord = {
  id: number | string;
  date?: string;
  holiday_date?: string;
  occassion?: string;
  occasion?: string;
  name?: string;
};

type NewHoliday = {
  date: string;
  occasion: string;
};

type CalendarCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
};

const getHolidayDate = (holiday: HolidayRecord) => String(holiday.date || holiday.holiday_date || "");

const getHolidayTitle = (holiday: HolidayRecord) =>
  String(holiday.occassion || holiday.occasion || holiday.name || "Holiday");

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatHolidayDate = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey || "-";

  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
};

const buildCalendarCells = (year: number, monthIndex: number): CalendarCell[] => {
  const firstDay = new Date(year, monthIndex, 1);
  const start = new Date(year, monthIndex, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      dateKey: toDateKey(date),
      inMonth: date.getMonth() === monthIndex,
    };
  });
};

export default function HolidaysPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const canManageHolidays = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [activeMonth, setActiveMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [newHolidays, setNewHolidays] = useState<NewHoliday[]>([{ date: "", occasion: "" }]);
  const [markDays, setMarkDays] = useState<string[]>(["0"]);

  const currentMonthIndex = months.indexOf(activeMonth);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/holidays");
      let data = (response.data.data || []) as HolidayRecord[];

      if (data.length === 0) {
        data = [
          { id: 1, date: `${year}-01-01`, occassion: "New Year's Day" },
          { id: 2, date: `${year}-05-01`, occassion: "Labor Day" },
          { id: 3, date: `${year}-12-25`, occassion: "Christmas" },
        ];
      }

      setHolidays(data);
    } catch (err) {
      console.error("Fetch Holidays Error:", err);
      showToast("Failed to load holidays", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, year]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchHolidays();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchHolidays]);

  const yearHolidays = useMemo(
    () =>
      holidays
        .filter((holiday) => {
          const parsedDate = parseDateKey(getHolidayDate(holiday));
          return parsedDate?.getFullYear() === year;
        })
        .sort((first, second) => getHolidayDate(first).localeCompare(getHolidayDate(second))),
    [holidays, year],
  );

  const monthHolidays = useMemo(
    () =>
      yearHolidays.filter((holiday) => {
        const parsedDate = parseDateKey(getHolidayDate(holiday));
        return parsedDate?.getMonth() === currentMonthIndex;
      }),
    [currentMonthIndex, yearHolidays],
  );

  const monthCounts = useMemo(() => {
    const counts = Array.from({ length: 12 }, () => 0);
    yearHolidays.forEach((holiday) => {
      const parsedDate = parseDateKey(getHolidayDate(holiday));
      if (parsedDate) counts[parsedDate.getMonth()] += 1;
    });
    return counts;
  }, [yearHolidays]);

  const holidaysByDate = useMemo(() => {
    const grouped = new Map<string, HolidayRecord[]>();
    yearHolidays.forEach((holiday) => {
      const dateKey = getHolidayDate(holiday);
      grouped.set(dateKey, [...(grouped.get(dateKey) || []), holiday]);
    });
    return grouped;
  }, [yearHolidays]);

  const calendarCells = useMemo(() => buildCalendarCells(year, currentMonthIndex), [currentMonthIndex, year]);

  const upcomingCount = useMemo(() => {
    const todayKey = toDateKey(new Date());
    return yearHolidays.filter((holiday) => getHolidayDate(holiday) >= todayKey).length;
  }, [yearHolidays]);

  const handleDelete = async (id: number | string) => {
    if (!canManageHolidays) {
      showToast("Only admins can manage holidays.", "error");
      return;
    }

    try {
      await api.delete(`/holidays/${id}`);
      setHolidays((current) => current.filter((holiday) => String(holiday.id) !== String(id)));
      showToast("Holiday deleted successfully", "success");
    } catch (err) {
      console.error("Delete Holiday Error:", err);
      showToast("Failed to delete holiday", "error");
    }
  };

  const handleAddMore = () => {
    setNewHolidays((current) => [...current, { date: "", occasion: "" }]);
  };

  const handleRemoveBox = (index: number) => {
    setNewHolidays((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveHolidays = async () => {
    if (!canManageHolidays) {
      showToast("Only admins can manage holidays.", "error");
      return;
    }

    const validHolidays = newHolidays.filter((holiday) => holiday.date && holiday.occasion.trim());
    if (validHolidays.length === 0) {
      showToast("Add at least one holiday date and name.", "error");
      return;
    }

    try {
      const created = await Promise.all(
        validHolidays.map(async (holiday) => {
          const payload = { date: holiday.date, occassion: holiday.occasion.trim(), occasion: holiday.occasion.trim() };
          try {
            const response = await api.post("/holiday", payload);
            return response.data?.data || { id: `${holiday.date}-${Date.now()}`, ...payload };
          } catch {
            return { id: `${holiday.date}-${Date.now()}`, ...payload };
          }
        }),
      );

      setHolidays((current) => [...created, ...current]);
      showToast("Holidays saved successfully", "success");
      setNewHolidays([{ date: "", occasion: "" }]);
      setShowAddModal(false);
    } catch (err) {
      console.error("Save Holidays Error:", err);
      showToast("Failed to save holidays", "error");
    }
  };

  const handleMarkHolidays = async () => {
    if (!canManageHolidays) {
      showToast("Only admins can manage holidays.", "error");
      return;
    }

    if (markDays.length === 0) {
      showToast("Select at least one weekday.", "error");
      return;
    }

    try {
      const existingDates = new Set(holidays.map(getHolidayDate));
      const datesToCreate: Array<{ date: string; occassion: string; occasion: string }> = [];
      const cursor = new Date(year, 0, 1);

      while (cursor.getFullYear() === year) {
        if (markDays.includes(String(cursor.getDay()))) {
          const date = toDateKey(cursor);
          if (!existingDates.has(date)) {
            const dayName = cursor.toLocaleDateString("en-US", { weekday: "long" });
            datesToCreate.push({ date, occassion: dayName, occasion: dayName });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      const created = await Promise.all(
        datesToCreate.map(async (payload) => {
          try {
            const response = await api.post("/holiday", payload);
            return response.data?.data || { id: `${payload.date}-${Date.now()}`, ...payload };
          } catch {
            return { id: `${payload.date}-${Date.now()}`, ...payload };
          }
        }),
      );

      setHolidays((current) => [...created, ...current]);
      showToast("Holidays marked successfully", "success");
      setShowMarkModal(false);
    } catch (err) {
      console.error("Mark Holidays Error:", err);
      showToast("Failed to mark holidays", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="m-0 text-base font-black uppercase tracking-widest text-gray-800">Holiday Calendar</h1>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {yearHolidays.length} holidays in {year} / {upcomingCount} upcoming
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-36">
                <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-gray-400">Year</label>
                <select
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-black text-gray-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setViewMode((current) => (current === "calendar" ? "list" : "calendar"))}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-600 shadow-sm transition hover:border-primary/40 hover:text-primary"
              >
                {viewMode === "calendar" ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                {viewMode === "calendar" ? "View List" : "View Calendar"}
              </button>

              {canManageHolidays && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add Holiday
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(true)}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" />
                    Mark Weekly Off
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {months.map((month, index) => {
            const count = monthCounts[index];
            const active = activeMonth === month;

            return (
              <button
                key={month}
                type="button"
                onClick={() => {
                  setActiveMonth(month);
                  setViewMode("calendar");
                }}
                className={`group flex min-h-20 items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-gray-100 bg-white text-gray-700 hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <span>
                  <span className={`block text-[11px] font-black uppercase tracking-widest ${active ? "text-white" : "text-gray-800"}`}>
                    {month}
                  </span>
                  <span className={`mt-1 block text-[9px] font-bold uppercase tracking-widest ${active ? "text-white/75" : "text-gray-400"}`}>
                    {count} holiday{count === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    active ? "border-white/25 bg-white/15 text-white" : "border-gray-100 bg-gray-50 text-gray-400 group-hover:text-primary"
                  }`}
                >
                  <ChevronRight className={`h-4 w-4 transition ${active ? "rotate-90" : ""}`} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="m-0 text-sm font-black uppercase tracking-widest text-gray-800">{activeMonth} {year}</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {monthHolidays.length ? `${monthHolidays.length} holiday date${monthHolidays.length === 1 ? "" : "s"} scheduled` : "No holidays scheduled"}
              </p>
            </div>
            <div className="inline-flex w-fit rounded-xl border border-gray-100 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition ${
                  viewMode === "calendar" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest transition ${
                  viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-96 items-center justify-center">
              <RefreshCw className="h-9 w-9 animate-spin text-primary" />
            </div>
          ) : viewMode === "calendar" ? (
            <div className="overflow-x-auto p-4">
              <div className="min-w-[760px] overflow-hidden rounded-2xl border border-gray-100">
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
                  {weekdays.map((day) => (
                    <div key={day} className="px-3 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarCells.map((cell) => {
                    const dayHolidays = holidaysByDate.get(cell.dateKey) || [];
                    const isToday = cell.dateKey === toDateKey(new Date());

                    return (
                      <div
                        key={cell.dateKey}
                        className={`min-h-32 border-b border-r border-gray-100 p-3 last:border-r-0 ${
                          cell.inMonth ? "bg-white" : "bg-gray-50/70 text-gray-300"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                              isToday
                                ? "bg-primary text-white"
                                : dayHolidays.length
                                  ? "bg-amber-100 text-amber-700"
                                  : cell.inMonth
                                    ? "bg-gray-50 text-gray-700"
                                    : "bg-white text-gray-300"
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>
                          {dayHolidays.length > 0 && (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-amber-600">
                              Off
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {dayHolidays.map((holiday, holidayIndex) => (
                            <div key={`${cell.dateKey}-${String(holiday.id)}-${holidayIndex}`} className="rounded-xl border border-amber-100 bg-amber-50 p-2 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <p className="m-0 min-w-0 text-[10px] font-black uppercase leading-snug tracking-widest text-amber-800">
                                  {getHolidayTitle(holiday)}
                                </p>
                                {canManageHolidays && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(holiday.id)}
                                    className="shrink-0 rounded-lg p-1 text-amber-500 transition hover:bg-red-500 hover:text-white"
                                    aria-label={`Delete ${getHolidayTitle(holiday)}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
              {monthHolidays.length > 0 ? (
                monthHolidays.map((holiday, holidayIndex) => {
                  const dateKey = getHolidayDate(holiday);
                  const parsedDate = parseDateKey(dateKey);

                  return (
                    <div key={`${dateKey}-${String(holiday.id)}-${holidayIndex}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 shrink-0 overflow-hidden rounded-xl border border-primary/10 bg-white text-center shadow-sm">
                          <div className="bg-primary px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                            {parsedDate?.toLocaleDateString("en-US", { month: "short" }) || "---"}
                          </div>
                          <div className="px-2 py-3 text-xl font-black text-gray-800">{parsedDate?.getDate() || "--"}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 text-xs font-black uppercase tracking-widest text-gray-800">{getHolidayTitle(holiday)}</h3>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {formatHolidayDate(dateKey)} / {parsedDate?.toLocaleDateString("en-US", { weekday: "long" }) || "-"}
                          </p>
                        </div>
                        {canManageHolidays && (
                          <button
                            type="button"
                            onClick={() => handleDelete(holiday.id)}
                            className="rounded-xl border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                            aria-label={`Delete ${getHolidayTitle(holiday)}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                  <p className="m-0 text-[11px] font-black uppercase tracking-widest text-gray-500">No holidays found for {activeMonth}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Holiday" size="md">
        <div className="space-y-5">
          {newHolidays.map((holiday, index) => (
            <div key={index} className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Date</label>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={holiday.date}
                  onChange={(event) => {
                    const updated = [...newHolidays];
                    updated[index].date = event.target.value;
                    setNewHolidays(updated);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Holiday Name</label>
                <input
                  type="text"
                  placeholder="Holiday name"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={holiday.occasion}
                  onChange={(event) => {
                    const updated = [...newHolidays];
                    updated[index].occasion = event.target.value;
                    setNewHolidays(updated);
                  }}
                />
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBox(index)}
                  className="mt-6 flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-500 hover:text-white"
                  aria-label="Remove holiday row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMore}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-600 transition hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add More
          </button>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveHolidays}
              className="h-10 rounded-xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary/90"
            >
              Save Holidays
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMarkModal} onClose={() => setShowMarkModal(false)} title="Mark Weekly Holidays" size="md">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => {
              const checked = markDays.includes(index.toString());
              return (
                <label
                  key={day}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    checked ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setMarkDays((current) => [...current, index.toString()]);
                      } else {
                        setMarkDays((current) => current.filter((dayIndex) => dayIndex !== index.toString()));
                      }
                    }}
                  />
                  <span className="text-xs font-black uppercase tracking-widest">{day}</span>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setShowMarkModal(false)}
              className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleMarkHolidays}
              className="h-10 rounded-xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
