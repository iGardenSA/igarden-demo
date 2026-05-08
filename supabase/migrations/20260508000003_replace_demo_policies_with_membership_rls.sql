-- ── Replace Demo Policies with Membership RLS — iGarden Smart OS ─────
-- Drop permissive demo policies and replace with farm_memberships-based
-- access control. Storage policies remain open until Sprint 9F.
-- Prerequisite: at least one row in farm_memberships for the active user.
-- ──────────────────────────────────────────────────────────────────────

-- Drop demo read policies
drop policy if exists "demo_read_farms"              on farms;
drop policy if exists "demo_read_zones"              on zones;
drop policy if exists "demo_read_batches"            on batches;
drop policy if exists "demo_read_audit_events"       on audit_events;
drop policy if exists "demo_read_input_usage_logs"   on input_usage_logs;
drop policy if exists "demo_read_calibration_logs"   on calibration_logs;
drop policy if exists "demo_read_water_sources"      on water_sources;
drop policy if exists "demo_read_report_exports"     on report_exports;

-- Drop demo insert policies
drop policy if exists "demo_insert_audit_events"     on audit_events;
drop policy if exists "demo_insert_report_exports"   on report_exports;

-- Membership-based read policies
create policy "members_can_read_farms"
  on farms for select
  using (is_farm_member(id));

create policy "members_can_read_zones"
  on zones for select
  using (is_farm_member(farm_id));

create policy "members_can_read_batches"
  on batches for select
  using (is_farm_member(farm_id));

create policy "members_can_read_audit_events"
  on audit_events for select
  using (is_farm_member(farm_id));

create policy "members_can_read_input_usage_logs"
  on input_usage_logs for select
  using (is_farm_member(farm_id));

create policy "members_can_read_calibration_logs"
  on calibration_logs for select
  using (is_farm_member(farm_id));

create policy "members_can_read_water_sources"
  on water_sources for select
  using (is_farm_member(farm_id));

-- report_exports: allow null farm_id rows (fallback exports before Sprint 9F)
create policy "members_can_read_report_exports"
  on report_exports for select
  using (farm_id is null or is_farm_member(farm_id));

-- Role-based insert policies
create policy "operators_can_insert_audit_events"
  on audit_events for insert
  with check (has_farm_role(farm_id, array['owner', 'operator', 'technician']));

-- Allow null farm_id inserts until Sprint 9F enforces it
create policy "owners_and_auditors_can_insert_report_exports"
  on report_exports for insert
  with check (farm_id is null or has_farm_role(farm_id, array['owner', 'auditor']));
