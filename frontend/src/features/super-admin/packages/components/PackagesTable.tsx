import { Edit, HardDrive, Trash2, Users } from "lucide-react";
import type { PackagePlan } from "../types";

type PackagesTableProps = {
  packages: PackagePlan[];
  loading: boolean;
  onEdit: (packagePlan: PackagePlan) => void;
  onDelete: (packagePlan: PackagePlan) => void;
};

export const PackagesTable = ({ packages, loading, onEdit, onDelete }: PackagesTableProps) => (
  <div className="white-box p-0">
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th className="w-16">#</th>
            <th>Name</th>
            <th>Annual Price ($)</th>
            <th>Monthly Price ($)</th>
            <th>
              <Users className="mr-1 inline-block h-4 w-4" /> Employees
            </th>
            <th>
              <HardDrive className="mr-1 inline-block h-4 w-4" /> Storage
            </th>
            <th>Modules</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="py-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                Loading packages...
              </td>
            </tr>
          ) : (
            packages.map((packagePlan, index) => (
              <tr key={packagePlan.id}>
                <td>{index + 1}</td>
                <td className="font-bold">{packagePlan.name}</td>
                <td>${packagePlan.annualPrice}</td>
                <td>${packagePlan.monthlyPrice}</td>
                <td>{packagePlan.employees}</td>
                <td>{packagePlan.storage}</td>
                <td>
                  <span className="label label-info">{packagePlan.modules}</span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end space-x-1">
                    <button
                      type="button"
                      onClick={() => onEdit(packagePlan)}
                      className="btn-success btn-outline rounded p-1"
                      aria-label={`Edit ${packagePlan.name} package`}
                      title={`Edit ${packagePlan.name} package`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {!packagePlan.isDefault && (
                      <button
                        type="button"
                        onClick={() => onDelete(packagePlan)}
                        className="btn-danger btn-outline rounded p-1"
                        aria-label={`Delete ${packagePlan.name} package`}
                        title={`Delete ${packagePlan.name} package`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
