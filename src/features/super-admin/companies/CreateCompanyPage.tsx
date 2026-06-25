"use client";

import { Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { CompanyWorkspaceForm } from "./components/CompanyWorkspaceForm";
import { CreateCompanyHeader } from "./components/CreateCompanyHeader";
import { useCreateCompany } from "./useCreateCompany";

export default function CreateCompanyPage() {
  const createCompany = useCreateCompany();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <CreateCompanyHeader />

        <form onSubmit={createCompany.handleSubmit} noValidate autoComplete="off" className="space-y-6">
          <CompanyWorkspaceForm company={createCompany.form.company} onChange={createCompany.updateCompany} />

          <div className="flex justify-end">
            <Button type="submit" loading={createCompany.saving} className="h-12 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              <Save className="mr-2 h-4 w-4" /> Create Company
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
