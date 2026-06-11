"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { defaultInvoices } from "./data";
import type { Invoice, InvoiceStatus } from "./types";

export type InvoiceStatusFilter = InvoiceStatus | "all";

export const useInvoices = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setInvoices(defaultInvoices);
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = companySearch.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesCompany = !normalizedSearch || invoice.company.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      return matchesCompany && matchesStatus;
    });
  }, [companySearch, invoices, statusFilter]);

  const resetFilters = () => {
    setCompanySearch("");
    setStatusFilter("all");
  };

  const handleDownload = (invoice: Invoice) => {
    showToast(`Invoice download for ${invoice.company} will connect to the backend invoice endpoint.`, "error");
  };

  return {
    loading,
    companySearch,
    statusFilter,
    filteredInvoices,
    setCompanySearch,
    setStatusFilter,
    resetFilters,
    handleDownload,
  };
};
