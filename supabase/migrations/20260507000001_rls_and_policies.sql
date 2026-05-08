-- ═══════════════════════════════════════════════════════════════════
-- iGarden Smart OS — Row Level Security + Demo Policies
-- Migration: 20260507000001_rls_and_policies
-- Sprint 5B: Enable RLS; add temporary read-all policies for demo
-- ═══════════════════════════════════════════════════════════════════
-- IMPORTANT: The demo policies below (using: true) are intentionally
-- permissive for the demo environment.  Replace with authenticated
-- policies before any production launch.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Enable RLS on all compliance tables ────────────────────────────
alter table farms             enable row level security;
alter table zones             enable row level security;
alter table batches           enable row level security;
alter table audit_events      enable row level security;
alter table input_usage_logs  enable row level security;
alter table calibration_logs  enable row level security;
alter table water_sources     enable row level security;
alter table report_exports    enable row level security;

-- ─── Demo read-only policies ────────────────────────────────────────
-- These allow any anonymous visitor to read demo rows.
-- They will be replaced with auth.uid()-based policies in production.

create policy "demo_read_farms"
  on farms for select using (data_mode = 'demo');

create policy "demo_read_zones"
  on zones for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_batches"
  on batches for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_audit_events"
  on audit_events for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_input_usage_logs"
  on input_usage_logs for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_calibration_logs"
  on calibration_logs for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_water_sources"
  on water_sources for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_read_report_exports"
  on report_exports for select using (
    farm_id in (select id from farms where data_mode = 'demo')
  );

-- ─── Insert-only policy for audit_events (future service role) ──────
-- When the backend service role inserts events, it bypasses RLS.
-- This policy documents the intended write path for anon/authenticated.
-- Actual inserts will be done via service_role in production.
create policy "demo_insert_audit_events"
  on audit_events for insert
  with check (
    farm_id in (select id from farms where data_mode = 'demo')
  );

create policy "demo_insert_report_exports"
  on report_exports for insert
  with check (
    farm_id in (select id from farms where data_mode = 'demo')
  );
