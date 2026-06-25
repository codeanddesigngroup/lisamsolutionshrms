import Link from "next/link";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";

export const AdminsHeader = () => (
  <div className="row bg-title mb-2">
    <div className="col-lg-6 col-md-6 col-sm-4 col-xs-12">
      <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Company Admins</h1>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Platform controlled admin access</p>
    </div>
    <div className="col-lg-6 col-sm-8 col-md-6 col-xs-12 flex justify-end space-x-2 align-middle">
      <Link href="/super-admin/users/create">
          <Button className="btn-success btn-outline btn-sm">
            Add User <Plus className="ml-1 inline-block h-4 w-4" />
          </Button>
      </Link>
    </div>
  </div>
);
