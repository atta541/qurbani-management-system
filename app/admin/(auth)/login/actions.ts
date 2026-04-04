"use server";

import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export type LoginActionState =
  | null
  | { error: string }
  | { ok: true; next: string };

/**
 * Do not call `redirect()` here: this action is used with `useActionState`, which can turn a
 * redirect into a failed POST (500 + digest) in production. On success, return `{ ok, next }`
 * and let the client `router.push` after the response applies `Set-Cookie`.
 */
export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      return { error: "Invalid email or password." };
    }

    await createAdminSession(admin.id);
    return { ok: true, next };
  } catch (e) {
    console.error("[loginAction]", e);
    return {
      error:
        "Could not sign you in. If this keeps happening, check that DATABASE_URL and ADMIN_SESSION_SECRET are set on the server.",
    };
  }
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
