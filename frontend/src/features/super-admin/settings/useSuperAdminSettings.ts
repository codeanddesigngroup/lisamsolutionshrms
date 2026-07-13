"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { defaultPlatformAdmins, settingsTabs } from "./data";
import type { PlatformAdmin, SettingsTabId } from "./types";

export const useSuperAdminSettings = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdmin[]>(defaultPlatformAdmins);

  const activeTabLabel = useMemo(() => settingsTabs.find((tab) => tab.id === activeTab)?.label ?? "Settings", [activeTab]);

  const removePlatformAdmin = (admin: PlatformAdmin) => {
    if (platformAdmins.length <= 1) {
      showToast("At least one platform owner should remain active.", "error");
      return;
    }

    setPlatformAdmins((current) => current.filter((item) => item.id !== admin.id));
    showToast(`${admin.name} removed locally.`);
  };

  const saveSettings = () => {
    showToast("Settings save will connect to the backend settings endpoint.", "error");
  };

  return {
    activeTab,
    activeTabLabel,
    platformAdmins,
    tabs: settingsTabs,
    setActiveTab,
    removePlatformAdmin,
    saveSettings,
  };
};
