import { verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return new TextEncoder().encode(secret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function createAdminSession(adminId: number) {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ typ: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(adminId))
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DAYS * 24 * 60 * 60)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, cookieOptions());
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
}

export async function getAdminFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const adminId = Number(payload.sub);
    if (!Number.isFinite(adminId)) return null;

    return await prisma.admin.findFirst({
      where: { id: adminId, isActive: true },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getAdminFromSession();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, password: true, isActive: true },
  });
  if (!admin?.isActive) return null;

  try {
    const ok = await verify(admin.password, password);
    if (!ok) return null;
    return { id: admin.id };
  } catch {
    // Corrupt hash or argon verify failure — treat as failed login, avoid 500
    return null;
  }
}

