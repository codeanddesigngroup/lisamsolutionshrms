import { Trash2, User } from "lucide-react";
import type { PlatformAdmin } from "../types";

type AuthSettingsPanelProps = {
  platformAdmins: PlatformAdmin[];
  onRemovePlatformAdmin: (admin: PlatformAdmin) => void;
};

export const AuthSettingsPanel = ({ platformAdmins, onRemovePlatformAdmin }: AuthSettingsPanelProps) => (
  <div className="space-y-8">
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold leading-relaxed text-blue-700">
      Super admins are internal system owners. They can manage company or branch records, admins, permissions, and global settings. Additional super admin creation is disabled here for now.
    </div>

    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {platformAdmins.map((admin) => (
            <tr key={admin.id}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black text-gray-800">{admin.name}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-xs font-bold text-gray-500">{admin.email}</td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-green-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-green-600">{admin.status}</span>
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onRemovePlatformAdmin(admin)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  aria-label={`Remove ${admin.name}`}
                  title={`Remove ${admin.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
