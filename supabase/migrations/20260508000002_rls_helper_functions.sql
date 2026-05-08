-- ── RLS Helper Functions — iGarden Smart OS ──────────────────────────
-- is_farm_member() and has_farm_role() are used by Sprint 9D policies.
-- Demo policies remain active until Supabase Auth is wired (Sprint 9C).
-- ─────────────────────────────────────────────────────────────────────

create or replace function is_farm_member(target_farm_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from farm_memberships
    where farm_id  = target_farm_id
      and user_id  = auth.uid()
      and status   = 'active'
  );
$$;

create or replace function has_farm_role(target_farm_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from farm_memberships
    where farm_id  = target_farm_id
      and user_id  = auth.uid()
      and status   = 'active'
      and role     = any(allowed_roles)
  );
$$;
