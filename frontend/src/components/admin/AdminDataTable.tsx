"use client";

import { ReactNode, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface AdminTableColumn<T> {
  header: string;
  accessor: keyof T | ((record: T) => ReactNode);
  className?: string;
  sortable?: boolean;
}

interface AdminDataTableProps<T> {
  title?: string;
  records: T[];
  columns: AdminTableColumn<T>[];
  emptyText?: string;
  searchPlaceholder?: string;
  getRecordKey?: (record: T, index: number) => string | number;
  pageSize?: number;
}

export default function AdminDataTable<T extends Record<string, unknown>>({
  title,
  records,
  columns,
  emptyText = "No records found.",
  searchPlaceholder = "Search records...",
  getRecordKey,
  pageSize = 10,
}: AdminDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return records;
    return records.filter((record) => JSON.stringify(record).toLowerCase().includes(normalizedQuery));
  }, [query, records]);

  const sortedRecords = useMemo(() => {
    if (sortIndex === null) return filteredRecords;

    const column = columns[sortIndex];
    if (!column) return filteredRecords;

    return [...filteredRecords].sort((first, second) => {
      const firstValue = getSortableValue(first, column.accessor);
      const secondValue = getSortableValue(second, column.accessor);
      const comparison = firstValue.localeCompare(secondValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [columns, filteredRecords, sortDirection, sortIndex]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (visiblePage - 1) * pageSize;
    return sortedRecords.slice(startIndex, startIndex + pageSize);
  }, [pageSize, sortedRecords, visiblePage]);

  const handleSort = (index: number) => {
    setCurrentPage(1);
    setSortIndex((currentIndex) => {
      if (currentIndex === index) {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
        return currentIndex;
      }
      setSortDirection("asc");
      return index;
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-50 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-50 px-5 py-4">
        {title && <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">{title}</h3>}
        <div className="relative min-w-[220px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-gray-100 bg-gray-50 pl-9 pr-3 text-xs font-bold text-gray-600 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/70">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 ${column.className || ""}`}>
                  {(column.sortable ?? typeof column.accessor !== "function") ? (
                    <button
                      type="button"
                      onClick={() => handleSort(columns.indexOf(column))}
                      className="inline-flex items-center gap-2 rounded-md text-left transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <span>{column.header}</span>
                      <ArrowUpDown className={`h-3.5 w-3.5 ${sortIndex === columns.indexOf(column) ? "text-primary" : "text-gray-300"}`} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRecords.map((record, index) => (
              <tr key={getRecordKey?.(record, index) || index} className="transition-colors hover:bg-gray-50/70">
                {columns.map((column) => (
                  <td key={column.header} className={`px-5 py-4 text-xs font-bold text-gray-600 ${column.className || ""}`}>
                    {typeof column.accessor === "function" ? column.accessor(record) : (record[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
            {sortedRecords.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-xs font-black uppercase tracking-widest text-gray-400">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sortedRecords.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Showing {(visiblePage - 1) * pageSize + 1}-{Math.min(visiblePage * pageSize, sortedRecords.length)} of {sortedRecords.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
              disabled={visiblePage === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-400 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">
              {visiblePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, visiblePage + 1))}
              disabled={visiblePage === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-100 text-gray-400 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getSortableValue<T extends Record<string, unknown>>(
  record: T,
  accessor: keyof T | ((record: T) => ReactNode)
): string {
  const value = typeof accessor === "function" ? accessor(record) : record[accessor];
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
