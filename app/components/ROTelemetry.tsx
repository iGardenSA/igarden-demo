import type { ROTelemetryRow } from "@/lib/smartos-types";
import { Droplet, Activity } from "lucide-react";
import { fmtNumber, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Brief §4 Phase 3.2 — RO Telemetry moat widget.
 * inlet/outlet pressure · differential · EC pre/post · salt rejection · membrane health.
 */
export function ROTelemetry({ rows }: { rows: ROTelemetryRow[] }) {
  const r = rows[0];
  if (!r) return null;
  const healthCls = {
    good: "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25",
    fair: "bg-[color:var(--color-status-low)]/10 text-[color:var(--color-status-low)] border-[color:var(--color-status-low)]/25",
    degraded: "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25",
    replace: "bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/25",
  }[r.membrane_health_status];

  return (
    <section className="iso-panel p-4 space-y-3" dir="rtl">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Droplet className="size-4 text-[color:var(--color-status-info)]" />
          وحدة التناضح العكسي (RO)
        </h3>
        <span className={cn("iso-chip border", healthCls)}>
          غشاء: {healthAr(r.membrane_health_status)}
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Cell label="ضغط الدخول" value={r.inlet_pressure} unit="bar" />
        <Cell label="ضغط الخروج" value={r.outlet_pressure} unit="bar" />
        <Cell label="فرق ضغط الغشاء" value={r.differential_pressure} unit="bar" warn={r.differential_pressure > 1.6} />
        <Cell label="EC قبل الترشيح" value={r.ec_pre_filtration} unit="ppm" digits={0} />
        <Cell label="EC بعد الترشيح" value={r.ec_post_filtration} unit="ppm" digits={0} />
        <Cell label="رفض الأملاح" value={r.salt_rejection_pct} unit="%" warn={r.salt_rejection_pct < 95} />
      </div>

      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] ltr-bdi border-t border-dashed border-[color:var(--color-iso-border)] pt-2">
        TDS: <span className="tabular">{fmtNumber(r.tds, 0)}</span> ppm · آخر قياس: {fmtDateTime(r.recorded_at)}
      </div>
    </section>
  );
}

function Cell({ label, value, unit, warn, digits = 2 }: { label: string; value: number; unit: string; warn?: boolean; digits?: number }) {
  return (
    <div className="iso-panel-flat p-2.5 rounded-md bg-[color:var(--color-iso-panel-alt)]">
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] mb-0.5">{label}</div>
      <div className={cn("text-lg font-bold tabular ltr-bdi", warn ? "text-[color:var(--color-status-med)]" : "text-[color:var(--color-iso-ink)]")}>
        {fmtNumber(value, digits)}
        <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)] ms-1">{unit}</span>
      </div>
    </div>
  );
}

function healthAr(s: ROTelemetryRow["membrane_health_status"]) {
  return { good: "جيّد", fair: "مقبول", degraded: "متدهور", replace: "استبدال" }[s];
}
