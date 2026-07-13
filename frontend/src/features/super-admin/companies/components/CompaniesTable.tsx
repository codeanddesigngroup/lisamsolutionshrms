import { Edit, Eye, RefreshCw, Trash2 } from "lucide-react";
import PermissionGate from "@/components/auth/PermissionGate";
import type { Company } from "../types";
import { getCompanyName, sameCompanyId } from "../utils";

type CompaniesTableProps = {
  companies: Company[];
  loading: boolean;
  impersonatingCompanyId: number | string | null;
  onLoginAsCompany: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (companyId: number | string) => void;
};

export const CompaniesTable = ({
  companies,
  loading,
  impersonatingCompanyId,
  onLoginAsCompany,
  onEdit,
  onDelete,
}: CompaniesTableProps) => (
  <div className="white-box p-0">
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th className="w-16">#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Website</th>
            <th>Status</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, index) => (
            <tr key={company.id}>
              <td>{index + 1}</td>
              <td>{getCompanyName(company)}</td>
              <td>{company.email}</td>
              <td>{company.website}</td>
              <td>
                <span className={`label ${company.status === "active" ? "label-success" : "label-danger"}`}>
                  {company.status}
                </span>
              </td>
              <td className="text-right">
                <div className="flex justify-end space-x-1">
                  <button
                    type="button"
                    onClick={() => onLoginAsCompany(company)}
                    disabled={sameCompanyId(impersonatingCompanyId, company.id)}
                    className="btn-info btn-outline rounded p-1 disabled:opacity-60"
                    title="Login as company admin"
                  >
                    {sameCompanyId(impersonatingCompanyId, company.id) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <PermissionGate permission="company.edit">
                    <button type="button" onClick={() => onEdit(company)} className="btn-success btn-outline rounded p-1" title="Edit company">
                      <Edit className="h-4 w-4" />
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="company.delete">
                    <button type="button" onClick={() => onDelete(company.id)} className="btn-danger btn-outline rounded p-1" title="Delete company">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </PermissionGate>
                </div>
              </td>
            </tr>
          ))}
          {!loading && companies.length === 0 && (
            <tr>
              <td colSpan={6} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                No company or branch records match this filter
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {loading && (
      <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
        Loading company / branch records...
      </div>
    )}
  </div>
);
