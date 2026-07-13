export type InvoiceStatus = "paid" | "pending" | "unpaid";

export type Invoice = {
  id: number;
  company: string;
  package: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
};
