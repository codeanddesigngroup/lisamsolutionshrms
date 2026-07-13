"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { deleteCompany, fetchCompanies, loginAsCompany, updateCompany } from "./api";
import type { Company, CompanyFormState } from "./types";
import { getCompanyName, sameCompanyId } from "./utils";

export const useCompanies = () => {
  const { showToast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [impersonatingCompanyId, setImpersonatingCompanyId] = useState<number | string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | string | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>({
    name: "",
    email: "",
    status: "active",
  });

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      setCompanies(await fetchCompanies());
    } catch (error) {
      console.error("Fetch Companies Error:", error);
      showToast("Unable to load companies", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCompanies();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCompanies]);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      const searchMatch = !query || `${getCompanyName(company)} ${company.email || ""}`.toLowerCase().includes(query);
      const statusMatch = statusFilter === "all" || company.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [companies, search, statusFilter]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const openCompanyEditor = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: getCompanyName(company),
      email: company.email || "",
      status: company.status || "active",
    });
  };

  const handleCompanyUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCompany) return;

    try {
      const updated = await updateCompany(editingCompany.id, companyForm);
      setCompanies((current) =>
        current.map((company) =>
          sameCompanyId(company.id, editingCompany.id)
            ? updated || { ...company, name: companyForm.name, company_name: companyForm.name, email: companyForm.email, status: companyForm.status }
            : company,
        ),
      );
      showToast("Company updated successfully", "success");
      setEditingCompany(null);
    } catch (error) {
      console.warn("Update Company Error:", error);
      showToast("Company updated locally. PHP endpoint should persist this payload.", "error");
      setCompanies((current) =>
        current.map((company) =>
          sameCompanyId(company.id, editingCompany.id)
            ? { ...company, name: companyForm.name, company_name: companyForm.name, email: companyForm.email, status: companyForm.status }
            : company,
        ),
      );
      setEditingCompany(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingCompanyId) return;

    try {
      await deleteCompany(deletingCompanyId);
      setCompanies((current) => current.filter((company) => !sameCompanyId(company.id, deletingCompanyId)));
      showToast("Company deleted successfully", "success");
      setDeletingCompanyId(null);
    } catch (error) {
      console.error("Delete Company Error:", error);
      showToast("Failed to delete company", "error");
    }
  };

  const handleLoginAsCompany = async (company: Company) => {
    setImpersonatingCompanyId(company.id);
    try {
      const response = await loginAsCompany(company.id);
      login(response.token, response.user, false, "/dashboard");
      showToast(`Logged in as ${getCompanyName(company)} admin.`);
    } catch (error) {
      console.error("Login As Company Error:", error);
      showToast("Unable to login as this company.", "error");
    } finally {
      setImpersonatingCompanyId(null);
    }
  };

  return {
    loading,
    companies,
    filteredCompanies,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    resetFilters,
    loadCompanies,
    impersonatingCompanyId,
    handleLoginAsCompany,
    deletingCompanyId,
    setDeletingCompanyId,
    handleDelete,
    editingCompany,
    setEditingCompany,
    companyForm,
    setCompanyForm,
    openCompanyEditor,
    handleCompanyUpdate,
  };
};
