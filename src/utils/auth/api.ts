import { apiUrl, fetchWithSession } from "@/utils/api/client";
import type { AuthMode, CurrentUserResponse } from "./types";

function safeNextPath(nextPath: string) {
  return nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
}

export function loginUrl(nextPath = "/") {
  return apiUrl(`/auth/login?next=${encodeURIComponent(safeNextPath(nextPath))}`);
}

export async function getAuthConfig(): Promise<{ mode: AuthMode }> {
  const response = await fetch(apiUrl("/auth/config"), {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch authentication configuration (${response.status}).`);
  }

  return response.json() as Promise<{ mode: AuthMode }>;
}

export async function getUserInfo(): Promise<CurrentUserResponse | null> {
  const response = await fetch(apiUrl("/auth/userinfo"), {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to validate the authentication session (${response.status}).`);
  }

  return response.json() as Promise<CurrentUserResponse>;
}

export async function logout() {
  const response = await fetchWithSession(apiUrl("/auth/logout"), {
    method: "POST",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to sign out cleanly.");
  }

  return response.json() as Promise<{ message: string; logout_url: string }>;
}
