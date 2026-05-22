import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =========================================================================
// Server-only Supabase client (uses service_role — bypasses RLS).
// Used by every server component, Server Action, and the seed script.
// MUST NOT be imported into a "use client" component — would leak the key.
// =========================================================================

const g = globalThis as unknown as { __igardenSupabase?: SupabaseClient };

export function getServerSupabase(): SupabaseClient {
  if (g.__igardenSupabase) return g.__igardenSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only)");

  g.__igardenSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
  return g.__igardenSupabase;
}
