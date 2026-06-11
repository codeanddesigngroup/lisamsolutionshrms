type IclockFetchOptions = {
  apiUrl?: string;
  apiToken?: string;
  label: string;
  searchParams?: Record<string, string | undefined>;
};

type IclockFetchResult = {
  success: boolean;
  payload: unknown;
  message?: string;
  upstreamStatus?: number;
};

const ICLOCK_TIMEOUT_MS = 15000;

const getPayloadMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  for (const key of ["detail", "message", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

export async function fetchIclockJson({
  apiUrl,
  apiToken,
  label,
  searchParams = {},
}: IclockFetchOptions): Promise<IclockFetchResult> {
  if (!apiUrl || !apiToken) {
    return {
      success: false,
      payload: null,
      message: `${label} API is not configured.`,
    };
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(apiUrl);
  } catch {
    return {
      success: false,
      payload: null,
      message: `${label} API URL is invalid.`,
    };
  }

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) upstreamUrl.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ICLOCK_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Token ${apiToken}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const body = await response.text();
    const payload = body ? JSON.parse(body) : null;

    if (!response.ok) {
      const detail = getPayloadMessage(payload);
      return {
        success: false,
        payload,
        message: detail || `${label} API returned ${response.status}.`,
        upstreamStatus: response.status,
      };
    }

    return { success: true, payload };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `${label} API timed out after ${ICLOCK_TIMEOUT_MS / 1000} seconds.`
        : error instanceof SyntaxError
          ? `${label} API returned invalid JSON.`
          : error instanceof Error
            ? error.message
            : `Unable to connect to ${label} API.`;

    return {
      success: false,
      payload: null,
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
