import { Suspense } from "react";
import CreateSalarySheetPage from "@/features/payroll/salary-sheet/CreateSalarySheetPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateSalarySheetPage />
    </Suspense>
  );
}
