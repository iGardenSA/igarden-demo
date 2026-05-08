// ─── مراجع الامتثال السعودي الرسمية ───
// المصادر: مواقع MEWA · SFDA · NAAMA · ZATCA الرسمية
// لا تعدّل هذه القيم إلا بإذن صريح من مدير الامتثال

export const REGULATORY_REFS = [
  {
    code: "MEWA-AGR-LAW-IR",
    fullName: "Implementing Regulations of the Agriculture Law",
    authority: "وزارة البيئة والمياه والزراعة",
    url: "https://www.mewa.gov.sa//en/InformationCenter/DocsCenter/RulesLibrary/Docs/Implementing%20Regulations%20of%20The%20Agriculture%20Law.pdf",
  },
  {
    code: "SFDA.FD 382/2018",
    fullName: "Maximum Limits of Pesticide Residues in Agricultural and Food Products",
    authority: "Saudi Food and Drug Authority",
    url: "https://www.sfda.gov.sa/en/regulations/2554",
  },
  {
    code: "Saudi GAP",
    fullName: "Good Agricultural Practices Certification",
    authority: "MEWA via NAAMA Platform",
    url: "https://naama.sa",
  },
  {
    code: "ZATCA Fatoora Phase 2",
    fullName: "E-Invoicing Integration",
    authority: "Zakat, Tax and Customs Authority",
    url: "https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx",
  },
] as const;

// ─── نطاقات جودة المياه — قيم مرجعية عامة ───
// EC العتبة هنا (3.5 mS/cm) هي الحد الأعلى الذي يستوعب جميع المحاصيل
// والمراحل في CROP_DB. القيم المثلى تختلف حسب المحصول والمرحلة وتُحسب
// ديناميكياً عبر calcComplianceScoreForZone(crop, stage) في compliance-engine.
export const WATER_QUALITY_RANGES = {
  pH:           { min: 5.5,  max: 7.5,    unit: "",      source: "Saudi GAP / MEWA — General range" },
  EC:           { min: 0,    max: 3.5,    unit: "mS/cm", source: "Upper bound across crops; per-crop targets vary" },
  TDS:          { min: 0,    max: 1500,   unit: "ppm",   source: "General agriculture reference" },
  freeChlorine: { min: 0,    max: 0.5,    unit: "mg/L",  source: "Hydroponic systems reference" },
} as const;

// نطاقات EC التشغيلية حسب فئة المحصول (مرجع داخلي للجاهزية)
// تُستخدم في الحساب الديناميكي للامتثال عند توفر معلومات المحصول/المرحلة
export const EC_OPERATIONAL_BANDS = {
  leafy:    { min: 0.8, max: 2.0 },   // ورقي (خس، جرجير، سبانخ، بقدونس)
  fruiting: { min: 1.4, max: 3.5 },   // ثمري (طماطم، خيار، فلفل، باذنجان، فراولة)
  herbal:   { min: 1.0, max: 2.2 },   // عطري (نعناع، ريحان)
  fodder:   { min: 0.5, max: 1.2 },   // علفي
  general:  { min: 0,   max: 3.5 },   // عام عند غياب معلومات المحصول
} as const;

export const ESTABLISHMENT_INFO = {
  nameAr: "شركة انتيليجنت غاردن",
  nameEn:  "Intelligent Garden Co.",
  cr:      "4030579637",
  misa:    "423450193",
  system:  "iGarden Smart OS — Demo Seed v1.0",
} as const;

export const DISCLAIMER_TEXT =
  "يعرض هذا النموذج معمارية حقيقية مع بيانات محاكاة. القيم المرجعية مبنية على المعايير الصناعية المتاحة (MEWA, SFDA.FD 382, Saudi GAP). تنسيقات التقارير قابلة للتعديل عند صدور المتطلبات الرسمية النهائية.";
