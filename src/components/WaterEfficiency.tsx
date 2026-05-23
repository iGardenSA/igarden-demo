import type { CoolingWaterLog } from "@/lib/types";
import { fmtNumber } from "@/lib/format";
import { Droplets } from "lucide-react";

/**
 * Brief §4 Phase 3.4 — water efficiency card.
 * Compares observed irrigation against a conservative open-field baseline.
 * Never quotes an absolute % savings — phrases as "تستهدف تقليصاً جوهرياً".
 */
export function WaterEfficiency({ logs }: { logs: CoolingWaterLog[] }) {
  if (logs.length === 0) return null;

  // Baseline: open-field hydroponics median water draw, internal conservative estimate.
  // This is a *modelled* comparison, not a measured one — wording reflects that.
  const baselinePerDayLiters = 2400; // conservative open-field baseline used for the panel

  const last7 = logs.slice(0, 7);
  const observedAvg = last7.reduce((s, l) => s + l.irrigation_water_liters + l.cooling_water_liters, 0) / Math.max(1, last7.length);
  const savedPerDay = Math.max(0, baselinePerDayLiters - observedAvg);
  const savedPer30 = savedPerDay * 30;

  return (
    <section className="iso-panel p-4 space-y-2" dir="rtl">
      <header className="flex items-center gap-2">
        <Droplets className="size-4 text-[color:var(--color-status-info)]" />
        <h3 className="text-sm font-bold">كفاءة المياه — مقارنة نموذجية</h3>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Box label="استهلاك يومي مُلاحَظ" value={observedAvg} unit="لتر/يوم" />
        <Box label="مرجع مقارنة محافظ" value={baselinePerDayLiters} unit="لتر/يوم" subdued />
      </div>

      <div className="iso-panel-flat p-3 rounded-md bg-[color:var(--color-status-ok)]/8 border border-[color:var(--color-status-ok)]/20">
        <div className="text-xs text-[color:var(--color-iso-ink-soft)]">فارق مُقدَّر (يوم):</div>
        <div className="tabular ltr-bdi text-2xl font-bold text-[color:var(--color-status-ok)]">
          {fmtNumber(savedPerDay, 0)} <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)]">لتر/يوم</span>
        </div>
        <div className="text-xs text-[color:var(--color-iso-ink-soft)] tabular ltr-bdi">
          ≈ {fmtNumber(savedPer30, 0)} لتر/شهر · يستهدف تقليصاً جوهرياً مقارنةً بالحقل المفتوح. غير مُعتمد خارجياً.
        </div>
      </div>
    </section>
  );
}

function Box({ label, value, unit, subdued }: { label: string; value: number; unit: string; subdued?: boolean }) {
  return (
    <div className="iso-panel-flat p-3 rounded-md bg-[color:var(--color-iso-panel-alt)]">
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] mb-0.5">{label}</div>
      <div className={`tabular ltr-bdi text-xl font-bold ${subdued ? "text-[color:var(--color-iso-ink-soft)]" : "text-[color:var(--color-iso-ink)]"}`}>
        {fmtNumber(value, 0)} <span className="text-xs font-medium text-[color:var(--color-iso-ink-soft)]">{unit}</span>
      </div>
    </div>
  );
}
