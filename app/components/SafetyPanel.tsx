import type { Role } from "@/lib/smartos-types";
import { Shield, ShieldAlert, ShieldCheck, Hand } from "lucide-react";
import { ROLE_LABELS_AR } from "@/lib/smartos-types";

/**
 * Brief §4 Phase 3.6 — visible safety panel.
 * E-stop is iconic (never wired in demo per G2). Role indicator + override toggle.
 * The override is a *visual* affordance — it doesn't bypass ControlConfirmModal.
 */
export function SafetyPanel({ role }: { role: Role }) {
  return (
    <section className="iso-panel p-4 space-y-3" dir="rtl">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Shield className="size-4 text-[color:var(--color-status-ok)]" />
          لوحة الأمان
        </h3>
        <span className="iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]">
          الدور الحالي: {ROLE_LABELS_AR[role]}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <div className="iso-panel-flat rounded-md p-4 flex flex-col items-center justify-center text-center bg-[color:var(--color-status-high)]/5 border border-[color:var(--color-status-high)]/25">
          <div className="size-16 rounded-full border-4 border-[color:var(--color-status-high)] bg-[color:var(--color-status-high)] flex items-center justify-center text-white font-bold tracking-wide shadow-inner">
            STOP
          </div>
          <div className="mt-2 text-xs font-semibold text-[color:var(--color-status-high)]">إيقاف اضطراري (يدوي)</div>
          <div className="text-[10px] text-[color:var(--color-iso-ink-muted)]">في الموقع · ليس زر برمجي</div>
        </div>

        <div className="iso-panel-flat rounded-md p-4 bg-[color:var(--color-iso-panel-alt)] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Hand className="size-4 text-[color:var(--color-status-med)]" />
            تجاوز يدوي
          </div>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] leading-relaxed">
            يتطلّب رمز مشرف ميداني + توقيت + سبب — ويُسجَّل كحدث <span className="ltr-bdi">manual_override</span> في سجل التدقيق.
          </p>
          <button
            type="button"
            disabled
            className="text-xs px-3 py-2 rounded-md bg-[color:var(--color-iso-fill)] border border-[color:var(--color-iso-border)] text-[color:var(--color-iso-ink-muted)] cursor-not-allowed"
            title="معطّل في الديمو — يتطلّب رمز مشرف"
          >
            بدء تجاوز يدوي (معطّل في الديمو)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Cap who="مشغّل" canControl="مشروط (بسبب + تأكيد)" />
        <Cap who="مدير عمليات" canControl="كامل (مع تسجيل)" />
        <Cap who="تنفيذي" canControl="قراءة فقط" />
      </div>

      <footer className="text-[11px] text-[color:var(--color-iso-ink-muted)] border-t border-dashed border-[color:var(--color-iso-border)] pt-2 flex items-center gap-1.5">
        <ShieldCheck className="size-3" /> لا تشغيل تلقائي للأوامر · كل أمر يمرّ بـ تأكيد ثنائي + قفل أمان + سجل.
      </footer>
    </section>
  );
}

function Cap({ who, canControl }: { who: string; canControl: string }) {
  return (
    <div className="iso-panel-flat rounded-md p-2 bg-[color:var(--color-iso-panel-alt)]">
      <div className="font-semibold">{who}</div>
      <div className="text-[color:var(--color-iso-ink-soft)]">{canControl}</div>
    </div>
  );
}
