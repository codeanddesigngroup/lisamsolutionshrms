import type { PermissionKey } from "@/lib/auth-contract";

export type Company = {
  id: number | string;
  name?: string;
  company_name?: string;
  status?: string;
};

export type Role = {
  id: number | string;
  name: string;
};

export type AdminAccount = {
  id: number | string;
  name: string;
  email: string;
  password?: string;
  role: string;
  company_id: number | string;
  role_id?: number | string;
  company?: Company;
  role_record?: Role;
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
  role_id: string;
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
  role?: string;
  role_id?: string;
  company_id: string;
  status: AdminAccount["status"];
  permissions: PermissionKey[];
  modules: string[];
};
