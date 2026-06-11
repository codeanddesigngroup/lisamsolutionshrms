import { useEffect, useState } from "react";
import socket from "./socket";

export type AttendanceScanEvent = {
  employeeId: string | number;
  employeeName: string;
  employeeImage?: string;
  deviceLocation: string;
  timestamp: string;
  type: "check_in" | "check_out";
};

export type DeviceStatusEvent = {
  deviceId: string | number;
  status: "online" | "offline";
};

/**
 * Hook to listen for live attendance scans (Stateful version)
 */
export function useAttendanceEvents() {
  const [latestScan, setLatestScan] = useState<AttendanceScanEvent | null>(null);
  const [sessionStats, setSessionStats] = useState({ clockIns: 0, clockOuts: 0 });

  useEffect(() => {
    const handler = (event: AttendanceScanEvent) => {
      setLatestScan(event);
      setSessionStats(prev => ({
        clockIns: prev.clockIns + (event.type === 'check_in' ? 1 : 0),
        clockOuts: prev.clockOuts + (event.type === 'check_out' ? 1 : 0),
      }));
    };

    socket.on("attendance.scanned", handler);
    return () => socket.off("attendance.scanned", handler);
  }, []);

  return { latestScan, sessionStats };
}

/**
 * Hook to listen for live attendance scans (Callback version)
 */
export function useAttendanceScanListener(onScan: (event: AttendanceScanEvent) => void) {
  useEffect(() => {
    socket.on("attendance.scanned", onScan);
    return () => socket.off("attendance.scanned", onScan);
  }, [onScan]);
}

/**
 * Hook to listen for device status changes
 */
export function useDeviceStatusEvents(onChange: (event: DeviceStatusEvent) => void) {
  useEffect(() => {
    socket.on("device.status.changed", onChange);
    return () => socket.off("device.status.changed", onChange);
  }, [onChange]);
}

/**
 * For development: Simulate a scan event
 */
export function simulateScan() {
  const names = ["John Doe", "Jane Smith", "Mike Tyson", "Sarah Wilson"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  
  socket.simulate("attendance.scanned", {
    employeeId: Math.floor(Math.random() * 1000),
    employeeName: randomName,
    deviceLocation: "Main Entrance Gateway",
    timestamp: new Date().toISOString(),
    type: Math.random() > 0.5 ? "check_in" : "check_out"
  });
}
