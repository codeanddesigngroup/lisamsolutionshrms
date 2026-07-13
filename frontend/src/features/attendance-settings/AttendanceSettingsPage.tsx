"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Clock,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type AttendanceSettingsForm = {
  id: number | string;
  office_start_time: string;
  office_end_time: string;
  halfday_mark_time: string;
  late_mark_duration: string;
  clockin_in_day: string;
  employee_clock_in_out: boolean;
  office_open_days: number[];
  radius_check: boolean;
  radius: string;
  ip_check: boolean;
  ip_address: string[];
  alert_after_status: boolean;
  alert_after: string;
};

type AttendanceSettingsPayload = Partial<
  Omit<AttendanceSettingsForm, "employee_clock_in_out" | "radius_check" | "ip_check" | "alert_after_status">
> & {
  employee_clock_in_out?: "yes" | "no";
  radius_check?: "yes" | "no";
  ip_check?: "yes" | "no";
  alert_after_status?: 0 | 1 | boolean | "on" | "off";
  office_open_days?: number[] | string;
  ip_address?: string[] | string | null;
  ip?: string[];
};

const defaultSettings: AttendanceSettingsForm = {
  id: 1,
  office_start_time: "09:00",
  office_end_time: "18:00",
  halfday_mark_time: "13:00",
  late_mark_duration: "15",
  clockin_in_day: "1",
  employee_clock_in_out: true,
  office_open_days: [1, 2, 3, 4, 5],
  radius_check: false,
  radius: "100",
  ip_check: false,
  ip_address: [""],
  alert_after_status: true,
  alert_after: "30",
};

const weekDays = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 },
];

function parseArray(value: unknown, fallback: unknown[] = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizeTime(value: unknown, fallback: string) {
  const raw = String(value || fallback);
  return raw.slice(0, 5);
}

function normalizeSettings(record?: AttendanceSettingsPayload | null): AttendanceSettingsForm {
  if (!record) return defaultSettings;

  const openDays = parseArray(record.office_open_days, defaultSettings.office_open_days)
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const ipAddresses = parseArray(record.ip_address ?? record.ip, [""])
    .map((ip) => String(ip))
    .filter((ip) => ip.trim().length > 0);

  return {
    id: record.id || defaultSettings.id,
    office_start_time: normalizeTime(record.office_start_time, defaultSettings.office_start_time),
    office_end_time: normalizeTime(record.office_end_time, defaultSettings.office_end_time),
    halfday_mark_time: normalizeTime(record.halfday_mark_time, defaultSettings.halfday_mark_time),
    late_mark_duration: String(record.late_mark_duration ?? defaultSettings.late_mark_duration),
    clockin_in_day: String(record.clockin_in_day ?? defaultSettings.clockin_in_day),
    employee_clock_in_out: record.employee_clock_in_out !== "no",
    office_open_days: openDays.length > 0 ? openDays : defaultSettings.office_open_days,
    radius_check: record.radius_check === "yes",
    radius: String(record.radius ?? defaultSettings.radius),
    ip_check: record.ip_check === "yes",
    ip_address: ipAddresses.length > 0 ? ipAddresses : [""],
    alert_after_status: record.alert_after_status === "on" || record.alert_after_status === 1 || record.alert_after_status === true,
    alert_after: String(record.alert_after ?? defaultSettings.alert_after),
  };
}

export default function AttendanceSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AttendanceSettingsForm>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/attendance-settings");
      const records = response.data.data;
      const record = Array.isArray(records) ? records[0] : records;
      setSettings(normalizeSettings(record));
    } catch (error) {
      console.error("Fetch Attendance Settings Error:", error);
      setSettings(defaultSettings);
      showToast("Using local attendance settings until the PHP endpoint is ready.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  const updateField = <K extends keyof AttendanceSettingsForm>(field: K, value: AttendanceSettingsForm[K]) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const toggleOpenDay = (day: number) => {
    setSettings((current) => {
      const exists = current.office_open_days.includes(day);
      const office_open_days = exists
        ? current.office_open_days.filter((item) => item !== day)
        : [...current.office_open_days, day].sort((a, b) => a - b);
      return { ...current, office_open_days };
    });
  };

  const updateIpAddress = (index: number, value: string) => {
    setSettings((current) => ({
      ...current,
      ip_address: current.ip_address.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const addIpAddress = () => {
    setSettings((current) => ({ ...current, ip_address: [...current.ip_address, ""] }));
  };

  const removeIpAddress = (index: number) => {
    setSettings((current) => ({
      ...current,
      ip_address: current.ip_address.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanIps = settings.ip_address.map((ip) => ip.trim()).filter(Boolean);

    if (settings.office_open_days.length === 0) {
      showToast("Select at least one office open day.", "error");
      return;
    }

    if (settings.ip_check && cleanIps.length === 0) {
      showToast("Add at least one allowed IP address or turn off IP checks.", "error");
      return;
    }

    if (settings.radius_check && Number(settings.radius) <= 0) {
      showToast("Radius must be greater than zero.", "error");
      return;
    }

    const payload: AttendanceSettingsPayload = {
      office_start_time: settings.office_start_time,
      office_end_time: settings.office_end_time,
      halfday_mark_time: settings.halfday_mark_time,
      late_mark_duration: settings.late_mark_duration,
      clockin_in_day: settings.clockin_in_day,
      employee_clock_in_out: settings.employee_clock_in_out ? "yes" : "no",
      office_open_days: settings.office_open_days,
      radius_check: settings.radius_check ? "yes" : "no",
      radius: settings.radius,
      ip_check: settings.ip_check ? "yes" : "no",
      ip: cleanIps,
      ip_address: cleanIps,
      alert_after_status: settings.alert_after_status ? 1 : 0,
      alert_after: settings.alert_after,
    };

    setSaving(true);
    try {
      await api.put(`/attendance-settings/${settings.id}`, payload);
      setSettings((current) => ({ ...current, ip_address: cleanIps.length > 0 ? cleanIps : [""] }));
      showToast("Attendance settings updated successfully.", "success");
    } catch (error) {
      console.error("Update Attendance Settings Error:", error);
      setSettings((current) => ({ ...current, ...normalizeSettings({ ...payload, id: current.id }) }));
      showToast("Attendance settings saved locally until the PHP endpoint is ready.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-6 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0">
              <Settings className="mr-2 inline-block h-5 w-5 text-primary" />
              Attendance Settings
            </h4>
          </div>
          <div className="col-lg-6 col-sm-8 col-md-8 col-xs-12 flex justify-end">
            <ol className="breadcrumb">
              <li><Link href="/dashboard">Home</Link></li>
              <li className="active">Attendance Settings</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-none bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Attendance Policy</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Office timing, employee self clock-in, and validation rules
                </p>
              </div>
              <Button type="button" onClick={fetchSettings} className="h-10 border-none bg-gray-50 px-5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Office Start Time</span>
                <input type="time" value={settings.office_start_time} onChange={(event) => updateField("office_start_time", event.target.value)} className="form-control" />
              </label>
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Office End Time</span>
                <input type="time" value={settings.office_end_time} onChange={(event) => updateField("office_end_time", event.target.value)} className="form-control" />
              </label>
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Half Day Mark Time</span>
                <input type="time" value={settings.halfday_mark_time} onChange={(event) => updateField("halfday_mark_time", event.target.value)} className="form-control" />
              </label>
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Late Mark Minutes</span>
                <input type="number" min="0" value={settings.late_mark_duration} onChange={(event) => updateField("late_mark_duration", event.target.value)} className="form-control" />
              </label>
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Check-ins Per Day</span>
                <input type="number" min="1" value={settings.clockin_in_day} onChange={(event) => updateField("clockin_in_day", event.target.value)} className="form-control" />
              </label>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Office Open Days</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {weekDays.map((day) => (
                  <label key={day.value} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">{day.label}</span>
                    <input
                      type="checkbox"
                      checked={settings.office_open_days.includes(day.value)}
                      onChange={() => toggleOpenDay(day.value)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
              </div>
            </Card>

            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Employee Clock-in</h3>
              </div>
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">Allow self attendance</span>
                  <input
                    type="checkbox"
                    checked={settings.employee_clock_in_out}
                    onChange={(event) => updateField("employee_clock_in_out", event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Check location radius
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.radius_check}
                    onChange={(event) => updateField("radius_check", event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>

                {settings.radius_check && (
                  <label className="block space-y-2 pl-1">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Allowed Radius In Meters</span>
                    <input type="number" min="1" value={settings.radius} onChange={(event) => updateField("radius", event.target.value)} className="form-control" />
                  </label>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Network className="h-5 w-5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Allowed IP Rules</h3>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Enabled
                  <input
                    type="checkbox"
                    checked={settings.ip_check}
                    onChange={(event) => updateField("ip_check", event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </div>

              {settings.ip_check ? (
                <div className="space-y-3">
                  {settings.ip_address.map((ip, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        value={ip}
                        onChange={(event) => updateIpAddress(index, event.target.value)}
                        className="form-control"
                        placeholder="192.168.1.1"
                      />
                      <button
                        type="button"
                        onClick={() => removeIpAddress(index)}
                        disabled={settings.ip_address.length === 1}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-300"
                        aria-label="Remove IP address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" onClick={addIpAddress} className="h-10 border-none bg-gray-50 px-5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <Plus className="h-4 w-4" />
                    Add IP
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  IP validation is disabled for employee clock-in.
                </div>
              )}
            </Card>

            <Card className="border-none bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800">Attendance Reminder</h3>
              </div>
              <div className="space-y-4">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">Reminder status</span>
                  <input
                    type="checkbox"
                    checked={settings.alert_after_status}
                    onChange={(event) => updateField("alert_after_status", event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
                {settings.alert_after_status && (
                  <label className="block space-y-2">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Reminder After Minutes</span>
                    <input type="number" min="1" value={settings.alert_after} onChange={(event) => updateField("alert_after", event.target.value)} className="form-control" />
                  </label>
                )}
              </div>
            </Card>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <Button type="submit" disabled={saving || loading} className="h-12 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Updating..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
