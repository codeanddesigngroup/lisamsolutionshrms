export type PackagePlan = {
  id: number;
  name: string;
  annualPrice: number;
  monthlyPrice: number;
  employees: number;
  storage: string;
  modules: number | "All";
  isDefault: boolean;
};
