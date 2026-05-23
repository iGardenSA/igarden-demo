import { cn } from "@/lib/cn";
import { fmtAgo, fmtNumber, fmtDateTime } from "@/lib/format";
import type { Alert, Sensor } from "@/lib/smartos-types";
import { AlertSeverity } from "./AlertSeverity";

/**
 * Brief §5 AlertCard — must show all 7 elements:
 *   1. severity · 2. trigger · 3. affected sensor/device
 *   4. recommended action · 5. owner · 6. status · 7. resolution log
 */
export function AlertCard({
  alert, sensor, children,
}: {
  alert: Alert;
  sensor?: Sensor;
  /** Optional child slot — used to render the AIRecommendation card under the alert. */
  children?: React.ReactNode;
}) {
  const isResolved = alert.status === "resolved";
  return (
    <article className={cn("iso-panel p-4 space-y-2.5", isResolved && "opacity-80")} dir="rtl">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{alert.title}</h3>
          <div className="text-xs text-[color:var(--color-iso-ink-soft)] flex items-center gap-2 flex-wrap">
            <AlertSeverity severity={alert.severity} />
            <span className="iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)] uppercase tracking-wide">
              {labelStatus(alert.status)}
            </span>
            <span className="ltr-bdi tabular">⏱ {fmtAgo(alert.created_at)}</span>
          </div>
        </div>
      </header>

      <p className="text-sm text-[color:var(--color-iso-ink-soft)] leading-relaxed">{alert.description}</p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {sensor && (
          <Row label="الحساس">
            <span className="ltr-bdi">{sensor.name}</span>
          </Row>
        )}
        {alert.trigger_value !== null && sensor && (
          <Row label="القيمة المُحفّزة">
            <span className="tabular ltr-bdi text-[color:var(--color-status-high)] font-semibold">
              {fmtNumber(alert.trigger_value)} {sensor.unit}
            </span>
          </Row>
        )}
        <Row label="المعنيّ">
          <span className="ltr-bdi">{alert.assigned_to ?? "غير مُعيَّن"}</span>
        </Row>
        {alert.acknowledged_at && (
          <Row label="تمّ الاطّلاع">
            <span className="ltr-bdi tabular">{fmtDateTime(alert.acknowledged_at)}</span>
          </Row>
        )}
        {alert.resolved_at && (
          <Row label="تمّت المعالجة">
            <span className="ltr-bdi tabular">{fmtDateTime(alert.resolved_at)}</span>
          </Row>
        )}
      </dl>

      <div className="bg-[color:var(--color-iso-panel-alt)] border border-dashed border-[color:var(--color-iso-border)] rounded-md p-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-iso-ink-soft)] mb-1">
          الإجراء المُوصى به
        </div>
        <p className="text-sm leading-relaxed">{alert.recommended_action}</p>
      </div>

      {children}
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="text-[color:var(--color-iso-ink-muted)]">{label}:</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function labelStatus(s: Alert["status"]) {
  return { open: "مفتوح", acknowledged: "مُطّلع عليه", resolved: "مُعالَج", suppressed: "مكبوح" }[s];
}
