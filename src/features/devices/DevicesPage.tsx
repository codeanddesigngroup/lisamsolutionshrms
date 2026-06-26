"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { Activity, Clock, Cpu, Radio, RefreshCw, Users, Wifi } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DeviceRecord = {
  serial: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  punchCount?: number;
  employeeCount?: number;
  companyCount?: number;
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isOnline = (value?: string) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= 24 * 60 * 60 * 1000;
};

export default function DevicesPage() {
  const { showToast } = useToast();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await api.get("/devices");
      setDevices(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Fetch Devices Error:", error);
      showToast("Failed to load attendance devices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const online = devices.filter((device) => isOnline(device.lastSeenAt)).length;
    const punches = devices.reduce((total, device) => total + Number(device.punchCount || 0), 0);
    const employees = devices.reduce((total, device) => total + Number(device.employeeCount || 0), 0);
    return { total: devices.length, online, punches, employees };
  }, [devices]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="white-box flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Attendance Devices</h4>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Machine serials, sync health, and punch activity
              </p>
            </div>
          </div>

          <Button className="btn-default" disabled={loading} onClick={fetchDevices}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Devices</p>
                <h4 className="m-0 mt-2 text-2xl font-black">{stats.total}</h4>
              </div>
              <Radio className="h-6 w-6 text-primary" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Online Today</p>
                <h4 className="m-0 mt-2 text-2xl font-black text-success">{stats.online}</h4>
              </div>
              <Wifi className="h-6 w-6 text-success" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Raw Punches</p>
                <h4 className="m-0 mt-2 text-2xl font-black">{stats.punches}</h4>
              </div>
              <Activity className="h-6 w-6 text-info" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employee Links</p>
                <h4 className="m-0 mt-2 text-2xl font-black">{stats.employees}</h4>
              </div>
              <Users className="h-6 w-6 text-warning" />
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h5 className="m-0 text-[11px] font-black uppercase tracking-widest text-gray-600">Device List</h5>
          </div>
          <div className="table-responsive">
            <table className="min-w-[900px]">
              <thead>
                <tr>
                  <th>Device Serial</th>
                  <th>Status</th>
                  <th>Last Sync</th>
                  <th>First Seen</th>
                  <th>Employees</th>
                  <th>Punches</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading devices</p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  devices.map((device) => {
                    const online = isOnline(device.lastSeenAt);
                    return (
                      <tr key={device.serial}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary/10 text-primary">
                              <Cpu className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="m-0 text-xs font-black text-gray-800">{device.serial}</p>
                              <p className="m-0 mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">ZKTeco / iClock</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`label ${online ? "label-success" : "label-warning"}`}>
                            {online ? "Online" : "Idle"}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {formatDateTime(device.lastSeenAt)}
                          </div>
                        </td>
                        <td className="text-xs font-bold text-gray-600">{formatDateTime(device.firstSeenAt)}</td>
                        <td className="text-xs font-black text-gray-700">{Number(device.employeeCount || 0)}</td>
                        <td className="text-xs font-black text-gray-700">{Number(device.punchCount || 0)}</td>
                      </tr>
                    );
                  })}

                {!loading && devices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No attendance devices have synced yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
