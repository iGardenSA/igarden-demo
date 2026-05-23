import { cn } from "@/lib/cn";
import { fmtAgo } from "@/lib/format";
import { isStale } from "@/lib/format";
import type { SiteHealth } from "@/lib/queries";
import { SourceBadge } from "./SourceBadge";
import { AlertTriangle, CircleDot, MapPin, Server, Clock } from "lucide-react";

/**
 * Brief §4 Phase 1.2 — appears at the top of every screen.
 * Carries: Site · Mode · Last sync · Devices online (X/Y) · Active alerts.
 * Last-sync staleness flips visibly to a warning chip past the threshold.
 */
export function StatusBar({ health, mode = "demo" }: { health: SiteHealth; mode?: "demo" | "live" | "investor" }) {
  const stale = isStale(health.lastSyncAt, 15);
  const allOnline = health.devicesOnline === health.devicesTotal;
  return (
    <div className="iso-panel-flat sticky top-0 z-30 px-4 py-2.5 flex items-center gap-4 flex-wrap text-sm">
      <div className="flex items-center gap-2 font-semibold text-[color:var(--color-deep-green)]">
        <MapPin className="size-4" />
        <span>{health.site.name}</span>
      </div>

      <span className="iso-divider w-px h-5 self-center hidden md:block" />

      {/* Mode */}
      <ModeChip mode={mode} />

      {/* Last sync */}
      <div className={cn("flex items-center gap-1.5 ltr-bdi", stale ? "text-[color:var(--color-status-med)]" : "text-[color:var(--color-iso-ink-soft)]")}>
        <Clock className="size-4" aria-hidden />
        <span className="tabular">{fmtAgo(health.lastSyncAt) || "—"}</span>
        {stale && <span className="iso-chip border bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/30">قراءة قديمة</span>}
      </div>

      {/* Devices */}
      <div className={cn("flex items-center gap-1.5", allOnline ? "text-[color:var(--color-iso-ink-soft)]" : "text-[color:var(--color-status-med)]")}>
        <Server className="size-4" aria-hidden />
        <span className="tabular">
          {health.devicesOnline}/{health.devicesTotal} متصلة
        </span>
      </div>

      {/* Source mix */}
      <div className="flex items-center gap-1.5">
        {health.hasLiveSource && <SourceBadge type="live" />}
        {!health.hasLiveSource && <SourceBadge type="simulated" />}
      </div>

      {/* Alerts */}
      <div className="ms-auto flex items-center gap-2">
        {health.openAlerts === 0 ? (
          <span className="iso-chip border bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25">
            <CircleDot className="size-3.5" aria-hidden />
            لا تنبيهات نشطة
          </span>
        ) : (
          <span className={cn(
            "iso-chip border",
            health.criticalAlerts > 0
              ? "bg-[color:var(--color-status-high)]/10 text-[color:var(--color-status-high)] border-[color:var(--color-status-high)]/30"
              : "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/30",
          )}>
            <AlertTriangle className="size-3.5" aria-hidden />
            <span className="tabular">{health.openAlerts}</span>
            <span>تنبيهات نشطة</span>
            {health.criticalAlerts > 0 && (
              <span className="tabular opacity-80">· P1: {health.criticalAlerts}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function ModeChip({ mode }: { mode: "demo" | "live" | "investor" }) {
  if (mode === "investor")
    return <span className="iso-chip border bg-[color:var(--color-deep-green)]/8 text-[color:var(--color-deep-green)] border-[color:var(--color-deep-green)]/25">وضع المستثمر</span>;
  if (mode === "live")
    return <span className="iso-chip border bg-[color:var(--color-src-live)]/10 text-[color:var(--color-src-live)] border-[color:var(--color-src-live)]/25">تشغيل حيّ</span>;
  return <span className="iso-chip border bg-[color:var(--color-src-simulated)]/10 text-[color:var(--color-src-simulated)] border-[color:var(--color-src-simulated)]/25">وضع الديمو</span>;
}
