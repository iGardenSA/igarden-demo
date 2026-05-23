import { cn } from "@/lib/cn";
import { fmtAgo, fmtDateTime } from "@/lib/format";
import type { Device } from "@/lib/smartos-types";
import { Signal, SignalLow, SignalMedium, SignalHigh, SignalZero, Wrench } from "lucide-react";

/**
 * Brief §4 Phase 1.3 — online/offline · last_heartbeat · signal · calibration_due.
 * Reads ONLY from the Device row + derived helpers (no UI-only state).
 */
export function DeviceHealth({ device, compact = false, calibrationDueAt }: {
  device: Device;
  compact?: boolean;
  calibrationDueAt?: string | null;
}) {
  const SigIcon = signalIcon(device.signal_strength);
  const isDegraded = device.status !== "online";
  return (
    <div className={cn("iso-panel p-3 space-y-1.5", isDegraded && "border-[color:var(--color-status-med)]/40")} dir="rtl">
      <div className="flex items-center gap-2">
        <span className={cn(
          "size-2 rounded-full",
          device.status === "online" && "bg-[color:var(--color-status-ok)]",
          device.status === "degraded" && "bg-[color:var(--color-status-med)] animate-pulse-soft",
          device.status === "offline" && "bg-[color:var(--color-status-high)]",
        )} aria-hidden />
        <span className="text-sm font-semibold">{device.name}</span>
        <span className="ms-auto iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]">
          {labelForType(device.device_type)}
        </span>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[color:var(--color-iso-ink-soft)]">
          <div className="flex items-center gap-1.5">
            <SigIcon className="size-3.5" aria-hidden />
            <span className="tabular ltr-bdi">{device.signal_strength ?? "—"}%</span>
          </div>
          <div className="text-end ltr-bdi tabular" title={device.last_heartbeat_at ? fmtDateTime(device.last_heartbeat_at) : ""}>
            ⏱ {fmtAgo(device.last_heartbeat_at)}
          </div>
          <div className="ltr-bdi">FW {device.firmware_version ?? "—"}</div>
          {calibrationDueAt && (
            <div className="text-end flex items-center justify-end gap-1">
              <Wrench className="size-3" aria-hidden />
              <span className="ltr-bdi">معايرة: {fmtAgo(calibrationDueAt)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function signalIcon(s: number | null) {
  if (s === null) return SignalZero;
  if (s >= 75) return SignalHigh;
  if (s >= 50) return SignalMedium;
  if (s >= 25) return SignalLow;
  return SignalZero;
}

function labelForType(t: Device["device_type"]) {
  return {
    gateway: "بوابة", controller: "تحكّم", pump: "مضخة", valve: "محبس",
    dosing: "جرعات", fan: "مراوح", ro_unit: "RO",
  }[t];
}
