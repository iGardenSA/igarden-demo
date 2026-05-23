import { AppShell } from "@/components/AppShell";
import { StatusBar } from "@/components/StatusBar";
import { ComplianceExport } from "@/components/ComplianceExport";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { computeSiteHealth, listSites, listReports, listControlEvents, listCommands, latestReadingsForSite, listSensors } from "@/lib/queries";
import { EmptyDb } from "@/components/EmptyDb";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const sites = await listSites();
  if (sites.length === 0) return <AppShell><EmptyDb context="reports" /></AppShell>;
  const primary = sites.find((s) => !s.is_demo_site) ?? sites[0];
  const [health, reports, sensors, latest, events, commands] = await Promise.all([
    computeSiteHealth(primary.id),
    listReports(),
    listSensors(primary.id),
    latestReadingsForSite(primary.id),
    listControlEvents({ siteId: primary.id, limit: 30 }),
    listCommands(primary.id, 30),
  ]);
  if (!health) return <AppShell><EmptyDb context="reports" /></AppShell>;
  const sensorById = Object.fromEntries(sensors.map((s) => [s.id, s]));
  const commandsMap = Object.fromEntries(commands.map((c) => [c.id, c]));

  const rangeFrom = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const rangeTo = new Date().toISOString().slice(0, 10);

  const rows = [
    ...latest.map((r) => ({
      time: r.recorded_at,
      metric: sensorById[r.sensor_id]?.name ?? r.sensor_id,
      value: `${fmtNumber(r.value, 2)} ${r.unit}`,
      source: r.source_type,
      status: r.status,
    })),
    ...events.map((e) => ({
      time: e.created_at,
      metric: `event:${e.event_type}`,
      value: `${e.previous_state ?? "—"} → ${e.new_state ?? "—"}`,
      source: e.source_type,
      status: e.event_type,
      actor: e.command_id ? commandsMap[e.command_id]?.requested_by : "",
      reason: e.command_id ? commandsMap[e.command_id]?.reason : "",
    })),
  ];

  return (
    <AppShell>
      <StatusBar health={health} mode="demo" />
      <main className="p-6 space-y-5">
        <header>
          <h1 className="text-xl font-bold text-[color:var(--color-deep-green)]">التقارير والامتثال</h1>
          <p className="text-xs text-[color:var(--color-iso-ink-soft)] mt-1 max-w-2xl">
            تقارير دورية + تصدير امتثال متوافق البنية مع GLOBALG.A.P. IFA. لا يعد ولا يدّعي اعتماداً خارجياً.
          </p>
        </header>

        <ComplianceExport siteName={primary.name} rangeFrom={rangeFrom} rangeTo={rangeTo} rows={rows} />

        <section className="iso-panel">
          <header className="px-4 py-3 border-b border-[color:var(--color-iso-border)]">
            <h2 className="text-sm font-bold">التقارير المُولَّدة</h2>
          </header>
          <table className="iso-table">
            <thead>
              <tr>
                <th>الموقع</th>
                <th>النوع</th>
                <th>الفترة</th>
                <th>الملخّص</th>
                <th>أُنشئ</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[color:var(--color-iso-ink-muted)] py-6">لا تقارير</td></tr>
              )}
              {reports.map((r) => {
                const site = sites.find((s) => s.id === r.site_id);
                return (
                  <tr key={r.id}>
                    <td>{site?.name ?? r.site_id}</td>
                    <td><span className="iso-chip border bg-[color:var(--color-iso-fill)] text-[color:var(--color-iso-ink-soft)] border-[color:var(--color-iso-border)]">{r.report_type}</span></td>
                    <td className="ltr-bdi tabular text-xs">{r.period_start.slice(0, 10)} → {r.period_end.slice(0, 10)}</td>
                    <td className="text-xs max-w-md">{r.summary}</td>
                    <td className="ltr-bdi tabular text-xs">{fmtDateTime(r.generated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="disclaimer-footer">
            كل تقرير يحمل إخلاء مسؤولية مُسجَّلاً في قاعدة البيانات (DB NOT NULL).
          </div>
        </section>
      </main>
    </AppShell>
  );
}
