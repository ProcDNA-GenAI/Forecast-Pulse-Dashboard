const DEFAULT_API_URL = "http://localhost:8001";

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
  return configuredUrl.endsWith("/") ? configuredUrl.slice(0, -1) : configuredUrl;
}

export function apiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

export function apiRequestUrl(path: string) {
  return new URL(
    apiUrl(path),
    typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
  );
}

export function readApiError(bodyText: string, fallback: string) {
  try {
    const parsed = JSON.parse(bodyText) as {
      detail?: unknown;
      error?: unknown;
      response?: unknown;
    };

    for (const value of [parsed.detail, parsed.error, parsed.response]) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  } catch {
    if (bodyText.trim()) {
      return bodyText.trim();
    }
  }

  return fallback;
}

const SESSION_EXPIRED_MESSAGE = "Your session has expired. Signing you in again.";
const SESSION_EXPIRED_TOAST_KEY = "forecast_pulse_session_expired";
const AUTH_REDIRECTING_KEY = "forecast_pulse_auth_redirecting";

export function consumeSessionExpiredMessage() {
  if (typeof window === "undefined") {
    return null;
  }

  const message = sessionStorage.getItem(SESSION_EXPIRED_TOAST_KEY);
  sessionStorage.removeItem(SESSION_EXPIRED_TOAST_KEY);
  sessionStorage.removeItem(AUTH_REDIRECTING_KEY);
  return message;
}

export function redirectToLoginOnSessionExpired(message = SESSION_EXPIRED_MESSAGE) {
  if (typeof window === "undefined") {
    return;
  }

  const isRedirecting = sessionStorage.getItem(AUTH_REDIRECTING_KEY) === "1";
  sessionStorage.setItem(SESSION_EXPIRED_TOAST_KEY, message);
  sessionStorage.setItem(AUTH_REDIRECTING_KEY, "1");

  if (window.location.pathname !== "/login" && !isRedirecting) {
    const nextPath = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
  }
}

export async function fetchWithSession(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.status === 401) {
    redirectToLoginOnSessionExpired();
  }

  return response;
}

export function requestSignal(signal?: AbortSignal, timeoutMs = 600_000) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}
