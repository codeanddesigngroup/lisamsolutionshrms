"use client";

import { RefreshCw, Power, Trash2 } from "lucide-react";
import { devicesService } from "@/services/attendance/devices.service";
import { useToast } from "@/context/ToastContext";
import { useState } from "react";

interface DeviceActionsProps {
  deviceId: string | number;
  onComplete: () => void;
}

export default function DeviceActions({ deviceId, onComplete }: DeviceActionsProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(action);
    try {
      await fn();
      showToast(`Device ${action} initiated successfully`, "success");
      onComplete();
    } catch (error) {
      showToast(`Failed to ${action} device`, "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => handleAction("sync", () => devicesService.syncEmployeesToDevice(deviceId))}
        disabled={!!loading}
        className="p-2 text-gray-400 hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
        title="Sync Employees"
      >
        <RefreshCw className={`h-4 w-4 ${loading === "sync" ? "animate-spin" : ""}`} />
      </button>
      
      <button
        onClick={() => handleAction("reboot", () => devicesService.rebootDevice(deviceId))}
        disabled={!!loading}
        className="p-2 text-gray-400 hover:bg-warning/10 hover:text-warning transition-all rounded-lg"
        title="Reboot Device"
      >
        <Power className={`h-4 w-4 ${loading === "reboot" ? "animate-pulse" : ""}`} />
      </button>

      <button
        onClick={() => handleAction("clear", () => devicesService.clearDeviceLogs(deviceId))}
        disabled={!!loading}
        className="p-2 text-gray-400 hover:bg-danger/10 hover:text-danger transition-all rounded-lg"
        title="Clear Logs"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
