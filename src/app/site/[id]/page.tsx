import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { SensorCard } from "@/components/SensorCard";
import { DeviceHealth } from "@/components/DeviceHealth";
import { PnIDDiagram } from "@/components/PnIDDiagram";
import { ROTelemetry } from "@/components/ROTelemetry";
import { CoolingWaterPanel } from "@/components/CoolingWaterPanel";
import { WaterEfficiency } from "@/components/WaterEfficiency";
import { SafetyPanel } from "@/components/SafetyPanel";
import { NetworkHealth } from "@/components/NetworkHealth";
import { AlertCard } from "@/components/AlertCard";
import { AlertActions } from "@/components/AlertActions";
import { AIRecommendationCard } from "@/components/AIRecommendation";
import { decideAIAction } from "@/lib/actions";
import {
  computeSiteHealth, listDevices, listSensors, latestReadingsForSite,
  recentReadings, getSite, listAlerts, getAIRecommendationForAlert, latestRO, latestCooling,
} from "@/lib/queries";
import { getCurrentRole } from "@/lib/role";
import type { Reading } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Params { params: Promise<{ id: string }> }

export default async function SitePage({ params }: Params) {
  const { id } = await params;
  const site = await getSite(id);
  if (!site) notFound();
  const [role, health, devices, sensors, latest, openAlerts, ro, cooling] = await Promise.all([
    getCurrentRole(),
    computeSiteHealth(id),
    listDevices(id),
    listSensors(id),
    latestReadingsForSite(id),
    listAlerts({ siteId: id, status: "open", limit: 10 }),
    latestRO(id, 1),
    latestCooling(id, 30),
  ]);
  if (!health) notFound();

  const trendEntries = await Promise.all(sensors.map(async (s) => [s.id, await recentReadings(s.id, 60)] as const));
  const trendBySensor = Object.fromEntries(trendEntries);
  const readingBySensor = Object.fromEntries(latest.map((r) => [r.sensor_id, r]));
  const deviceById = Object.fromEntries(devices.map((d) => [d.id, d]));

  const aiEntries = await Promise.all(openAlerts.map(async (a) => [a.id, await getAIRecommendationForAlert(a.id)] as const));
  const aiByAlert = Object.fromEntries(aiEntries);

  const inSafe = (r: Reading | undefined) => {
    if (!r) return false;
    const s = sensors.find((sx) => sx.id === r.sensor_id);
    if (!s) return true;
    return r.value >= s.min_safe_value && r.value <= s.max_safe_value;
  };

  const ph = latest.find((r) => sensors.find((s) => s.id === r.sensor_id)?.sensor_type === "ph");
  const ec = latest.find((r) => sensors.find((s) => s.id === r.sensor_id)?.sensor_type === "ec");
  const waterTemp = latest.find((r) => sensors.find((s) => s.id === r.sensor_id)?.sensor_type === "water_temp");
  const tank = latest.find((r) => sensors.find((s) => s.id === r.sensor_id)?.sensor_type === "tank_level");

  const showExecutiveOnly = role === "executive";

  return (
    <AppShell>
      <StatusBar health={health} mode={site.is_demo_site ? "demo" : "live"} />

      <main className="p-6 space-y-5">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-iso-ink-muted)]">{site.location}</div>
            <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">{site.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/site/${id}/control`} className="text-xs px-3 py-2 rounded-md border border-[color:var(--color-iso-border)] hover:bg-[color:var(--color-iso-panel-alt)]">
              لوحة التحكّم
            </Link>
            <NetworkHealth site={site} />
          </div>
        </header>

        {!showExecutiveOnly && (
          <>
            <section className="iso-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">مخطط الحلقة (P&ID مُبسَّط)</h2>
                <span className="text-[11px] text-[color:var(--color-iso-ink-muted)]">قراءات لحظية · لون = خروج عن النطاق</span>
              </div>
              <div className="overflow-x-auto">
                <PnIDDiagram ph={ph} ec={ec} waterTemp={waterTemp} tankLevel={tank} inSafe={inSafe} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold mb-2">الحسّاسات</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sensors.map((s) => (
                  <SensorCard
                    key={s.id}
                    sensor={s}
                    latest={readingBySensor[s.id]}
                    trend={trendBySensor[s.id] ?? []}
                    device={s.device_id ? deviceById[s.device_id] : undefined}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {openAlerts.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold">تنبيهات مفتوحة على هذا الموقع</h2>
            {openAlerts.map((a) => {
              const ai = aiByAlert[a.id];
              const sensor = sensors.find((s) => s.id === a.sensor_id);
              return (
                <AlertCard key={a.id} alert={a} sensor={sensor}>
                  <div className="flex items-center justify-end gap-2">
                    <AlertActions alertId={a.id} status={a.status} />
                  </div>
                  {ai && (
                    <AIRecommendationCard
                      rec={ai}
                      overrideRatePct={18}
                      onDecide={async (id, d) => { "use server"; await decideAIAction(id, d); }}
                    />
                  )}
                </AlertCard>
              );
            })}
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          {cooling.length > 0 && <CoolingWaterPanel logs={cooling} />}
          {cooling.length > 0 && <WaterEfficiency logs={cooling} />}
          {ro.length > 0 && <ROTelemetry rows={ro} />}
          <SafetyPanel role={role} />
        </div>

        {role !== "executive" && (
          <section>
            <h2 className="text-sm font-bold mb-2">صحّة الأجهزة</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map((d) => {
                const calSensor = sensors.find((s) => s.device_id === d.id);
                return <DeviceHealth key={d.id} device={d} calibrationDueAt={calSensor?.calibration_due_at} />;
              })}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  );
}
