import { Building2, Check, Edit3, Trash2, UserCog, X } from "lucide-react";
import Card from "@/components/ui/Card";
import { getModulesFromPermissions } from "@/lib/auth-contract";
import type { AdminAccount, Company } from "../types";
import { getAdminCompanyId, getAdminRoleLabel, getCompanyName } from "../utils";

type AdminsTableProps = {
  admins: AdminAccount[];
  loading: boolean;
  companyMap: Map<string, Company>;
  onStatusToggle: (admin: AdminAccount) => void;
  onEdit: (admin: AdminAccount) => void;
  onDelete: (admin: AdminAccount) => void;
};

export const AdminsTable = ({ admins, loading, companyMap, onStatusToggle, onEdit, onDelete }: AdminsTableProps) => (
  <Card className="overflow-hidden border-none bg-white p-0 shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="min-w-64 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Name</th>
            <th className="min-w-52 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Company</th>
            <th className="min-w-40 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Role</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {admins.map((admin) => {
            const company = admin.company || companyMap.get(getAdminCompanyId(admin));
            const modules = getModulesFromPermissions(admin.permissions || []);
            const roleLabel = getAdminRoleLabel(admin.permissions || []);

            return (
              <tr key={admin.id} className="hover:bg-gray-50/60">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{admin.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-gray-400">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {getCompanyName(company)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600">
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${admin.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onStatusToggle(admin)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:bg-primary/10"
                      title={admin.status === "active" ? "Deactivate admin" : "Activate admin"}
                    >
                      {admin.status === "active" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(admin)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                      title="Edit admin"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(admin)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      title="Delete admin"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!loading && admins.length === 0 && (
            <tr>
              <td colSpan={6} className="py-16 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                No admins match this filter
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    {loading && <div className="p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Loading admins...</div>}
  </Card>
);
