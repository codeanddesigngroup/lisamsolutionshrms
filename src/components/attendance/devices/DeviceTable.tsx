"use client";

import { AttendanceDevice } from "@/services/attendance/devices.service";
import DeviceStatusBadge from "./DeviceStatusBadge";
import DeviceActions from "./DeviceActions";

interface DeviceTableProps {
  devices: AttendanceDevice[];
  onActionComplete: () => void;
}

export default function DeviceTable({ devices, onActionComplete }: DeviceTableProps) {
  return (
    <div className="table-responsive">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Device Details</th>
            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Serial / IP</th>
            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Last Sync</th>
            <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {devices.map((device) => (
            <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-bold text-gray-800">{device.name}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{device.location || "N/A"}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-xs font-medium text-gray-600">{device.serial_number}</div>
                <div className="text-[10px] text-primary">{device.ip_address}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <DeviceStatusBadge status={device.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                {new Date(device.last_sync_at).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-center">
                <DeviceActions deviceId={device.id} onComplete={onActionComplete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
