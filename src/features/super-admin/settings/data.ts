import { CreditCard, Layout, Mail, Settings, Shield } from "lucide-react";
import type { PlatformAdmin, SettingsTab } from "./types";

export const settingsTabs: SettingsTab[] = [
  { id: "general", label: "General Settings", icon: Settings },
  { id: "email", label: "Email Settings", icon: Mail },
  { id: "payment", label: "Payment Settings", icon: CreditCard },
  { id: "theme", label: "Theme Settings", icon: Layout },
  { id: "auth", label: "Auth Settings", icon: Shield },
];

export const defaultPlatformAdmins: PlatformAdmin[] = [
  { id: 1, name: "Platform Owner", email: "superadmin@example.com", status: "active" },
];
