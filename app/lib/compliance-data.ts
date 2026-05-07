// ─── Compliance Data Adapter — iGarden Smart OS ────────────────────
// Fetches the 3 compliance tables from Supabase and maps them to
// the display shapes used by the UI components.
// Returns null when Supabase is not configured → UI falls back to
// mock constants from page.tsx.
// ───────────────────────────────────────────────────────────────────

import { isSupabaseConfigured, get } from './supabase';

// ── Display types (match the shapes expected by the UI components) ──

export type AuditEventDisplay = {
  id: string;
  ts: string;
  zone: string;
  actor: string;
  action: string;
  before: string;
  after: string;
  reason: string;
  status: string;
  hash: string;
};

export type BatchDisplay = {
  batchId: string;
  crop: string;
  zone: string;
  planting: string;
  harvest: string;
  water: string;
  inputs: string;
  sensor: string;
  invoice: string;
  statusLabel: string;
  statusColor: string;
};

export type WaterSourceDisplay = {
  source: string;
  treatment: string;
  lastTest: string;
  ph: string;
  ec: string;
  tds: string;
  status: string;
  attachment: string;
};

export type ComplianceLiveData = {
  auditEvents:  AuditEventDisplay[];
  batches:      BatchDisplay[];
  waterSources: WaterSourceDisplay[];
  source:       'supabase';
};

// ── Mappers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAuditEvents(rows: any[]): AuditEventDisplay[] {
  return rows.map(r => ({
    id:     r.event_id ?? r.id ?? '',
    ts:     (r.created_at ?? '').slice(0, 16).replace('T', ' '),
    zone:   r.zones?.zone_code ?? 'Demo Zone',
    actor:  r.actor_type ?? 'System',
    action: r.action ?? '',
    before: r.before_value ?? '',
    after:  r.after_value  ?? '',
    reason: r.reason       ?? '',
    status: r.chain_status === 'valid' ? 'Locked' : 'Review',
    hash:   r.event_hash   ?? '',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBatches(rows: any[]): BatchDisplay[] {
  return rows.map(r => ({
    batchId:     r.batch_id,
    crop:        r.crop,
    zone:        r.zones?.zone_code ?? 'Demo Zone',
    planting:    r.planting_date      ?? 'N/A',
    harvest:     r.expected_harvest   ?? 'N/A',
    water:       r.water_source       ?? 'N/A',
    inputs:      r.inputs_summary     ?? 'Linked in DB',
    sensor:      r.sensor_summary     ?? 'From demo database',
    invoice:     r.invoice_reference  ?? 'Not linked — demo',
    statusLabel: r.status === 'active'    ? '🟢 نشطة'
               : r.status === 'harvested' ? '✅ محصودة'
               :                           '⚪ ملغاة',
    statusColor: r.status === 'active'    ? '#059669'
               : r.status === 'harvested' ? '#2563EB'
               :                           '#6B7280',
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWaterSources(rows: any[]): WaterSourceDisplay[] {
  return rows.map(r => ({
    source:     r.source_name     ?? 'N/A',
    treatment:  r.treatment_type  ?? 'N/A',
    lastTest:   r.last_test_date  ?? 'N/A',
    ph:         r.ph  != null ? String(r.ph)        : 'N/A',
    ec:         r.ec  != null ? `${r.ec} mS/cm`     : 'N/A',
    tds:        r.tds != null ? `${r.tds} ppm`      : 'N/A',
    status:     r.status === 'operational' ? 'ضمن الهدف'
              : r.status === 'monitoring'  ? 'للمراقبة'
              :                             'غير متاح',
    attachment: 'غير مرفق — ديمو',
  }));
}

// ── Main fetch function ───────────────────────────────────────────────

export async function getComplianceLiveData(): Promise<ComplianceLiveData | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const [auditRows, batchRows, waterRows] = await Promise.all([
      get('audit_events', 'select=*,zones(zone_code)&order=created_at.desc&limit=50'),
      get('batches',      'select=*,zones(zone_code)&order=created_at.desc'),
      get('water_sources', 'order=created_at.asc'),
    ]);

    return {
      auditEvents:  mapAuditEvents(auditRows),
      batches:      mapBatches(batchRows),
      waterSources: mapWaterSources(waterRows),
      source:       'supabase',
    };
  } catch (err) {
    console.warn('[iGarden] Supabase data unavailable, using mock:', err);
    return null;
  }
}
