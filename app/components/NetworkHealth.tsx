import type { Site } from "@/lib/smartos-types";
import { Activity } from "lucide-react";

/**
 * Brief §4 Phase 3.7 — operational realism strip.
 * Even in simulated mode, presents realistic latency/jitter so the demo doesn't
 * imply impossible instant sync. Numbers are static-but-plausible per site.
 */
const PROFILE: Record<string, { mqttMs: number; modbusMs: number; uptime: number; jitterMs: number }> = {
  "site-asfan-rnd":          { mqttMs: 38,  modbusMs: 22, uptime: 99.7, jitterMs: 6 },
  "site-industrial-south":   { mqttMs: 71,  modbusMs: 41, uptime: 99.2, jitterMs: 14 },
  "site-demo":               { mqttMs: 12,  modbusMs:  9, uptime: 99.9, jitterMs: 2 },
};

export function NetworkHealth({ site }: { site: Site }) {
  const p = PROFILE[site.id] ?? PROFILE["site-demo"];
  return (
    <div className="iso-panel-flat px-3 py-2 flex items-center gap-3 flex-wrap text-xs ltr-bdi" dir="rtl">
      <div className="flex items-center gap-1.5 text-[color:var(--color-iso-ink-soft)]">
        <Activity className="size-3.5" />
        <span>صحة الشبكة</span>
      </div>
      <Stat label="MQTT" value={`${p.mqttMs}ms`} />
      <Stat label="Modbus" value={`${p.modbusMs}ms`} />
      <Stat label="jitter" value={`±${p.jitterMs}ms`} />
      <Stat label="uptime" value={`${p.uptime}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]">
      <span className="opacity-70">{label}</span>
      <span className="tabular font-semibold">{value}</span>
    </span>
  );
}
