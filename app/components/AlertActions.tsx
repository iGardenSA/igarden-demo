"use client";

import { useTransition } from "react";
import { ackAlertAction, resolveAlertAction } from "@/lib/actions";
import { Check, Eye } from "lucide-react";

export function AlertActions({ alertId, status }: { alertId: string; status: string }) {
  const [pending, start] = useTransition();
  if (status === "resolved" || status === "suppressed") return null;
  return (
    <div className="flex items-center gap-2">
      {status === "open" && (
        <button
          onClick={() => start(() => ackAlertAction(alertId))}
          disabled={pending}
          className="text-xs px-2.5 py-1.5 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)] flex items-center gap-1.5"
        >
          <Eye className="size-3.5" /> اطّلعت
        </button>
      )}
      <button
        onClick={() => start(() => resolveAlertAction(alertId))}
        disabled={pending}
        className="text-xs px-2.5 py-1.5 rounded-md border border-[color:var(--color-status-ok)]/30 bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] hover:bg-[color:var(--color-status-ok)]/15 flex items-center gap-1.5"
      >
        <Check className="size-3.5" /> اعتبار مُعالَج
      </button>
    </div>
  );
}
