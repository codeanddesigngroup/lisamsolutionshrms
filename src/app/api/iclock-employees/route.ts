import { NextRequest, NextResponse } from "next/server";
import { fetchIclockJson } from "@/lib/iclock-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type IclockEmployee = {
  id?: number | string;
  emp_code?: number | string;
  employee_id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  department?: unknown;
  position?: unknown;
};

const getEmployees = (payload: unknown): IclockEmployee[] => {
  if (Array.isArray(payload)) return payload as IclockEmployee[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results)) return record.results as IclockEmployee[];
    if (Array.isArray(record.data)) return record.data as IclockEmployee[];
  }
  return [];
};

export async function GET(request: NextRequest) {
  const iclockEmployeesUrl = process.env.ICLOCK_EMPLOYEES_URL;
  const iclockApiToken = process.env.ICLOCK_API_TOKEN;

  const { searchParams } = request.nextUrl;
  const result = await fetchIclockJson({
    apiUrl: iclockEmployeesUrl,
    apiToken: iclockApiToken,
    label: "iClock employees",
    searchParams: {
      page_size: searchParams.get("page_size") || "10000",
    },
  });

  if (result.success) {
    return NextResponse.json({
      success: true,
      data: getEmployees(result.payload),
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
    message: result.message || "Unable to load iClock employees.",
    upstreamStatus: result.upstreamStatus,
  });
}
