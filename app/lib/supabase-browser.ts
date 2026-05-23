"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =========================================================================
// Browser Supabase client (anon key — read-only per RLS policies).
// Currently unused — the demo reads server-side. Provided for future
// real-time subscriptions when live MQTT bridge lands (post-G2).
// =========================================================================

let cached: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
