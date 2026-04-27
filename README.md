# 🌱 iGarden Smart OS — Demo Seed

الديمو التفاعلي لنظام iGarden Smart OS — يُنشر على [demo.igarden.sa](https://demo.igarden.sa)

---

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [التقنيات](#التقنيات)
- [التشغيل المحلي](#التشغيل-المحلي)
- [النشر على Vercel](#النشر-على-vercel)
- [ربط الـ Subdomain](#ربط-الـ-subdomain)
- [الصيانة](#الصيانة)

---

## نظرة عامة

ديمو وظيفي بـ React + Recharts يحاكي معمارية Smart OS الحقيقية:

- **4 تبويبات:** Live Dashboard / Crop Engine / History / Zones Settings
- **12 محصول × 4 مناطق سعودية** = ~150 وصفة فريدة
- **محرّك توصيات** مُكيَّف للمناخ السعودي (جدة، الرياض، أبها، تبوك)
- **3 أشهر بيانات تاريخية** مع رسوم تفاعلية ومقارنة بين المناطق
- **إدارة كاملة للمناطق** (CRUD + 4 أجهزة لكل منطقة)
- **حفظ تلقائي** عبر `window.storage` (Claude Artifacts) أو `localStorage` (Production)

> ⚠️ القراءات محاكاة — ليست بيانات حقيقية من حساسات

---

## التقنيات

| الطبقة | الأداة | الإصدار |
|---|---|---|
| Framework | Next.js | 15.x |
| Runtime | React | 19.x |
| Language | TypeScript | 5.x |
| Charts | Recharts | 2.x |
| Icons | lucide-react | 0.468 |
| Hosting | Vercel | Pro |
| Region | Frankfurt (fra1) | — |

---

## التشغيل المحلي

### المتطلبات

- Node.js >= 20
- npm أو pnpm

### الخطوات

```bash
# 1. تثبيت التبعيات
npm install

# 2. تشغيل dev server
npm run dev

# 3. فتح المتصفح على
# http://localhost:3000
```

### اختبار البناء قبل النشر

```bash
npm run build
npm run start
```

---

## النشر على Vercel

### 1️⃣ إنشاء Repo على GitHub

```bash
cd demo-igarden
git init
git add .
git commit -m "feat: initial demo seed"
git branch -M main

# أنشئ repo جديد على github.com/iGardenSA باسم "demo-igarden"
git remote add origin https://github.com/iGardenSA/demo-igarden.git
git push -u origin main
```

### 2️⃣ ربط Vercel

1. اذهب لـ [vercel.com/new](https://vercel.com/new)
2. اختر **"Import Git Repository"** → اختر `demo-igarden`
3. **Framework Preset:** Next.js (يُكتشف تلقائياً)
4. **Root Directory:** `.` (الجذر)
5. **Environment Variables:** لا حاجة لشيء حالياً
6. اضغط **Deploy**

ستحصل على URL مثل: `https://demo-igarden.vercel.app`

### 3️⃣ Preview Deployment للاختبار

كل push على branch جديد ينشئ preview تلقائياً:

```bash
git checkout -b preview
git push origin preview
# Vercel سينشئ: https://demo-igarden-preview-igardensa.vercel.app
```

---

## ربط الـ Subdomain

### في Vercel Dashboard

1. اذهب لـ Project Settings → Domains
2. أضف: `demo.igarden.sa`
3. Vercel سيعطيك تعليمات DNS (CNAME أو A record)

### في DNS Provider (حيث mucha سجلت igarden.sa)

#### الخيار A — CNAME (موصى به)
```
Type:  CNAME
Name:  demo
Value: cname.vercel-dns.com
TTL:   3600
```

#### الخيار B — A Record
```
Type:  A
Name:  demo
Value: 76.76.21.21
TTL:   3600
```

⏳ انتظر 5-30 دقيقة لانتشار DNS، ثم Vercel يعطي SSL تلقائياً.

### التحقق

```bash
# تحقق من DNS
dig demo.igarden.sa +short

# تحقق من SSL
curl -I https://demo.igarden.sa
```

---

## الصيانة

### تحديث المحتوى

أيّ تعديل على `app/page.tsx` ودفعه إلى `main` ينشر تلقائياً على Production.

```bash
git add app/page.tsx
git commit -m "feat: تحديث محرك التوصيات"
git push origin main
# Vercel ينشر خلال 1-2 دقيقة
```

### Rollback عند مشكلة

في Vercel Dashboard → Deployments → اختر deployment سابق → "Promote to Production"

### استبدال الشعار

```bash
# استبدل الملفات في public/branding/
# ثم
git add public/branding/
git commit -m "chore: تحديث الشعار"
git push origin main
```

---

## هيكل المشروع

```
demo-igarden/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # الديمو الكامل (1199 سطر)
│   └── globals.css         # CSS الأساسي
├── public/
│   └── branding/
│       ├── icon-master-white.png
│       └── icon-master-original.png
├── package.json
├── tsconfig.json
├── next.config.js
├── vercel.json
├── .gitignore
└── README.md
```

---

## الاتصال

- 🌐 الموقع الرسمي: [igarden.sa](https://igarden.sa)
- 📧 البريد: info@igarden.sa
- 🐙 GitHub: [@iGardenSA](https://github.com/iGardenSA)

---

**iGarden — ازرع بذكاء**
*حين تزرع بذكاء، تحصد بثقة*

© 2026 شركة انتيليجنت غاردن (ذات مسؤولية محدودة)
