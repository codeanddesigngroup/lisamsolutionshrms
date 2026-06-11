import { Filter, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import type { InvoiceStatusFilter } from "../useInvoices";

type InvoicesFiltersProps = {
  companySearch: string;
  statusFilter: InvoiceStatusFilter;
  onCompanySearchChange: (value: string) => void;
  onStatusFilterChange: (value: InvoiceStatusFilter) => void;
  onReset: () => void;
};

export const InvoicesFilters = ({
  companySearch,
  statusFilter,
  onCompanySearchChange,
  onStatusFilterChange,
  onReset,
}: InvoicesFiltersProps) => (
  <div className="white-box">
    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-400">Company</label>
        <div className="relative">
          <input
            type="text"
            value={companySearch}
            onChange={(event) => onCompanySearchChange(event.target.value)}
            className="form-control pl-8"
            placeholder="Search Company..."
          />
          <Search className="absolute left-3 top-2 h-3 w-3 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-400">Status</label>
        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as InvoiceStatusFilter)} className="form-control">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div>
        <Button type="button" onClick={onReset} className="btn-success btn-sm w-full">
          <Filter className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </div>
    </div>
  </div>
);
