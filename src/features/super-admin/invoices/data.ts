import type { Invoice } from "./types";

export const defaultInvoices: Invoice[] = [
  { id: 1, company: "Lisam Solutions", package: "Enterprise", amount: 999, status: "paid", date: "2024-05-01" },
  { id: 2, company: "Tech Prodigy", package: "Professional", amount: 199, status: "paid", date: "2024-04-28" },
  { id: 3, company: "Global HR", package: "Basic", amount: 49, status: "pending", date: "2024-05-05" },
];
