import type { PackagePlan } from "./types";

export const defaultPackagePlans: PackagePlan[] = [
  { id: 1, name: "Free", annualPrice: 0, monthlyPrice: 0, employees: 5, storage: "100 MB", modules: 10, isDefault: true },
  { id: 2, name: "Starter", annualPrice: 199, monthlyPrice: 19, employees: 20, storage: "1 GB", modules: 25, isDefault: false },
  { id: 3, name: "Enterprise", annualPrice: 999, monthlyPrice: 99, employees: 1000, storage: "Unlimited", modules: "All", isDefault: false },
];
