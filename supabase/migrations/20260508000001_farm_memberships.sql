-- ── Farm Memberships — iGarden Smart OS ─────────────────────────────
-- Links users to farms with a role. Sprint 9D will activate RLS
-- policies that use this table; demo policies remain untouched for now.
-- ────────────────────────────────────────────────────────────────────
create table farm_memberships (
  id         uuid        primary key default gen_random_uuid(),
  farm_id    uuid        not null references farms(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('owner', 'operator', 'technician', 'auditor')),
  status     text        not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz default now(),
  unique (farm_id, user_id)
);

create index farm_memberships_user_id_idx on farm_memberships(user_id);
create index farm_memberships_farm_id_idx on farm_memberships(farm_id);
create index farm_memberships_role_idx    on farm_memberships(role);
