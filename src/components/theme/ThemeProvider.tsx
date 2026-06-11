"use client";

import { useEffect } from "react";
import { applyThemeSettings, loadThemeSettings, THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type ThemeSettings } from "@/lib/theme-settings";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyThemeSettings(loadThemeSettings());

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeSettings>).detail;
      if (detail) applyThemeSettings(detail);
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === THEME_STORAGE_KEY) {
        applyThemeSettings(loadThemeSettings());
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return <>{children}</>;
}
