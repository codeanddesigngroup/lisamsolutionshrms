"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { InvoicesFilters } from "./components/InvoicesFilters";
import { InvoicesHeader } from "./components/InvoicesHeader";
import { InvoicesTable } from "./components/InvoicesTable";
import { useInvoices } from "./useInvoices";

export default function SuperAdminInvoicesPage() {
  const invoices = useInvoices();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <InvoicesHeader />
        <InvoicesFilters
          companySearch={invoices.companySearch}
          statusFilter={invoices.statusFilter}
          onCompanySearchChange={invoices.setCompanySearch}
          onStatusFilterChange={invoices.setStatusFilter}
          onReset={invoices.resetFilters}
        />
        <InvoicesTable invoices={invoices.filteredInvoices} loading={invoices.loading} onDownload={invoices.handleDownload} />
      </div>
    </DashboardLayout>
  );
}
