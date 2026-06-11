"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import FinanceDocumentPage, { makeFinanceFallback } from "@/components/admin/FinanceDocumentPage";

export default function EstimateDetailsPage() {
  const params = useParams();
  const fallback = useMemo(() => makeFinanceFallback(params.id, "estimate"), [params.id]);

  return (
    <FinanceDocumentPage
      documentType="estimate"
      title="Estimate"
      endpoint="estimate"
      listPath="/estimates"
      editPathPrefix="/estimates"
      fallback={fallback}
    />
  );
}
