"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import FinanceDocumentPage, { makeFinanceFallback } from "@/components/admin/FinanceDocumentPage";

export default function InvoiceDetailsPage() {
  const params = useParams();
  const fallback = useMemo(() => makeFinanceFallback(params.id, "invoice"), [params.id]);

  return (
    <FinanceDocumentPage
      documentType="invoice"
      title="Invoice"
      endpoint="invoice"
      listPath="/invoices"
      editPathPrefix="/invoices"
      fallback={fallback}
    />
  );
}
