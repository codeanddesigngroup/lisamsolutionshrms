import { Filter, RefreshCw, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { AdminAccount, Company } from "../types";
import { getCompanyName } from "../utils";

type AdminFiltersProps = {
  loading: boolean;
  companies: Company[];
  search: string;
  companyFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onCompanyFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  onReset: () => void;
};

export const AdminFilters = ({
  loading,
  companies,
  search,
  companyFilter,
  statusFilter,
  onSearchChange,
  onCompanyFilterChange,
  onStatusFilterChange,
  onRefresh,
  onReset,
}: AdminFiltersProps) => (
  <Card className="border-none bg-white p-5 shadow-sm">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Search</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Name, email, company"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company / Branch</label>
        <select
          value={companyFilter}
          onChange={(event) => onCompanyFilterChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="all">All Company / Branches</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {getCompanyName(company)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as AdminAccount["status"] | "all")}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="button" onClick={onRefresh} loading={loading} className="h-11 border-none bg-gray-100 px-4 text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button type="button" onClick={onReset} className="h-11 border-none bg-gray-100 px-4 text-gray-600">
          <Filter className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  </Card>
);
