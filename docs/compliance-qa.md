# Compliance Demo — QA Acceptance Checklist (RC-2)

> **Environment:** demo.igarden.sa
> **Branch:** `claude/review-demo-reports-QXsZc`
> **Last commit:** RC-2 stamp + EN partial-translation badge
> **Last updated:** 2026-05-08
> **Status:** 🚀 **RC-2 · Bilingual Compliance Readiness Demo · نموذج جاهزية امتثال ثنائي اللغة**

---

## What changed since RC-1

RC-2 introduces a **bilingual gate + UI** plus several compliance-language hardenings. Treat it as a release candidate, not a small patch:

1. Login gate (`demo / demo`) before any UI is shown
2. ar/en language switching (RTL ↔ LTR, persisted in localStorage)
3. Full Arabic PDF (html2canvas + jsPDF) replacing English-only `jsPDF + autoTable`
4. Real QR codes via `qrcode` library replacing 36-cell placeholder grids
5. Saudi GAP 8-item checklist now distinguishes **measured** (system data) from **external** (off-system documentation)
6. Removed fictitious inspector name; replaced with `<placeholder>` tokens
7. ZATCA section reframed as **Conceptual Linkage** with explicit warning that it is not a valid Phase 2 invoice
8. Dynamic EC threshold (3.5 mS/cm general; per-category bands documented)
9. Added GLOBALG.A.P. / ISO / Codex / EU MRL / ISO 27001 gap-analysis document
10. localStorage replaces sessionStorage (settings persist across tab close)
11. ConfirmDialog + ToastBanner replace `window.alert/confirm`
12. Seed script drops/recreates audit chain trigger so it can insert demo hashes
13. Footer carries **production-readiness note** for adoption messaging

---

## RC-2 Acceptance Test (run before any external share)

### Section A — Login Gate

| # | Action | Expected | Result |
|---|--------|----------|--------|
| A1 | Open the URL with no prior login (clear localStorage if needed) | `LoginScreen` appears, no leakage of dashboard content | ☐ |
| A2 | Switch language from the login screen | UI flips ar↔en, RTL↔LTR, brand text follows | ☐ |
| A3 | Sign in with `demo` / `demo` (Remember me ON) | Lands on Live Dashboard, header shows live pulse + lang + sign-out | ☐ |
| A4 | Refresh the tab | Stays signed in (localStorage persistence) | ☐ |
| A5 | Sign out from header | Returns to LoginScreen, no dashboard remnants visible | ☐ |
| A6 | Sign in with wrong credentials | Inline error: "Invalid username or password. Use demo / demo." | ☐ |
| A7 | Sign in with Remember me OFF, refresh | Returns to LoginScreen on refresh | ☐ |

### Section B — Bilingual UI

| # | Scenario | Expected | Result |
|---|----------|----------|--------|
| B1 | Toggle language from header (ع/EN button) | dir flips RTL/LTR; layout doesn't break | ☐ |
| B2 | Header on mobile (≤640px) | Logo + pulse + lang + signout fit; no overflow | ☐ |
| B3 | All 5 tabs are translated | live / engine / history / zones / compliance labels switch | ☐ |
| B4 | Transparency banner translates fully | ar and en versions of "Demo Mode / Simulated / Not a Cert Substitute" both render | ☐ |
| B5 | Footer signature + copyright switch | "ازرع بذكاء" ↔ "Grow Smart"; signature line flips | ☐ |
| B6 | Live Dashboard 4 control cards (Climate/Fertigation/Irrigation/Energy) | Titles, subtitles, metrics, actuators all translate | ☐ |
| B7 | Crop Engine 3 selectors + recommendation panel | Step labels and units translate; crop and stage names remain canonical Arabic | ☐ |
| B8 | History tab metric dropdown + chart legend | Metric labels translate; chart numbers stable | ☐ |
| B9 | Zones Settings — add/edit/delete | Form labels translate; new-zone default name reflects language | ☐ |
| B10 | Compliance banner (3 chips) | Saudi authorities chip + data source chip + RC-2 badge all translate | ☐ |
| B11 | Compliance scores cards | "compliant / needs review / out of range" + KPI labels translate | ☐ |
| B12 | EN-only partial-translation notice in Compliance | Yellow notice appears in English, not in Arabic | ☐ |
| B13 | Reports library 4 buttons + 4 cards | Buttons translate; reportNo + dates stable | ☐ |

### Section C — PDF Export (Arabic + English)

| # | Step | Expected | Result |
|---|------|----------|--------|
| C1 | In Arabic: click "📊 تقرير الامتثال PDF" | A4 PDF downloads with Arabic header, RTL tables, full disclaimers | ☐ |
| C2 | Open the PDF on desktop | All Arabic letters connect properly (no broken glyphs); numbers tabular | ☐ |
| C3 | Open the same PDF on a phone | Renders correctly; pagination intact | ☐ |
| C4 | Switch to English, click the equivalent button | New PDF downloads (Arabic content acceptable: this PDF mirrors the Arabic compliance template; we keep one bilingual template per RC-2) | ☐ |
| C5 | Inspect PDF metadata table | Report ID stamp + Farm Code + "Compliance Demo RC-2 (Bilingual)" version visible | ☐ |
| C6 | Inspect Saudi GAP table inside the PDF | 8 items show "✓ مُقاس بالنظام" or "⊘ خارج النطاق", **not** all-compliant | ☐ |
| C7 | Inspect Audit Trail table | Recent events render; Hash column visible | ☐ |
| C8 | Inspect footer on every page | "Page i / N · iGarden Smart OS · DEMO" stamp present | ☐ |
| C9 | Check for forbidden language inside PDF | None of: "Certified", "Approved by MEWA", "Officially integrated" — present anywhere | ☐ |

### Section D — QR Codes

| # | Check | Expected | Result |
|---|-------|----------|--------|
| D1 | ZATCA invoice modal QR | Real qrcode-generated image; payload contains `NOT-A-VALID-ZATCA-TLV` marker | ☐ |
| D2 | Scan the ZATCA QR with a phone | Decodes to plain text (not TLV); preceded by red warning box "ليست فاتورة Phase 2 صالحة" | ☐ |
| D3 | Batch traceability QR | Real QR pointing to `https://trace.igarden.sa/BATCH-...?demo=1`, labelled "نمطي — غير مفعَّل" | ☐ |
| D4 | Scan it with a phone | Opens demo URL placeholder (404 today is acceptable; the badge warns it's not active) | ☐ |
| D5 | No grid-of-pixels placeholders remain anywhere | `Array.from({ length: 36 })` style mock-QRs are gone | ☐ |

### Section E — Compliance Hardening

| # | Spot-check | Expected | Result |
|---|------------|----------|--------|
| E1 | Saudi GAP modal — 8-item table | Items 2/4/7/8 show "خارج النطاق" with explicit external-doc note | ☐ |
| E2 | Saudi GAP modal signatures | All three signatures show `<مكان توقيع …>` placeholders, no fake names | ☐ |
| E3 | ZATCA modal | Red warning at top + buyer/seller fields use `<DEMO-VAT-15-DIGITS>` and `<مكان عنوان …>` | ☐ |
| E4 | Reference values card under Scores | EC threshold = 3.5 mS/cm + per-category note (leafy/fruiting/herbal/fodder) | ☐ |
| E5 | MEWA Monthly KPIs | EC OK uses `≤ 3.5 mS/cm`, not `≤ 2.5` | ☐ |
| E6 | Verify/trace links | Annotated `(نمطي — غير مفعَّل) / not active`; verify URL struck-through | ☐ |
| E7 | System Limits → GLOBALG.A.P. card | Shows 6-standard readiness percentages + link to `docs/global-standards-gap-analysis.md` | ☐ |
| E8 | Audit Trail tab | Append-only structure visible + chain integrity panel renders | ☐ |
| E9 | Operational Logs tab | Calibration / Input usage / Water source tables CSV-exportable | ☐ |
| E10 | Roles tab | 5 roles with permissions and restrictions listed | ☐ |

### Section F — Storage + Auth (Optional Live Test, requires Supabase env)

| # | Step | Expected | Result |
|---|------|----------|--------|
| F1 | With `NEXT_PUBLIC_SUPABASE_*` set, sign in via demo gate | Demo gate is local; Supabase magic-link panel still appears in Compliance tab | ☐ |
| F2 | Sign in to Supabase via magic link, add owner row to `farm_memberships` | Data Source flips to 🟢 Supabase | ☐ |
| F3 | Click Compliance PDF | PDF downloads; Storage `compliance-reports/demo/RPT-DEMO-*.pdf` appears; `report_exports` row inserted with farm_id | ☐ |
| F4 | Update on `audit_events` | DB trigger raises exception (verified externally) | ☐ |

---

## Acceptance criteria for "RC-2 demo-ready"

- [ ] All Section A login flows pass
- [ ] B1–B13 bilingual checks pass
- [ ] C1–C9 PDF Arabic rendering passes (no broken glyphs)
- [ ] D1–D5 QR checks pass
- [ ] E1–E10 compliance hardening verified
- [ ] No console errors in either language, signed-in or signed-out
- [ ] None of the forbidden terms (Certified / Approved by MEWA / Officially integrated / Guaranteed Saudi GAP / system-claim "معتمد") appear anywhere
- [ ] All PDF exports carry correct `activeFarmCode` and `RC-2` version stamp
- [ ] Append-only audit guardrails confirmed via DB test
- [ ] **Decision:** merge to `main` only after all sections above are checked and a tester has signed off

**Tester:** _______________  **Date:** _______________  **Sign-off:** _______________

---

## Language Audit — Forbidden Terms (still enforced)

| Forbidden | Correct alternative | Verified |
|-----------|---------------------|----------|
| Certified / معتمد (as system claim) | Readiness / جاهزية | ✅ |
| Approved by MEWA | Aligned with MEWA requirements | ✅ |
| Officially integrated | Ready for integration | ✅ |
| Guaranteed Saudi GAP | Saudi GAP readiness indicators | ✅ |
| Immutable (unqualified) | Append-only / tamper-evident (demo) | ✅ |

> Legitimate uses of "معتمد": "مختبر معتمد" (accredited lab), "جهة معتمدة" (accredited body), "مفتش معتمد" (accredited inspector), "SDK معتمد" (certified SDK). All verified to describe **external parties**, never iGarden itself.

---

## Known Limitations (deliberate in RC-2)

- Some Compliance sub-sections (audit chain detail, system limits, role permissions, API mapping, operational logs, full report templates) remain in Arabic in the EN UI. The `partialTranslationNotice` banner makes this explicit. Translation will land in RC-3.
- Demo gate uses plain `demo / demo` stored in localStorage — production replaces this with Supabase Auth (Magic Link) or Microsoft Entra SSO.
- ZATCA QR is intentionally non-TLV; clearly disclosed in red warning and labels.
- `verify.igarden.sa` and `trace.igarden.sa` are not deployed yet; UI marks both as `(نمطي — غير مفعَّل) / not active`.
- Storage bucket policies remain demo-open (Sprint 9F tightening still pending — affects only live Supabase environment, not the demo gate).

---

## Production-Readiness Statement

> The compliance core, the auth context, the i18n provider, the QR pipeline, the PDF pipeline, the Supabase data adapter, and the append-only audit triggers are all designed to be **wired to real sensors and live data on adoption**. The simulated readings (`simulateLive`, `generateHistoricalData`) are isolated to two functions that an integrator can swap for an MQTT subscriber or Supabase Realtime channel without touching UI components.
