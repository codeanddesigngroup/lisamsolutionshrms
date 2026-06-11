import { Building2, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import type { CreateCompanyAdminPayload } from "../types";

type CompanyWorkspaceFormProps = {
  company: CreateCompanyAdminPayload["company"];
  onChange: (name: keyof CreateCompanyAdminPayload["company"], value: string) => void;
};

export const CompanyWorkspaceForm = ({ company, onChange }: CompanyWorkspaceFormProps) => (
  <Card title="Company / Branch Workspace" className="border-none bg-white p-8 shadow-sm">
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company / Branch Name</label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input required autoComplete="off" value={company.name} onChange={(event) => onChange("name", event.target.value)} className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input required type="email" autoComplete="off" value={company.email} onChange={(event) => onChange("email", event.target.value)} className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</label>
        <input value={company.phone} onChange={(event) => onChange("phone", event.target.value)} className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Website</label>
        <input value={company.website} onChange={(event) => onChange("website", event.target.value)} className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10" />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
        <select value={company.status} onChange={(event) => onChange("status", event.target.value)} className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  </Card>
);
