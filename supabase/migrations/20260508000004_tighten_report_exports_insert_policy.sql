-- Sprint 9F: tighten report_exports insert policy — remove farm_id is null allowance
-- Before this: farm_id is null or has_farm_role(...)
-- After this:  has_farm_role(...) only — farm_id must be present and valid

drop policy if exists "owners_and_auditors_can_insert_report_exports" on report_exports;

create policy "owners_and_auditors_can_insert_report_exports"
  on report_exports for insert
  with check (
    has_farm_role(farm_id, array['owner', 'auditor'])
  );
