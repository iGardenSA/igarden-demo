# Compliance Demo — QA Checklist

> **Environment:** demo.igarden.sa  
> **Branch:** claude/add-compliance-tab-EyHaB  
> **Last updated:** 2026-05-08  
> **Status:** 🚀 Release Candidate

---

## RC-1 Manual Acceptance Test

Run these steps in order before any external demo share. Record pass/fail below.

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| 1 | Open compliance tab, confirm RC badge visible | "Release Candidate · Compliance Readiness Demo · Not a Certification Product" in banner | ☐ |
| 2 | Confirm you are logged out | Data Source badge = `🔵 بيانات محلية محاكاة`; Auth panel shows sign-in form | ☐ |
| 3 | Sign in via Magic Link | Link sent confirmation shown; click link in email → signed-in state | ☐ |
| 4 | Add owner membership in Supabase SQL Editor | `insert into farm_memberships (farm_id, user_id, role, status) select id, '<YOUR_UUID>', 'owner', 'active' from farms where farm_code = 'DEMO-001' on conflict (farm_id, user_id) do update set role = 'owner', status = 'active';` | ☐ |
| 5 | Refresh / wait for data | Data Source badge = `🟢 مصدر البيانات: قاعدة ديمو Supabase`; System Health all 🟢 | ☐ |
| 6 | Click "تقرير الامتثال PDF" | PDF downloads immediately to device | ☐ |
| 7 | Check Supabase Storage → compliance-reports | `demo/RPT-DEMO-*.pdf` file appears | ☐ |
| 8 | Check Supabase Table → report_exports | Row with `farm_id` + `file_url` + `report_type` visible | ☐ |
| 9 | Open downloaded PDF | Header shows correct `activeFarmCode`; disclaimer present on page 1; all sections populated | ☐ |
| 10 | Click "تسجيل خروج" | Auth panel resets to sign-in form; Data Source reverts to `🔵 Mock`; no page errors | ☐ |
| 11 | While logged out, click "تقرير الامتثال PDF" | PDF downloads; no insert error; console shows "no activeFarmId" info only | ☐ |

**RC-1 Outcome:** ☐ Pass &nbsp;&nbsp; ☐ Fail (document issues below)

**Tester:** _______________  **Date:** _______________  **Notes:** _______________

---

---

## Test Matrix

| # | Scenario | Expected behaviour | Status |
|---|----------|--------------------|--------|
| 1 | **No env vars** (`NEXT_PUBLIC_SUPABASE_*` absent) | Mock data only, no console errors, no broken UI | ☐ |
| 2 | **Env vars present + logged out** | Data source badge shows `🔵 بيانات محلية محاكاة`; Auth panel shows sign-in form | ☐ |
| 3 | **Logged in, no `farm_memberships` row** | Supabase returns empty arrays → fallback to mock; Auth panel shows "لا توجد عضوية مزرعة" warning | ☐ |
| 4 | **Logged in as `owner` with membership** | Data source badge shows `🟢 قاعدة ديمو Supabase`; live data visible | ☐ |
| 5 | **Owner exports PDF (Supabase live)** | PDF downloads immediately; Storage upload fires; `report_exports` row inserted with `farm_id` | ☐ |
| 6 | **Logged-out user exports PDF** | PDF downloads; no `report_exports` insert; no error or broken state | ☐ |
| 7 | **Attempt UPDATE on `audit_events`** | DB trigger raises exception; no row modified | ☐ |
| 8 | **Attempt DELETE on `audit_events`** | DB trigger raises exception; no row deleted | ☐ |
| 9 | **Storage upload fails** (e.g. wrong bucket policy) | PDF still downloads; `report_exports` logged with `file_url = null`; no UI error | ☐ |
| 10 | **Magic link sign-in flow** | Email input → link sent confirmation → clicking link signs user in → Auth panel switches to signed-in state | ☐ |
| 11 | **Sign out** | Auth panel resets to sign-in form; data source falls back to mock | ☐ |
| 12 | **System Health card accuracy** | Auth / Data source / Farm context / Report logging statuses match actual app state | ☐ |

---

## Acceptance criteria for "Demo-ready"

- [ ] All 12 scenarios pass
- [ ] No console errors in logged-out or logged-in state
- [ ] No "Certified", "Approved by MEWA", "Officially integrated" language visible anywhere
- [ ] All PDF exports carry correct `activeFarmCode` in header, metadata, and footer
- [ ] `report_exports` table receives rows only when owner is signed in with valid `farm_id`
- [ ] Append-only audit guardrails confirmed via DB test

---

## Language Audit — Forbidden Terms

Terms that must NOT appear as claims made by the system:

| Forbidden | Correct alternative |
|-----------|---------------------|
| Certified / معتمد (as system claim) | Readiness / جاهزية |
| Approved by MEWA | Aligned with MEWA requirements |
| Officially integrated | Ready for integration |
| Guaranteed Saudi GAP | Saudi GAP readiness indicators |
| Immutable (unqualified) | Append-only / tamper-evident (demo) |

> Legitimate uses of "معتمد": "مختبر معتمد" (accredited lab), "جهة معتمدة" (accredited body) — these are correct because they describe external parties, NOT iGarden itself.

---

## Known Limitations (by design)

- `auth.uid()` in SQL Editor returns `null` — use explicit UUID when seeding memberships
- Storage bucket policies remain demo-open in Sprint 9; tighten in Sprint 10+
- `report_exports.farm_id` read policy still allows `null` rows (legacy; clean up in production)
- Magic link email delivery depends on Supabase project SMTP configuration
