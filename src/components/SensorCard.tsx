import Link from "next/link";
import { cn } from "@/lib/cn";
import { fmtAgo, fmtNumber, isStale } from "@/lib/format";
import type { Reading, Sensor, Device } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";
import { SensorTrend } from "./SensorTrend";
import { AlertTriangle } from "lucide-react";

/**
 * Brief §5 SensorCard — must show all 8 elements:
 *   1. value · 2. unit · 3. acceptable range · 4. status · 5. trend
 *   6. source badge · 7. timestamp · 8. device health
 */
export function SensorCard({
  sensor, latest, trend, device,
}: {
  sensor: Sensor;
  latest: Reading | undefined;
  trend: Reading[];
  device: Device | undefined;
}) {
  const v = latest?.value;
  const inBand = v !== undefined && v >= sensor.min_safe_value && v <= sensor.max_safe_value;
  const sensorStale = isStale(latest?.recorded_at, 15);
  const offline = sensor.status === "offline" || latest === undefined;
  const critical = !inBand && !offline;

  return (
    <Link
      href={`/site/${sensor.site_id}/sensor/${sensor.id}`}
      className={cn(
        "iso-panel block p-4 transition-colors hover:bg-[color:var(--color-iso-panel-alt)]",
        critical && "border-[color:var(--color-status-high)]/40",
        sensorStale && "border-[color:var(--color-status-med)]/40",
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-[color:var(--color-iso-ink)]">{sensor.name}</h3>
        <SourceBadge type={latest?.source_type ?? sensor.source_type} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className={cn(
            "tabular ltr-bdi text-3xl font-bold",
            critical && "text-[color:var(--color-status-high)]",
            !critical && !offline && "text-[color:var(--color-iso-ink)]",
            offline && "text-[color:var(--color-iso-ink-muted)]",
          )}>
            {offline ? "—" : fmtNumber(v, 2)}
            <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)] ms-1 ltr-bdi">{sensor.unit}</span>
          </div>
          <div className="text-xs text-[color:var(--color-iso-ink-muted)] ltr-bdi tabular">
            النطاق: {sensor.min_safe_value}–{sensor.max_safe_value} {sensor.unit}
          </div>
        </div>
        <SensorTrend readings={trend} min={sensor.min_safe_value} max={sensor.max_safe_value} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {critical && (
            <span className="iso-chip border bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/25">
              <AlertTriangle className="size-3" /> خارج النطاق
            </span>
          )}
          {sensorStale && !offline && (
            <span className="iso-chip border bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25">
              قراءة قديمة
            </span>
          )}
          {offline && (
            <span className="iso-chip border bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/25">
              لا قراءة
            </span>
          )}
        </div>
        <div className="text-[color:var(--color-iso-ink-muted)] ltr-bdi tabular">
          {fmtAgo(latest?.recorded_at)}
        </div>
      </div>

      {device && (
        <div className="mt-2 pt-2 border-t border-[color:var(--color-iso-border)] text-xs text-[color:var(--color-iso-ink-soft)] flex items-center justify-between">
          <span>{device.name}</span>
          <span className={cn(
            "iso-chip border text-[10px]",
            device.status === "online"
              ? "bg-[color:var(--color-status-ok)]/8 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25"
              : "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25",
          )}>
            {device.status === "online" ? "متصل" : "متدهور"}
          </span>
        </div>
      )}
    </Link>
  );
}
