-- ═══════════════════════════════════════════════════════════════════
-- iGarden Smart OS — Compliance Schema Foundation
-- Migration: 20260507000000_compliance_schema
-- Sprint 5A: Supabase tables for compliance demo
-- ═══════════════════════════════════════════════════════════════════
-- Design principles:
--   • audit_events is append-only (enforced in Sprint 5C via triggers)
--   • All tables carry farm_id for future multi-tenant RLS
--   • data_mode column distinguishes 'demo' vs 'live' rows
--   • No hard delete on compliance records — use status flags instead
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. farms ───────────────────────────────────────────────────────
create table if not exists farms (
  id          uuid primary key default gen_random_uuid(),
  farm_code   text not null unique,
  name        text,
  region      text,
  system_type text,
  data_mode   text not null default 'demo'
                   check (data_mode in ('demo', 'live')),
  created_at  timestamptz not null default now()
);

comment on table  farms              is 'Top-level farm entities. One row per physical farm.';
comment on column farms.farm_code    is 'Human-readable identifier shown in exports (e.g. DEMO-001).';
comment on column farms.data_mode    is 'demo = simulated data; live = real production data.';

-- ─── 2. zones ───────────────────────────────────────────────────────
create table if not exists zones (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references farms(id) on delete restrict,
  zone_code   text not null,
  crop        text,
  system_type text,
  status      text not null default 'active'
                   check (status in ('active', 'inactive', 'maintenance')),
  created_at  timestamptz not null default now(),
  unique (farm_id, zone_code)
);

comment on table zones is 'Growing zones / greenhouses within a farm.';

-- ─── 3. batches ─────────────────────────────────────────────────────
create table if not exists batches (
  id                uuid primary key default gen_random_uuid(),
  batch_id          text not null unique,
  farm_id           uuid not null references farms(id)   on delete restrict,
  zone_id           uuid          references zones(id)   on delete set null,
  crop              text not null,
  planting_date     date,
  expected_harvest  date,
  actual_harvest    date,
  water_source      text,
  inputs_summary    text,
  sensor_summary    text,
  invoice_reference text,
  status            text not null default 'active'
                         check (status in ('active', 'harvested', 'cancelled')),
  created_at        timestamptz not null default now()
);

comment on table  batches                  is 'Production batches — core traceability unit.';
comment on column batches.batch_id         is 'Human-readable batch identifier (e.g. BATCH-TOM-2026-001).';
comment on column batches.invoice_reference is 'Links harvest batch to ZATCA invoice reference. Not the invoice itself.';

-- ─── 4. audit_events (append-only) ──────────────────────────────────
create table if not exists audit_events (
  id             uuid primary key default gen_random_uuid(),
  event_id       text not null unique,
  farm_id        uuid not null references farms(id)    on delete restrict,
  zone_id        uuid          references zones(id)    on delete set null,
  batch_id       uuid          references batches(id)  on delete set null,
  actor_type     text not null
                      check (actor_type in ('System', 'Operator', 'Technician', 'Auditor', 'Owner')),
  actor_id       text,
  action         text not null,
  before_value   text,
  after_value    text,
  reason         text,
  previous_hash  text not null,
  event_hash     text not null,
  chain_status   text not null default 'valid'
                      check (chain_status in ('valid', 'broken', 'unverified')),
  -- correction_of links a correction event to the original event it corrects
  correction_of  text references audit_events(event_id) on delete set null,
  created_at     timestamptz not null default now()
);

comment on table  audit_events               is 'Append-only audit log. Never update or delete rows.';
comment on column audit_events.previous_hash is 'Hash of the immediately preceding event in the chain. GENESIS for first event.';
comment on column audit_events.event_hash    is 'Hash(event_id || previous_hash). Tamper-evidence indicator.';
comment on column audit_events.correction_of is 'If set, this event corrects a previous event. Original is never modified.';

-- ─── 5. input_usage_logs ────────────────────────────────────────────
create table if not exists input_usage_logs (
  id          uuid primary key default gen_random_uuid(),
  input_id    text not null unique,
  farm_id     uuid not null references farms(id)    on delete restrict,
  zone_id     uuid          references zones(id)    on delete set null,
  batch_id    uuid          references batches(id)  on delete set null,
  input_type  text,
  input_name  text not null,
  quantity    numeric,
  unit        text,
  applied_by  text,
  applied_at  timestamptz,
  reason      text,
  created_at  timestamptz not null default now()
);

comment on table input_usage_logs is 'Agricultural input records (fertilizers, pesticides, etc.) linked to batches.';

-- ─── 6. calibration_logs ────────────────────────────────────────────
create table if not exists calibration_logs (
  id               uuid primary key default gen_random_uuid(),
  device_id        text not null,
  device_type      text,
  farm_id          uuid not null references farms(id)  on delete restrict,
  zone_id          uuid          references zones(id)  on delete set null,
  last_calibration date,
  next_calibration date,
  technician       text,
  status           text not null default 'valid'
                        check (status in ('valid', 'review_soon', 'overdue')),
  notes            text,
  created_at       timestamptz not null default now()
);

comment on table calibration_logs is 'Sensor calibration history. New row per calibration event; old rows are never overwritten.';

-- ─── 7. water_sources ───────────────────────────────────────────────
create table if not exists water_sources (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references farms(id) on delete restrict,
  source_name    text not null,
  treatment_type text,
  last_test_date date,
  ph             numeric check (ph >= 0 and ph <= 14),
  ec             numeric check (ec >= 0),
  tds            numeric check (tds >= 0),
  status         text not null default 'operational'
                      check (status in ('operational', 'monitoring', 'offline')),
  attachment_url text,
  created_at     timestamptz not null default now()
);

comment on table water_sources is 'Irrigation water source records per farm.';

-- ─── 8. report_exports ──────────────────────────────────────────────
create table if not exists report_exports (
  id           uuid primary key default gen_random_uuid(),
  report_id    text not null unique,
  farm_id      uuid          references farms(id) on delete restrict, -- nullable until Sprint 9B wires activeFarmId
  report_type  text not null
                    check (report_type in (
                      'mewa-monthly', 'saudi-gap', 'water-efficiency',
                      'zatca-invoice', 'compliance-readiness', 'audit-trail',
                      'batch-traceability'
                    )),
  data_mode    text not null default 'demo'
                    check (data_mode in ('demo', 'live')),
  generated_by text,
  generated_at timestamptz not null default now(),
  file_url     text,
  disclaimer   text
);

comment on table  report_exports             is 'Log of every report/PDF export. Enables export audit trail.';
comment on column report_exports.report_id   is 'Human-readable ID (e.g. RPT-DEMO-202605-0001). Matches getReportMetadata().';
comment on column report_exports.file_url    is 'Storage URL when file is persisted. NULL for browser-only downloads.';

-- ─── Indexes ────────────────────────────────────────────────────────
create index if not exists idx_audit_events_farm_id     on audit_events(farm_id);
create index if not exists idx_audit_events_event_id    on audit_events(event_id);
create index if not exists idx_audit_events_created_at  on audit_events(created_at desc);
create index if not exists idx_audit_events_actor_type  on audit_events(actor_type);
create index if not exists idx_batches_farm_id          on batches(farm_id);
create index if not exists idx_batches_batch_id         on batches(batch_id);
create index if not exists idx_report_exports_farm_id   on report_exports(farm_id);
create index if not exists idx_report_exports_generated on report_exports(generated_at desc);
create index if not exists idx_input_usage_batch_id     on input_usage_logs(batch_id);
create index if not exists idx_calibration_farm_id      on calibration_logs(farm_id);
