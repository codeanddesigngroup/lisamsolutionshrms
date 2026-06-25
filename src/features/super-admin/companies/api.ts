import api from "@/lib/api";
import type { LoginResponse } from "@/lib/auth-contract";
import type { Company, CompanyFormState, CreateCompanyAdminPayload } from "./types";

export const fetchCompanies = async () => {
  const response = await api.get("/companies");
  return (response.data.data || []) as Company[];
};

export const updateCompany = async (companyId: number | string, payload: CompanyFormState) => {
  const response = await api.put(`/companies/${companyId}`, payload);
  return response.data.data as Company | undefined;
};

export const deleteCompany = async (companyId: number | string) => {
  await api.delete(`/companies/${companyId}`);
};

export const loginAsCompany = async (companyId: number | string) => {
  const response = await api.post<{ data: LoginResponse }>(`/companies/${companyId}/login`);
  return response.data.data;
};

export const createCompanyWithAdmin = async (payload: CreateCompanyAdminPayload) => {
  const response = await api.post("/companies", payload.company);
  return response.data.data as Company | undefined;
};
