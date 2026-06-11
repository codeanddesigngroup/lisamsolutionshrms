"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AdminEditModal } from "./components/AdminEditModal";
import { AdminFilters } from "./components/AdminFilters";
import { AdminsHeader } from "./components/AdminsHeader";
import { AdminStatsCards } from "./components/AdminStatsCards";
import { AdminsTable } from "./components/AdminsTable";
import { DeleteAdminModal } from "./components/DeleteAdminModal";
import { useSuperAdminAdmins } from "./useSuperAdminAdmins";

export default function SuperAdminAdminsPage() {
  const admins = useSuperAdminAdmins();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminsHeader />
        <AdminStatsCards stats={admins.stats} />
        <AdminFilters
          loading={admins.loading}
          companies={admins.companies}
          search={admins.search}
          companyFilter={admins.companyFilter}
          statusFilter={admins.statusFilter}
          onSearchChange={admins.setSearch}
          onCompanyFilterChange={admins.setCompanyFilter}
          onStatusFilterChange={admins.setStatusFilter}
          onRefresh={admins.fetchData}
          onReset={admins.resetFilters}
        />
        <AdminsTable
          admins={admins.filteredAdmins}
          loading={admins.loading}
          companyMap={admins.companyMap}
          onStatusToggle={admins.handleStatusToggle}
          onEdit={admins.openEditForm}
          onDelete={admins.setDeletingAdmin}
        />
      </div>

      <AdminEditModal
        isOpen={admins.formOpen}
        saving={admins.saving}
        form={admins.form}
        selectedCompanyName={admins.selectedCompanyName}
        showPassword={admins.showPassword}
        visiblePasswordError={admins.visiblePasswordError}
        passwordValidationMessage={admins.passwordValidationMessage}
        onClose={admins.closeEditForm}
        onSubmit={admins.handleSave}
        setForm={admins.setForm}
        setShowPassword={admins.setShowPassword}
        setPasswordTouched={admins.setPasswordTouched}
      />

      <DeleteAdminModal
        admin={admins.deletingAdmin}
        onClose={() => admins.setDeletingAdmin(null)}
        onConfirm={admins.handleDelete}
      />
    </DashboardLayout>
  );
}
