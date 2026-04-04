/**
 * Database operations for `Year` (Eid season).
 *
 * Business rules (from schema / plan):
 * - At most one `Year` should have `isActive: true` at any time.
 * - Enforcing “exactly one active” is done here via a transaction when activating.
 *
 * Callers must ensure the current user is an authenticated admin (see server actions).
 *
 * ## Read caching
 * `listYearsForAdmin` and `getActiveYear` use Next.js `unstable_cache` (Data Cache) so
 * navigating between admin routes does not hit Postgres on every visit. Mutations must call
 * `revalidateTag(ADMIN_YEARS_CACHE_TAG)` (see season server actions).
 *
 * Note: In `next dev`, caching can be less aggressive; production builds benefit most.
 *
 * ## Debugging
 * In development, `[years-cache]` lines appear in the **terminal** running Next.js (not the
 * browser console). Compare “invoked” lines (every RSC run) vs “Prisma …” lines (actual DB).
 */
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { parseUtcDateOnly, type CreateYearFormValues } from "@/lib/validations/year";

/** Single tag for all cached `Year` reads — invalidate together on any write. */
export const ADMIN_YEARS_CACHE_TAG = "admin-years-data";

/** Dev-only: logs to the Node terminal (where `next dev` runs). If you see `Prisma …` only on first load then not when revisiting `/admin/season/years`, the Data Cache is working. */
function logYearsCacheDev(message: string, detail?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  if (detail) {
    console.log(`[years-cache] ${message}`, detail);
  } else {
    console.log(`[years-cache] ${message}`);
  }
}

/**
 * Shapes returned to the admin UI — avoid over-fetching.
 * On the server, date fields are `Date`. When passed into a Client Component, Next serializes them
 * to ISO strings — consumers must normalize (see `formatUtcDate` in the years UI).
 */
export type YearListItem = {
  id: number;
  year: number;
  label: string;
  eidDay1: Date | string;
  eidDay2: Date | string;
  eidDay3: Date | string;
  isActive: boolean;
  createdAt: Date | string;
};

async function listYearsForAdminUncached(limit: number): Promise<YearListItem[]> {
  logYearsCacheDev("Prisma findMany → years table (cache bypass or Data Cache miss)", {
    limit,
  });
  console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 listYearsForAdminUncached EXECUTED");
  return prisma.year.findMany({
    select: {
      id: true,
      year: true,
      label: true,
      eidDay1: true,
      eidDay2: true,
      eidDay3: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { year: "desc" },
    take: limit,
  });
}

/**
 * Cached list for the default admin page limit (100). Defined at module scope so the Data Cache
 * key is stable across requests.
 */
const getCachedYearsListDefault = unstable_cache(
  () => listYearsForAdminUncached(100),
  ["admin-years-list", "v1"],
  { tags: [ADMIN_YEARS_CACHE_TAG] },
);

/**
 * Lists seasons newest-first. Cap avoids unbounded scans if the table grows for decades.
 * Default `limit` is served from the Data Cache; other limits bypass cache (rare).
 */
export async function listYearsForAdmin(limit = 100): Promise<YearListItem[]> {
  const bounded = Math.min(Math.max(limit, 1), 500);
  logYearsCacheDev("listYearsForAdmin() invoked", {
    bounded,
    usesDataCache: bounded === 100,
  });
  if (bounded === 100) {
    return getCachedYearsListDefault();
  }
  return listYearsForAdminUncached(bounded);
}

const getCachedActiveYear = unstable_cache(
  async () => {
    logYearsCacheDev("Prisma findFirst → active year (Data Cache miss)", {});
    return prisma.year.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        year: true,
        label: true,
        eidDay1: true,
        eidDay2: true,
        eidDay3: true,
      },
    });
  },
  ["admin-active-year", "v1"],
  { tags: [ADMIN_YEARS_CACHE_TAG] },
);

/** The currently active season, if any (used by layout + later phases). */
export async function getActiveYear() {
  logYearsCacheDev("getActiveYear() invoked (Prisma runs only on Data Cache miss)", {});
  return getCachedActiveYear();
}

export type CreateYearResult =
  | { ok: true }
  | { ok: false; code: "DUPLICATE_YEAR" | "UNKNOWN"; message: string };

/**
 * Inserts a new season. New rows start inactive; admin explicitly activates one season.
 */
export async function createYearRecord(values: CreateYearFormValues): Promise<CreateYearResult> {
  try {
    await prisma.year.create({
      data: {
        year: values.year,
        label: values.label,
        eidDay1: parseUtcDateOnly(values.eidDay1),
        eidDay2: parseUtcDateOnly(values.eidDay2),
        eidDay3: parseUtcDateOnly(values.eidDay3),
        isActive: false,
      },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        code: "DUPLICATE_YEAR",
        message: "A season with this year number already exists. Choose a different year.",
      };
    }
    console.error("[createYearRecord]", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Could not create the season. Try again or check server logs.",
    };
  }
}

export type SetActiveYearResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "UNKNOWN"; message: string };

/**
 * Marks exactly one season as active: all others `isActive: false`, then target `true`.
 * Executed in one transaction to avoid a window with zero or multiple actives.
 */
export async function setActiveYearById(yearRowId: number): Promise<SetActiveYearResult> {
  const exists = await prisma.year.findUnique({
    where: { id: yearRowId },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, code: "NOT_FOUND", message: "That season no longer exists." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.year.updateMany({ data: { isActive: false } });
      await tx.year.update({
        where: { id: yearRowId },
        data: { isActive: true },
      });
    });
    return { ok: true };
  } catch (e) {
    console.error("[setActiveYearById]", e);
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Could not update the active season. Try again or check server logs.",
    };
  }
}
