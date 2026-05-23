// =========================================================================
// Brief §7 red-line wording, centralised.
// Reports and compliance exports MUST carry these — schema enforces NOT NULL.
// =========================================================================

export const DISCLAIMERS = {
  compliance:
    "MEWA/Naama-style compliance snapshot — not an official integration. " +
    "IFA-aligned record structure — not third-party certified.",

  demo:
    "ديمو تحقّق ميداني — يعرض كيف يربط iGarden المراقبة والتنبيهات والتحكم تحت إشراف وسجلات التدقيق والتقارير المُهيّأة للامتثال للزراعة المُحكَمة السعودية.",

  simulated:
    "بعض البيانات أو كلّها محاكاة لأغراض العرض — تظهر بشارة “simulated” أينما وُجدت.",

  aiHumanApproval:
    "كل توصية بالذكاء الاصطناعي تتطلب اعتماد بشري قبل التنفيذ. لا تشغيل تلقائي.",

  reportFooter:
    "iGarden Smart OS · Reporting layer · compliance-ready · IFA-aligned · not certified. " +
    "Cooling/irrigation water values are operational counters — not validated against MEWA/Naama systems.",
} as const;

export const SAFE_ANSWER_EN =
  "This is a field-validation demo showing how iGarden connects monitoring, " +
  "alerting, supervised control, audit logs, and compliance-ready reporting " +
  "for Saudi controlled agriculture.";
