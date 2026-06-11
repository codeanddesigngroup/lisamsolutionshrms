import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  if (!iclockTransactionsUrl || !iclockApiToken) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "iClock transactions API is not configured.",
      },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const upstreamUrl = new URL(iclockTransactionsUrl);

  upstreamUrl.searchParams.set("page_size", searchParams.get("page_size") || "10000");

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    upstreamUrl.searchParams.set("start_time", `${date} 00:00:00`);
    upstreamUrl.searchParams.set("end_time", `${date} 23:59:59`);
  } else if (
    startDate &&
    endDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    upstreamUrl.searchParams.set("start_time", `${startDate} 00:00:00`);
    upstreamUrl.searchParams.set("end_time", `${endDate} 23:59:59`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Token ${iclockApiToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message: `iClock API returned ${response.status}`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: getTransactions(payload),
      meta: payload && typeof payload === "object" ? {
        count: (payload as Record<string, unknown>).count,
        next: (payload as Record<string, unknown>).next,
        previous: (payload as Record<string, unknown>).previous,
      } : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to connect to iClock API";
    return NextResponse.json({ success: false, data: [], message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
