import { cn } from "@/lib/cn";
import type { SourceType } from "@/lib/smartos-types";
import { Radio, FlaskConical, Hand, Unplug } from "lucide-react";
import { fmtAgo } from "@/lib/format";

const LABEL: Record<SourceType, string> = {
  live: "حيّ",
  simulated: "محاكاة",
  manual: "يدوي",
  offline: "غير متصل",
};

const ICON: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  live: Radio,
  simulated: FlaskConical,
  manual: Hand,
  offline: Unplug,
};

const CLS: Record<SourceType, string> = {
  live:      "bg-[color:var(--color-src-live)]/10 text-[color:var(--color-src-live)] border-[color:var(--color-src-live)]/30",
  simulated: "bg-[color:var(--color-src-simulated)]/10 text-[color:var(--color-src-simulated)] border-[color:var(--color-src-simulated)]/30",
  manual:    "bg-[color:var(--color-src-manual)]/10 text-[color:var(--color-src-manual)] border-[color:var(--color-src-manual)]/30",
  offline:   "bg-[color:var(--color-src-offline)]/10 text-[color:var(--color-src-offline)] border-[color:var(--color-src-offline)]/30",
};

/**
 * Brief §3.1 / §7 red line: every reading MUST be visibly marked with source_type.
 * `type` is required — there is no default — so it's impossible to render a
 * source-less badge by mistake.
 */
export function SourceBadge({
  type,
  timestamp,
  className,
  showTimestamp = false,
}: {
  type: SourceType;
  timestamp?: string | null;
  className?: string;
  showTimestamp?: boolean;
}) {
  const Icon = ICON[type];
  return (
    <span className={cn("iso-chip border", CLS[type], className)} dir="rtl" title={LABEL[type]}>
      <Icon className="size-3.5" aria-hidden />
      <span>{LABEL[type]}</span>
      {showTimestamp && timestamp && (
        <span className="opacity-70 ltr-bdi tabular">· {fmtAgo(timestamp)}</span>
      )}
    </span>
  );
}
