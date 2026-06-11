import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

type CompaniesFiltersProps = {
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReset: () => void;
};

export const CompaniesFilters = ({ search, statusFilter, onSearchChange, onStatusFilterChange, onReset }: CompaniesFiltersProps) => (
  <div className="white-box">
    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-400">Search</label>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="form-control"
          placeholder="Name or email"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-400">Status</label>
        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)} className="form-control">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="flex space-x-2">
        <Button onClick={onReset} className="btn-inverse btn-sm flex-1">
          <RefreshCw className="mr-1 inline-block h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  </div>
);
