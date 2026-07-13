"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { CompaniesFilters } from "./components/CompaniesFilters";
import { CompaniesHeader } from "./components/CompaniesHeader";
import { CompaniesTable } from "./components/CompaniesTable";
import { DeleteCompanyModal } from "./components/DeleteCompanyModal";
import { EditCompanyModal } from "./components/EditCompanyModal";
import { useCompanies } from "./useCompanies";

export default function CompaniesPage() {
  const companies = useCompanies();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CompaniesHeader total={companies.companies.length} />
        <CompaniesFilters
          search={companies.search}
          statusFilter={companies.statusFilter}
          onSearchChange={companies.setSearch}
          onStatusFilterChange={companies.setStatusFilter}
          onReset={companies.resetFilters}
        />
        <CompaniesTable
          companies={companies.filteredCompanies}
          loading={companies.loading}
          impersonatingCompanyId={companies.impersonatingCompanyId}
          onLoginAsCompany={companies.handleLoginAsCompany}
          onEdit={companies.openCompanyEditor}
          onDelete={companies.setDeletingCompanyId}
        />
      </div>

      <DeleteCompanyModal
        isOpen={!!companies.deletingCompanyId}
        onClose={() => companies.setDeletingCompanyId(null)}
        onConfirm={companies.handleDelete}
      />

      <EditCompanyModal
        company={companies.editingCompany}
        form={companies.companyForm}
        setForm={companies.setCompanyForm}
        onClose={() => companies.setEditingCompany(null)}
        onSubmit={companies.handleCompanyUpdate}
      />
    </DashboardLayout>
  );
}
