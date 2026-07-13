"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PackagesHeader } from "./components/PackagesHeader";
import { PackagesNote } from "./components/PackagesNote";
import { PackagesTable } from "./components/PackagesTable";
import { usePackages } from "./usePackages";

export default function PackagesPage() {
  const packages = usePackages();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PackagesHeader total={packages.packages.length} onTrialSettings={packages.openTrialSettings} />
        <PackagesTable packages={packages.packages} loading={packages.loading} onEdit={packages.handleEdit} onDelete={packages.handleDelete} />
        <PackagesNote />
      </div>
    </DashboardLayout>
  );
}
