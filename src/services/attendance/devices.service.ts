import api from "../../lib/api";
import { ApiEnvelope, ApiResource } from "../../lib/api-contract";

export interface AttendanceDevice {
  id: string | number;
  name: string;
  serial_number: string;
  ip_address: string;
  status: "online" | "offline";
  last_sync_at: string;
  location?: string;
}

export const devicesService = {
  /**
   * Fetch all registered biometric devices
   */
  listDevices: async (): Promise<ApiEnvelope<AttendanceDevice[]>> => {
    const response = await api.get<ApiEnvelope<AttendanceDevice[]>>("/v1/attendance-devices");
    return response.data;
  },

  /**
   * Push current employee roster to the device for recognition
   */
  syncEmployeesToDevice: async (deviceId: string | number): Promise<ApiEnvelope<{ success: boolean }>> => {
    const response = await api.post<ApiEnvelope<{ success: boolean }>>(`/v1/attendance-devices/${deviceId}/sync-employees`);
    return response.data;
  },

  /**
   * Send a reboot command to the physical device
   */
  rebootDevice: async (deviceId: string | number): Promise<ApiEnvelope<{ success: boolean }>> => {
    const response = await api.post<ApiEnvelope<{ success: boolean }>>(`/v1/attendance-devices/${deviceId}/reboot`);
    return response.data;
  },

  /**
   * Wipe raw logs from the device storage
   */
  clearDeviceLogs: async (deviceId: string | number): Promise<ApiEnvelope<{ success: boolean }>> => {
    const response = await api.post<ApiEnvelope<{ success: boolean }>>(`/v1/attendance-devices/${deviceId}/clear-logs`);
    return response.data;
  }
};
