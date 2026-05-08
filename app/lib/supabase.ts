// ─── Supabase REST client — iGarden Smart OS ───────────────────────
// Uses plain fetch() against the Supabase PostgREST / Storage APIs.
// No SDK dependency — install @supabase/supabase-js in Sprint 9D when
// Auth UI is added, then wire registerSupabaseAuthTokenProvider().
//
// Auth token flow (Sprint 9C):
//   - setSupabaseAccessTokenProvider() registers a function that returns
//     the logged-in user's JWT.
//   - getAuthorizationToken() calls it; falls back to the anon key when
//     no provider is registered or the provider returns null.
//   - All REST/Storage calls use getAuthorizationToken(), so once Auth is
//     wired the requests automatically carry the user JWT and RLS fires.
// ───────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = () =>
  SUPABASE_URL !== '' && SUPABASE_ANON !== '';

// ─── Auth token provider ─────────────────────────────────────────────
// Registered by supabase-auth.ts in Sprint 9D once Auth SDK is wired.

let accessTokenProvider: (() => Promise<string | null>) | null = null;

export function setSupabaseAccessTokenProvider(
  provider: (() => Promise<string | null>) | null
): void {
  accessTokenProvider = provider;
}

async function getAuthorizationToken(): Promise<string> {
  if (accessTokenProvider) {
    const token = await accessTokenProvider();
    if (token) return token;
  }
  return SUPABASE_ANON;
}

// ─── Low-level PostgREST helper ──────────────────────────────────────

async function rest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const token = await getAuthorizationToken();
  const url   = `${SUPABASE_URL}/rest/v1/${path}`;
  const res   = await fetch(url, {
    ...options,
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${token}`,
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

// ─── Generic get helper ───────────────────────────────────────────────

export async function get<T = Record<string, unknown>>(
  table: string,
  query = ''
): Promise<T[]> {
  const path   = query ? `${table}?${query}` : table;
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

// ─── Generic POST ────────────────────────────────────────────────────
// Throws on HTTP errors so the caller can decide what to do.

export async function post<T = Record<string, unknown>>(
  table: string,
  body: Record<string, unknown>
): Promise<T[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const token = await getAuthorizationToken();
  const url   = `${SUPABASE_URL}/rest/v1/${table}`;
  const res   = await fetch(url, {
    method:  'POST',
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase POST ${table}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T[]>;
}

// ─── Storage helpers ─────────────────────────────────────────────────

export async function uploadStorageObject(input: {
  bucket:       string;
  path:         string;
  body:         Blob;
  contentType?: string;
}): Promise<{ path: string }> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');
  const token    = await getAuthorizationToken();
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${input.bucket}/${input.path}`,
    {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${token}`,
        'Content-Type':  input.contentType ?? 'application/octet-stream',
        'x-upsert':      'true',
      },
      body: input.body,
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase storage upload failed: ${response.status} ${errorText}`);
  }
  return { path: input.path };
}

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
