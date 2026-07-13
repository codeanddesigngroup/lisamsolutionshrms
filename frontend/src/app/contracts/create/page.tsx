import CreateContractPage from "@/features/contracts/create/CreateContractPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateContractPage />
    </Suspense>
  );
}
