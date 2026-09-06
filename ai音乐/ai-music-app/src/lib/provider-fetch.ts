const DEFAULT_PROVIDER_TIMEOUT_MS = 90_000;

function timeoutMs() {
  const configured = Number(process.env.AI_PROVIDER_TIMEOUT_MS);
  return Number.isInteger(configured) && configured >= 1_000 && configured <= 120_000 ? configured : DEFAULT_PROVIDER_TIMEOUT_MS;
}

export async function providerFetch(input: string | URL, init: RequestInit = {}) {
  const url = new URL(String(input));
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:")) {
    throw new Error("PROVIDER_URL_REJECTED");
  }
  const timeout = AbortSignal.timeout(timeoutMs());
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(url, { ...init, signal, redirect: "error", cache: "no-store" });
}

export function providerHttpErrorResponse(response: Response) {
  const retryAfter = Number(response.headers.get("retry-after") ?? 0);
  const code = response.status === 429 ? "PROVIDER_RATE_LIMITED" : response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "PROVIDER_REJECTED";
  return Response.json({ error: response.status === 429 ? "AI 服务繁忙，请稍后重试。" : "AI 服务暂时无法完成生成。", code, retryable: response.status === 429 || response.status >= 500, ...(retryAfter > 0 ? { retryAfterSeconds: retryAfter } : {}) }, { status: response.status === 429 ? 429 : 502, headers: retryAfter > 0 ? { "Retry-After": String(retryAfter) } : undefined });
}

export function providerExceptionResponse(error: unknown) {
  const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
  return Response.json({ error: timeout ? "AI 服务响应超时，请稍后重试。" : "AI 服务暂时不可用。", code: timeout ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE", retryable: true }, { status: timeout ? 504 : 502 });
}
