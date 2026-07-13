import Link from "next/link";
import { Building2, CalendarDays, Mail, MoreHorizontal } from "lucide-react";
import type { RecentCompany } from "../types";

type RecentCompaniesTableProps = {
  companies: RecentCompany[];
  loading?: boolean;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const RecentCompaniesTable = ({ companies, loading = false }: RecentCompaniesTableProps) => (
  <div className="white-box overflow-hidden p-0">
    <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Recent Companies</h4>
          <p className="m-0 mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Latest company and branch records</p>
        </div>
      </div>
      <Link href="/super-admin/companies" className="w-fit rounded border border-gray-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-all hover:border-primary/30 hover:text-primary">
        View All
      </Link>
    </div>

    {loading ? (
      <div className="px-6 py-10">
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    ) : companies.length === 0 ? (
      <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-gray-500">
          <Building2 className="h-6 w-6" />
        </div>
        <h5 className="m-0 font-black uppercase tracking-tight text-gray-800">No companies yet</h5>
        <p className="m-0 mt-2 text-sm text-gray-500">New company records will appear here after creation.</p>
      </div>
    ) : (
      <div className="table-responsive">
        <table className="min-w-[760px]">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Created</th>
              <th className="w-20 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-black text-gray-600">
                      {getInitials(company.name)}
                    </div>
                    <div>
                      <p className="m-0 font-bold text-gray-800">{company.name}</p>
                      <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">ID {company.id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{company.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`label ${company.status === "Active" ? "label-success" : "label-warning"}`}>{company.status}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <span>{new Date(company.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                </td>
                <td className="text-center">
                  <Link href="/super-admin/companies" className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-100 text-gray-500 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary" aria-label={`Open ${company.name}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
