"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { emailPattern, validateAdminPassword } from "@/lib/admin-password";
import { createCompanyWithAdmin } from "./api";
import type { CreateCompanyAdminPayload } from "./types";
import { emptyCreateCompanyPayload } from "./utils";

export const useCreateCompany = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [form, setForm] = useState<CreateCompanyAdminPayload>(emptyCreateCompanyPayload);

  const updateCompany = (name: keyof CreateCompanyAdminPayload["company"], value: string) => {
    setForm((current) => ({ ...current, company: { ...current.company, [name]: value } }));
  };

  const updateAdmin = (name: keyof CreateCompanyAdminPayload["admin"], value: string) => {
    setForm((current) => ({ ...current, admin: { ...current.admin, [name]: value } }));
  };

  const passwordValidationMessage = useMemo(
    () =>
      validateAdminPassword({
        password: form.admin.password,
        required: true,
        name: form.admin.name,
        email: form.admin.email,
        companyName: form.company.name,
      }),
    [form.admin.email, form.admin.name, form.admin.password, form.company.name],
  );

  const visiblePasswordError = passwordTouched && passwordValidationMessage;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.company.name.trim() || !form.company.email.trim() || !form.admin.name.trim() || !form.admin.email.trim()) {
      showToast("Company name, company email, admin name, and admin email are required.", "error");
      return;
    }
    if (!emailPattern.test(form.company.email.trim())) {
      showToast("Enter a valid company email address.", "error");
      return;
    }
    if (!emailPattern.test(form.admin.email.trim())) {
      showToast("Enter a valid admin email address.", "error");
      return;
    }
    if (passwordValidationMessage) {
      setPasswordTouched(true);
      showToast(passwordValidationMessage, "error");
      return;
    }

    setSaving(true);

    try {
      await createCompanyWithAdmin({
        company: {
          ...form.company,
          name: form.company.name.trim(),
          email: form.company.email.trim(),
        },
        admin: {
          ...form.admin,
          name: form.admin.name.trim(),
          email: form.admin.email.trim(),
          password: form.admin.password.trim(),
        },
      });
      showToast("Company and admin created successfully.");
      router.push("/super-admin/admins");
    } catch (error) {
      console.warn("Create company endpoint pending:", error);
      showToast("Unable to create company and admin.", "error");
      setSaving(false);
    }
  };

  return {
    saving,
    form,
    updateCompany,
    updateAdmin,
    showAdminPassword,
    setShowAdminPassword,
    setPasswordTouched,
    passwordValidationMessage,
    visiblePasswordError,
    handleSubmit,
  };
};
