import Link from "next/link";
import { Building2, ShieldCheck, UserPlus } from "lucide-react";
import Button from "@/components/ui/Button";

export const DashboardHeader = () => (
  <div className="white-box flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 text-primary">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <div>
        <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Super Admin Dashboard</h4>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Platform companies, admins, billing, and system readiness
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <Link href="/super-admin/companies/create">
        <Button className="h-10 bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white">
          <Building2 className="h-4 w-4" />
          Add Company
        </Button>
      </Link>
      <Link href="/super-admin/users/create">
        <Button className="h-10 border border-gray-100 bg-gray-50 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
          <UserPlus className="h-4 w-4" />
          Add Admin
        </Button>
      </Link>
    </div>
  </div>
);
