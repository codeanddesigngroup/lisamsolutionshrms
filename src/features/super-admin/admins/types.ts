import type { PermissionKey } from "@/lib/auth-contract";

export type Company = {
  id: number | string;
  name?: string;
  company_name?: string;
  status?: string;
};

export type AdminAccount = {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role: "admin";
  company_id: number | string;
  company?: Company;
  status: "active" | "inactive";
  permissions: PermissionKey[];
  modules?: string[];
  last_login_at?: string | null;
  created_at?: string;
};

export type AdminFormState = {
  name: string;
  email: string;
  password: string;
  company_id: string;
  status: AdminAccount["status"];
  permissions: PermissionKey[];
};

export type AdminStats = {
  total: number;
  active: number;
  companies: number;
  restricted: number;
};

export type AdminSavePayload = {
  name: string;
  email: string;
  password?: string;
  role: "admin";
  company_id: string;
  status: AdminAccount["status"];
  permissions: PermissionKey[];
  modules: string[];
};
