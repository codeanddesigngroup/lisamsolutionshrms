import { Package, Settings } from "lucide-react";
import Button from "@/components/ui/Button";

type PackagesHeaderProps = {
  total: number;
  onTrialSettings: () => void;
};

export const PackagesHeader = ({ total, onTrialSettings }: PackagesHeaderProps) => (
  <div className="row bg-title mb-6">
    <div className="col-lg-6 col-md-6 col-sm-4 col-xs-12">
      <h4 className="page-title m-0">
        <Package className="mr-2 inline-block h-5 w-5 text-primary" />
        Packages List
        <span className="ml-2 border-l border-[#eee] pl-2 text-info">{total}</span>
        <span className="ml-1 text-[10px] font-bold uppercase text-gray-400">Total Packages</span>
      </h4>
    </div>
    <div className="col-lg-6 col-sm-8 col-md-6 col-xs-12 flex justify-end space-x-2">
      <Button type="button" onClick={onTrialSettings} className="btn-info btn-outline btn-sm">
        Free Trial Settings <Settings className="ml-1 inline-block h-4 w-4" />
      </Button>
    </div>
  </div>
);
