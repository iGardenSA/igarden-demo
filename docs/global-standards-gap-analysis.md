# تحليل الفجوة مقابل المعايير العالمية — iGarden Smart OS Demo

> **النطاق:** بيئة الديمو الحالية (`demo.igarden.sa`) مقابل أربعة معايير عالمية رئيسية.
> **آخر تحديث:** 2026-05-08
> **الحالة:** Reference Document — لا يُنشر للجمهور قبل المراجعة القانونية.

يوضّح هذا المستند **ما هو موجود** في النموذج التجريبي و**ما هو ناقص** للوصول إلى مطابقة كاملة مع كل معيار. الهدف ليس الادعاء بالامتثال — بل تقديم خارطة طريق صادقة لما يلزم استكماله قبل أي شهادة فعلية.

---

## 1. GLOBALG.A.P. IFA v6 (Integrated Farm Assurance — Crops)

| متطلب الـ Control Point | الحالة في الديمو | فجوة |
|--------------------------|-------------------|-------|
| **AF 1.1** Site History & Risk Assessment | ❌ غائب | إضافة سجل تاريخ الموقع + قالب تقييم مخاطر منهجي |
| **AF 4.1–4.3** Worker Health, Safety & Welfare | ❌ غائب | إضافة وحدة سجلات سلامة العمال (إصابات، PPE، تدريب) |
| **AF 6** Waste & Pollution Management | ❌ غائب | إضافة سجل المخلفات (بلاستيك، محاليل مستهلكة، نفايات نباتية) |
| **AF 7** Environment & Biodiversity | ⚠️ جزئي | بيانات استهلاك المياه/الطاقة موجودة، لكن لا تقييم تنوع حيوي |
| **CB 4** Soil/Substrate Management | ⚠️ جزئي | "Requires Lab" مذكور لكن لا قالب لتحليل الركيزة |
| **CB 5** Fertilizer Use | ✅ موجود | `input_usage_logs` يغطي الأسمدة بـ batch_id |
| **CB 6** Water Management | ✅ موجود | `water_sources` + WUE report |
| **CB 7** Integrated Pest Management (IPM) | ❌ غائب | إضافة جدول `pest_observations` + `treatment_records` |
| **CB 7.6** Pesticide Records | ⚠️ جزئي | يذكر "صفر مبيدات" لكن لا حقل MRL test |
| **CB 8** Pre-Harvest Interval (PHI) | ❌ غائب | إضافة حقل `phi_days` في batches وقواعد منع الحصاد |
| **CB 9** Harvest & Handling | ⚠️ جزئي | `actual_harvest` موجود؛ لا سجل تدريب الحصاد |
| **CB 10** Post-Harvest Activities | ❌ غائب | إضافة سجل التعقيم بعد الحصاد، ضوابط درجة الحرارة |
| **CB 11** Hygiene Risk Assessment | ❌ غائب | قالب تقييم مخاطر النظافة |
| **AF 14** Recall / Withdrawal Procedure | ❌ غائب | إضافة سياسة استدعاء + اختبار وهمي سنوي |

**أولوية التنفيذ للحصول على شهادة GLOBALG.A.P.:**
1. AF 14 (Recall) — أساسي ولا يُتسامح فيه
2. CB 7 (IPM) — حتى لو "صفر مبيدات"، يجب توثيق المراقبة
3. CB 8 (PHI) — قاعدة منع تشغيلية
4. AF 1.1 + AF 11 (Risk Assessments) — لا يصح بدونها

---

## 2. ISO 22005:2007 — Traceability in feed and food chain

| المتطلب | الحالة | فجوة |
|----------|---------|------|
| **§ 4.1** نظام تتبع موثّق | ⚠️ جزئي | يوجد `batches` و`audit_events` لكن لا "Traceability System Document" منفصل |
| **§ 5.2.a** تحديد المواد عند كل خطوة | ✅ موجود | batch_id + zone_id + input_id |
| **§ 5.2.b** نظام ترقيم الدفعات الموثّق | ✅ موجود | `BATCH-CROP-YEAR-NNN` |
| **§ 5.2.c** سجلات المعالجة | ⚠️ جزئي | `input_usage_logs` يغطي الأسمدة فقط |
| **§ 5.3** التحقق من النظام (Internal Verification) | ❌ غائب | لا يوجد قالب تدقيق داخلي دوري |
| **§ 5.4** إدارة عدم المطابقة | ❌ غائب | إضافة وحدة `non_conformance_log` |
| **§ 6** المراجعة الإدارية للنظام | ❌ غائب | قالب مراجعة سنوي |

**أولوية التنفيذ:** § 5.4 ثم § 5.3.

---

## 3. Codex Alimentarius — CAC/RCP 1-1969 (HACCP)

| المبدأ HACCP | الحالة | فجوة |
|---------------|---------|------|
| **Principle 1** تحليل المخاطر (Hazard Analysis) | ❌ غائب | قالب Hazard Analysis Worksheet لكل خطوة |
| **Principle 2** تحديد CCPs | ❌ غائب | قائمة CCPs (مثلاً: pH water, EC water, post-harvest cooling) |
| **Principle 3** تحديد الحدود الحرجة | ⚠️ جزئي | عتبات pH/EC موجودة كأهداف تشغيلية، لا كحدود حرجة موثّقة |
| **Principle 4** نظام مراقبة CCPs | ✅ موجود | الحساسات + audit_events |
| **Principle 5** الإجراءات التصحيحية | ⚠️ جزئي | الـ overrides اليدوية موثّقة، لا "Corrective Action SOP" |
| **Principle 6** التحقق (Verification) | ❌ غائب | لا جدول Verification Schedule |
| **Principle 7** التوثيق وحفظ السجلات | ✅ موجود | append-only + storage bucket |

**فجوة جوهرية:** الديمو يعرض "monitoring" قوي (المبدأ 4 و7) لكنه يفتقد **منهجية HACCP الرسمية** (المبادئ 1-3, 6).

---

## 4. EU MRL Regulation (EC) No 396/2005 — Pesticide Residues

| المتطلب | الحالة | فجوة |
|----------|---------|------|
| ربط الدفعة بقائمة المبيدات المستخدمة | ⚠️ جزئي | `input_usage_logs` ولكن بلا فئة "pesticide" مستقلة |
| نتيجة اختبار MRL من مختبر معتمد | ❌ غائب | إضافة جدول `mrl_test_results` مع: مختبر، تاريخ، مادة، نتيجة، حد EU |
| مقارنة آلية مع EU MRL Database | ❌ غائب | استرجاع EU MRL DB API أو CSV محلي |
| رفض الدفعة عند تجاوز الحد | ❌ غائب | قاعدة عمل: إذا `mrl > eu_limit` فالدفعة محجوزة |

**ملاحظة:** نظام هيدروبونيك مغلق + "صفر مبيدات" يقلّل المخاطر لكن لا يلغي الحاجة للتوثيق.

---

## 5. ISO 22000:2018 — Food Safety Management

| البند | الحالة | فجوة |
|--------|---------|------|
| **§ 4** Context of the organization | ❌ غائب |  |
| **§ 5** Leadership commitment | ❌ غائب |  |
| **§ 6** Planning (risks & opportunities) | ❌ غائب |  |
| **§ 7** Support (resources, competence, awareness) | ⚠️ جزئي | الأدوار موجودة، Competence لا |
| **§ 8** Operational planning | ⚠️ جزئي | جزء كبير منها مغطى بـ HACCP |
| **§ 9** Performance evaluation | ⚠️ جزئي | KPIs موجودة، Internal audit لا |
| **§ 10** Improvement (NCs, CAPA) | ❌ غائب |  |

ISO 22000 معيار إدارة شامل — يصعب تطبيقه بالكامل في نموذج تقني، لكنه يفيد كنقطة مرجعية للبيئة الإدارية المحيطة.

---

## 6. ISO 27001 — Information Security (مرتبط لأن النظام يخزن بيانات تجارية)

| البند | الحالة | فجوة |
|--------|---------|------|
| Append-only audit log | ✅ موجود (Trigger + Hash chain) |  |
| Row-Level Security | ✅ موجود (membership-based) |  |
| Encryption at rest | ⚠️ يفترض من Supabase الافتراضي | توثيق صريح |
| Access logs | ❌ غائب | إضافة سجل من يدخل وأين |
| Incident response plan | ❌ غائب |  |
| Backup & DR procedure | ❌ غائب |  |

---

## 7. خطة التنفيذ المقترحة (3 سبرنتات)

### Sprint A — أساسيات الامتثال (4 أسابيع)
- جدول `pest_observations` + `treatment_records`
- جدول `non_conformance_log`
- حقل `phi_days` في `batches` + قاعدة منع الحصاد
- وثيقة Recall Procedure + اختبار وهمي

### Sprint B — تقييم المخاطر و HACCP (4 أسابيع)
- Hazard Analysis Worksheet (UI + DB)
- CCPs definition (مع مرجعية لكل CCP)
- Critical Limits documentation
- Verification Schedule

### Sprint C — الجودة المخبرية والتكامل الإداري (4 أسابيع)
- جدول `mrl_test_results` + رفع PDF تقرير المختبر
- ربط MRL مع SFDA accredited labs list
- Internal Audit template
- Management Review template

---

## 8. خلاصة

| المعيار | درجة الجاهزية الحالية | الجهد للوصول لشهادة |
|----------|------------------------|----------------------|
| **Saudi GAP** (NAAMA) | 🟡 60% | ~3 سبرنتات + جهة معتمدة |
| **GLOBALG.A.P. IFA v6** | 🟡 45% | ~6 سبرنتات + Verifier acreditado |
| **ISO 22005:2007** | 🟢 70% | ~1 سبرنت + توثيق |
| **Codex HACCP** | 🟡 55% | ~2 سبرنت + Hazard Analysis |
| **EU MRL Reg** | 🔴 25% | يتطلب مختبر معتمد + integration |
| **ISO 22000:2018** | 🔴 20% | بيئة إدارية كاملة (خارج نطاق التقنية) |
| **ISO 27001** | 🟢 65% | ~1 سبرنت + توثيق |

> **الموقف الصادق:** النظام في حالته الحالية يصلح كـ **أداة إدارة وتوثيق** لمزرعة تستهدف الحصول على شهادة Saudi GAP، لكنه **لا يستبدل** الشهادة ولا الجهة المعتمدة. الشهادة الفعلية تتطلب مفتشاً معتمداً، مختبراً معتمداً، ومراجعة موقع.
