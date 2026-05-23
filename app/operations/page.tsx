import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { SourceBadge } from "@/components/SourceBadge";
import { AnalogIndicator } from "@/components/AnalogIndicator";
import { AlertSeverity } from "@/components/AlertSeverity";
import { GoldenFlowTrigger } from "@/components/GoldenFlowTrigger";
import { TransparencyPanel } from "@/components/TransparencyPanel";
import { RoleSwitcherForm } from "@/components/RoleSwitcher";
import { NetworkHealth } from "@/components/NetworkHealth";
import { EmptyDb } from "@/components/EmptyDb";
import {
  listSites, listAlerts, computeSiteHealth, latestReadingsForSite, listSensors,
} from "@/lib/queries";
import { getCurrentRole } from "@/lib/role";
import { fmtAgo } from "@/lib/format";
import { Activity, ArrowLeft } from "lucide-react";

// Reads Supabase at request time — never prerender against an empty build-time DB.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sites, role] = await Promise.all([listSites(), getCurrentRole()]);
  if (sites.length === 0) return <AppShell><EmptyDb context="fleet" /></AppShell>;

  // Primary site = first non-demo site (R&D) or first
  const primary = sites.find((s) => !s.is_demo_site) ?? sites[0];
  const [health, readings, sensors, allAlerts, fleetHealths] = await Promise.all([
    computeSiteHealth(primary.id),
    latestReadingsForSite(primary.id),
    listSensors(primary.id),
    listAlerts({ status: "any", limit: 5 }),
    Promise.all(sites.map((s) => computeSiteHealth(s.id))),
  ]);
  if (!health) return <AppShell><EmptyDb context="primary site" /></AppShell>;

  const sensorByType = Object.fromEntries(sensors.map((s) => [s.sensor_type, s]));
  const readingBySensor = Object.fromEntries(readings.map((r) => [r.sensor_id, r]));
  const fleet = sites.map((s, i) => ({ site: s, health: fleetHealths[i] }));

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />

      <main className="p-6 space-y-6">
        {/* Header strip */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--color-iso-ink-muted)]">نظرة عامة على الأسطول</div>
            <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">iGarden Smart OS · شاشة الـ 60 ثانية</h1>
            <p className="text-xs text-[color:var(--color-iso-ink-soft)] mt-1 max-w-2xl">
              طبقة التشغيل والبيانات تحت المزارع المائية الذكية السعودية — مراقبة · تنبيهات · تحكم تحت إشراف · سجلات تدقيق · امتثال.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RoleSwitcherForm current={role} />
            <TransparencyPanel />
            <GoldenFlowTrigger />
          </div>
        </div>

        {/* ISA-101 analog row — only KPIs of the primary site */}
        <section className="iso-panel p-5">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Activity className="size-4 text-[color:var(--color-status-info)]" />
              مؤشرات تشغيلية — {primary.name}
            </h2>
            <NetworkHealth site={primary} />
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {(["ph", "ec", "water_temp", "tank_level"] as const).map((t) => {
              const s = sensorByType[t];
              if (!s) return null;
              const r = readingBySensor[s.id];
              return (
                <AnalogIndicator
                  key={t}
                  value={r?.value ?? null}
                  min={s.min_safe_value * 0.7}
                  max={s.max_safe_value * 1.3}
                  safeMin={s.min_safe_value}
                  safeMax={s.max_safe_value}
                  label={s.name}
                  unit={s.unit}
                />
              );
            })}
          </div>
        </section>

        {/* Fleet table + alerts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <section className="iso-panel lg:col-span-2">
            <header className="px-4 py-3 border-b border-[color:var(--color-iso-border)] flex items-center justify-between">
              <h2 className="text-sm font-bold">المواقع</h2>
              <span className="text-xs text-[color:var(--color-iso-ink-muted)] tabular ltr-bdi">{sites.length} موقع</span>
            </header>
            <table className="iso-table">
              <thead>
                <tr>
                  <th>الموقع</th>
                  <th>الحالة</th>
                  <th>الأجهزة</th>
                  <th>تنبيهات</th>
                  <th>المصدر</th>
                  <th>آخر مزامنة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fleet.map(({ site, health }) => (
                  <tr key={site.id}>
                    <td>
                      <div className="font-semibold">{site.name}</div>
                      <div className="text-[11px] text-[color:var(--color-iso-ink-muted)]">{site.location}</div>
                    </td>
                    <td>
                      <span className={`iso-chip border ${site.status === "online"
                        ? "bg-[color:var(--color-status-ok)]/10 text-[color:var(--color-status-ok)] border-[color:var(--color-status-ok)]/25"
                        : "bg-[color:var(--color-status-med)]/10 text-[color:var(--color-status-med)] border-[color:var(--color-status-med)]/25"}`}>
                        {site.status === "online" ? "متصل" : site.status}
                      </span>
                    </td>
                    <td className="tabular ltr-bdi text-xs">{health?.devicesOnline ?? "—"}/{health?.devicesTotal ?? "—"}</td>
                    <td>
                      {!health || health.openAlerts === 0
                        ? <span className="text-[color:var(--color-iso-ink-muted)] text-xs">—</span>
                        : <span className={`tabular ltr-bdi font-semibold ${health.criticalAlerts > 0 ? "text-[color:var(--color-status-high)]" : "text-[color:var(--color-status-med)]"}`}>{health.openAlerts}</span>}
                    </td>
                    <td><SourceBadge type={health?.hasLiveSource ? "live" : "simulated"} /></td>
                    <td className="ltr-bdi tabular text-xs text-[color:var(--color-iso-ink-soft)]">{fmtAgo(health?.lastSyncAt)}</td>
                    <td>
                      <Link href={`/site/${site.id}`} className="text-xs text-[color:var(--color-status-info)] hover:underline flex items-center gap-1">
                        تفصيل <ArrowLeft className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="iso-panel">
            <header className="px-4 py-3 border-b border-[color:var(--color-iso-border)] flex items-center justify-between">
              <h2 className="text-sm font-bold">آخر التنبيهات</h2>
              <Link href="/alerts" className="text-xs text-[color:var(--color-status-info)] hover:underline">عرض الكل</Link>
            </header>
            <div className="divide-y divide-[color:var(--color-iso-border)]">
              {allAlerts.length === 0 && (
                <div className="p-4 text-xs text-[color:var(--color-iso-ink-muted)]">لا تنبيهات</div>
              )}
              {allAlerts.map((a) => (
                <Link key={a.id} href={`/alerts#${a.id}`} className="block p-3 hover:bg-[color:var(--color-iso-panel-alt)]">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertSeverity severity={a.severity} />
                    <span className="text-[11px] text-[color:var(--color-iso-ink-muted)] ltr-bdi tabular">{fmtAgo(a.created_at)}</span>
                  </div>
                  <div className="text-sm font-semibold">{a.title}</div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Role-aware footer note */}
        <div className="text-[11px] text-[color:var(--color-iso-ink-muted)] iso-chip border bg-white border-[color:var(--color-iso-border)] inline-flex">
          الدور المعروض: {role === "operator" ? "مشغّل (قوائم + تنبيهات)" : role === "manager" ? "مدير العمليات (مواقع + سجلات + تقارير)" : "تنفيذي (مياه + إنتاج + امتثال)"}
        </div>
      </main>
    </AppShell>
  );
}
