"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, FileText, RefreshCw, Search, Ticket, User, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import api from "@/lib/api";

interface SearchItem {
  id: string | number;
  title: string;
  subtitle: string;
  href: string;
}

interface SearchGroup {
  key: string;
  label: string;
  endpoint: string;
  hrefBase: string;
  icon: "client" | "employee" | "project" | "task" | "lead" | "ticket" | "invoice";
  titleKeys: string[];
  subtitleKeys: string[];
}

const groups: SearchGroup[] = [
  { key: "clients", label: "Clients", endpoint: "/client", hrefBase: "/clients", icon: "client", titleKeys: ["client_detail.company_name", "name"], subtitleKeys: ["email"] },
  { key: "employees", label: "Employees", endpoint: "/employee", hrefBase: "/employees", icon: "employee", titleKeys: ["name"], subtitleKeys: ["email", "employee_detail.designation.name"] },
  { key: "projects", label: "Projects", endpoint: "/project", hrefBase: "/projects", icon: "project", titleKeys: ["project_name"], subtitleKeys: ["status", "client.name"] },
  { key: "tasks", label: "Tasks", endpoint: "/task", hrefBase: "/tasks", icon: "task", titleKeys: ["heading", "title"], subtitleKeys: ["status", "project.project_name"] },
  { key: "leads", label: "Leads", endpoint: "/lead", hrefBase: "/leads", icon: "lead", titleKeys: ["client_name", "company_name"], subtitleKeys: ["client_email", "status.type"] },
  { key: "tickets", label: "Tickets", endpoint: "/ticket", hrefBase: "/tickets", icon: "ticket", titleKeys: ["subject"], subtitleKeys: ["status", "priority"] },
  { key: "invoices", label: "Invoices", endpoint: "/invoice", hrefBase: "/invoices", icon: "invoice", titleKeys: ["invoice_number"], subtitleKeys: ["status", "client.name"] },
];

function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, record);
}

function textFrom(record: Record<string, unknown>, paths: string[]): string {
  for (const path of paths) {
    const value = readPath(record, path);
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "Untitled";
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  const root = payload as Record<string, unknown> | null;
  const data = root && typeof root === "object" && "data" in root ? root.data : payload;
  if (Array.isArray(data)) return data.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)) {
    return (data as Record<string, unknown>).data as Record<string, unknown>[];
  }
  return [];
}

function iconFor(type: SearchGroup["icon"]) {
  switch (type) {
    case "client": return Users;
    case "employee": return User;
    case "project": return Briefcase;
    case "task": return FileText;
    case "lead": return FileText;
    case "ticket": return Ticket;
    case "invoice": return FileText;
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, SearchItem[]>>({});
  const [searched, setSearched] = useState(false);

  const totalResults = useMemo(() => Object.values(results).reduce((total, group) => total + group.length, 0), [results]);

  const runSearch = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) return;

    setLoading(true);
    setSearched(true);
    const nextResults: Record<string, SearchItem[]> = {};

    await Promise.all(groups.map(async (group) => {
      try {
        const response = await api.get(group.endpoint);
        const rows = extractRows(response.data);
        nextResults[group.key] = rows
          .map((record) => {
            const id = readPath(record, "id");
            const normalizedId = typeof id === "string" || typeof id === "number" ? id : crypto.randomUUID();
            return {
              id: normalizedId,
              title: textFrom(record, group.titleKeys),
              subtitle: textFrom(record, group.subtitleKeys),
              href: `${group.hrefBase}/${normalizedId}`,
            };
          })
          .filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(trimmedQuery))
          .slice(0, 8);
      } catch {
        nextResults[group.key] = [];
      }
    }));

    setResults(nextResults);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Universal Search</h1>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <Link href="/dashboard" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Search</span>
          </div>
        </div>

        <Card className="border-none bg-white p-8 shadow-sm">
          <form onSubmit={runSearch} className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border-none bg-gray-50 py-4 pl-14 pr-5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search clients, employees, projects, tasks, leads, tickets, and invoices..."
              />
            </div>
            <Button type="submit" loading={loading} className="bg-primary text-white px-10 h-14 text-[10px] font-black uppercase tracking-widest">
              Search
            </Button>
          </form>
        </Card>

        {searched && (
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {loading ? "Searching all modules..." : `${totalResults} result${totalResults === 1 ? "" : "s"} found`}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((group) => {
            const Icon = iconFor(group.icon);
            const groupResults = results[group.key] ?? [];
            return (
              <Card key={group.key} className="border-none bg-white p-0 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">{group.label}</h2>
                  </div>
                  {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="divide-y divide-gray-50">
                  {!loading && groupResults.length === 0 && (
                    <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                      {searched ? "No matches" : "Run a search"}
                    </div>
                  )}
                  {groupResults.map((item) => (
                    <Link key={`${group.key}-${item.id}`} href={item.href} className="block p-5 transition-colors hover:bg-gray-50">
                      <p className="text-sm font-black text-gray-800">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">{item.subtitle}</p>
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
