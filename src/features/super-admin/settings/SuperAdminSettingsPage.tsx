"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { SettingsContent } from "./components/SettingsContent";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsSidebar } from "./components/SettingsSidebar";
import { useSuperAdminSettings } from "./useSuperAdminSettings";

export default function SuperAdminSettingsPage() {
  const settings = useSuperAdminSettings();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SettingsHeader />

        <div className="flex flex-col gap-6 lg:flex-row">
          <SettingsSidebar tabs={settings.tabs} activeTab={settings.activeTab} onTabChange={settings.setActiveTab} />
          <SettingsContent
            activeTab={settings.activeTab}
            activeTabLabel={settings.activeTabLabel}
            platformAdmins={settings.platformAdmins}
            onRemovePlatformAdmin={settings.removePlatformAdmin}
            onSave={settings.saveSettings}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
