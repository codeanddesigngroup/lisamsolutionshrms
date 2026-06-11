"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { emailPattern, validateAdminPassword } from "@/lib/admin-password";
import { getModulesFromPermissions, rolePermissions } from "@/lib/auth-contract";
import { useToast } from "@/context/ToastContext";
import { deleteAdminAccount, fetchAdminWorkspace, updateAdminAccount, updateAdminStatus } from "./api";
import type { AdminAccount, AdminFormState, Company } from "./types";
import {
  emptyAdminForm,
  getAdminCompanyId,
  getAdminRoleLabel,
  getCompanyName,
  normalizePermissions,
  sameId,
} from "./utils";

export const useSuperAdminAdmins = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AdminFormState>(emptyAdminForm);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const workspace = await fetchAdminWorkspace();
      setAdmins(workspace.admins.map((admin) => ({
        ...admin,
        status: admin.status || "active",
        permissions: normalizePermissions(admin.permissions || []),
      })));
      setCompanies(workspace.companies);
    } catch (error) {
      console.error("Load platform admins failed:", error);
      showToast("Unable to load company admins.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const companyMap = useMemo(() => new Map(companies.map((company) => [String(company.id), company])), [companies]);

  const selectedCompanyName = useMemo(() => {
    const selectedCompany = companyMap.get(form.company_id) || (editingAdmin && sameId(getAdminCompanyId(editingAdmin), form.company_id) ? editingAdmin.company : undefined);
    return getCompanyName(selectedCompany);
  }, [companyMap, editingAdmin, form.company_id]);

  const passwordValidationMessage = useMemo(
    () =>
      validateAdminPassword({
        password: form.password,
        required: false,
        name: form.name,
        email: form.email,
        companyName: selectedCompanyName,
      }),
    [form.email, form.name, form.password, selectedCompanyName],
  );

  const visiblePasswordError = passwordTouched && passwordValidationMessage;

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const company = admin.company || companyMap.get(getAdminCompanyId(admin));
      const text = `${admin.name} ${admin.email} ${getCompanyName(company)} ${getAdminRoleLabel(admin.permissions || [])}`.toLowerCase();
      const searchMatch = !query || text.includes(query);
      const companyMatch = companyFilter === "all" || getAdminCompanyId(admin) === companyFilter;
      const statusMatch = statusFilter === "all" || admin.status === statusFilter;
      return searchMatch && companyMatch && statusMatch;
    });
  }, [admins, companyFilter, companyMap, search, statusFilter]);

  const stats = useMemo(() => {
    const activeAdmins = admins.filter((admin) => admin.status === "active").length;
    const companyIds = new Set(admins.map((admin) => getAdminCompanyId(admin)).filter(Boolean));
    const restrictedAdmins = admins.filter((admin) => !(admin.permissions || []).includes("*") && admin.permissions.length < rolePermissions.admin.length).length;
    return {
      total: admins.length,
      active: activeAdmins,
      companies: companyIds.size,
      restricted: restrictedAdmins,
    };
  }, [admins]);

  const openEditForm = (admin: AdminAccount) => {
    setEditingAdmin(admin);
    setForm({
      name: admin.name || "",
      email: admin.email || "",
      password: String(admin.password || ""),
      company_id: getAdminCompanyId(admin),
      status: admin.status || "active",
      permissions: normalizePermissions(admin.permissions || []),
    });
    setShowPassword(false);
    setPasswordTouched(false);
    setFormOpen(true);
  };

  const closeEditForm = () => {
    setFormOpen(false);
    setEditingAdmin(null);
    setForm(emptyAdminForm);
    setShowPassword(false);
    setPasswordTouched(false);
  };

  const resetFilters = () => {
    setSearch("");
    setCompanyFilter("all");
    setStatusFilter("all");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAdmin) {
      showToast("Admins can only be edited from this panel for now.", "error");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.company_id) {
      showToast("Name, email, and company are required.", "error");
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      showToast("Enter a valid admin email address.", "error");
      return;
    }
    if (passwordValidationMessage) {
      setPasswordTouched(true);
      showToast(passwordValidationMessage, "error");
      return;
    }

    const duplicateEmail = admins.some(
      (admin) => admin.email.toLowerCase() === form.email.trim().toLowerCase() && String(admin.id) !== String(editingAdmin.id),
    );
    if (duplicateEmail) {
      showToast("Another admin already uses this email.", "error");
      return;
    }

    const nextPermissions = normalizePermissions(form.permissions);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim() || undefined,
      role: "admin" as const,
      company_id: form.company_id,
      status: form.status,
      permissions: nextPermissions,
      modules: getModulesFromPermissions(nextPermissions),
    };

    setSaving(true);
    try {
      const updated = await updateAdminAccount(editingAdmin.id, payload);
      setAdmins((current) => current.map((admin) => (sameId(admin.id, editingAdmin.id) ? updated || { ...editingAdmin, ...payload } : admin)));
      showToast("Admin access updated successfully.");
      closeEditForm();
    } catch (error) {
      console.error("Save admin failed:", error);
      showToast("Unable to save admin access.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (admin: AdminAccount) => {
    const nextStatus = admin.status === "active" ? "inactive" : "active";

    try {
      const updated = await updateAdminStatus(admin, nextStatus);
      setAdmins((current) => current.map((item) => (sameId(item.id, admin.id) ? updated || { ...admin, status: nextStatus } : item)));
      showToast(`Admin ${nextStatus === "active" ? "activated" : "deactivated"}.`);
    } catch (error) {
      console.error("Status update failed:", error);
      showToast("Unable to update admin status.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    try {
      await deleteAdminAccount(deletingAdmin.id);
      setAdmins((current) => current.filter((admin) => !sameId(admin.id, deletingAdmin.id)));
      showToast("Admin deleted successfully.");
    } catch (error) {
      console.error("Delete admin failed:", error);
      showToast("Unable to delete admin.", "error");
    } finally {
      setDeletingAdmin(null);
    }
  };

  return {
    loading,
    saving,
    companies,
    search,
    setSearch,
    companyFilter,
    setCompanyFilter,
    statusFilter,
    setStatusFilter,
    filteredAdmins,
    companyMap,
    stats,
    formOpen,
    form,
    setForm,
    showPassword,
    setShowPassword,
    setPasswordTouched,
    passwordValidationMessage,
    visiblePasswordError,
    selectedCompanyName,
    deletingAdmin,
    setDeletingAdmin,
    fetchData,
    resetFilters,
    openEditForm,
    closeEditForm,
    handleSave,
    handleStatusToggle,
    handleDelete,
  };
};
