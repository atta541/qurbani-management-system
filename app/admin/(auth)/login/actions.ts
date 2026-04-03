"use server";

import { redirect } from "next/navigation";

import {
  clearAdminSession,
  createAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function loginAction(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    return { error: "Invalid email or password." };
  }

  await createAdminSession(admin.id);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

