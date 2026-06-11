import type { Company } from "./types";

export const getCompanyName = (company: Company) => company.company_name || company.name || "Unnamed Company";

export const sameCompanyId = (left?: number | string | null, right?: number | string | null) => String(left ?? "") === String(right ?? "");

export const emptyCreateCompanyPayload = {
  company: {
    name: "",
    email: "",
    phone: "",
    website: "",
    status: "active",
  },
  admin: {
    name: "",
    email: "",
    password: "",
    role: "admin" as const,
  },
};
