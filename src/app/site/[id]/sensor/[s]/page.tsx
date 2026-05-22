import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { SourceBadge } from "@/components/SourceBadge";
import { SensorTrend } from "@/components/SensorTrend";
import { DeviceHealth } from "@/components/DeviceHealth";
import { computeSiteHealth, getSensor, latestReading, recentReadings, listDevices } from "@/lib/queries";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface Params { params: Promise<{ id: string; s: string }> }

export default async function SensorDetailPage({ params }: Params) {
  const { id, s } = await params;
  const sensor = await getSensor(s);
  if (!sensor || sensor.site_id !== id) notFound();
  const [health, latest, trend30d, trend24h, devices] = await Promise.all([
    computeSiteHealth(id),
    latestReading(s),
    recentReadings(s, 96 * 30),
    recentReadings(s, 96),
    listDevices(id),
  ]);
  if (!health) notFound();
  const device = devices.find((d) => d.id === sensor.device_id);

  const inSafe = latest ? latest.value >= sensor.min_safe_value && latest.value <= sensor.max_safe_value : false;

  const vals = trend24h.map((r) => r.value);
  const min24 = vals.length ? Math.min(...vals) : null;
  const max24 = vals.length ? Math.max(...vals) : null;
  const avg24 = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />
      <main className="p-6 space-y-5">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link href={`/site/${id}`} className="text-xs text-[color:var(--color-status-info)] inline-flex items-center gap-1 mb-1">
              <ArrowRight className="size-3" /> العودة للموقع
            </Link>
            <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">{sensor.name}</h1>
            <div className="text-xs text-[color:var(--color-iso-ink-muted)] flex items-center gap-2 mt-1">
              <SourceBadge type={latest?.source_type ?? sensor.source_type} timestamp={latest?.recorded_at ?? null} showTimestamp />
              <span className="ltr-bdi">ID: {sensor.id}</span>
            </div>
          </div>
        </header>

        <section className="iso-panel p-5 grid md:grid-cols-3 gap-5">
          <div className="md:col-span-1 space-y-2">
            <div className="text-xs text-[color:var(--color-iso-ink-muted)]">القراءة الحالية</div>
            <div className={`tabular ltr-bdi text-5xl font-bold ${inSafe ? "text-[color:var(--color-iso-ink)]" : "text-[color:var(--color-status-high)]"}`}>
              {latest ? fmtNumber(latest.value, 2) : "—"}
              <span className="text-base font-medium text-[color:var(--color-iso-ink-soft)] ms-2">{sensor.unit}</span>
            </div>
            <div className="text-xs text-[color:var(--color-iso-ink-muted)] ltr-bdi">
              النطاق الآمن: {sensor.min_safe_value} – {sensor.max_safe_value} {sensor.unit}
            </div>
            <div className="text-xs text-[color:var(--color-iso-ink-muted)] ltr-bdi tabular">
              آخر تحديث: {fmtDateTime(latest?.recorded_at ?? null)}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="text-xs text-[color:var(--color-iso-ink-muted)] mb-1">مخطط 30 يوماً (15 دقيقة بين القراءات)</div>
            <div className="iso-panel-flat p-3 rounded-md bg-[color:var(--color-iso-panel-alt)] overflow-hidden">
              <SensorTrend readings={trend30d} min={sensor.min_safe_value} max={sensor.max_safe_value} height={120} width={600} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Stat label="أدنى (24س)" value={min24} unit={sensor.unit} />
              <Stat label="متوسط (24س)" value={avg24} unit={sensor.unit} />
              <Stat label="أعلى (24س)" value={max24} unit={sensor.unit} />
            </div>
          </div>
        </section>

        {device && (
          <section className="grid sm:grid-cols-2 gap-3">
            <DeviceHealth device={device} calibrationDueAt={sensor.calibration_due_at} />
            <div className="iso-panel p-3 text-xs text-[color:var(--color-iso-ink-soft)] leading-relaxed">
              <div className="text-sm font-bold mb-1 text-[color:var(--color-iso-ink)]">سياسة التنبيه</div>
              <p>
                يُولَّد تنبيه تلقائياً عند خروج القراءة عن النطاق الآمن لأكثر من قراءتين متتاليتين.
                درجة الخطورة تُحدَّد بناءً على بُعد القيمة عن النطاق + مدة التجاوز.
              </p>
              <p className="mt-1">كل تنبيه مرفق بإجراء موصى به (ISA-18.2) — لا تنبيهات بلا فعل مطلوب.</p>
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="iso-panel-flat p-2.5 rounded-md bg-[color:var(--color-iso-panel-alt)]">
      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)]">{label}</div>
      <div className="tabular ltr-bdi font-bold">{value === null ? "—" : `${fmtNumber(value, 2)} ${unit}`}</div>
    </div>
  );
}
