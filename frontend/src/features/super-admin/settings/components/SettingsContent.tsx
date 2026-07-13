import { Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { AuthSettingsPanel } from "./AuthSettingsPanel";
import { GeneralSettingsForm } from "./GeneralSettingsForm";
import { SettingsComingSoon } from "./SettingsComingSoon";
import type { PlatformAdmin, SettingsTabId } from "../types";

type SettingsContentProps = {
  activeTab: SettingsTabId;
  activeTabLabel: string;
  platformAdmins: PlatformAdmin[];
  onRemovePlatformAdmin: (admin: PlatformAdmin) => void;
  onSave: () => void;
};

export const SettingsContent = ({
  activeTab,
  activeTabLabel,
  platformAdmins,
  onRemovePlatformAdmin,
  onSave,
}: SettingsContentProps) => (
  <div className="flex-1">
    <div className="white-box">
      <h3 className="box-title mb-8 border-b border-[#f2f2f3] pb-4">{activeTabLabel}</h3>

      {activeTab === "general" && <GeneralSettingsForm />}
      {activeTab === "auth" && <AuthSettingsPanel platformAdmins={platformAdmins} onRemovePlatformAdmin={onRemovePlatformAdmin} />}
      {activeTab !== "general" && activeTab !== "auth" && <SettingsComingSoon label={activeTabLabel} />}

      <div className="mt-10 flex justify-end border-t border-[#f2f2f3] pt-6">
        <Button type="button" onClick={onSave} className="btn-success">
          <Save className="mr-2 h-4 w-4" /> Save Settings
        </Button>
      </div>
    </div>
  </div>
);
