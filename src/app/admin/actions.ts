"use server";

import { updateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/data";
import { requireAdmin } from "@/lib/supabase/server";

/**
 * Appelée par le back-office après chaque modification : invalide le cache
 * des pages publiques pour que le site reflète immédiatement les changements.
 */
export async function refreshPublicSite(): Promise<{ ok: boolean }> {
  const user = await requireAdmin();
  if (!user) return { ok: false };
  updateTag(CONTENT_TAG);
  return { ok: true };
}
