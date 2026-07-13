"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Layout, Monitor, Palette, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  applyThemeSettings,
  defaultThemeSettings,
  loadThemeSettings,
  normalizeThemeSettings,
  persistThemeSettings,
  resetThemeSettings,
  themePresets,
  type InterfaceDensity,
  type NavbarTheme,
  type SidebarTheme,
  type ThemeSettings,
  THEME_STORAGE_KEY,
} from "@/lib/theme-settings";

type ThemeRecord = ThemeSettings & { id?: number | string };

const colorFields: Array<{ key: keyof Pick<ThemeSettings, "primaryColor" | "secondaryColor" | "backgroundColor" | "foregroundColor">; label: string }> = [
  { key: "primaryColor", label: "Primary" },
  { key: "secondaryColor", label: "Sidebar Base" },
  { key: "backgroundColor", label: "Page Background" },
  { key: "foregroundColor", label: "Text Base" },
];

const extractRecords = <T,>(payload: unknown): T[] => {
  const root = payload as { data?: unknown } | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  return Array.isArray(data) ? (data as T[]) : [];
};

const sameTheme = (a: ThemeSettings, b: ThemeSettings) => JSON.stringify(a) === JSON.stringify(b);

export default function ThemeSettingsPage() {
  const { showToast } = useToast();
  const [draft, setDraft] = useState<ThemeSettings>(defaultThemeSettings);
  const [saved, setSaved] = useState<ThemeSettings>(defaultThemeSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasUnsavedChanges = useMemo(() => !sameTheme(draft, saved), [draft, saved]);

  useEffect(() => {
    const localTheme = loadThemeSettings();
    setDraft(localTheme);
    setSaved(localTheme);
    setLoading(false);

    const hasLocalTheme = typeof window !== "undefined" && Boolean(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (hasLocalTheme) return;

    const fetchTheme = async () => {
      try {
        const response = await api.get("/theme-settings");
        const record = extractRecords<ThemeRecord>(response.data)[0];
        if (!record) return;
        const nextTheme = normalizeThemeSettings(record);
        setDraft(nextTheme);
        setSaved(nextTheme);
        persistThemeSettings(nextTheme);
      } catch {
        // Local theme settings are enough when the backend endpoint is not available.
      }
    };

    void fetchTheme();
  }, []);

  useEffect(() => {
    applyThemeSettings(draft);
  }, [draft]);

  const patchDraft = (patch: Partial<ThemeSettings>) => {
    setDraft((current) => {
      const nextPatch = { ...patch };
      colorFields.forEach((field) => {
        const value = nextPatch[field.key];
        if (value !== undefined && !/^#[0-9a-f]{6}$/i.test(String(value))) {
          delete nextPatch[field.key];
        }
      });
      return normalizeThemeSettings({ ...current, ...nextPatch });
    });
  };

  const saveThemeToApi = useCallback(async (settings: ThemeSettings) => {
    try {
      const response = await api.get("/theme-settings");
      const existing = extractRecords<ThemeRecord>(response.data)[0];
      if (existing?.id) {
        await api.put(`/theme-settings/${existing.id}`, settings);
      } else {
        await api.post("/theme-settings", settings);
      }
    } catch {
      // The persisted browser theme remains the source of truth in local/mock mode.
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const normalized = normalizeThemeSettings(draft);
    persistThemeSettings(normalized);
    setSaved(normalized);
    await saveThemeToApi(normalized);
    setSaving(false);
    showToast("Theme settings saved.", "success");
  };

  const handleReset = async () => {
    setSaving(true);
    resetThemeSettings();
    setDraft(defaultThemeSettings);
    setSaved(defaultThemeSettings);
    await saveThemeToApi(defaultThemeSettings);
    setSaving(false);
    showToast("Theme settings reset.", "success");
  };

  const handleDiscard = () => {
    setDraft(saved);
    applyThemeSettings(saved);
    showToast("Unsaved theme changes discarded.", "info");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-black uppercase tracking-widest text-gray-700">Theme Settings</h1>
            <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
              <Link href="/dashboard" className="font-bold transition-colors hover:text-primary">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="font-bold transition-colors hover:text-primary">Settings</Link>
              <span className="font-bold">/</span>
              <span className="font-bold text-gray-700">Theme Settings</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/settings">
              <Button className="h-9 border-none bg-gray-100 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-200">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            <Button type="button" onClick={handleReset} disabled={saving || loading} className="h-9 border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            {hasUnsavedChanges && (
              <Button type="button" onClick={handleDiscard} disabled={saving} className="h-9 border border-gray-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">
                Discard
              </Button>
            )}
            <Button type="button" onClick={handleSave} disabled={saving || loading} loading={saving} className="h-9 bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20">
              <Save className="h-3.5 w-3.5" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-gray-50 pb-4">
                <h3 className="m-0 flex items-center text-xs font-black uppercase tracking-widest text-gray-500">
                  <Palette className="mr-2 h-4 w-4 text-primary" />
                  Color System
                </h3>
                {hasUnsavedChanges && <span className="rounded-full bg-yellow-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-yellow-700">Unsaved</span>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {colorFields.map((field) => (
                  <label key={field.key} className="rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                    <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-gray-400">{field.label}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={draft[field.key]}
                        onChange={(event) => patchDraft({ [field.key]: event.target.value })}
                        className="h-11 w-16 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white p-1"
                      />
                      <input
                        value={draft[field.key]}
                        onChange={(event) => patchDraft({ [field.key]: event.target.value })}
                        className="font-mono uppercase"
                        maxLength={7}
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                {themePresets.map((preset) => {
                  const selected =
                    draft.primaryColor === preset.settings.primaryColor &&
                    draft.secondaryColor === preset.settings.secondaryColor &&
                    draft.backgroundColor === preset.settings.backgroundColor;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => patchDraft(preset.settings)}
                      className={`rounded-xl border p-3 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-primary/30"}`}
                    >
                      <div className="mb-3 flex items-center gap-1">
                        <span className="h-5 flex-1 rounded" style={{ backgroundColor: preset.settings.primaryColor }} />
                        <span className="h-5 flex-1 rounded" style={{ backgroundColor: preset.settings.secondaryColor }} />
                        <span className="h-5 flex-1 rounded border border-gray-100" style={{ backgroundColor: preset.settings.backgroundColor }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{preset.label}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center border-b border-gray-50 pb-4">
                <SlidersHorizontal className="mr-2 h-4 w-4 text-primary" />
                <h3 className="m-0 text-xs font-black uppercase tracking-widest text-gray-500">Layout Controls</h3>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Sidebar</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["dark", "light", "brand"] as SidebarTheme[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => patchDraft({ sidebarTheme: option })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${draft.sidebarTheme === option ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-500 hover:border-primary/30"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Top Bar</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["light", "brand"] as NavbarTheme[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => patchDraft({ navbarTheme: option })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${draft.navbarTheme === option ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-500 hover:border-primary/30"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">Density</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["comfortable", "compact"] as InterfaceDensity[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => patchDraft({ density: option })}
                        className={`rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${draft.density === option ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-500 hover:border-primary/30"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span className="mb-3 block text-[10px] font-black uppercase tracking-widest text-gray-400">Corner Radius</span>
                  <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-3">
                    <input
                      type="range"
                      min={2}
                      max={18}
                      value={draft.radius}
                      onChange={(event) => patchDraft({ radius: Number(event.target.value) })}
                      className="h-2 min-h-0 p-0"
                    />
                    <span className="w-12 text-right text-xs font-black text-gray-600">{draft.radius}px</span>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-20 border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="m-0 mb-4 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                <Layout className="mr-2 h-4 w-4 text-primary" />
                Live Preview
              </h3>
              <div className="overflow-hidden border border-gray-200 bg-white shadow-sm" style={{ borderRadius: draft.radius }}>
                <div className="flex h-72">
                  <div
                    className="w-20 border-r p-3"
                    style={{
                      backgroundColor: draft.sidebarTheme === "light" ? "#ffffff" : draft.sidebarTheme === "brand" ? draft.primaryColor : draft.secondaryColor,
                      borderColor: "rgba(148, 163, 184, 0.22)",
                    }}
                  >
                    <div className="mb-5 h-7 rounded bg-white/25" />
                    <div className="space-y-2">
                      <div className="h-8 rounded bg-primary" />
                      <div className="h-8 rounded bg-white/10" />
                      <div className="h-8 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: draft.backgroundColor }}>
                    <div className="flex h-12 items-center justify-between border-b px-4" style={{ backgroundColor: draft.navbarTheme === "brand" ? draft.secondaryColor : "#ffffff" }}>
                      <Monitor className="h-4 w-4 text-primary" />
                      <div className="h-6 w-20 rounded bg-primary/10" />
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="h-4 w-28 rounded bg-gray-200" />
                      <div className="rounded bg-white p-4 shadow-sm" style={{ borderRadius: draft.radius }}>
                        <div className="mb-3 h-3 w-24 rounded bg-gray-100" />
                        <div className="h-10 rounded bg-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-16 rounded bg-white shadow-sm" style={{ borderRadius: draft.radius }} />
                        <div className="h-16 rounded bg-white shadow-sm" style={{ borderRadius: draft.radius }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Primary</p>
                <p className="mt-1 font-mono text-sm font-black uppercase text-gray-700">{draft.primaryColor}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
