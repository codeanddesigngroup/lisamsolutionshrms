import { ShieldCheck } from "lucide-react";

export const DashboardHeader = () => (
  <div className="row bg-title mb-6">
    <div className="col-lg-12">
      <h4 className="page-title m-0">
        <ShieldCheck className="h-5 w-5 mr-2 inline-block text-primary" />
        Super Admin Dashboard
      </h4>
    </div>
  </div>
);
