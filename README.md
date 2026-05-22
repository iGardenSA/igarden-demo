# iGarden Smart OS — TAQADAM Hardening Demo

> **Tier 3 · داخلي · v1.0 · 2026-05-22**
>
> طبقة التشغيل والبيانات تحت المزارع المائية الذكية السعودية — مراقبة · تنبيهات · تحكم تحت إشراف · سجلات تدقيق · امتثال.

**Branch:** `feat/smartos-demo-hardening` (لم يُدفع — يحترم G3)
**Stack:** Next.js 16 · React 19 · Tailwind v4 · TypeScript · SQLite (better-sqlite3) · Vitest

---

## التشغيل المحلي (Offline-first)

```bash
npm install
npm run seed       # 30 يوماً + 3 مواقع + حادثة EC جاهزة للتشغيل
npm run dev        # http://localhost:3210
npm run test       # 13 اختبار · 3 ملفات
```

لا حاجة لإنترنت بعد الـ install — DB ملف محلي في `data/igarden-demo.db`.

## بنية المشروع

```
data/
  schema.sql              # 13 جدول · CHECK constraints على source_type · NOT NULL على reason/disclaimer
  seed.ts                 # 30 يوماً deterministic · 3 مواقع · EC incident
src/
  app/                    # App Router · صفحات server components
  components/             # 20+ مكون ISA-101 · RTL Arabic-first
  lib/                    # db · queries · actions · golden-flow · format · disclaimers
src/styles/globals.css    # ISA-101 design tokens · brand colors · RTL
tests/
  source-type.test.ts     # red-line enforcement
  control-safety.test.ts  # reason + dual-confirm + safety lock
  golden-flow.test.ts     # end-to-end happy path
DEMO-SCRIPT.md            # سكربت 5دق + 90ث + Q&A + plan-C
DECISIONS.log             # كل قرار ذاتي مع السبب
_legacy/                  # ديمو HTML/JS القديم (مرجع تصميم)
```

## الشاشات

| المسار | الغرض |
|---|---|
| `/` | Fleet overview · شاشة الـ 60 ثانية |
| `/site/[id]` | Site detail · sensors · P&ID · alerts · localization widgets |
| `/site/[id]/sensor/[s]` | Sensor detail · 30-day trend |
| `/site/[id]/control` | Control panel · ControlConfirmModal · audit log |
| `/alerts` | تنبيهات مفتوحة/مُطّلع/مُعالَجة + بطاقات AI |
| `/logs` | سجل التدقيق + سجل الصيانة + تصدير CSV |
| `/reports` | تقارير + تصدير امتثال (CSV/PDF) + footers إلزامية |
| `/ai` | قائمة توصيات AI · pending/decided |
| `/demo` | وضع المستثمر · سرد 1→7 |

## STOP-GATEs

| Gate | الحالة |
|---|---|
| **G1** Discovery | ✅ مكتمل — Path B مُعتمَد |
| **G2** Live hardware | ⏸ **محترم** — لا MQTT/GPIO/FastAPI · commands مُحاكاة فقط |
| **G3** git push / PR | ⏸ **محترم** — يحتاج اعتماد علي |
| **G4** Vercel / demo.igarden.sa | ⏸ **محترم** — يحتاج اعتماد علي |

## الخطوط الحمراء (محترمة بنيوياً — §7)

- ✅ كل قراءة موسومة المصدر (NOT NULL + CHECK ENUM على DB)
- ✅ كل أمر تحكّم: reason + confirmed_by + safety_lock_enabled NOT NULL
- ✅ كل بطاقة AI: requires_human_approval=1 (CHECK constraint)
- ✅ كل تقرير: disclaimer NOT NULL
- ✅ لا ادعاء certified/integrated → "compliance-ready · IFA-aligned · not certified"
- ✅ لا أرقام مطلقة (90%/27%/3×) → "تستهدف تقليصاً جوهرياً"
- ✅ Tier 3: لا أسماء عملاء (001/002/003/004) — "موقع صناعي · المنطقة الجنوبية"
- ✅ Arabic-first RTL · BiDi-safe (bdi spans) · Western numerals (tabular)

## التشغيل عبر اللابتوب في عرض حي

اتبع `DEMO-SCRIPT.md` — حرفياً.

---

*🌱 ازرع بذكاء · Tier 3 · لا يُنشَر علناً*
