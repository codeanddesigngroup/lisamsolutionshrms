"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { defaultPackagePlans } from "./data";
import type { PackagePlan } from "./types";

export const usePackages = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackagePlan[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPackages(defaultPackagePlans);
      setLoading(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleEdit = (packagePlan: PackagePlan) => {
    showToast(`${packagePlan.name} package editing will connect to the backend package endpoint.`, "error");
  };

  const handleDelete = (packagePlan: PackagePlan) => {
    if (packagePlan.isDefault) {
      showToast("Default packages cannot be deleted.", "error");
      return;
    }

    setPackages((current) => current.filter((item) => item.id !== packagePlan.id));
    showToast(`${packagePlan.name} package removed locally.`);
  };

  const openTrialSettings = () => {
    showToast("Free trial settings will connect to the backend package settings endpoint.", "error");
  };

  return {
    loading,
    packages,
    handleEdit,
    handleDelete,
    openTrialSettings,
  };
};
