import Link from "next/link";
import { Plus, Shield } from "lucide-react";
import PermissionGate from "@/components/auth/PermissionGate";
import Button from "@/components/ui/Button";

type CompaniesHeaderProps = {
  total: number;
};

export const CompaniesHeader = ({ total }: CompaniesHeaderProps) => (
  <div className="row bg-title mb-2">
    <div className="col-lg-6 col-md-6 col-sm-4 col-xs-12">
      <h4 className="page-title m-0">
        <Shield className="h-5 w-5 mr-2 inline-block text-primary" />
        Company / Branches
        <span className="text-info border-l border-[#eee] ml-2 pl-2">{total}</span>
        <span className="ml-1 text-[10px] uppercase text-gray-400">Total Records</span>
      </h4>
    </div>
    <div className="col-lg-6 col-sm-8 col-md-6 col-xs-12 flex justify-end space-x-2 align-middle">
      <Link href="/super-admin/companies/create">
        <PermissionGate permission="company.create">
          <Button className="btn-success btn-outline btn-sm">
            Add Company / Branch <Plus className="ml-1 inline-block h-4 w-4" />
          </Button>
        </PermissionGate>
      </Link>
    </div>
  </div>
);
