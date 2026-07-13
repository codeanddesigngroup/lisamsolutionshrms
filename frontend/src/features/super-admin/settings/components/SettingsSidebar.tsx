import type { SettingsTab, SettingsTabId } from "../types";

type SettingsSidebarProps = {
  tabs: SettingsTab[];
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
};

export const SettingsSidebar = ({ tabs, activeTab, onTabChange }: SettingsSidebarProps) => (
  <div className="w-full lg:w-64">
    <div className="white-box overflow-hidden p-0">
      <nav className="flex flex-col">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center border-b border-[#f2f2f3] px-6 py-4 text-[12px] font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id ? "bg-[#03a9f3] text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="mr-3 h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  </div>
);
