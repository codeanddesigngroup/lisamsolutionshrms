"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { emailPattern } from "@/lib/admin-password";
import { createCompanyWithAdmin } from "./api";
import type { CreateCompanyAdminPayload } from "./types";
import { emptyCreateCompanyPayload } from "./utils";

export const useCreateCompany = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateCompanyAdminPayload>(emptyCreateCompanyPayload);

  const updateCompany = (name: keyof CreateCompanyAdminPayload["company"], value: string) => {
    setForm((current) => ({ ...current, company: { ...current.company, [name]: value } }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.company.name.trim() || !form.company.email.trim()) {
      showToast("Company name and email are required.", "error");
      return;
    }
    if (!emailPattern.test(form.company.email.trim())) {
      showToast("Enter a valid company email address.", "error");
      return;
    }

    setSaving(true);

    try {
      await createCompanyWithAdmin({
        company: {
          ...form.company,
          name: form.company.name.trim(),
          email: form.company.email.trim(),
          phone: form.company.phone.trim(),
          website: form.company.website.trim(),
        },
        admin: form.admin,
      });
      showToast("Company created successfully.");
      router.push("/super-admin/companies");
    } catch (error) {
      console.warn("Create company failed:", error);
      showToast("Unable to create company.", "error");
      setSaving(false);
    }
  };

  return {
    saving,
    form,
    updateCompany,
    handleSubmit,
  };
};
