"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import FinanceDocumentPage, { makeFinanceFallback } from "@/components/admin/FinanceDocumentPage";

export default function ProposalDetailsPage() {
  const params = useParams();
  const fallback = useMemo(() => makeFinanceFallback(params.id, "proposal"), [params.id]);

  return (
    <FinanceDocumentPage
      documentType="proposal"
      title="Proposal"
      endpoint="proposal"
      listPath="/proposals"
      editPathPrefix="/proposals"
      fallback={fallback}
    />
  );
}
