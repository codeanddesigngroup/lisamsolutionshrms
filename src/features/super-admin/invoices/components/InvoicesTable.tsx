import { Building, Calendar, DollarSign, Download } from "lucide-react";
import type { Invoice } from "../types";

type InvoicesTableProps = {
  invoices: Invoice[];
  loading: boolean;
  onDownload: (invoice: Invoice) => void;
};

const formatInvoiceDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });

export const InvoicesTable = ({ invoices, loading, onDownload }: InvoicesTableProps) => (
  <div className="white-box p-0">
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th className="w-16">#</th>
            <th>
              <Building className="mr-1 inline-block h-4 w-4" /> Company
            </th>
            <th>Package</th>
            <th>
              <DollarSign className="mr-1 inline-block h-4 w-4" /> Amount
            </th>
            <th>Status</th>
            <th>
              <Calendar className="mr-1 inline-block h-4 w-4" /> Date
            </th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                Loading invoices...
              </td>
            </tr>
          ) : invoices.length ? (
            invoices.map((invoice, index) => (
              <tr key={invoice.id}>
                <td>{index + 1}</td>
                <td className="cursor-pointer font-bold text-primary hover:underline">{invoice.company}</td>
                <td>{invoice.package}</td>
                <td>${invoice.amount}</td>
                <td>
                  <span className={`label ${invoice.status === "paid" ? "label-success" : "label-warning"}`}>{invoice.status}</span>
                </td>
                <td>{formatInvoiceDate(invoice.date)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => onDownload(invoice)}
                    className="btn-info btn-outline rounded p-1 transition-all hover:bg-info hover:text-white"
                    aria-label={`Download invoice for ${invoice.company}`}
                    title={`Download invoice for ${invoice.company}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                No invoices found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
