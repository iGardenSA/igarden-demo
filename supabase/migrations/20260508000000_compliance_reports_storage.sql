-- ── Compliance Reports Storage Bucket — iGarden Smart OS ───────────
-- Private bucket for exported compliance PDF reports.
-- Storage path: compliance-reports/demo/<reportId>.pdf
-- Sprint 9 will tighten these policies with auth + farm membership.
-- ───────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('compliance-reports', 'compliance-reports', false)
on conflict (id) do nothing;

-- Demo insert policy (open for demo; lock down in Sprint 9)
create policy "demo_insert_compliance_reports"
on storage.objects for insert
with check (bucket_id = 'compliance-reports');

-- Demo read policy
create policy "demo_read_compliance_reports"
on storage.objects for select
using (bucket_id = 'compliance-reports');
