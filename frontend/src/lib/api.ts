import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Session = {
  token: string;
  role: string;
  name: string;
};

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("ciq_token")?.value;
  const role = jar.get("ciq_role")?.value;
  const name = jar.get("ciq_name")?.value;
  if (!token || !role || !name) return null;
  return { token, role, name };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getSession();
  if (!session) redirect("/login");

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("The CustomerIQ API is not running.", 503);
  }

  if (response.status === 401) redirect("/login");

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? "Request failed";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export function apiBase() {
  return API_URL;
}
