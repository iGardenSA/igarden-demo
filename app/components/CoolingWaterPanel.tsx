import type { CoolingWaterLog } from "@/lib/smartos-types";
import { fmtNumber, fmtDay } from "@/lib/format";
import { Snowflake, Sprout, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Brief §4 Phase 3.3 — separate cooling water from irrigation water visually.
 * Shows optimization-active toggle history (the "27% story" without ever quoting 27%).
 */
export function CoolingWaterPanel({ logs }: { logs: CoolingWaterLog[] }) {
  if (logs.length === 0) return null;
  const today = logs[0];
  const optActive = today.optimization_active === 1;

  // last 30-day totals
  const totalCooling = logs.reduce((s, l) => s + l.cooling_water_liters, 0);
  const totalIrrigation = logs.reduce((s, l) => s + l.irrigation_water_liters, 0);

  return (
    <section className="iso-panel p-4 space-y-3" dir="rtl">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Snowflake className="size-4 text-[color:var(--color-status-info)]" />
          فصل مياه التبريد عن مياه الري
        </h3>
        <span className={cn("iso-chip border", optActive
          ? "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25"
          : "bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]")}>
          <Sparkles className="size-3" />
          {optActive ? "تحسين مُفعَّل" : "تحسين متوقّف"}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Block icon={<Snowflake className="size-4 text-[color:var(--color-status-info)]" />}
          label="مياه التبريد" today={today.cooling_water_liters} total={totalCooling} unit="لتر" />
        <Block icon={<Sprout className="size-4 text-[color:var(--color-status-ok)]" />}
          label="مياه الري" today={today.irrigation_water_liters} total={totalIrrigation} unit="لتر" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-[color:var(--color-iso-ink-soft)] pt-1">
        <Stat label="تدرّج حراري عمودي" value={today.vertical_temp_gradient} unit="°C/m" />
        <Stat label="معدّل الاستخلاص" value={today.fan_extraction_rate} unit="m³/h" />
        <Stat label="حرارة محيط" value={today.ambient_temp} unit="°C" />
      </div>

      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] border-t border-dashed border-[color:var(--color-iso-border)] pt-2">
        التحسين يستهدف تقليصاً جوهرياً في مياه التبريد عبر إعادة استخدام تكثّف المراوح وتعديل دورة الاستخلاص. الأرقام عمليّة — ليست مُعتمدة من جهات خارجية.
        <span className="block mt-0.5 ltr-bdi">آخر يوم في السجل: {fmtDay(today.recorded_at)}</span>
      </div>
    </section>
  );
}

function Block({ icon, label, today, total, unit }: {
  icon: React.ReactNode; label: string; today: number; total: number; unit: string;
}) {
  return (
    <div className="iso-panel-flat p-3 rounded-md bg-[color:var(--color-iso-panel-alt)]">
      <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-iso-ink-soft)] mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="tabular ltr-bdi text-2xl font-bold">
        {fmtNumber(today, 0)} <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)]">{unit}/يوم</span>
      </div>
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] tabular ltr-bdi mt-0.5">
        إجمالي 30 يوماً: {fmtNumber(total, 0)} {unit}
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div>
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)]">{label}</div>
      <div className="tabular ltr-bdi font-semibold">{value === null ? "—" : `${fmtNumber(value, 1)} ${unit}`}</div>
    </div>
  );
}
