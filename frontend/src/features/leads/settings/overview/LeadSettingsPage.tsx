"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Edit, FileText, Plus, RefreshCw, Trash2, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

type LeadSettingTab = "sources" | "status" | "categories";

type LeadSettingItem = {
  id: number | string;
  type?: string;
  category_name?: string;
};

const tabs: Array<{ id: LeadSettingTab; label: string; endpoint: string; createHref: string; singular: string; field: "type" | "category_name" }> = [
  { id: "sources", label: "Lead Sources", endpoint: "/lead-source", createHref: "/lead-settings/source/create", singular: "source", field: "type" },
  { id: "status", label: "Lead Status", endpoint: "/lead-status", createHref: "/lead-settings/status/create", singular: "status", field: "type" },
  { id: "categories", label: "Lead Categories", endpoint: "/lead-category", createHref: "/lead-settings/category/create", singular: "category", field: "category_name" },
];

const getItemName = (item: LeadSettingItem, field: "type" | "category_name") => String(item[field] || "");

export default function LeadSettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<LeadSettingTab>("sources");
  const [itemsByTab, setItemsByTab] = useState<Record<LeadSettingTab, LeadSettingItem[]>>({
    sources: [],
    status: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ tab: LeadSettingTab; item: LeadSettingItem; value: string } | null>(null);

  const activeConfig = useMemo(() => tabs.find((tab) => tab.id === activeTab) || tabs[0], [activeTab]);
  const activeItems = itemsByTab[activeTab];

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(tabs.map((tab) => api.get(tab.endpoint)));
      setItemsByTab({
        sources: responses[0].data.data || [],
        status: responses[1].data.data || [],
        categories: responses[2].data.data || [],
      });
    } catch (err) {
      console.error("Fetch Lead Settings Error:", err);
      showToast("Failed to load lead settings", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  const handleDelete = async (item: LeadSettingItem) => {
    try {
      await api.delete(`${activeConfig.endpoint}/${item.id}`);
      setItemsByTab((current) => ({
        ...current,
        [activeTab]: current[activeTab].filter((currentItem) => String(currentItem.id) !== String(item.id)),
      }));
      showToast("Lead setting deleted", "success");
    } catch (err) {
      console.error("Delete Lead Setting Error:", err);
      showToast("Failed to delete lead setting", "error");
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const config = tabs.find((tab) => tab.id === editing.tab) || tabs[0];
    try {
      const response = await api.put(`${config.endpoint}/${editing.item.id}`, {
        [config.field]: editing.value,
      });
      const updated = response.data.data as LeadSettingItem;
      setItemsByTab((current) => ({
        ...current,
        [editing.tab]: current[editing.tab].map((item) => (String(item.id) === String(editing.item.id) ? updated : item)),
      }));
      setEditing(null);
      showToast("Lead setting updated", "success");
    } catch (err) {
      console.error("Update Lead Setting Error:", err);
      showToast("Failed to update lead setting", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Lead Settings</h1>
            <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
              <Link href="/dashboard" className="font-bold transition-colors hover:text-primary">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="font-bold transition-colors hover:text-primary">Settings</Link>
              <span className="font-bold">/</span>
              <span className="font-bold text-gray-700">Lead Settings</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="h-8 border-none bg-gray-100 px-3 text-[10px] text-gray-600 hover:bg-gray-200">
              <ArrowLeft className="mr-1 h-3 w-3" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <Card className="overflow-hidden border-gray-100 bg-white p-0 shadow-sm">
              <div className="border-b border-gray-50 bg-gray-50/30 p-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Configuration</h3>
              </div>
              <div className="space-y-1 p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center justify-between rounded px-4 py-3 text-left text-sm font-bold transition-colors ${
                      activeTab === tab.id ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-70">{itemsByTab[tab.id].length}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="flex h-full flex-col overflow-hidden border-gray-100 bg-white p-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/30 p-6">
                <div>
                  <h3 className="flex items-center text-sm font-black tracking-wide text-gray-800">
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    Manage {activeConfig.label}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">These records are loaded through mock API now and can map directly to backend endpoints later.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={fetchSettings} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition hover:text-primary">
                    <RefreshCw className={`mr-2 inline h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <Link href={activeConfig.createHref}>
                    <Button className="h-9 bg-primary px-6 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm shadow-primary/20">
                      <Plus className="mr-2 h-3.5 w-3.5" /> Add {activeConfig.singular}
                    </Button>
                  </Link>
                </div>
              </div>

              {editing && (
                <div className="flex flex-wrap items-center gap-3 border-b border-primary/10 bg-primary/5 p-4">
                  <input
                    value={editing.value}
                    onChange={(event) => setEditing((current) => (current ? { ...current, value: event.target.value } : current))}
                    className="h-10 min-w-64 rounded-lg border border-primary/20 bg-white px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
                  />
                  <button onClick={handleUpdate} className="flex h-10 items-center rounded-lg bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white">
                    <Check className="mr-2 h-4 w-4" />
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="flex h-10 items-center rounded-lg bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}

              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Name</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeItems.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{getItemName(item, activeConfig.field)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditing({ tab: activeTab, item, value: getItemName(item, activeConfig.field) })}
                              className="p-1 text-blue-400 transition-colors hover:text-blue-600"
                              aria-label={`Edit ${getItemName(item, activeConfig.field)}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 text-red-400 transition-colors hover:text-red-600"
                              aria-label={`Delete ${getItemName(item, activeConfig.field)}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && activeItems.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-6 py-10 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
