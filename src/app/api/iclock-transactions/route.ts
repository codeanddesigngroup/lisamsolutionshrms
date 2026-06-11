import { NextRequest, NextResponse } from "next/server";
import { fetchIclockJson } from "@/lib/iclock-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IclockTransaction = {
  id?: number | string;
  emp?: number | string;
  emp_code?: number | string;
  employee_id?: number | string;
  punch_time?: string;
  timestamp?: string;
  terminal_sn?: string;
  terminal_alias?: string;
  terminal_id?: number | string;
  area_alias?: string;
  punch_state?: string | number;
  verify_type?: string | number;
};

const getTransactions = (payload: unknown): IclockTransaction[] => {
  if (Array.isArray(payload)) return payload as IclockTransaction[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as IclockTransaction[];
    if (Array.isArray(record.data)) return record.data as IclockTransaction[];
  }
  return [];
};

export async function GET(request: NextRequest) {
  const iclockTransactionsUrl = process.env.ICLOCK_TRANSACTIONS_URL;
  const iclockApiToken = process.env.ICLOCK_API_TOKEN;

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const upstreamSearchParams: Record<string, string | undefined> = {
    page_size: searchParams.get("page_size") || "10000",
  };

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    upstreamSearchParams.start_time = `${date} 00:00:00`;
    upstreamSearchParams.end_time = `${date} 23:59:59`;
  } else if (
    startDate &&
    endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    upstreamSearchParams.start_time = `${startDate} 00:00:00`;
    upstreamSearchParams.end_time = `${endDate} 23:59:59`;
  }

  const result = await fetchIclockJson({
    apiUrl: iclockTransactionsUrl,
    apiToken: iclockApiToken,
    label: "iClock transactions",
    searchParams: upstreamSearchParams,
  });

  if (result.success) {
    return NextResponse.json({
      success: true,
      data: getTransactions(result.payload),
      meta: result.payload && typeof result.payload === "object" ? {
        count: (result.payload as Record<string, unknown>).count,
        next: (result.payload as Record<string, unknown>).next,
        previous: (result.payload as Record<string, unknown>).previous,
      } : undefined,
    });
  }

  return NextResponse.json({
    success: false,
    data: [],
    message: result.message || "Unable to load iClock transactions.",
    upstreamStatus: result.upstreamStatus,
  });
}
