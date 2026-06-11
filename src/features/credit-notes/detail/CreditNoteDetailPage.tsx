"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import FinanceDocumentPage, { makeFinanceFallback } from "@/components/admin/FinanceDocumentPage";

export default function CreditNoteDetailsPage() {
  const params = useParams();
  const fallback = useMemo(() => makeFinanceFallback(params.id, "credit-note"), [params.id]);

  return (
    <FinanceDocumentPage
      documentType="credit-note"
      title="Credit Note"
      endpoint="credit-note"
      listPath="/credit-notes"
      editPathPrefix="/credit-notes"
      fallback={fallback}
    />
  );
}
