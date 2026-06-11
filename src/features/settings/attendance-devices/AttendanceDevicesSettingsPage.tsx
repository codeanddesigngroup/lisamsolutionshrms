"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DeviceTable from "@/components/attendance/devices/DeviceTable";
import AddDeviceModal from "@/components/attendance/devices/AddDeviceModal";
import { Plus, Cpu, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCallback, useEffect, useState } from "react";
import { AttendanceDevice, devicesService } from "@/services/attendance/devices.service";

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await devicesService.listDevices();
      // For mock: if response empty, provide defaults
      setDevices(response.data.length ? response.data : [
        { id: 1, name: "Front Gate (MB460)", serial_number: "ZK-MB460-9901", ip_address: "192.168.1.50", status: "online", last_sync_at: new Date().toISOString(), location: "Main Entrance" },
        { id: 2, name: "Production Floor", serial_number: "ZK-F22-8822", ip_address: "192.168.1.55", status: "offline", last_sync_at: new Date(Date.now() - 86400000).toISOString(), location: "Sector B" }
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDevices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDevices]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="white-box flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Attendance Devices</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest">Settings / Biometric Infrastructure</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={fetchDevices} className="btn-default">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
             </Button>
             <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Device
             </Button>
          </div>
        </div>

        <AddDeviceModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchDevices} 
        />

        {/* Device Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="white-box p-6 border-l-4 border-primary">
            <div className="text-3xl font-black text-gray-800">{devices.length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Total Registered</div>
          </div>
          <div className="white-box p-6 border-l-4 border-success">
            <div className="text-3xl font-black text-success">{devices.filter(d => d.status === 'online').length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Online Devices</div>
          </div>
          <div className="white-box p-6 border-l-4 border-danger">
            <div className="text-3xl font-black text-danger">{devices.filter(d => d.status === 'offline').length}</div>
            <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Offline Devices</div>
          </div>
        </div>

        {/* Table Section */}
        <div className="white-box p-0 overflow-hidden relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Pinging infrastructure...</p>
            </div>
          )}
          <DeviceTable devices={devices} onActionComplete={fetchDevices} />
        </div>
      </div>
    </DashboardLayout>
  );
}
