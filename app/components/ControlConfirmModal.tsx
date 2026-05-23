"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { ShieldCheck, ShieldAlert, Lock, X } from "lucide-react";
import type { Command, CommandType, Device } from "@/lib/smartos-types";

/**
 * Brief §5 ControlConfirmModal — must show all 5 elements:
 *   1. confirmation modal · 2. mandatory reason · 3. safety lock
 *   4. command status · 5. command history (linked via parent)
 *
 * Reason is required to submit. Safety lock must be ON. Confirmation
 * identity is captured per click (operator ID + dual-confirm name).
 */
export function ControlConfirmModal({
  open,
  onClose,
  device,
  commandType,
  requestedState,
  defaultRequester = "op-current",
  onSubmit,
  recentStatus,
}: {
  open: boolean;
  onClose: () => void;
  device: Device;
  commandType: CommandType;
  requestedState: string;
  defaultRequester?: string;
  /** Server action — must enforce same invariants server-side. */
  onSubmit: (input: {
    siteId: string;
    deviceId: string;
    commandType: CommandType;
    requestedState: string;
    reason: string;
    requestedBy: string;
    confirmedBy: string;
    safetyLockEnabled: true;
  }) => Promise<{ ok: boolean; error?: string; commandId?: string }>;
  /** Recent command status to show context — §5 element 4 + 5. */
  recentStatus?: Command | null;
}) {
  const [reason, setReason] = useState("");
  const [confirmedBy, setConfirmedBy] = useState("");
  const [safetyLock, setSafetyLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const canSubmit = reason.trim().length >= 3 && confirmedBy.trim().length >= 2 && safetyLock && !pending;

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await onSubmit({
        siteId: device.site_id,
        deviceId: device.id,
        commandType,
        requestedState,
        reason: reason.trim(),
        requestedBy: defaultRequester,
        confirmedBy: confirmedBy.trim(),
        safetyLockEnabled: true,
      });
      if (!r.ok) setError(r.error ?? "تعذّر تنفيذ الأمر");
      else { onClose(); reset(); }
    });
  }
  function reset() { setReason(""); setConfirmedBy(""); setSafetyLock(false); }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" dir="rtl">
      <div className="iso-panel max-w-lg w-full bg-white p-5 space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="size-5 text-[color:var(--color-status-med)]" aria-hidden />
              تأكيد أمر تحكّم
            </h2>
            <p className="text-xs text-[color:var(--color-iso-ink-muted)]">
              سيُسجَّل هذا الإجراء في سجل التدقيق ولا يمكن إخفاؤه لاحقاً.
            </p>
          </div>
          <button onClick={onClose} className="text-[color:var(--color-iso-ink-muted)] hover:text-[color:var(--color-iso-ink)]" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </header>

        <div className="iso-panel-flat p-3 bg-[color:var(--color-iso-panel-alt)] text-sm space-y-1">
          <div><span className="text-[color:var(--color-iso-ink-muted)]">الجهاز:</span> <span className="font-semibold">{device.name}</span></div>
          <div><span className="text-[color:var(--color-iso-ink-muted)]">الأمر:</span> <span className="font-mono ltr-bdi">{commandTypeAr(commandType)} → {requestedState}</span></div>
          {recentStatus && (
            <div className="text-xs text-[color:var(--color-iso-ink-muted)] mt-1">
              آخر أمر: <span className="ltr-bdi">{recentStatus.command_type} · {recentStatus.status}</span>
            </div>
          )}
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">سبب الإجراء (إلزامي)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: EC مرتفع — إيقاف الجرعات لإعادة تقييم بعد دورة ري قصيرة"
            rows={3}
            className="w-full text-sm border border-[color:var(--color-iso-border)] rounded-md p-2 focus:outline-none focus:border-[color:var(--color-status-info)]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">تأكيد ثانوي (اسم/ID)</span>
          <input
            value={confirmedBy}
            onChange={(e) => setConfirmedBy(e.target.value)}
            placeholder="op-fahad / مشرف الوردية"
            className="w-full text-sm border border-[color:var(--color-iso-border)] rounded-md p-2 ltr-bdi focus:outline-none focus:border-[color:var(--color-status-info)]"
          />
        </label>

        <label className={cn(
          "flex items-start gap-3 p-3 rounded-md border cursor-pointer",
          safetyLock
            ? "bg-[color:var(--color-status-ok)]/8 border-[color:var(--color-status-ok)]/30"
            : "bg-[color:var(--color-status-med)]/5 border-[color:var(--color-status-med)]/25",
        )}>
          <input
            type="checkbox"
            checked={safetyLock}
            onChange={(e) => setSafetyLock(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-semibold flex items-center gap-1.5">
              <Lock className="size-4" aria-hidden />
              تفعيل قفل الأمان
            </span>
            <span className="text-xs text-[color:var(--color-iso-ink-soft)] block mt-0.5">
              يضمن أن الأمر يتطلّب اعتماداً يدوياً لاحقاً للتراجع. لا يمكن المتابعة بدونه.
            </span>
          </span>
        </label>

        {error && (
          <div className="text-sm text-[color:var(--color-status-high)] iso-chip border bg-[color:var(--color-status-high)]/10 border-[color:var(--color-status-high)]/25">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "px-4 py-2 text-sm rounded-md font-semibold border flex items-center gap-2",
              canSubmit
                ? "bg-[color:var(--color-deep-green)] text-white border-[color:var(--color-deep-green)] hover:bg-[color:var(--color-corp-green)]"
                : "bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-muted)] border-[color:var(--color-iso-border)] cursor-not-allowed",
            )}
          >
            <ShieldCheck className="size-4" aria-hidden />
            {pending ? "جارٍ التسجيل…" : "تأكيد وتسجيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

function commandTypeAr(t: CommandType) {
  return { pause: "إيقاف مؤقت", resume: "استئناف", open: "فتح", close: "إغلاق", set: "ضبط", reset: "إعادة ضبط", toggle: "تبديل" }[t];
}
