import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

  if (!iclockEmployeesUrl || !iclockApiToken) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "iClock employees API is not configured.",
      },
      { status: 500 },
    );
  }

  const { searchParams } = request.nextUrl;
  const upstreamUrl = new URL(iclockEmployeesUrl);

  upstreamUrl.searchParams.set("page_size", searchParams.get("page_size") || "10000");

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
          message: `iClock employees API returned ${response.status}`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: getEmployees(payload),
      meta: payload && typeof payload === "object" ? {
        count: (payload as Record<string, unknown>).count,
        next: (payload as Record<string, unknown>).next,
        previous: (payload as Record<string, unknown>).previous,
      } : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to connect to iClock employees API";
    return NextResponse.json({ success: false, data: [], message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
