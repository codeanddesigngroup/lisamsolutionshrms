import type { ComponentType, SVGProps } from "react";

export type SettingsTabId = "general" | "email" | "payment" | "theme" | "auth";

export type SettingsTab = {
  id: SettingsTabId;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type PlatformAdmin = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive";
};
