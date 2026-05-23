"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";
import type { AIRecommendation, ConfidenceLabel } from "@/lib/smartos-types";
import { Brain, Check, Edit3, X, ShieldAlert } from "lucide-react";

const CONF_LABEL: Record<ConfidenceLabel, string> = { low: "ثقة منخفضة", medium: "ثقة متوسطة", high: "ثقة عالية" };
const CONF_CLS: Record<ConfidenceLabel, string> = {
  low:    "bg-[color:var(--color-status-low)]/10 text-[color:var(--color-status-low)] border-[color:var(--color-status-low)]/25",
  medium: "bg-[color:var(--color-status-info)]/10 text-[color:var(--color-status-info)] border-[color:var(--color-status-info)]/25",
  high:   "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25",
};

/**
 * Brief §5 AIRecommendation — must show all 4 elements:
 *   1. reason · 2. evidence · 3. confidence label · 4. human approval required
 *
 * Plus: override rate trailing 7 days (transparency).
 * NEVER auto-actuates — onApprove triggers a separate ControlConfirmModal upstream.
 */
export function AIRecommendationCard({
  rec,
  overrideRatePct,
  onDecide,
  onApproveAndOpenControl,
}: {
  rec: AIRecommendation;
  overrideRatePct?: number | null;
  onDecide: (id: string, decision: "approved" | "modified" | "rejected") => Promise<void>;
  onApproveAndOpenControl?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const isPending = rec.approval_status === "pending";
  const isApproved = rec.approval_status === "approved";

  function decide(d: "approved" | "modified" | "rejected") {
    startTransition(async () => {
      await onDecide(rec.id, d);
      if (d === "approved" && onApproveAndOpenControl) onApproveAndOpenControl();
    });
  }

  return (
    <section className="iso-panel p-4 space-y-3 border-[color:var(--color-status-info)]/20" dir="rtl">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-[color:var(--color-status-info)]" aria-hidden />
          <h3 className="text-sm font-bold">توصية مساعد الذكاء الاصطناعي</h3>
          <span className={cn("iso-chip border", CONF_CLS[rec.confidence_label])}>{CONF_LABEL[rec.confidence_label]}</span>
        </div>
        <span className="iso-chip border bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25">
          <ShieldAlert className="size-3" aria-hidden /> يتطلّب اعتماداً بشرياً
        </span>
      </header>

      <div className="space-y-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-iso-ink-muted)] mb-0.5">التوصية</div>
          <p className="text-sm leading-relaxed">{rec.recommendation}</p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-iso-ink-muted)] mb-0.5">المبرّر / الدليل</div>
          <p className="text-sm leading-relaxed text-[color:var(--color-iso-ink-soft)]">{rec.evidence_summary}</p>
        </div>
      </div>

      {overrideRatePct !== undefined && overrideRatePct !== null && (
        <div className="text-xs text-[color:var(--color-iso-ink-muted)] iso-chip border bg-[color:var(--color-iso-fill)] border-[color:var(--color-iso-border)]">
          <span className="tabular ltr-bdi">{overrideRatePct}%</span>
          <span>من توصيات الأسبوع الماضي عدّلها أو رفضها المشغّل</span>
        </div>
      )}

      <footer className="flex items-center justify-end gap-2 pt-1">
        {!isPending && (
          <span className={cn(
            "iso-chip border text-xs",
            isApproved
              ? "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25"
              : "bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]",
          )}>
            القرار: {labelDecision(rec.approval_status)}
          </span>
        )}
        {isPending && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("rejected")}
              className="px-3 py-1.5 text-xs rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-1.5"
            >
              <X className="size-3.5" /> رفض
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("modified")}
              className="px-3 py-1.5 text-xs rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-1.5"
            >
              <Edit3 className="size-3.5" /> تعديل
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("approved")}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md font-semibold border flex items-center gap-1.5",
                "bg-[color:var(--color-deep-green)] text-white border-[color:var(--color-deep-green)] hover:bg-[color:var(--color-corp-green)]",
              )}
            >
              <Check className="size-3.5" /> اعتماد + فتح تحكّم
            </button>
          </>
        )}
      </footer>
    </section>
  );
}

function labelDecision(s: AIRecommendation["approval_status"]) {
  return { pending: "بانتظار", approved: "مُعتمَد", modified: "مُعدَّل", rejected: "مرفوض" }[s];
}
