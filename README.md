# iGarden Smart OS — TAQADAM Demo

> **Tier 3 · داخلي · v2.0 · 2026-05-22**
>
> طبقة التشغيل والبيانات تحت المزارع المائية الذكية السعودية — مراقبة · تنبيهات · تحكم تحت إشراف · سجلات تدقيق · امتثال.
> منشور أونلاين على `demo.igarden.sa` · جاهز للربط الفعلي بحساسات حقيقية (MQTT → Supabase) لاحقاً.

**Branch:** `feat/supabase-migration` (لم يُدفع — يحترم G3)
**Stack:** Next.js 16 · React 19 · Tailwind v4 · TypeScript · **Supabase (Postgres + RLS)** · Vitest

---

## التشغيل المحلي

```bash
npm install
cp .env.example .env.local              # ثم املأ المفاتيح من Supabase dashboard
npm run seed                            # اختياري: يعيد زرع 30 يوماً
npm run dev                             # http://localhost:3210
npm run test                            # 11 unit + 4 integration (الأخيرة تُخطّى بلا env)
```

**ملاحظة:** الـ DB أصبح سحابياً (Supabase). لإعادة الزرع بدون service_role محلياً:
```sql
SELECT seed_demo_data();   -- في Supabase SQL Editor — function معرَّفة في schema
```

## بنية المشروع

```
supabase/
  migrations/                # 3 migrations: schema · RPC helpers · seed function
src/
  app/                       # App Router · صفحات server components (كلها dynamic)
  components/                # 24 مكوّن ISA-101 · RTL Arabic-first
  lib/
    supabase/                # server.ts (service_role) · client.ts (anon)
    queries.ts               # async wrappers — نفس تواقيع SQLite السابق
    actions.ts               # Server Actions
    golden-flow.ts           # RPC trigger
    types.ts                 # TS literals تطابق Postgres ENUMs
    format.ts · disclaimers.ts · role.ts · cn.ts
scripts/
  seed-supabase.ts           # backup TS seed (يحتاج service_role)
tests/
  control-safety.test.ts     # 7 unit tests (mocked supabase)
  source-type-types.test.ts  # 4 type-level assertions
  integration-supabase.test.ts # 4 integration (تتطلب env)
DEMO-SCRIPT.md               # 5دق · 90ث · Q&A · plan-C
DECISIONS.log                # كل قرار ذاتي مع السبب
_legacy/                     # الديمو HTML/JS القديم + SQLite الـ schema/db/seed (مرجع تصميم)
```

## الشاشات

| المسار | الغرض | Rendering |
|---|---|---|
| `/` | Fleet overview · شاشة الـ 60 ثانية | dynamic |
| `/site/[id]` | Site detail · sensors · P&ID · localization widgets | dynamic |
| `/site/[id]/sensor/[s]` | Sensor detail · 30-day trend | dynamic |
| `/site/[id]/control` | Control panel · ControlConfirmModal · audit log | dynamic |
| `/alerts` | تنبيهات مفتوحة/مُطّلع/مُعالَجة + بطاقات AI | dynamic |
| `/logs` | سجل التدقيق + سجل الصيانة + تصدير CSV | dynamic |
| `/reports` | تقارير + تصدير امتثال (CSV/PDF) + footers إلزامية | dynamic |
| `/ai` | قائمة توصيات AI · pending/decided | dynamic |
| `/demo` | وضع المستثمر · سرد 1→7 | dynamic |

كل صفحة تقرأ Supabase تحوي `export const dynamic = "force-dynamic"` — يمنع prerender error الذي ظهر سابقاً على `/ai`.

## Supabase

- **Project:** `igarden-smartos-demo` (ID: `ewcmosjxbqtzmkzakojn`) · region `eu-central-1`
- **URL:** `https://ewcmosjxbqtzmkzakojn.supabase.co`
- **معزول فيزيائياً** عن `igarden-web` (CRM/leads) و `igarden-ai-council`.
- **12 جدول** + 17 ENUM type + 12 RLS policy (anon SELECT · service_role كامل).
- **4 RPC functions:** `latest_readings_for_site`, `site_health`, `issue_command_with_event`, `execute_command_with_event`, `trigger_golden_flow`, `seed_demo_data`.

## STOP-GATEs

| Gate | الحالة |
|---|---|
| **G1** Discovery | ✅ مكتمل |
| **G2** Live hardware (MQTT/FastAPI/GPIO) | ⏸ **محترم** — كل القراءات `simulated` |
| **G3** git push / PR | ⏸ **محترم** — يحتاج اعتماد علي |
| **G4** Vercel env vars + ربط `demo.igarden.sa` | ⏸ **محترم** — يحتاج علي يضيف env vars |

## الخطوط الحمراء (محترمة بنيوياً — §7)

- ✅ كل قراءة موسومة المصدر (Postgres ENUM `source_type`)
- ✅ كل أمر تحكّم: `reason` + `confirmed_by` NOT NULL + CHECK length > 0 + `safety_lock_enabled` NOT NULL
- ✅ كل بطاقة AI: `requires_human_approval` CHECK = true
- ✅ كل تقرير: `disclaimer` NOT NULL + CHECK length > 0
- ✅ RLS مفعّل: anon لا يكتب أبداً
- ✅ لا ادعاء certified/integrated → "compliance-ready · IFA-aligned · not certified"
- ✅ لا أرقام مطلقة → "تستهدف تقليصاً جوهرياً"
- ✅ Tier 3: لا أسماء عملاء — "موقع صناعي · المنطقة الجنوبية"
- ✅ Arabic-first RTL · BiDi-safe · Western tabular numerals

## التشغيل على Vercel (G4 — بعد اعتماد علي)

أضف هذه الـ env vars على Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL       = https://ewcmosjxbqtzmkzakojn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = (من Supabase: Settings → API → anon/public)
SUPABASE_SERVICE_ROLE_KEY      = (من Supabase: Settings → API → service_role · SECRET)
```

ثم اربط نطاق `demo.igarden.sa` بالمشروع.

---

*🌱 ازرع بذكاء · Tier 3 · لا يُنشَر علناً*
