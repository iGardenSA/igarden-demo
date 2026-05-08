// ─── Supabase Auth Client — iGarden Smart OS ────────────────────────
// Wraps @supabase/supabase-js Auth and registers the JWT provider so
// every REST/Storage call automatically carries the user's access token.
// Safe when env vars are absent: supabaseAuth will be null and the
// REST client falls back to the anon key.
// ────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { setSupabaseAccessTokenProvider } from './supabase';

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabaseAuth =
  url && anonKey ? createClient(url, anonKey) : null;

export function registerSupabaseAuthTokenProvider(): void {
  if (!supabaseAuth) return;

  setSupabaseAccessTokenProvider(async () => {
    const { data } = await supabaseAuth.auth.getSession();
    return data.session?.access_token ?? null;
  });
}
