// ─── Supabase REST client — iGarden Smart OS ───────────────────────
// Uses plain fetch() against the Supabase PostgREST API.
// No SDK dependency — install @supabase/supabase-js when ready, then
// replace these helpers with the typed client.
//
// Setup:
//   1. cp .env.example .env.local  and fill in the two variables
//   2. Apply migrations:  supabase db push  (or Supabase dashboard SQL editor)
//   3. Run seed:          supabase db seed --db-url <connection-string>
//
// The frontend continues to use mock data from page.tsx until Sprint 6.
// ───────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = () =>
  SUPABASE_URL !== '' && SUPABASE_ANON !== '';

// Low-level PostgREST helper
async function rest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    console.error(`[iGarden] Supabase ${path}:`, res.status, await res.text());
    return null;
  }
  return res.json() as Promise<T>;
}

// ─── Generic get helper (used by compliance-data.ts) ─────────────────
// Fetches rows from a table with optional PostgREST query string.
// Returns empty array on error or when Supabase is not configured.
export async function get<T = Record<string, unknown>>(
  table: string,
  query = ''
): Promise<T[]> {
  const path = query ? `${table}?${query}` : table;
  const result = await rest<T[]>(path);
  return result ?? [];
}

// ─── Read helpers ────────────────────────────────────────────────────

export async function fetchDemoFarm() {
  return rest<Record<string, unknown>>(
    'farms?farm_code=eq.DEMO-001&data_mode=eq.demo&limit=1'
  ).then(r => (Array.isArray(r) ? r[0] ?? null : r));
}

export async function fetchAuditEvents(farmId: string, limit = 50) {
  return rest<Record<string, unknown>[]>(
    `audit_events?farm_id=eq.${farmId}&order=created_at.desc&limit=${limit}`
  ).then(r => r ?? []);
}

export async function fetchBatches(farmId: string) {
  return rest<Record<string, unknown>[]>(
    `batches?farm_id=eq.${farmId}&order=created_at.desc`
  ).then(r => r ?? []);
}

// ─── Write helpers ────────────────────────────────────────────────────

export async function insertReportExport(payload: {
  report_id:    string;
  farm_id:      string;
  report_type:  string;
  data_mode:    string;
  generated_by?: string;
  disclaimer?:  string;
}) {
  return rest<Record<string, unknown>>(
    'report_exports',
    {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(payload),
    }
  );
}
