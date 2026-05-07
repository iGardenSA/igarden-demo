-- ═══════════════════════════════════════════════════════════════════
-- iGarden Smart OS — Append-only Guardrails for audit_events
-- Migration: 20260507000002_append_only_triggers
-- Sprint 5C: Database-level enforcement of the append-only model
-- ═══════════════════════════════════════════════════════════════════
-- This is the first real transition from "Tamper-evident demo"
-- to "append-only backend behavior".
-- ═══════════════════════════════════════════════════════════════════

-- ─── Trigger function ───────────────────────────────────────────────
create or replace function prevent_audit_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'audit_events are append-only. '
    'To correct event %, add a new correction event with correction_of = ''%''.',
    old.event_id, old.event_id;
end;
$$;

-- ─── Attach to UPDATE and DELETE ────────────────────────────────────
create trigger prevent_audit_event_update
  before update on audit_events
  for each row execute function prevent_audit_event_mutation();

create trigger prevent_audit_event_delete
  before delete on audit_events
  for each row execute function prevent_audit_event_mutation();

-- ─── Validate hash chain on INSERT ──────────────────────────────────
create or replace function validate_audit_event_chain()
returns trigger
language plpgsql
as $$
declare
  expected_prev text;
begin
  -- Find the hash of the most recent event in the same farm
  select event_hash
    into expected_prev
    from audit_events
   where farm_id = new.farm_id
   order by created_at desc
   limit 1;

  -- First event in the farm: must declare GENESIS
  if expected_prev is null then
    if new.previous_hash <> 'GENESIS' then
      raise exception
        'First audit event for this farm must have previous_hash = ''GENESIS''. Got: %',
        new.previous_hash;
    end if;
  else
    if new.previous_hash <> expected_prev then
      raise exception
        'Hash chain broken. Expected previous_hash = %, got %.',
        expected_prev, new.previous_hash;
    end if;
  end if;

  -- Mark chain status
  new.chain_status := 'valid';
  return new;
end;
$$;

create trigger validate_audit_event_chain
  before insert on audit_events
  for each row execute function validate_audit_event_chain();

comment on trigger prevent_audit_event_update on audit_events
  is 'Prevents any UPDATE on audit_events. Use correction events instead.';
comment on trigger prevent_audit_event_delete on audit_events
  is 'Prevents any DELETE on audit_events. Records are permanent.';
comment on trigger validate_audit_event_chain on audit_events
  is 'Validates that each new event continues the hash chain correctly.';
