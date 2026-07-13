import api from "@/lib/api";
import type { AdminAccount, AdminSavePayload, Company, Role } from "./types";

export const fetchAdminWorkspace = async () => {
  const [adminsResponse, companiesResponse, rolesResponse] = await Promise.all([api.get("/users"), api.get("/companies"), api.get("/roles")]);

  return {
    admins: (adminsResponse.data.data || []) as AdminAccount[],
    companies: (companiesResponse.data.data || []) as Company[],
    roles: (rolesResponse.data.data || []) as Role[],
  };
};

export const updateAdminAccount = async (adminId: number | string, payload: AdminSavePayload) => {
  const response = await api.put(`/admins/${adminId}`, payload);
  return response.data.data as AdminAccount | undefined;
};

export const createAdminAccount = async (payload: AdminSavePayload) => {
  const response = await api.post("/users", payload);
  return response.data.data as AdminAccount | undefined;
};

export const updateAdminStatus = async (admin: AdminAccount, status: AdminAccount["status"]) => {
  const response = await api.put(`/admins/${admin.id}`, { ...admin, status });
  return response.data.data as AdminAccount | undefined;
};

export const deleteAdminAccount = async (adminId: number | string) => {
  await api.delete(`/admins/${adminId}`);
};
