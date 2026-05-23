import { cn } from "@/lib/cn";
import type { Severity } from "@/lib/smartos-types";

const STYLE: Record<Severity, string> = {
  p1: "bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/30",
  p2: "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/30",
  p3: "bg-[color:var(--color-status-low)]/10 text-[color:var(--color-status-low)] border-[color:var(--color-status-low)]/25",
};

const LABEL: Record<Severity, string> = {
  p1: "P1 · حرج",
  p2: "P2 · متوسط",
  p3: "P3 · منخفض",
};

export function AlertSeverity({ severity, className }: { severity: Severity; className?: string }) {
  return <span className={cn("iso-chip border", STYLE[severity], className)}>{LABEL[severity]}</span>;
}
