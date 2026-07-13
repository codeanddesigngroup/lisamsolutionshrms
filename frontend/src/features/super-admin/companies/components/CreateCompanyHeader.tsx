import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export const CreateCompanyHeader = () => (
  <div className="-mx-6 -mt-6 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
    <div>
      <h1 className="text-base font-black uppercase tracking-widest text-gray-800">Add Company / Branch</h1>
      <p className="mt-1 text-xs font-bold text-gray-400">Create an internal company or branch record and assign the first admin</p>
    </div>
    <Link href="/super-admin/companies">
      <Button className="h-9 border border-gray-200 bg-gray-100 text-xs text-gray-600">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
    </Link>
  </div>
);
