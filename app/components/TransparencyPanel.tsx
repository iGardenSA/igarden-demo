"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, FlaskConical, Hammer } from "lucide-react";

/**
 * Brief §4 Phase 4.2 — transparency overlay.
 * "What is real today / What is simulated / What is next."
 * Hidden by default; toggled by the demo presenter.
 */
const REAL = [
  "بنية البيانات (13 جدول SQL مع قيود NOT NULL + ENUM لكل source_type)",
  "تأكيد + قفل أمان + سجل تدقيق على كل أمر تحكّم (تطبيق على مستوى DB)",
  "بطاقة AI = توصية + دليل + ثقة + اعتماد بشري إلزامي (لا تشغيل تلقائي)",
  "Golden Flow متّصل من تنبيه → AI → تأكيد → تنفيذ مُسجَّل → تقرير",
  "RTL عربية-أولاً · حساس BiDi للوحدات والأرقام والمعرّفات",
  "ISA-101: رمادي محايد · لون فقط للحالة الشاذة · مؤشرات تماثلية",
];

const SIMULATED = [
  "كل القراءات الحالية في الديمو محاكاة (90% — موقع البحث والتطوير فقط يحوي بعض حسّاسات live)",
  "أوامر التحكّم تُسجَّل لكن لا تُترجم لفعل GPIO/Modbus فيزيائي (محترم لـ G2)",
  "زمن الشبكة (MQTT/Modbus) مولّد بمعدّلات واقعية للموقع — ليس قياساً حياً",
  "بطاقة AI تستخدم استنتاجاً مُبيَّتاً على EC — لا استدعاء نموذج خارجي",
  "أرقام كفاءة المياه مقارنة نموذجية مقابل خط أساس محافظ — ليست قياساً مُعتمَداً",
];

const NEXT = [
  "ربط FastAPI + MQTT بـ Raspberry Pi CM5 على بيئة البحث والتطوير (تحت G2 — يحتاج موافقة قبل التشغيل)",
  "نشر على demo.igarden.sa عبر Vercel (تحت G4)",
  "تكامل تصدير مع MEWA/Naama (مهيّأ بنيوياً — لا يدّعي الاعتماد)",
  "بطاقات AI متعدّدة الأنماط (انتقال من مُبيَّت → استنتاج إحصائي → نموذج)",
];

export function TransparencyPanel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="iso-chip border bg-white border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] text-[color:var(--color-iso-ink-soft)]"
        type="button"
      >
        <Eye className="size-3.5" /> شفافية الديمو
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" dir="rtl">
          <div className="iso-panel bg-white max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 space-y-4">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Eye className="size-5 text-[color:var(--color-status-info)]" />
                ما الحقيقي / المحاكى / القادم
              </h2>
              <button onClick={() => setOpen(false)} className="text-[color:var(--color-iso-ink-muted)] hover:text-[color:var(--color-iso-ink)]" aria-label="إغلاق">
                <EyeOff className="size-5" />
              </button>
            </header>

            <Section title="حقيقي اليوم" Icon={CheckCircle2} color="ok" items={REAL} />
            <Section title="محاكى لأغراض العرض" Icon={FlaskConical} color="sim" items={SIMULATED} />
            <Section title="القادم — يتطلّب G2/G4" Icon={Hammer} color="next" items={NEXT} />

            <footer className="text-[11px] text-[color:var(--color-iso-ink-muted)] border-t border-dashed border-[color:var(--color-iso-border)] pt-2">
              هدف اللوحة: شفافية تامة مع المُقيِّم — لا ادّعاءات تفوقية ولا اعتمادات لم تحدث.
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, items, Icon, color }: {
  title: string; items: string[];
  Icon: React.ComponentType<{ className?: string }>;
  color: "ok" | "sim" | "next";
}) {
  const cls = {
    ok:   { box: "border-[color:var(--color-status-ok)]/25 bg-[color:var(--color-status-ok)]/5",   icon: "text-[color:var(--color-status-ok)]" },
    sim:  { box: "border-[color:var(--color-src-simulated)]/25 bg-[color:var(--color-src-simulated)]/5", icon: "text-[color:var(--color-src-simulated)]" },
    next: { box: "border-[color:var(--color-status-info)]/25 bg-[color:var(--color-status-info)]/5", icon: "text-[color:var(--color-status-info)]" },
  }[color];

  return (
    <section className={`iso-panel-flat rounded-md border p-3 ${cls.box}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold mb-2 ${cls.icon}`}>
        <Icon className="size-4" /> {title}
      </div>
      <ul className="space-y-1 text-xs leading-relaxed text-[color:var(--color-iso-ink)]">
        {items.map((t, i) => <li key={i} className="flex gap-2"><span className="text-[color:var(--color-iso-ink-muted)]">•</span> {t}</li>)}
      </ul>
    </section>
  );
}
