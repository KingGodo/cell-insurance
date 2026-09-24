"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiBase, getSession } from "@/lib/api";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 12,
};

export async function login(_previous: { error: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let destination = "/dashboard";
  try {
    const response = await fetch(`${apiBase()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { error: body?.error?.message ?? "Sign-in failed" };
    }

    const user = body.data.user as { role: string; name: string };
    const jar = await cookies();
    jar.set("ciq_token", body.data.token, cookieOptions);
    jar.set("ciq_role", user.role, cookieOptions);
    jar.set("ciq_name", user.name, cookieOptions);
    destination = user.role === "CUSTOMER" ? "/account" : "/dashboard";
  } catch {
    return { error: "The CustomerIQ API is not running. Start it from the backend folder." };
  }

  redirect(destination);
}

export async function logout() {
  const jar = await cookies();
  jar.delete("ciq_token");
  jar.delete("ciq_role");
  jar.delete("ciq_name");
  redirect("/");
}

export async function updateClaimStatus(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");

  await fetch(`${apiBase()}/api/v1/claims/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, note: note || undefined }),
  });

  revalidatePath(`/claims/${id}`);
  revalidatePath("/claims");
  revalidatePath("/dashboard");
}

export async function addClaimDocument(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  const fileName = String(formData.get("fileName") ?? "");
  const documentType = String(formData.get("documentType") ?? "");

  await fetch(`${apiBase()}/api/v1/claims/${id}/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName, documentType }),
  });

  revalidatePath(`/claims/${id}`);
}
