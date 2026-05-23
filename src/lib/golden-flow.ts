import { getServerSupabase } from "./supabase/server";

/**
 * Brief §4 Phase 2.1 — the one-button incident at the heart of the demo.
 *
 * Delegates to a Postgres function (idempotent re-arm of the EC excursion +
 * its alert + its pending AI recommendation). Centralising it in the DB
 * means even non-Next clients (e.g. a manual SQL re-trigger during a live
 * demo) hit the same logic.
 */
export async function triggerGoldenFlow(): Promise<{ ok: boolean; alertId?: string }> {
  const { data, error } = await getServerSupabase().rpc("trigger_golden_flow");
  if (error) { console.warn("[golden-flow]", error); return { ok: false }; }
  return { ok: true, alertId: (data as string | null) ?? undefined };
}
